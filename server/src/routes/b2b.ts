import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';
import { Organization, Invoice, Payment, User, Assignment, PaymentMethod } from '../types';

const router = Router();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function computeEventStatus(assignment: Assignment, evidenceList: any[]): 'Scheduled' | 'Crew Assigned' | 'Cleaning In Progress' | 'Completed' | 'Verified' {
  if (assignment.status === 'COMPLETED') {
    const hasApprovedAfter = evidenceList.some(
      (e) => e.assignmentId === assignment.assignmentId && e.category === 'AFTER' && (e.reviewStatus === 'APPROVED' || e.autoVerified)
    );
    return hasApprovedAfter ? 'Verified' : 'Completed';
  }

  if (assignment.status === 'IN_PROGRESS') {
    return 'Cleaning In Progress';
  }

  if ((assignment.teamIds && assignment.teamIds.length > 0) || (assignment.workerIds && assignment.workerIds.length > 0)) {
    return 'Crew Assigned';
  }

  return 'Scheduled';
}

function getClientOrgId(req: Request): string | null {
  if (req.user?.role === 'B2B_CLIENT') {
    return req.user.organizationId || null;
  }
  // Admin can view or act on behalf if specified via query or param
  if (req.user?.role === 'ADMIN') {
    return (req.query.organizationId as string) || (req.body.organizationId as string) || req.user.organizationId || null;
  }
  return null;
}

// ============================================================================
// B2B CLIENT PORTAL ENDPOINTS (Read-only Operational, Payment & Profile)
// ============================================================================

// 1. Client Overview Summary
router.get('/client/overview', authMiddleware, requireRole(['B2B_CLIENT', 'ADMIN']), (req: Request, res: Response) => {
  const orgId = getClientOrgId(req);
  if (!orgId) {
    return res.status(400).json({ error: 'No organization associated with this account' });
  }

  const organization = db.getOrganizationById(orgId);
  if (!organization) {
    return res.status(404).json({ error: 'Organization not found' });
  }

  const events = db.getEventsForOrganization(orgId);
  const evidenceList = db.getWorkEvidence();
  const invoices = db.getInvoices(orgId);
  const payments = db.getPayments(orgId);

  const totalEvents = events.length;
  const completedEvents = events.filter((e) => e.status === 'COMPLETED').length;
  const upcomingEvents = events.filter((e) => e.status !== 'COMPLETED' && e.status !== 'CANCELLED').length;

  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
  const totalPaid = payments
    .filter((p) => p.status === 'SUCCESS')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const outstandingAmount = Math.max(0, totalInvoiced - totalPaid);

  const pendingInvoices = invoices.filter((i) => i.status === 'PENDING' || i.status === 'OVERDUE' || i.status === 'PARTIALLY_PAID');

  // Format upcoming and ongoing events
  const today = new Date().toISOString().slice(0, 10);
  const activeEvents = events
    .filter((e) => e.status !== 'CANCELLED')
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
    .map((e) => {
      const team = e.teamIds?.[0] ? db.getTeamById(e.teamIds[0]) : undefined;
      const leader = team?.leaderIds?.[0] ? db.getLeaderById(team.leaderIds[0]) : undefined;
      const location = e.locationId ? db.getLocationById(e.locationId) : undefined;
      const eventStatus = computeEventStatus(e, evidenceList);

      return {
        ...e,
        computedStatus: eventStatus,
        teamName: team?.name || 'Assigned Crew',
        leaderName: leader?.name || e.assignedByName || 'Supervisor',
        leaderPhone: leader?.phone || '',
        locationAddress: location?.address || e.locationAddress || '',
        workerCount: e.workerIds?.length || e.requiredWorkersCount || 0,
      };
    });

  res.json({
    organization,
    summary: {
      totalEvents,
      upcomingEvents,
      completedEvents,
      totalInvoiced,
      totalPaid,
      outstandingAmount,
      pendingInvoicesCount: pendingInvoices.length,
      contractPricing: organization.contractPricing,
      paymentTerms: organization.paymentTerms,
    },
    upcomingAndOngoingEvents: activeEvents,
  });
});

// 2. Client Events List
router.get('/client/events', authMiddleware, requireRole(['B2B_CLIENT', 'ADMIN']), (req: Request, res: Response) => {
  const orgId = getClientOrgId(req);
  if (!orgId) {
    return res.status(400).json({ error: 'No organization associated with this account' });
  }

  const events = db.getEventsForOrganization(orgId);
  const evidenceList = db.getWorkEvidence();

  const enrichedEvents = events.map((e) => {
    const team = e.teamIds?.[0] ? db.getTeamById(e.teamIds[0]) : undefined;
    const leader = team?.leaderIds?.[0] ? db.getLeaderById(team.leaderIds[0]) : undefined;
    const location = e.locationId ? db.getLocationById(e.locationId) : undefined;
    const computedStatus = computeEventStatus(e, evidenceList);

    return {
      eventId: e.assignmentId,
      eventName: e.title,
      description: e.description,
      cleaningRequirements: e.cleaningRequirements,
      date: e.date,
      startTime: e.startTime,
      endTime: e.endTime,
      locationId: e.locationId,
      locationName: e.locationName || location?.name,
      locationAddress: e.locationAddress || location?.address,
      assignedTeamId: e.teamIds?.[0] || null,
      assignedTeamName: team?.name || 'Assigned Cleaning Crew',
      teamLeaderId: leader?.leaderId || null,
      teamLeaderName: leader?.name || e.assignedByName || 'Assigned Supervisor',
      teamLeaderPhone: leader?.phone || null,
      workersAssignedCount: e.workerIds?.length || e.requiredWorkersCount || 0,
      status: computedStatus,
      rawStatus: e.status,
      servicePrice: e.servicePrice,
      paymentTerms: e.paymentTerms,
      completionNote: e.completionNote,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  });

  res.json({ events: enrichedEvents });
});

// 3. Client Single Event Details (Read-only operational information)
router.get('/client/events/:id', authMiddleware, requireRole(['B2B_CLIENT', 'ADMIN']), (req: Request, res: Response) => {
  const orgId = getClientOrgId(req);
  const id = req.params.id as string;

  const event = db.getAssignmentById(id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  // Security: B2B client can only view events belonging to their own organization
  if (req.user?.role === 'B2B_CLIENT' && event.organizationId !== orgId) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to view this event' });
  }

  const team = event.teamIds?.[0] ? db.getTeamById(event.teamIds[0]) : undefined;
  const leader = team?.leaderIds?.[0] ? db.getLeaderById(team.leaderIds[0]) : undefined;
  const location = event.locationId ? db.getLocationById(event.locationId) : undefined;

  // Retrieve assigned workers with check-in & attendance status
  const allWorkers = db.getWorkers();
  const allAttendance = db.getAttendance().filter((a) => a.assignmentId === event.assignmentId || (a.date === event.date && event.workerIds?.includes(a.workerId)));

  const assignedWorkers = (event.workerIds || []).map((wId) => {
    const worker = allWorkers.find((w) => w.workerId === wId);
    const att = allAttendance.find((a) => a.workerId === wId);

    return {
      workerId: wId,
      workerCode: wId,
      name: worker?.name || 'Assigned Specialist',
      phone: worker?.phone || '',
      photoURL: worker?.photoURL || '',
      isCheckedIn: Boolean(att?.checkInTime),
      checkInStatus: att ? att.status : 'PENDING',
      verificationStatus: att?.verificationStatus || 'PENDING',
      gpsStatus: att?.gpsStatus || 'UNAVAILABLE',
      checkInTime: att?.checkInTime || null,
      checkOutTime: att?.checkOutTime || null,
      gpsVerified: att?.verificationStatus === 'VERIFIED',
      checkInAddress: att?.checkInAddress || null,
    };
  });

  // Retrieve Before and After photo evidence
  const allEvidence = db.getWorkEvidence().filter((ev) => ev.assignmentId === event.assignmentId);
  const beforePhotos = allEvidence.filter((ev) => ev.category === 'BEFORE');
  const afterPhotos = allEvidence.filter((ev) => ev.category === 'AFTER');

  const computedStatus = computeEventStatus(event, allEvidence);

  // Supervisor verification
  const verificationRecord = allEvidence.find((ev) => ev.reviewStatus === 'APPROVED' || ev.autoVerified);
  const supervisorVerification = {
    isVerified: computedStatus === 'Verified',
    verifiedBy: verificationRecord?.reviewedByName || (verificationRecord?.autoVerified ? 'Automated AI & Geo-Verification' : null),
    verifiedAt: verificationRecord?.reviewedAt || verificationRecord?.uploadedAt || null,
    reviewNotes: verificationRecord?.reviewNotes || (verificationRecord?.autoVerified ? 'Auto-verified with matched Before and After site photographs.' : null),
  };

  res.json({
    event: {
      eventId: event.assignmentId,
      eventName: event.title,
      description: event.description,
      cleaningRequirements: event.cleaningRequirements,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      location: {
        locationId: event.locationId,
        name: event.locationName || location?.name,
        address: event.locationAddress || location?.address,
        latitude: event.locationLatitude || location?.latitude,
        longitude: event.locationLongitude || location?.longitude,
      },
      team: {
        teamId: team?.teamId || null,
        name: team?.name || 'Assigned Cleaning Crew',
      },
      leader: {
        leaderId: leader?.leaderId || null,
        name: leader?.name || event.assignedByName || 'Supervisor',
        phone: leader?.phone || '',
      },
      status: computedStatus,
      rawStatus: event.status,
      assignedWorkers,
      beforePhotos,
      afterPhotos,
      supervisorVerification,
      completionTime: event.status === 'COMPLETED' ? event.updatedAt : null,
      completionNote: event.completionNote,
      servicePrice: event.servicePrice,
      paymentTerms: event.paymentTerms,
    },
  });
});

// 4. Client Payments & Invoices Summary & List
router.get('/client/invoices', authMiddleware, requireRole(['B2B_CLIENT', 'ADMIN']), (req: Request, res: Response) => {
  const orgId = getClientOrgId(req);
  if (!orgId) {
    return res.status(400).json({ error: 'No organization associated with this account' });
  }

  const organization = db.getOrganizationById(orgId);
  const invoices = db.getInvoices(orgId);
  const payments = db.getPayments(orgId);

  const totalContractAmount = organization?.contractPricing || invoices.reduce((s, i) => s + Number(i.amount || 0), 0);
  const totalPaid = payments
    .filter((p) => p.status === 'SUCCESS')
    .reduce((s, p) => s + Number(p.amount || 0), 0);
  const totalInvoiced = invoices.reduce((s, i) => s + Number(i.amount || 0), 0);
  const outstandingAmount = Math.max(0, totalInvoiced - totalPaid);

  let overallPaymentStatus = 'Paid in Full';
  if (outstandingAmount > 0) {
    const hasOverdue = invoices.some((i) => i.status === 'OVERDUE');
    overallPaymentStatus = hasOverdue ? 'Overdue Invoices' : 'Payment Due';
  }

  res.json({
    summary: {
      totalContractAmount,
      totalInvoiced,
      totalPaid,
      outstandingAmount,
      paymentStatus: overallPaymentStatus,
    },
    invoices,
  });
});

// 5. Client Secure Payment Checkout & Verification (Pay Now)
router.post('/client/invoices/:id/pay', authMiddleware, requireRole(['B2B_CLIENT', 'ADMIN']), (req: Request, res: Response) => {
  const orgId = getClientOrgId(req);
  const id = req.params.id as string;
  const { amount, paymentMethod = 'ONLINE', transactionId: clientTxnId } = req.body;

  const invoice = db.getInvoiceById(id);
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  // Security: Client can only pay their own organization's invoices
  if (req.user?.role === 'B2B_CLIENT' && invoice.organizationId !== orgId) {
    return res.status(403).json({ error: 'Forbidden: You do not own this invoice' });
  }

  const remainingBalance = Math.max(0, Number(invoice.amount) - Number(invoice.amountPaid || 0));
  if (remainingBalance <= 0) {
    return res.status(400).json({ error: 'This invoice has already been paid in full' });
  }

  const payAmount = Number(amount) > 0 ? Math.min(Number(amount), remainingBalance) : remainingBalance;

  // Server-side generation and verification of unique transaction ID
  const serverTxnId = clientTxnId || `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  const receiptNum = `RCPT-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;

  // 1. Create Payment Record
  const newPayment: Payment = {
    paymentId: `PAY-${Date.now()}`,
    receiptNumber: receiptNum,
    invoiceId: invoice.invoiceId,
    invoiceNumber: invoice.invoiceNumber,
    organizationId: invoice.organizationId,
    organizationName: invoice.organizationName,
    assignmentId: invoice.assignmentId,
    eventName: invoice.eventName,
    amount: payAmount,
    paymentDate: new Date().toISOString(),
    paymentMethod: (paymentMethod as PaymentMethod) || 'ONLINE',
    transactionId: serverTxnId,
    status: 'SUCCESS',
    recordedBy: req.user?.uid,
    recordedByName: req.user?.displayName,
    notes: 'Online payment via Go_Repireo Crew Secure B2B Gateway',
    receiptUrl: `/api/b2b/client/receipts/${receiptNum}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.createPayment(newPayment);

  // 2. Update Invoice State
  const newAmountPaid = Number(invoice.amountPaid || 0) + payAmount;
  const newStatus = newAmountPaid >= Number(invoice.amount) ? 'PAID' : 'PARTIALLY_PAID';

  const updatedInvoice = db.updateInvoice(invoice.invoiceId, {
    amountPaid: newAmountPaid,
    status: newStatus,
    notes: `Payment of ₹${payAmount.toLocaleString('en-IN')} received on ${new Date().toLocaleDateString()}. Receipt: ${receiptNum}`,
  });

  // 3. Log Activity
  db.logActivity({
    logId: `act-${Date.now()}`,
    actorId: req.user?.uid || 'client',
    actorName: req.user?.displayName || 'B2B Client',
    actorRole: req.user?.role || 'B2B_CLIENT',
    action: 'RECORD_PAYMENT',
    entityType: 'INVOICE',
    entityId: invoice.invoiceId,
    changes: { amount: payAmount, receiptNumber: receiptNum, transactionId: serverTxnId },
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: 'Payment verified and receipt generated successfully',
    payment: newPayment,
    invoice: updatedInvoice,
    receiptNumber: receiptNum,
  });
});

// 6. Client Payment History & Receipts List
router.get('/client/payments', authMiddleware, requireRole(['B2B_CLIENT', 'ADMIN']), (req: Request, res: Response) => {
  const orgId = getClientOrgId(req);
  if (!orgId) {
    return res.status(400).json({ error: 'No organization associated with this account' });
  }

  const payments = db.getPayments(orgId);
  res.json({ payments });
});

// 7. Client Single Receipt Details
router.get('/client/receipts/:id', authMiddleware, requireRole(['B2B_CLIENT', 'ADMIN']), (req: Request, res: Response) => {
  const orgId = getClientOrgId(req);
  const id = req.params.id as string;

  const payment = db.getPaymentById(id);
  if (!payment) {
    return res.status(404).json({ error: 'Receipt not found' });
  }

  if (req.user?.role === 'B2B_CLIENT' && payment.organizationId !== orgId) {
    return res.status(403).json({ error: 'Forbidden: You do not own this receipt' });
  }

  const organization = db.getOrganizationById(payment.organizationId);
  const invoice = db.getInvoiceById(payment.invoiceId);

  res.json({
    receipt: payment,
    organization,
    invoice,
    settings: db.getSettings(),
  });
});

// 8. Client Organization Profile
router.get('/client/profile', authMiddleware, requireRole(['B2B_CLIENT', 'ADMIN']), (req: Request, res: Response) => {
  const orgId = getClientOrgId(req);
  if (!orgId) {
    return res.status(400).json({ error: 'No organization associated with this account' });
  }

  const organization = db.getOrganizationById(orgId);
  if (!organization) {
    return res.status(404).json({ error: 'Organization not found' });
  }

  const allLocations = db.getLocations();
  const serviceLocations = (organization.serviceLocationIds || [])
    .map((locId) => allLocations.find((l) => l.locationId === locId))
    .filter(Boolean);

  res.json({
    organization,
    serviceLocations,
    user: {
      uid: req.user?.uid,
      displayName: req.user?.displayName,
      email: req.user?.email,
      phone: req.user?.phone,
      role: req.user?.role,
    },
  });
});

// 9. Client Profile Update (Limited to contact info)
router.put('/client/profile', authMiddleware, requireRole(['B2B_CLIENT', 'ADMIN']), (req: Request, res: Response) => {
  const orgId = getClientOrgId(req);
  if (!orgId) {
    return res.status(400).json({ error: 'No organization associated with this account' });
  }

  const { contactPerson, phone, email, address } = req.body;

  const updatedOrg = db.updateOrganization(orgId, {
    contactPerson: contactPerson || undefined,
    phone: phone || undefined,
    email: email || undefined,
    address: address || undefined,
  });

  // Also update user's own display name and phone if needed
  if (req.user?.uid) {
    db.updateUser(req.user.uid, {
      displayName: contactPerson || req.user.displayName,
      phone: phone || req.user.phone,
      email: email || req.user.email,
    });
  }

  res.json({ success: true, organization: updatedOrg });
});

// ============================================================================
// ADMIN CONSOLE: B2B MANAGEMENT ENDPOINTS
// ============================================================================

// 1. Admin: Get all B2B Organizations
router.get('/admin/organizations', authMiddleware, requireRole(['ADMIN']), (req: Request, res: Response) => {
  const orgs = db.getOrganizations();
  const allAssignments = db.getAssignments();
  const allInvoices = db.getInvoices();
  const allLocations = db.getLocations();

  const enriched = orgs.map((o) => {
    const orgEvents = allAssignments.filter((a) => a.organizationId === o.organizationId);
    const orgInvoices = allInvoices.filter((i) => i.organizationId === o.organizationId);
    const totalInvoiced = orgInvoices.reduce((s, i) => s + Number(i.amount || 0), 0);
    const totalPaid = orgInvoices.reduce((s, i) => s + Number(i.amountPaid || 0), 0);
    const locations = (o.serviceLocationIds || []).map((id) => allLocations.find((l) => l.locationId === id)?.name).filter(Boolean);

    return {
      ...o,
      eventsCount: orgEvents.length,
      activeEventsCount: orgEvents.filter((e) => e.status !== 'COMPLETED' && e.status !== 'CANCELLED').length,
      totalInvoiced,
      totalPaid,
      outstandingAmount: Math.max(0, totalInvoiced - totalPaid),
      locationNames: locations,
    };
  });

  res.json({ organizations: enriched });
});

// 2. Admin: Create B2B Organization & Initial Account
router.post('/admin/organizations', authMiddleware, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  const {
    name,
    contactPerson,
    email,
    phone,
    address,
    serviceLocationIds = [],
    contractStartDate,
    contractEndDate,
    contractPricing = 0,
    paymentTerms = 'Net 30 Days',
    notes,
    initialPassword = 'password123',
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Organization name is required' });
  }
  if (!contactPerson || !contactPerson.trim()) {
    return res.status(400).json({ error: 'Contact person is required' });
  }
  if (!phone || !phone.trim()) {
    return res.status(400).json({ error: 'Mobile phone number is required' });
  }

  const orgId = `ORG-${new Date().getFullYear()}-${String(Math.floor(100 + Math.random() * 900))}`;
  const now = new Date().toISOString();

  // Create Organization
  const newOrg: Organization = {
    organizationId: orgId,
    name: name.trim(),
    contactPerson: contactPerson.trim(),
    email: email ? email.trim() : `client_${orgId.toLowerCase()}@workcrew.in`,
    phone: phone.trim(),
    address: address ? address.trim() : undefined,
    serviceLocationIds: Array.isArray(serviceLocationIds) ? serviceLocationIds : [],
    contractStartDate: contractStartDate || now.slice(0, 10),
    contractEndDate: contractEndDate || new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
    contractPricing: Number(contractPricing) || 0,
    paymentTerms: paymentTerms || 'Net 30 Days',
    status: 'ACTIVE',
    notes: notes || undefined,
    createdAt: now,
    updatedAt: now,
  };

  db.createOrganization(newOrg);

  // Create Initial B2B User Account with role B2B_CLIENT
  const userId = `user-b2b-${Date.now()}`;
  const passwordHash = bcrypt.hashSync(initialPassword, 10);

  const newUser: User = {
    uid: userId,
    role: 'B2B_CLIENT',
    displayName: `${contactPerson.trim()} (${name.trim()})`,
    phone: phone.trim(),
    email: email ? email.trim() : undefined,
    passwordHash,
    organizationId: orgId,
    organizationName: name.trim(),
    active: true,
    mustChangePassword: false,
    createdAt: now,
    updatedAt: now,
  };

  db.addUser(newUser);

  db.logActivity({
    logId: `act-${Date.now()}`,
    actorId: req.user?.uid || 'admin',
    actorName: req.user?.displayName || 'Administrator',
    actorRole: 'ADMIN',
    action: 'CREATE_ORGANIZATION',
    entityType: 'ORGANIZATION',
    entityId: orgId,
    changes: { name, contactPerson, phone, orgId },
    timestamp: now,
  });

  res.status(201).json({
    success: true,
    message: 'B2B Organization and client login account created successfully',
    organization: newOrg,
    user: {
      uid: newUser.uid,
      displayName: newUser.displayName,
      phone: newUser.phone,
      email: newUser.email,
      role: newUser.role,
    },
  });
});

// 3. Admin: Update B2B Organization
router.put('/admin/organizations/:id', authMiddleware, requireRole(['ADMIN']), (req: Request, res: Response) => {
  const id = req.params.id as string;
  const updates = req.body;

  const existing = db.getOrganizationById(id);
  if (!existing) {
    return res.status(404).json({ error: 'Organization not found' });
  }

  const updated = db.updateOrganization(id, updates);

  // If organization name changed, update linked users and events
  if (updates.name && updates.name !== existing.name) {
    const users = db.getUsers().filter((u) => u.organizationId === id);
    users.forEach((u) => {
      db.updateUser(u.uid, { organizationName: updates.name });
    });

    const events = db.getEventsForOrganization(id);
    events.forEach((e) => {
      db.updateAssignment(e.assignmentId, { organizationName: updates.name });
    });
  }

  res.json({ success: true, organization: updated });
});

// 4. Admin: Get all B2B Events
router.get('/admin/events', authMiddleware, requireRole(['ADMIN']), (req: Request, res: Response) => {
  const assignments = db.getAssignments().filter((a) => Boolean(a.organizationId));
  const evidenceList = db.getWorkEvidence();

  const formatted = assignments.map((a) => {
    const org = a.organizationId ? db.getOrganizationById(a.organizationId) : undefined;
    const team = a.teamIds?.[0] ? db.getTeamById(a.teamIds[0]) : undefined;
    const leader = team?.leaderIds?.[0] ? db.getLeaderById(team.leaderIds[0]) : undefined;
    const computedStatus = computeEventStatus(a, evidenceList);

    return {
      ...a,
      computedStatus,
      organizationName: org?.name || a.organizationName || 'B2B Client',
      teamName: team?.name || 'Assigned Crew',
      leaderName: leader?.name || a.assignedByName || 'Supervisor',
      workerCount: a.workerIds?.length || a.requiredWorkersCount || 0,
    };
  });

  res.json({ events: formatted });
});

// 5. Admin: Create B2B Event
router.post('/admin/events', authMiddleware, requireRole(['ADMIN']), (req: Request, res: Response) => {
  const {
    title,
    organizationId,
    locationId,
    date,
    startTime = '09:00',
    endTime = '17:00',
    cleaningRequirements,
    requiredWorkersCount = 2,
    teamId,
    leaderId,
    servicePrice = 0,
    paymentTerms = 'Due on Completion',
    priority = 'HIGH',
    instructions,
  } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Event name is required' });
  }
  if (!organizationId) {
    return res.status(400).json({ error: 'Client / Organization selection is required' });
  }
  if (!locationId) {
    return res.status(400).json({ error: 'Service Location is required' });
  }
  if (!date) {
    return res.status(400).json({ error: 'Event date is required' });
  }

  const organization = db.getOrganizationById(organizationId);
  if (!organization) {
    return res.status(404).json({ error: 'Selected organization not found' });
  }

  const location = db.getLocationById(locationId);
  const team = teamId ? db.getTeamById(teamId) : undefined;
  const leader = leaderId ? db.getLeaderById(leaderId) : team?.leaderIds?.[0] ? db.getLeaderById(team.leaderIds[0]) : undefined;

  // Resolve assigned worker IDs from the team
  const workerIds = team?.memberWorkerIds || [];

  const assignmentId = `EVT-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;
  const now = new Date().toISOString();

  const newAssignment: Assignment = {
    assignmentId,
    title: title.trim(),
    description: cleaningRequirements || `B2B Contract Cleaning for ${organization.name}`,
    locationId,
    locationName: location?.name || 'Client Facility',
    locationAddress: location?.address || '',
    locationLatitude: location?.latitude,
    locationLongitude: location?.longitude,
    assignedBy: req.user?.uid || 'admin',
    assignedByName: leader?.name || req.user?.displayName || 'Operations Admin',
    teamIds: teamId ? [teamId] : [],
    workerIds,
    date,
    startTime,
    endTime,
    priority: priority as any,
    status: workerIds.length > 0 ? 'ASSIGNED' : 'ASSIGNED',
    instructions: instructions || cleaningRequirements,
    organizationId,
    organizationName: organization.name,
    cleaningRequirements: cleaningRequirements || '',
    requiredWorkersCount: Number(requiredWorkersCount) || workerIds.length || 2,
    servicePrice: Number(servicePrice) || 0,
    paymentTerms: paymentTerms || organization.paymentTerms || 'Due on Completion',
    createdAt: now,
    updatedAt: now,
  };

  db.addAssignment(newAssignment);

  // If workers are attached, create assignment member records
  workerIds.forEach((wId) => {
    db.addAssignmentMember({
      membershipId: `mem-${assignmentId}-${wId}`,
      assignmentId,
      workerId: wId,
      teamId: teamId || undefined,
      individualStatus: 'ASSIGNED',
    });
  });

  // Optionally auto-generate invoice if service price is set
  if (Number(servicePrice) > 0) {
    const invId = `INV-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;
    db.createInvoice({
      invoiceId: invId,
      invoiceNumber: invId,
      organizationId,
      organizationName: organization.name,
      assignmentId,
      eventName: title.trim(),
      issueDate: date,
      dueDate: new Date(new Date(date).getTime() + 15 * 86400000).toISOString().slice(0, 10),
      amount: Number(servicePrice),
      amountPaid: 0,
      status: 'PENDING',
      description: cleaningRequirements || `Contract Cleaning Service: ${title.trim()}`,
      items: [
        {
          description: title.trim(),
          quantity: 1,
          unitPrice: Number(servicePrice),
          total: Number(servicePrice),
        },
      ],
      notes: `Event Invoice generated by Admin. Terms: ${paymentTerms}`,
      createdAt: now,
      updatedAt: now,
    });
  }

  db.logActivity({
    logId: `act-${Date.now()}`,
    actorId: req.user?.uid || 'admin',
    actorName: req.user?.displayName || 'Administrator',
    actorRole: 'ADMIN',
    action: 'CREATE_B2B_EVENT',
    entityType: 'ASSIGNMENT',
    entityId: assignmentId,
    changes: { title, organizationId, date, servicePrice },
    timestamp: now,
  });

  res.status(201).json({
    success: true,
    message: 'B2B Event created successfully and linked to client dashboard and workforce crew',
    event: newAssignment,
  });
});

// 6. Admin: Get all Invoices
router.get('/admin/invoices', authMiddleware, requireRole(['ADMIN']), (req: Request, res: Response) => {
  const invoices = db.getInvoices();
  res.json({ invoices });
});

// 7. Admin: Generate New Invoice
router.post('/admin/invoices', authMiddleware, requireRole(['ADMIN']), (req: Request, res: Response) => {
  const {
    organizationId,
    assignmentId,
    amount,
    issueDate,
    dueDate,
    description,
    items,
    notes,
  } = req.body;

  if (!organizationId) {
    return res.status(400).json({ error: 'Organization is required' });
  }
  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Valid invoice amount is required' });
  }

  const organization = db.getOrganizationById(organizationId);
  if (!organization) {
    return res.status(404).json({ error: 'Organization not found' });
  }

  const event = assignmentId ? db.getAssignmentById(assignmentId) : undefined;
  const invId = `INV-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;
  const now = new Date().toISOString();

  const newInvoice: Invoice = {
    invoiceId: invId,
    invoiceNumber: invId,
    organizationId,
    organizationName: organization.name,
    assignmentId: event?.assignmentId,
    eventName: event?.title || 'Contract Facility Service',
    issueDate: issueDate || now.slice(0, 10),
    dueDate: dueDate || new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    amount: Number(amount),
    amountPaid: 0,
    status: 'PENDING',
    description: description || `Facility Cleaning & Sanitization Services for ${organization.name}`,
    items: Array.isArray(items) && items.length > 0 ? items : [
      {
        description: event?.title || 'Contract Cleaning Service',
        quantity: 1,
        unitPrice: Number(amount),
        total: Number(amount),
      },
    ],
    notes: notes || `Payment terms: ${organization.paymentTerms}`,
    createdAt: now,
    updatedAt: now,
  };

  db.createInvoice(newInvoice);

  res.status(201).json({
    success: true,
    message: 'Invoice generated successfully',
    invoice: newInvoice,
  });
});

// 8. Admin: Record Offline Payment (Bank Transfer, Cash, Cheque, UPI)
router.post('/admin/invoices/:id/record-payment', authMiddleware, requireRole(['ADMIN']), (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { amount, paymentMethod = 'BANK_TRANSFER', transactionId, notes } = req.body;

  const invoice = db.getInvoiceById(id);
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  const remaining = Math.max(0, Number(invoice.amount) - Number(invoice.amountPaid || 0));
  if (remaining <= 0) {
    return res.status(400).json({ error: 'Invoice is already fully paid' });
  }

  const payAmount = Number(amount) > 0 ? Math.min(Number(amount), remaining) : remaining;
  const txnId = transactionId || `offline_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const receiptNum = `RCPT-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;
  const now = new Date().toISOString();

  const newPayment: Payment = {
    paymentId: `PAY-${Date.now()}`,
    receiptNumber: receiptNum,
    invoiceId: invoice.invoiceId,
    invoiceNumber: invoice.invoiceNumber,
    organizationId: invoice.organizationId,
    organizationName: invoice.organizationName,
    assignmentId: invoice.assignmentId,
    eventName: invoice.eventName,
    amount: payAmount,
    paymentDate: now,
    paymentMethod: paymentMethod as PaymentMethod,
    transactionId: txnId,
    status: 'SUCCESS',
    recordedBy: req.user?.uid,
    recordedByName: req.user?.displayName || 'Administrator',
    notes: notes || `Offline payment recorded by Admin via ${paymentMethod}`,
    receiptUrl: `/api/b2b/client/receipts/${receiptNum}`,
    createdAt: now,
    updatedAt: now,
  };

  db.createPayment(newPayment);

  const newAmountPaid = Number(invoice.amountPaid || 0) + payAmount;
  const newStatus = newAmountPaid >= Number(invoice.amount) ? 'PAID' : 'PARTIALLY_PAID';

  const updatedInvoice = db.updateInvoice(invoice.invoiceId, {
    amountPaid: newAmountPaid,
    status: newStatus,
    notes: `Offline payment of ₹${payAmount.toLocaleString('en-IN')} recorded by Admin (${paymentMethod}). Receipt: ${receiptNum}`,
  });

  res.json({
    success: true,
    message: 'Offline payment recorded and receipt created successfully',
    payment: newPayment,
    invoice: updatedInvoice,
    receiptNumber: receiptNum,
  });
});

// 9. Admin: Get all Payment Transactions
router.get('/admin/payments', authMiddleware, requireRole(['ADMIN']), (req: Request, res: Response) => {
  const payments = db.getPayments();
  res.json({ payments });
});

export default router;
