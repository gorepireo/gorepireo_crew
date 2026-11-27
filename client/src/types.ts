export type UserRole = 'ADMIN' | 'TEAM_LEADER' | 'WORKER' | 'B2B_CLIENT';

export interface User {
  uid: string;
  role: UserRole;
  displayName: string;
  phone: string;
  email?: string;
  photoURL?: string;
  organizationId?: string;
  organizationName?: string;
  active: boolean;
  mustChangePassword?: boolean;
  failedLoginAttempts?: number;
  lockedUntil?: string | null;
  createdById?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Worker {
  workerId: string;
  userId: string;
  name: string;
  phone: string;
  email?: string;
  photoURL?: string;
  address?: string;
  primaryTeamId?: string | null;
  primaryTeamName?: string | null;
  teamAssignmentStatus?: 'UNASSIGNED' | 'ASSIGNED';
  joiningDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  createdById?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamLeader {
  leaderId: string;
  userId: string;
  name: string;
  phone: string;
  email?: string;
  photoURL?: string;
  managedTeamIds: string[];
  permissions: {
    canAddWorkers: boolean;
    canAssignJobs: boolean;
    canCorrectAttendance: boolean;
    canCreateTeams: boolean;
  };
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  teamId: string;
  name: string;
  description: string;
  leaderIds: string[];
  memberWorkerIds: string[];
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  leaders?: TeamLeader[];
  workers?: Worker[];
}

export interface WorkLocation {
  locationId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  geofenceRadiusMeters: number;
  status: 'ACTIVE' | 'ARCHIVED';
  photoURL?: string;
  googleDriveFileId?: string;
  activeAssignmentsCount?: number;
}

export type AssignmentPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AssignmentStatus = 'ASSIGNED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'NOT_DONE' | 'CANCELLED';

export interface Assignment {
  assignmentId: string;
  title: string;
  description: string;
  locationId: string;
  locationName?: string;
  locationAddress?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  locationPhotoURL?: string;
  assignedBy: string;
  assignedByName?: string;
  teamIds: string[];
  workerIds: string[];
  date: string;
  startTime: string;
  endTime: string;
  priority: AssignmentPriority;
  status: AssignmentStatus;
  instructions?: string;
  completionNote?: string;
  completionEvidenceUrl?: string;
  // B2B Event Links
  organizationId?: string;
  organizationName?: string;
  cleaningRequirements?: string;
  requiredWorkersCount?: number;
  servicePrice?: number;
  paymentTerms?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentMember {
  membershipId: string;
  assignmentId: string;
  workerId: string;
  teamId?: string;
  individualStatus: AssignmentStatus;
  acceptedAt?: string;
  completedAt?: string;
}

export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'LATE'
  | 'HALF_DAY'
  | 'ON_LEAVE'
  | 'APPROVED_LEAVE'
  | 'PENDING_VERIFICATION'
  | 'LOCATION_EXCEPTION'
  | 'CORRECTED'
  | 'PENDING';

export type AttendanceMethod = 'GPS' | 'MANUAL_LEADER' | 'MANUAL_ADMIN';

export type GPSVerificationStatus =
  | 'VERIFIED'
  | 'OUTSIDE_GEOFENCE'
  | 'POOR_ACCURACY'
  | 'EXCEPTION'
  | 'UNAVAILABLE'
  | 'PENDING'
  | 'FLAGGED'
  | 'MANUAL_OVERRIDE';

export interface AttendancePhoto {
  photoId: string;
  workerId: string;
  workerName?: string;
  assignmentId?: string;
  assignmentTitle?: string;
  teamId?: string;
  photoType: 'CHECK_IN' | 'CHECK_OUT';
  storagePath: string;
  thumbnailPath?: string;
  watermarkPath?: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  detectedAddress: string;
  deviceCapturedAt: string;
  serverUploadedAt: string;
  verificationStatus: GPSVerificationStatus;
  createdAt: string;
}

export interface Attendance {
  attendanceId: string;
  workerId: string;
  workerName?: string;
  workerCode?: string;
  teamId?: string;
  teamName?: string;
  assignmentId?: string;
  assignmentTitle?: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  checkInMethod?: AttendanceMethod;
  checkOutMethod?: AttendanceMethod;
  checkInLatitude?: number;
  checkInLongitude?: number;
  checkInAccuracy?: number;
  checkInDistanceMeters?: number;
  checkInAddress?: string;
  checkInPhotoId?: string;
  checkInPhotoUrl?: string;
  checkOutLatitude?: number;
  checkOutLongitude?: number;
  checkOutAccuracy?: number;
  checkOutDistanceMeters?: number;
  checkOutAddress?: string;
  checkOutPhotoId?: string;
  checkOutPhotoUrl?: string;
  status: AttendanceStatus;
  workingMinutes?: number;
  verificationStatus: 'VERIFIED' | 'FLAGGED' | 'MANUAL_OVERRIDE' | 'PENDING';
  gpsStatus?: GPSVerificationStatus;
  photoStatus?: 'SUBMITTED' | 'MISSING' | 'EXCEPTION';
  exceptionReason?: string;
  exceptionStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  exceptionResolvedBy?: string;
  markedBy?: string;
  markedByName?: string;
  remarks?: string;
  correctionRequested?: boolean;
  correctionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceEvent {
  eventId: string;
  attendanceId: string;
  workerId: string;
  assignmentId?: string;
  eventType: 'CHECK_IN' | 'CHECK_OUT' | 'MANUAL_MARK' | 'CORRECTION' | 'EXCEPTION' | 'VERIFICATION_OVERRIDE';
  eventSource: 'WORKER_APP' | 'LEADER_PORTAL' | 'ADMIN_PORTAL' | 'SYSTEM';
  actorId: string;
  actorName: string;
  method?: AttendanceMethod;
  photoId?: string;
  photoUrl?: string;
  timestamp: string;
  deviceTimestamp?: string;
  serverTimestamp?: string;
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
  detectedAddress?: string;
  geofenceDistanceMeters?: number;
  verificationStatus?: string;
  exceptionReason?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    distanceMeters?: number;
    detectedAddress?: string;
  };
  reason?: string;
  previousValues?: Partial<Attendance>;
  newValues?: Partial<Attendance>;
}

export type WorkEvidenceCategory = 'BEFORE' | 'DURING' | 'AFTER' | 'OTHER';
export type WorkEvidenceReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface WorkEvidence {
  evidenceId: string;
  workerId: string;
  workerName?: string;
  assignmentId: string;
  assignmentTitle?: string;
  locationId: string;
  locationName?: string;
  teamId?: string;
  photoId: string;
  photoUrl: string;
  watermarkUrl?: string;
  category: WorkEvidenceCategory;
  description?: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  detectedAddress: string;
  capturedAt: string;
  uploadedAt: string;
  reviewStatus: WorkEvidenceReviewStatus;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  autoVerified?: boolean;
  createdAt: string;
}

export interface LeaveRequest {
  leaveId: string;
  workerId: string;
  workerName: string;
  teamId?: string;
  startDate: string;
  endDate: string;
  leaveType: 'CASUAL' | 'SICK' | 'EMERGENCY' | 'PLANNED';
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  reviewComment?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface Notification {
  notificationId: string;
  recipientId: string;
  title: string;
  message: string;
  type: 'ASSIGNMENT' | 'ATTENDANCE' | 'SYSTEM' | 'CORRECTION' | 'LEAVE';
  read: boolean;
  relatedEntityId?: string;
  createdAt: string;
}

export interface ActivityLog {
  logId: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: 'WORKER' | 'LEADER' | 'TEAM' | 'LOCATION' | 'ASSIGNMENT' | 'ATTENDANCE' | 'SETTINGS' | 'ORGANIZATION' | 'INVOICE' | 'PAYMENT';
  entityId: string;
  changes?: Record<string, any>;
  timestamp: string;
}

export interface PasswordResetRequest {
  requestId: string;
  userId: string;
  workerId?: string;
  leaderId?: string;
  name: string;
  phone: string;
  role: UserRole;
  requestedBy: string;
  requestedByName: string;
  targetLeaderId?: string;
  teamId?: string;
  teamName?: string;
  status: 'PENDING' | 'RESOLVED' | 'REJECTED';
  reason?: string;
  temporaryPasswordGenerated?: string;
  resolvedBy?: string;
  resolvedByName?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface OrganizationSettings {
  orgName: string;
  orgLogo?: string;
  contactEmail: string;
  contactPhone: string;
  defaultGeofenceRadiusMeters: number;
  lateArrivalGracePeriodMinutes: number;
  workingDays: number[];
  defaultStartTime: string;
  defaultEndTime: string;
  timezone: string;
  notificationsEnabled: boolean;
  allowManualAttendance: boolean;
  requireGPSAccuracyThreshold: number;
  requireAttendancePhoto: boolean;
  requireWorkEvidence: boolean;
  maxAllowedGPSAccuracyMeters: number;
  photoRetentionDays: number;
}

// ==================== B2B CLIENT PORTAL ENTITIES ====================

export interface Organization {
  organizationId: string; // ORG-2026-001
  orgId?: string; // alias
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address?: string;
  serviceLocationIds: string[];
  serviceLocations?: string[];
  contractStartDate: string; // YYYY-MM-DD
  contractEndDate: string; // YYYY-MM-DD
  contractPricing: number;
  paymentTerms: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'PARTIALLY_PAID';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  invoiceId: string; // INV-2026-001
  invoiceNumber: string;
  organizationId: string;
  organizationName: string;
  assignmentId?: string;
  eventName?: string;
  issueDate: string; // YYYY-MM-DD
  invoiceDate?: string; // alias
  dueDate: string; // YYYY-MM-DD
  amount: number;
  amountPaid: number;
  status: InvoiceStatus;
  description?: string;
  items?: InvoiceItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'ONLINE' | 'RAZORPAY' | 'BANK_TRANSFER' | 'CASH' | 'CHEQUE' | 'UPI';
export type PaymentStatus = 'SUCCESS' | 'FAILED' | 'PENDING';

export interface Payment {
  paymentId: string; // PAY-2026-001
  receiptNumber: string; // RCPT-2026-001
  invoiceId: string;
  invoiceNumber: string;
  organizationId: string;
  organizationName: string;
  assignmentId?: string;
  eventName?: string;
  amount: number;
  paymentDate: string; // ISO string
  paymentMethod: PaymentMethod;
  transactionId: string;
  status: PaymentStatus;
  recordedBy?: string;
  recordedByName?: string;
  notes?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

