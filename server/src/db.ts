import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcryptjs';
import { createClient, Client } from '@libsql/client/web';
import {
  User,
  UserRole,
  Worker,
  TeamLeader,
  Team,
  WorkLocation,
  Assignment,
  AssignmentMember,
  Attendance,
  AttendanceEvent,
  AttendancePhoto,
  WorkEvidence,
  LeaveRequest,
  Notification,
  ActivityLog,
  OrganizationSettings,
  PasswordResetRequest,
  Organization,
  Invoice,
  Payment,
} from './types';

export interface DatabaseSchema {
  users: User[];
  workers: Worker[];
  teamLeaders: TeamLeader[];
  teams: Team[];
  locations: WorkLocation[];
  assignments: Assignment[];
  assignmentMembers: AssignmentMember[];
  attendance: Attendance[];
  attendanceEvents: AttendanceEvent[];
  attendancePhotos: AttendancePhoto[];
  workEvidence: WorkEvidence[];
  leaveRequests: LeaveRequest[];
  notifications: Notification[];
  activityLogs: ActivityLog[];
  passwordResetRequests: PasswordResetRequest[];
  organizations: Organization[];
  invoices: Invoice[];
  payments: Payment[];
  settings: OrganizationSettings;
}

function safeJsonParse<T>(val: any, fallback: T): T {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  if (typeof val !== 'string') return fallback;
  const trimmed = val.trim();
  if (!trimmed) return fallback;
  try {
    return JSON.parse(trimmed);
  } catch {
    try {
      const fixed = trimmed.replace(/'/g, '"');
      return JSON.parse(fixed);
    } catch {
      if (Array.isArray(fallback) && typeof trimmed === 'string') {
        const parts = trimmed.replace(/[\[\]]/g, '').split(',').map((s: string) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
        return parts as unknown as T;
      }
      return fallback;
    }
  }
}

const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'data') : path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

const DEFAULT_TURSO_URL = 'https://gorepireo-workcrew-gorepireo.aws-ap-south-1.turso.io';
const DEFAULT_TURSO_TOKEN =
  'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJnaWQiOiJlNzQ5NGZiZC05MzFmLTRlM2ItYTU5Ni1iOWJhZjUwNmRkNzUiLCJpYXQiOjE3OTUwMjAxNTUsImtpZCI6IjJxR3Brck5QRVJ4Zkp6T1oyMXRvVVpwbmNBREtsbEszY3lqUHJvMzFvWjQiLCJyaWQiOiIxYjE5OGUwYS01MjU3LTQxNjEtODYwMC1kMzQwNzMxMzU1YzgifQ.5t4_WGiQNWUg9I68knvCAYP-JxQIw-LxmI_Pv8qyn_wqOFl03O4fwkpzboojtqoRbgrCW9WfkAsblQsCLpPCCA';

const INITIAL_SETTINGS: OrganizationSettings = {
  orgName: 'Go_Repireo Crew',
  orgLogo: '/logo.png',
  contactEmail: 'operations@workcrew.com',
  contactPhone: '+91 98765 00000',
  defaultGeofenceRadiusMeters: 100,
  lateArrivalGracePeriodMinutes: 15,
  workingDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
  defaultStartTime: '08:00',
  defaultEndTime: '17:00',
  timezone: 'Asia/Kolkata',
  notificationsEnabled: true,
  allowManualAttendance: true,
  requireGPSAccuracyThreshold: 50,
  requireAttendancePhoto: true,
  requireWorkEvidence: true,
  maxAllowedGPSAccuracyMeters: 50,
  photoRetentionDays: 90,
};

function getSeedData(): DatabaseSchema {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const users: User[] = [
    {
      uid: 'user-admin-1',
      role: 'ADMIN',
      displayName: 'Rajesh Sharma',
      phone: '+91 98765 11111',
      email: 'admin@workcrew.com',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      active: true,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },
    {
      uid: 'user-leader-1',
      role: 'TEAM_LEADER',
      displayName: 'Vikram Malhotra',
      phone: '+91 98765 22222',
      email: 'leader1@workcrew.com',
      photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      active: true,
      createdAt: '2026-01-05T08:00:00Z',
      updatedAt: '2026-01-05T08:00:00Z',
    },
    {
      uid: 'user-leader-2',
      role: 'TEAM_LEADER',
      displayName: 'Ananya Sen',
      phone: '+91 98765 33333',
      email: 'leader2@workcrew.com',
      photoURL: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      active: true,
      createdAt: '2026-01-10T08:00:00Z',
      updatedAt: '2026-01-10T08:00:00Z',
    },
    {
      uid: 'user-worker-1',
      role: 'WORKER',
      displayName: 'Amit Kumar',
      phone: '+91 98765 43210',
      email: 'worker1@workcrew.com',
      photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      active: true,
      createdAt: '2026-01-15T08:00:00Z',
      updatedAt: '2026-01-15T08:00:00Z',
    },
    {
      uid: 'user-worker-2',
      role: 'WORKER',
      displayName: 'Suresh Patel',
      phone: '+91 98765 43211',
      email: 'suresh@workcrew.com',
      photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      active: true,
      createdAt: '2026-01-16T08:00:00Z',
      updatedAt: '2026-01-16T08:00:00Z',
    },
    {
      uid: 'user-worker-3',
      role: 'WORKER',
      displayName: 'Ravi Shankar',
      phone: '+91 98765 43212',
      email: 'ravi@workcrew.com',
      photoURL: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      active: true,
      createdAt: '2026-01-18T08:00:00Z',
      updatedAt: '2026-01-18T08:00:00Z',
    },
    {
      uid: 'user-worker-4',
      role: 'WORKER',
      displayName: 'Mohan Lal',
      phone: '+91 98765 43213',
      email: 'mohan@workcrew.com',
      photoURL: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      active: true,
      createdAt: '2026-01-20T08:00:00Z',
      updatedAt: '2026-01-20T08:00:00Z',
    },
    {
      uid: 'user-worker-5',
      role: 'WORKER',
      displayName: 'Deepak Verma',
      phone: '+91 98765 43214',
      email: 'deepak@workcrew.com',
      active: true,
      createdAt: '2026-01-22T08:00:00Z',
      updatedAt: '2026-01-22T08:00:00Z',
    },
    {
      uid: 'user-worker-6',
      role: 'WORKER',
      displayName: 'Karan Singhania',
      phone: '+91 98765 43215',
      email: 'karan@workcrew.com',
      active: true,
      createdAt: '2026-01-25T08:00:00Z',
      updatedAt: '2026-01-25T08:00:00Z',
    },
    {
      uid: 'user-worker-7',
      role: 'WORKER',
      displayName: 'Pooja Das',
      phone: '+91 98765 43216',
      email: 'pooja@workcrew.com',
      active: true,
      createdAt: '2026-02-01T08:00:00Z',
      updatedAt: '2026-02-01T08:00:00Z',
    },
    {
      uid: 'user-b2b-001',
      role: 'B2B_CLIENT',
      displayName: 'Vikram Malhotra',
      phone: '9800615893',
      email: 'client@apextowers.com',
      photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      organizationId: 'ORG-2026-001',
      organizationName: 'Apex Corporate Towers',
      active: true,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },
  ];

  const teamLeaders: TeamLeader[] = [
    {
      leaderId: 'TL-001',
      userId: 'user-leader-1',
      name: 'Vikram Malhotra',
      phone: '+91 98765 22222',
      email: 'leader1@workcrew.com',
      managedTeamIds: ['TM-001', 'TM-002'],
      permissions: {
        canAddWorkers: true,
        canAssignJobs: true,
        canCorrectAttendance: true,
        canCreateTeams: true,
      },
      status: 'ACTIVE',
      createdAt: '2026-01-05T08:00:00Z',
      updatedAt: '2026-01-05T08:00:00Z',
    },
    {
      leaderId: 'TL-002',
      userId: 'user-leader-2',
      name: 'Ananya Sen',
      phone: '+91 98765 33333',
      email: 'leader2@workcrew.com',
      managedTeamIds: ['TM-003'],
      permissions: {
        canAddWorkers: true,
        canAssignJobs: true,
        canCorrectAttendance: false,
        canCreateTeams: false,
      },
      status: 'ACTIVE',
      createdAt: '2026-01-10T08:00:00Z',
      updatedAt: '2026-01-10T08:00:00Z',
    },
  ];

  const teams: Team[] = [
    {
      teamId: 'TM-001',
      name: 'Alpha Site Civil Team',
      description: 'Heavy structural civil engineering and concrete works crew',
      leaderIds: ['TL-001'],
      memberWorkerIds: ['WC-2026-001', 'WC-2026-002', 'WC-2026-003'],
      status: 'ACTIVE',
      createdAt: '2026-01-15T08:00:00Z',
      updatedAt: '2026-01-15T08:00:00Z',
    },
    {
      teamId: 'TM-002',
      name: 'Metro Electrical Unit',
      description: 'High voltage cabling, junction routing and distribution board installation',
      leaderIds: ['TL-001'],
      memberWorkerIds: ['WC-2026-004', 'WC-2026-005'],
      status: 'ACTIVE',
      createdAt: '2026-01-18T08:00:00Z',
      updatedAt: '2026-01-18T08:00:00Z',
    },
    {
      teamId: 'TM-003',
      name: 'Apex HVAC & Plumbing',
      description: 'Chiller lines, ducting networks, and sanitary plumbing',
      leaderIds: ['TL-002'],
      memberWorkerIds: ['WC-2026-006', 'WC-2026-007'],
      status: 'ACTIVE',
      createdAt: '2026-01-20T08:00:00Z',
      updatedAt: '2026-01-20T08:00:00Z',
    },
  ];

  const workers: Worker[] = [
    {
      workerId: 'WC-2026-001',
      userId: 'user-worker-1',
      name: 'Amit Kumar',
      phone: '+91 98765 43210',
      email: 'worker1@workcrew.com',
      photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      address: 'House 42, Green Avenue, Noida',
      primaryTeamId: 'TM-001',
      primaryTeamName: 'Alpha Site Civil Team',
      joiningDate: '2026-01-15',
      status: 'ACTIVE',
      createdAt: '2026-01-15T08:00:00Z',
      updatedAt: '2026-01-15T08:00:00Z',
    },
    {
      workerId: 'WC-2026-002',
      userId: 'user-worker-2',
      name: 'Suresh Patel',
      phone: '+91 98765 43211',
      email: 'suresh@workcrew.com',
      photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      address: 'Flat 102, Shanti Vihar, Delhi',
      primaryTeamId: 'TM-001',
      primaryTeamName: 'Alpha Site Civil Team',
      joiningDate: '2026-01-16',
      status: 'ACTIVE',
      createdAt: '2026-01-16T08:00:00Z',
      updatedAt: '2026-01-16T08:00:00Z',
    },
    {
      workerId: 'WC-2026-003',
      userId: 'user-worker-3',
      name: 'Ravi Shankar',
      phone: '+91 98765 43212',
      email: 'ravi@workcrew.com',
      photoURL: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      address: 'Plot 15, Sector 4, Ghaziabad',
      primaryTeamId: 'TM-001',
      primaryTeamName: 'Alpha Site Civil Team',
      joiningDate: '2026-01-18',
      status: 'ACTIVE',
      createdAt: '2026-01-18T08:00:00Z',
      updatedAt: '2026-01-18T08:00:00Z',
    },
    {
      workerId: 'WC-2026-004',
      userId: 'user-worker-4',
      name: 'Mohan Lal',
      phone: '+91 98765 43213',
      email: 'mohan@workcrew.com',
      photoURL: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      address: 'C-89, Subhash Nagar, Delhi',
      primaryTeamId: 'TM-002',
      primaryTeamName: 'Metro Electrical Unit',
      joiningDate: '2026-01-20',
      status: 'ACTIVE',
      createdAt: '2026-01-20T08:00:00Z',
      updatedAt: '2026-01-20T08:00:00Z',
    },
    {
      workerId: 'WC-2026-005',
      userId: 'user-worker-5',
      name: 'Deepak Verma',
      phone: '+91 98765 43214',
      email: 'deepak@workcrew.com',
      address: 'Block B, Mayur Vihar, Delhi',
      primaryTeamId: 'TM-002',
      primaryTeamName: 'Metro Electrical Unit',
      joiningDate: '2026-01-22',
      status: 'ACTIVE',
      createdAt: '2026-01-22T08:00:00Z',
      updatedAt: '2026-01-22T08:00:00Z',
    },
    {
      workerId: 'WC-2026-006',
      userId: 'user-worker-6',
      name: 'Karan Singhania',
      phone: '+91 98765 43215',
      email: 'karan@workcrew.com',
      address: 'Pocket 3, Dwarka Sector 11',
      primaryTeamId: 'TM-003',
      primaryTeamName: 'Apex HVAC & Plumbing',
      joiningDate: '2026-01-25',
      status: 'ACTIVE',
      createdAt: '2026-01-25T08:00:00Z',
      updatedAt: '2026-01-25T08:00:00Z',
    },
    {
      workerId: 'WC-2026-007',
      userId: 'user-worker-7',
      name: 'Pooja Das',
      phone: '+91 98765 43216',
      email: 'pooja@workcrew.com',
      address: 'Street 9, Rohini Sector 16',
      primaryTeamId: 'TM-003',
      primaryTeamName: 'Apex HVAC & Plumbing',
      joiningDate: '2026-02-01',
      status: 'ACTIVE',
      createdAt: '2026-02-01T08:00:00Z',
      updatedAt: '2026-02-01T08:00:00Z',
    },
  ];

  const locations: WorkLocation[] = [
    {
      locationId: 'LOC-001',
      name: 'Central Metro Hub - Pier Foundation Site',
      address: 'Outer Ring Road, Near Gate 3, Sector 18, Noida / Delhi NCR',
      latitude: 28.5355,
      longitude: 77.3910,
      geofenceRadiusMeters: 120,
      status: 'ACTIVE',
      createdAt: '2026-01-10T08:00:00Z',
      updatedAt: '2026-01-10T08:00:00Z',
    },
    {
      locationId: 'LOC-002',
      name: 'Tech Park Tower B - Substation & HVAC Wing',
      address: 'Plot 42, Electronic City Phase 1, Bengaluru',
      latitude: 12.8399,
      longitude: 77.6770,
      geofenceRadiusMeters: 100,
      status: 'ACTIVE',
      createdAt: '2026-01-12T08:00:00Z',
      updatedAt: '2026-01-12T08:00:00Z',
    },
    {
      locationId: 'LOC-003',
      name: 'Greenfield Solar Power Project Block 4',
      address: 'Gurh Tehsil, Rewa Solar Ultra Mega Park, Madhya Pradesh',
      latitude: 24.5362,
      longitude: 81.3037,
      geofenceRadiusMeters: 250,
      status: 'ACTIVE',
      createdAt: '2026-01-15T08:00:00Z',
      updatedAt: '2026-01-15T08:00:00Z',
    },
    {
      locationId: 'LOC-004',
      name: 'Bhiwandi Logistics Hub Terminal 2',
      address: 'Mumbai-Nashik Expressway, Sector 7, Bhiwandi, Maharashtra',
      latitude: 19.2965,
      longitude: 73.0631,
      geofenceRadiusMeters: 150,
      status: 'ACTIVE',
      createdAt: '2026-01-20T08:00:00Z',
      updatedAt: '2026-01-20T08:00:00Z',
    },
  ];

  const assignments: Assignment[] = [
    {
      assignmentId: 'ASN-20260218-001',
      title: 'Pier Reinforcement Rebar & Pre-Pour Inspection',
      description: 'Complete tie-wire binding of vertical column cages on Pier 14B and verify alignment against laser level specifications before concrete mix arrives.',
      locationId: 'LOC-001',
      locationName: 'Central Metro Hub - Pier Foundation Site',
      locationAddress: 'Outer Ring Road, Near Gate 3, Sector 18, Noida / Delhi NCR',
      locationLatitude: 28.5355,
      locationLongitude: 77.3910,
      assignedBy: 'TL-001',
      assignedByName: 'Vikram Malhotra',
      teamIds: ['TM-001'],
      workerIds: ['WC-2026-001', 'WC-2026-002', 'WC-2026-003'],
      date: today,
      startTime: '08:00',
      endTime: '17:00',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      instructions: 'Mandatory PPE: Hardhat, steel-toe boots, hi-vis vest, and safety harness for column cage elevation. Check concrete slump test when transit mixers pull in.',
      organizationId: 'ORG-2026-001',
      organizationName: 'Apex Corporate Towers',
      cleaningRequirements: 'Complete deep industrial pressure washing of pier base, concrete spill wash, and waste disposal before handover.',
      requiredWorkersCount: 3,
      servicePrice: 45000,
      paymentTerms: 'Net 15 Days',
      createdAt: `${today}T06:30:00Z`,
      updatedAt: `${today}T08:15:00Z`,
    },
    {
      assignmentId: 'ASN-20260218-002',
      title: 'Underground 33kV Cable Tray Routing & Grounding',
      description: 'Pull armored feeder lines through trench sector D and bolt grounding braids to main copper bus bar at terminal vault.',
      locationId: 'LOC-001',
      locationName: 'Central Metro Hub - Pier Foundation Site',
      locationAddress: 'Outer Ring Road, Near Gate 3, Sector 18, Noida / Delhi NCR',
      locationLatitude: 28.5355,
      locationLongitude: 77.3910,
      assignedBy: 'TL-001',
      assignedByName: 'Vikram Malhotra',
      teamIds: ['TM-002'],
      workerIds: ['WC-2026-004', 'WC-2026-005'],
      date: today,
      startTime: '08:30',
      endTime: '16:30',
      priority: 'CRITICAL',
      status: 'ASSIGNED',
      instructions: 'Ensure circuit isolation lock-out/tag-out (LOTO) verification prior to contact with feeder termination lugs.',
      organizationId: 'ORG-2026-001',
      organizationName: 'Apex Corporate Towers',
      cleaningRequirements: 'Trench sector debris clearance, cable channel dust vacuuming, and terminal room disinfection.',
      requiredWorkersCount: 2,
      servicePrice: 32000,
      paymentTerms: 'Due on Completion',
      createdAt: `${today}T07:00:00Z`,
      updatedAt: `${today}T07:00:00Z`,
    },
    {
      assignmentId: 'ASN-20260217-001',
      title: 'Cooling Tower Chilled Water Riser Pressure Test',
      description: 'Fill condenser line loop with dyed water to 12 bar and hold pressure gauge steady for 4 consecutive hours.',
      locationId: 'LOC-002',
      locationName: 'Tech Park Tower B - Substation & HVAC Wing',
      locationAddress: 'Plot 42, Electronic City Phase 1, Bengaluru',
      locationLatitude: 12.8399,
      locationLongitude: 77.6770,
      assignedBy: 'TL-002',
      assignedByName: 'Ananya Sen',
      teamIds: ['TM-003'],
      workerIds: ['WC-2026-006', 'WC-2026-007'],
      date: yesterday,
      startTime: '08:00',
      endTime: '16:00',
      priority: 'MEDIUM',
      status: 'COMPLETED',
      completionNote: 'Pressure held steady at 12.1 bar for 4.5 hours with zero joint sweating observed. Signed off by MEP consultant.',
      organizationId: 'ORG-2026-001',
      organizationName: 'Apex Corporate Towers',
      cleaningRequirements: 'Complete chemical flush of chiller lines, post-test floor wash, and pipe polishing.',
      requiredWorkersCount: 2,
      servicePrice: 28000,
      paymentTerms: 'Paid Online',
      createdAt: `${yesterday}T07:00:00Z`,
      updatedAt: `${yesterday}T16:20:00Z`,
    },
  ];

  const assignmentMembers: AssignmentMember[] = [
    {
      membershipId: 'mem-1',
      assignmentId: 'ASN-20260218-001',
      workerId: 'WC-2026-001',
      teamId: 'TM-001',
      individualStatus: 'IN_PROGRESS',
      acceptedAt: `${today}T07:45:00Z`,
    },
    {
      membershipId: 'mem-2',
      assignmentId: 'ASN-20260218-001',
      workerId: 'WC-2026-002',
      teamId: 'TM-001',
      individualStatus: 'IN_PROGRESS',
      acceptedAt: `${today}T07:50:00Z`,
    },
    {
      membershipId: 'mem-3',
      assignmentId: 'ASN-20260218-001',
      workerId: 'WC-2026-003',
      teamId: 'TM-001',
      individualStatus: 'ACCEPTED',
      acceptedAt: `${today}T08:05:00Z`,
    },
    {
      membershipId: 'mem-4',
      assignmentId: 'ASN-20260218-002',
      workerId: 'WC-2026-004',
      teamId: 'TM-002',
      individualStatus: 'ASSIGNED',
    },
    {
      membershipId: 'mem-5',
      assignmentId: 'ASN-20260218-002',
      workerId: 'WC-2026-005',
      teamId: 'TM-002',
      individualStatus: 'ASSIGNED',
    },
    {
      membershipId: 'mem-6',
      assignmentId: 'ASN-20260217-001',
      workerId: 'WC-2026-006',
      teamId: 'TM-003',
      individualStatus: 'COMPLETED',
      acceptedAt: `${yesterday}T07:30:00Z`,
      completedAt: `${yesterday}T16:15:00Z`,
    },
    {
      membershipId: 'mem-7',
      assignmentId: 'ASN-20260217-001',
      workerId: 'WC-2026-007',
      teamId: 'TM-003',
      individualStatus: 'COMPLETED',
      acceptedAt: `${yesterday}T07:35:00Z`,
      completedAt: `${yesterday}T16:10:00Z`,
    },
  ];

  const attendance: Attendance[] = [
    {
      attendanceId: 'att-today-1',
      workerId: 'WC-2026-001',
      workerName: 'Amit Kumar',
      workerCode: 'WC-2026-001',
      teamId: 'TM-001',
      teamName: 'Alpha Site Civil Team',
      assignmentId: 'ASN-20260218-001',
      assignmentTitle: 'Pier Reinforcement Rebar & Pre-Pour Inspection',
      date: today,
      checkInTime: `${today}T08:02:14Z`,
      checkInMethod: 'GPS',
      checkInLatitude: 28.5356,
      checkInLongitude: 77.3911,
      checkInAccuracy: 12,
      checkInDistanceMeters: 16,
      status: 'PRESENT',
      verificationStatus: 'VERIFIED',
      gpsStatus: 'VERIFIED',
      photoStatus: 'SUBMITTED',
      checkInPhotoId: 'photo-att-1',
      checkInPhotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      checkInAddress: 'Site Gate 3, Sector 62 Industrial Corridor, Noida, UP 201309',
      remarks: 'Verified within 16m geofence radius',
      createdAt: `${today}T08:02:14Z`,
      updatedAt: `${today}T08:02:14Z`,
    },
    {
      attendanceId: 'att-today-2',
      workerId: 'WC-2026-002',
      workerName: 'Suresh Patel',
      workerCode: 'WC-2026-002',
      teamId: 'TM-001',
      teamName: 'Alpha Site Civil Team',
      assignmentId: 'ASN-20260218-001',
      assignmentTitle: 'Pier Reinforcement Rebar & Pre-Pour Inspection',
      date: today,
      checkInTime: `${today}T08:14:32Z`,
      checkInMethod: 'GPS',
      checkInLatitude: 28.5354,
      checkInLongitude: 77.3908,
      checkInAccuracy: 18,
      checkInDistanceMeters: 23,
      status: 'PRESENT',
      verificationStatus: 'VERIFIED',
      gpsStatus: 'VERIFIED',
      photoStatus: 'SUBMITTED',
      checkInPhotoId: 'photo-att-2',
      checkInPhotoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
      checkInAddress: 'Pier Base Pier 4A, Sector 62 Metro Project, Noida, UP',
      remarks: 'On time, geofence verified',
      createdAt: `${today}T08:14:32Z`,
      updatedAt: `${today}T08:14:32Z`,
    },
    {
      attendanceId: 'att-yesterday-1',
      workerId: 'WC-2026-006',
      workerName: 'Karan Singhania',
      workerCode: 'WC-2026-006',
      teamId: 'TM-003',
      teamName: 'Apex HVAC & Plumbing',
      assignmentId: 'ASN-20260217-001',
      date: yesterday,
      checkInTime: `${yesterday}T07:55:00Z`,
      checkOutTime: `${yesterday}T16:25:00Z`,
      checkInMethod: 'GPS',
      checkOutMethod: 'GPS',
      checkInLatitude: 12.8398,
      checkInLongitude: 77.6771,
      checkInAccuracy: 15,
      checkInDistanceMeters: 18,
      checkInPhotoId: 'photo-att-3',
      checkInPhotoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
      checkInAddress: 'Block 2 Utility Room, Electronic City Phase 1, Bangalore, KA',
      checkOutLatitude: 12.8397,
      checkOutLongitude: 77.6772,
      checkOutAccuracy: 14,
      checkOutDistanceMeters: 22,
      checkOutPhotoId: 'photo-att-4',
      checkOutPhotoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
      checkOutAddress: 'Block 2 Utility Room, Electronic City Phase 1, Bangalore, KA',
      status: 'PRESENT',
      workingMinutes: 510,
      verificationStatus: 'VERIFIED',
      gpsStatus: 'VERIFIED',
      photoStatus: 'SUBMITTED',
      createdAt: `${yesterday}T07:55:00Z`,
      updatedAt: `${yesterday}T16:25:00Z`,
    },
    {
      attendanceId: 'att-yesterday-2',
      workerId: 'WC-2026-007',
      workerName: 'Pooja Das',
      workerCode: 'WC-2026-007',
      teamId: 'TM-003',
      teamName: 'Apex HVAC & Plumbing',
      assignmentId: 'ASN-20260217-001',
      date: yesterday,
      checkInTime: `${yesterday}T08:00:00Z`,
      checkOutTime: `${yesterday}T16:15:00Z`,
      checkInMethod: 'GPS',
      checkOutMethod: 'GPS',
      checkInLatitude: 12.8399,
      checkInLongitude: 77.6769,
      checkInAccuracy: 12,
      checkInDistanceMeters: 14,
      checkOutLatitude: 12.8399,
      checkOutLongitude: 77.6769,
      checkOutAccuracy: 12,
      checkOutDistanceMeters: 14,
      status: 'PRESENT',
      workingMinutes: 495,
      verificationStatus: 'VERIFIED',
      createdAt: `${yesterday}T08:00:00Z`,
      updatedAt: `${yesterday}T16:15:00Z`,
    },
  ];

  const attendanceEvents: AttendanceEvent[] = [
    {
      eventId: 'evt-1',
      attendanceId: 'att-today-1',
      workerId: 'WC-2026-001',
      eventType: 'CHECK_IN',
      eventSource: 'WORKER_APP',
      actorId: 'user-worker-1',
      actorName: 'Amit Kumar',
      timestamp: `${today}T08:02:14Z`,
      location: {
        latitude: 28.5356,
        longitude: 77.3911,
        accuracy: 12,
        distanceMeters: 16,
      },
      reason: 'Standard worker GPS check-in',
    },
  ];

  const leaveRequests: LeaveRequest[] = [
    {
      leaveId: 'leave-1',
      workerId: 'WC-2026-003',
      workerName: 'Ravi Shankar',
      teamId: 'TM-001',
      startDate: `${today}`,
      endDate: `${today}`,
      leaveType: 'SICK',
      reason: 'Fever and seasonal flu, visiting local clinic.',
      status: 'PENDING',
      createdAt: `${today}T06:00:00Z`,
    },
  ];

  const notifications: Notification[] = [
    {
      notificationId: 'notif-1',
      recipientId: 'WC-2026-001',
      title: 'New Work Assignment Assigned',
      message: 'You have been assigned to "Pier Reinforcement Rebar & Pre-Pour Inspection" at Central Metro Hub.',
      type: 'ASSIGNMENT',
      read: false,
      relatedEntityId: 'ASN-20260218-001',
      createdAt: `${today}T06:30:00Z`,
    },
    {
      notificationId: 'notif-2',
      recipientId: 'WC-2026-001',
      title: 'Attendance Confirmed',
      message: 'GPS check-in verified successfully at 08:02 AM within job geofence.',
      type: 'ATTENDANCE',
      read: true,
      relatedEntityId: 'att-today-1',
      createdAt: `${today}T08:02:15Z`,
    },
    {
      notificationId: 'notif-3',
      recipientId: 'user-leader-1',
      title: 'Worker Check-in Notification',
      message: 'Amit Kumar and Suresh Patel have checked in for Alpha Site Civil Team.',
      type: 'ATTENDANCE',
      read: false,
      relatedEntityId: 'ASN-20260218-001',
      createdAt: `${today}T08:15:00Z`,
    },
  ];

  const activityLogs: ActivityLog[] = [
    {
      logId: 'log-1',
      actorId: 'user-admin-1',
      actorName: 'Rajesh Sharma',
      actorRole: 'ADMIN',
      action: 'ORGANIZATION_INITIALIZED',
      entityType: 'SETTINGS',
      entityId: 'settings-root',
      timestamp: '2026-01-01T08:00:00Z',
    },
    {
      logId: 'log-2',
      actorId: 'user-admin-1',
      actorName: 'Rajesh Sharma',
      actorRole: 'ADMIN',
      action: 'CREATED_TEAM_LEADER',
      entityType: 'LEADER',
      entityId: 'TL-001',
      changes: { name: 'Vikram Malhotra', teams: ['TM-001', 'TM-002'] },
      timestamp: '2026-01-05T08:00:00Z',
    },
    {
      logId: 'log-3',
      actorId: 'user-leader-1',
      actorName: 'Vikram Malhotra',
      actorRole: 'TEAM_LEADER',
      action: 'REGISTERED_WORKER',
      entityType: 'WORKER',
      entityId: 'WC-2026-001',
      changes: { name: 'Amit Kumar', teamId: 'TM-001' },
      timestamp: '2026-01-15T08:00:00Z',
    },
  ];

  const attendancePhotos: AttendancePhoto[] = [
    {
      photoId: 'photo-att-1',
      workerId: 'WC-2026-001',
      workerName: 'Amit Kumar',
      assignmentId: 'ASN-20260218-001',
      assignmentTitle: 'Pier Reinforcement Rebar & Pre-Pour Inspection',
      teamId: 'TM-001',
      photoType: 'CHECK_IN',
      storagePath: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      thumbnailPath: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
      latitude: 28.5356,
      longitude: 77.3911,
      accuracyMeters: 12,
      detectedAddress: 'Site Gate 3, Sector 62 Industrial Corridor, Noida, UP 201309',
      deviceCapturedAt: `${today}T08:02:14Z`,
      serverUploadedAt: `${today}T08:02:15Z`,
      verificationStatus: 'VERIFIED',
      createdAt: `${today}T08:02:15Z`,
    },
    {
      photoId: 'photo-att-2',
      workerId: 'WC-2026-002',
      workerName: 'Suresh Patel',
      assignmentId: 'ASN-20260218-001',
      assignmentTitle: 'Pier Reinforcement Rebar & Pre-Pour Inspection',
      teamId: 'TM-001',
      photoType: 'CHECK_IN',
      storagePath: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
      thumbnailPath: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
      latitude: 28.5354,
      longitude: 77.3908,
      accuracyMeters: 18,
      detectedAddress: 'Pier Base Pier 4A, Sector 62 Metro Project, Noida, UP',
      deviceCapturedAt: `${today}T08:14:32Z`,
      serverUploadedAt: `${today}T08:14:33Z`,
      verificationStatus: 'VERIFIED',
      createdAt: `${today}T08:14:33Z`,
    },
    {
      photoId: 'photo-att-3',
      workerId: 'WC-2026-006',
      workerName: 'Karan Singhania',
      assignmentId: 'ASN-20260217-001',
      assignmentTitle: 'Basement HVAC Chiller Compressor Overhaul',
      teamId: 'TM-003',
      photoType: 'CHECK_IN',
      storagePath: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
      thumbnailPath: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80',
      latitude: 12.8398,
      longitude: 77.6771,
      accuracyMeters: 15,
      detectedAddress: 'Block 2 Utility Room, Electronic City Phase 1, Bangalore, KA',
      deviceCapturedAt: `${yesterday}T07:55:00Z`,
      serverUploadedAt: `${yesterday}T07:55:02Z`,
      verificationStatus: 'VERIFIED',
      createdAt: `${yesterday}T07:55:02Z`,
    },
    {
      photoId: 'photo-att-4',
      workerId: 'WC-2026-006',
      workerName: 'Karan Singhania',
      assignmentId: 'ASN-20260217-001',
      assignmentTitle: 'Basement HVAC Chiller Compressor Overhaul',
      teamId: 'TM-003',
      photoType: 'CHECK_OUT',
      storagePath: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
      thumbnailPath: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80',
      latitude: 12.8397,
      longitude: 77.6772,
      accuracyMeters: 14,
      detectedAddress: 'Block 2 Utility Room, Electronic City Phase 1, Bangalore, KA',
      deviceCapturedAt: `${yesterday}T16:25:00Z`,
      serverUploadedAt: `${yesterday}T16:25:02Z`,
      verificationStatus: 'VERIFIED',
      createdAt: `${yesterday}T16:25:02Z`,
    },
  ];

  const workEvidence: WorkEvidence[] = [
    {
      evidenceId: 'ev-1',
      workerId: 'WC-2026-001',
      workerName: 'Amit Kumar',
      assignmentId: 'ASN-20260218-001',
      assignmentTitle: 'Pier Reinforcement Rebar & Pre-Pour Inspection',
      locationId: 'LOC-001',
      locationName: 'Sector 62 Metro Station Project - Pillar 14 to 28',
      teamId: 'TM-001',
      photoId: 'photo-ev-1',
      photoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f7?w=800&auto=format&fit=crop&q=80',
      watermarkUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f7?w=800&auto=format&fit=crop&q=80',
      category: 'BEFORE',
      description: 'Initial site condition prior to rebar placement. Debris cleared from footings.',
      latitude: 28.5356,
      longitude: 77.3911,
      accuracyMeters: 12,
      detectedAddress: 'Pillar 14 Foundation Pit, Sector 62, Noida, UP',
      capturedAt: `${today}T08:30:00Z`,
      uploadedAt: `${today}T08:30:15Z`,
      reviewStatus: 'APPROVED',
      reviewedBy: 'user-leader-1',
      reviewedByName: 'Vikram Malhotra',
      reviewedAt: `${today}T09:00:00Z`,
      reviewNotes: 'Verified footing clearance and excavation dimensions.',
      createdAt: `${today}T08:30:15Z`,
    },
    {
      evidenceId: 'ev-2',
      workerId: 'WC-2026-001',
      workerName: 'Amit Kumar',
      assignmentId: 'ASN-20260218-001',
      assignmentTitle: 'Pier Reinforcement Rebar & Pre-Pour Inspection',
      locationId: 'LOC-001',
      locationName: 'Sector 62 Metro Station Project - Pillar 14 to 28',
      teamId: 'TM-001',
      photoId: 'photo-ev-2',
      photoUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80',
      watermarkUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80',
      category: 'DURING',
      description: 'High-tensile rebar binding in progress. Rebar ties spacing strictly verified at 150mm.',
      latitude: 28.5355,
      longitude: 77.3910,
      accuracyMeters: 10,
      detectedAddress: 'Pillar 14 Foundation Cage, Sector 62, Noida, UP',
      capturedAt: `${today}T11:15:00Z`,
      uploadedAt: `${today}T11:15:20Z`,
      reviewStatus: 'PENDING',
      createdAt: `${today}T11:15:20Z`,
    },
    {
      evidenceId: 'ev-3',
      workerId: 'WC-2026-006',
      workerName: 'Karan Singhania',
      assignmentId: 'ASN-20260217-001',
      assignmentTitle: 'Basement HVAC Chiller Compressor Overhaul',
      locationId: 'LOC-003',
      locationName: 'Electronics City Tech Park Tower B',
      teamId: 'TM-003',
      photoId: 'photo-ev-3',
      photoUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80',
      watermarkUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80',
      category: 'AFTER',
      description: 'Compressor gaskets replaced, freon pressure tested at 120 PSI, 0 leaks detected.',
      latitude: 12.8398,
      longitude: 77.6771,
      accuracyMeters: 14,
      detectedAddress: 'HVAC Plant Room B2, Tower B, Electronic City, Bangalore, KA',
      capturedAt: `${yesterday}T15:45:00Z`,
      uploadedAt: `${yesterday}T15:46:10Z`,
      reviewStatus: 'APPROVED',
      reviewedBy: 'user-leader-2',
      reviewedByName: 'Ananya Sen',
      reviewedAt: `${yesterday}T16:30:00Z`,
      reviewNotes: 'Pressure gauge test verified. Work meets safety standards.',
      createdAt: `${yesterday}T15:46:10Z`,
    },
  ];

  const organizations: Organization[] = [];

  const invoices: Invoice[] = [
    {
      invoiceId: 'INV-2026-001',
      invoiceNumber: 'INV-2026-001',
      organizationId: 'ORG-2026-001',
      organizationName: 'Apex Corporate Towers',
      assignmentId: 'ASN-20260217-001',
      eventName: 'Cooling Tower Chilled Water Riser Pressure Test & Sanitization',
      issueDate: yesterday,
      dueDate: today,
      amount: 28000,
      amountPaid: 28000,
      status: 'PAID',
      description: 'Comprehensive chemical flush of chiller lines, post-test floor wash, and pipe polishing.',
      items: [
        { description: 'Cooling Tower chemical flush & sanitization', quantity: 1, unitPrice: 18000, total: 18000 },
        { description: 'Industrial Floor scrub & waste clearance', quantity: 1, unitPrice: 10000, total: 10000 },
      ],
      notes: 'Paid online via Go_Repireo B2B Instant Gateway.',
      createdAt: `${yesterday}T16:30:00Z`,
      updatedAt: `${yesterday}T17:00:00Z`,
    },
    {
      invoiceId: 'INV-2026-002',
      invoiceNumber: 'INV-2026-002',
      organizationId: 'ORG-2026-001',
      organizationName: 'Apex Corporate Towers',
      assignmentId: 'ASN-20260218-001',
      eventName: 'Pier Reinforcement Rebar & Pre-Pour Inspection',
      issueDate: today,
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
      amount: 45000,
      amountPaid: 0,
      status: 'PENDING',
      description: 'Deep industrial pressure washing of pier base, concrete spill wash, and waste disposal before handover.',
      items: [
        { description: 'Foundation Pier Pressure Wash & Chemical Scrubbing', quantity: 1, unitPrice: 30000, total: 30000 },
        { description: 'Hazardous Waste & Concrete Slurry Clearance', quantity: 1, unitPrice: 15000, total: 15000 },
      ],
      notes: 'Standard contract invoice. Due within 15 days.',
      createdAt: `${today}T08:00:00Z`,
      updatedAt: `${today}T08:00:00Z`,
    },
  ];

  const payments: Payment[] = [
    {
      paymentId: 'PAY-2026-001',
      receiptNumber: 'RCPT-2026-001',
      invoiceId: 'INV-2026-001',
      invoiceNumber: 'INV-2026-001',
      organizationId: 'ORG-2026-001',
      organizationName: 'Apex Corporate Towers',
      assignmentId: 'ASN-20260217-001',
      eventName: 'Cooling Tower Chilled Water Riser Pressure Test & Sanitization',
      amount: 28000,
      paymentDate: `${yesterday}T17:00:00Z`,
      paymentMethod: 'ONLINE',
      transactionId: 'txn_2026_981240192',
      status: 'SUCCESS',
      notes: 'Instant settlement confirmed by gateway.',
      receiptUrl: '/api/b2b/client/receipts/RCPT-2026-001',
      createdAt: `${yesterday}T17:00:00Z`,
      updatedAt: `${yesterday}T17:00:00Z`,
    },
  ];

  return {
    users,
    workers,
    teamLeaders,
    teams,
    locations,
    assignments,
    assignmentMembers,
    attendance,
    attendanceEvents,
    attendancePhotos,
    workEvidence,
    leaveRequests,
    notifications,
    activityLogs,
    passwordResetRequests: [],
    organizations,
    invoices,
    payments,
    settings: INITIAL_SETTINGS,
  };
}

class DatabaseService {
  private data: DatabaseSchema;
  private tursoClient: Client | null = null;
  private readyPromise: Promise<void> | null = null;

  constructor() {
    this.ensureDataDir();
    this.data = this.loadData();
    const effectiveTursoUrl = process.env.TURSO_DATABASE_URL || DEFAULT_TURSO_URL;
    if (effectiveTursoUrl) {
      // In 100% online cloud database mode, initialize empty so only real Turso tables exist
      this.data.users = [];
      this.data.workers = [];
      this.data.teamLeaders = [];
      this.data.teams = [];
      this.data.locations = [];
      this.data.assignments = [];
      this.data.assignmentMembers = [];
      this.data.attendance = [];
      this.data.attendanceEvents = [];
      this.data.attendancePhotos = [];
      this.data.workEvidence = [];
      this.data.activityLogs = [];
      this.data.passwordResetRequests = [];
    }
    this.readyPromise = this.initTurso();
  }

  public async ready(): Promise<void> {
    if (this.readyPromise) {
      try {
        await Promise.race([
          this.readyPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Turso connection timeout')), 3500)),
        ]);
      } catch (err: any) {
        console.warn('[DB] ready() timeout or notice, proceeding:', err?.message);
      }
    }
  }

  private async initTurso(): Promise<void> {
    const rawUrl = process.env.TURSO_DATABASE_URL || DEFAULT_TURSO_URL;
    const tursoUrl = rawUrl.replace(/^libsql:\/\//, 'https://');
    const tursoToken = process.env.TURSO_AUTH_TOKEN || DEFAULT_TURSO_TOKEN;
    if (tursoUrl && tursoToken) {
      try {
        this.tursoClient = createClient({
          url: tursoUrl,
          authToken: tursoToken,
        });
        console.log('[TURSO] Active client connected to:', tursoUrl);
        await this.ensureTursoB2BSchema();
        await this.syncFromTurso();
      } catch (err: any) {
        console.warn('[TURSO] Could not initialize cloud database client:', err.message);
      }
    }
  }

  private schemaEnsured = false;
  private schemaPromise: Promise<void> | null = null;
  private lastFetchAt: Record<string, number> = {};
  private readonly FETCH_TTL_MS = 5000;

  private isFresh(key: string): boolean {
    return Date.now() - (this.lastFetchAt[key] || 0) < this.FETCH_TTL_MS;
  }

  private markFetched(key: string): void {
    this.lastFetchAt[key] = Date.now();
  }

  private invalidateFetch(key: string): void {
    delete this.lastFetchAt[key];
  }

  private async ensureTursoB2BSchema(): Promise<void> {
    if (!this.tursoClient || this.schemaEnsured) return;
    if (this.schemaPromise) return this.schemaPromise;
    this.schemaPromise = (async () => {
    const client = this.tursoClient;
    if (!client) return;
    try {
      await Promise.all([
        client.execute(`
          CREATE TABLE IF NOT EXISTS users (
            uid TEXT PRIMARY KEY,
            role TEXT NOT NULL,
            displayName TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            photoURL TEXT,
            organizationId TEXT,
            organizationName TEXT,
            active INTEGER DEFAULT 1,
            passwordHash TEXT,
            mustChangePassword INTEGER DEFAULT 0,
            failedLoginAttempts INTEGER DEFAULT 0,
            lockedUntil TEXT,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL
          )
        `),
        client.execute(`
          CREATE TABLE IF NOT EXISTS workers (
            workerId TEXT PRIMARY KEY,
            userId TEXT NOT NULL,
            name TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            photoURL TEXT,
            address TEXT,
            primaryTeamId TEXT,
            primaryTeamName TEXT,
            teamAssignmentStatus TEXT DEFAULT 'UNASSIGNED',
            joiningDate TEXT,
            status TEXT DEFAULT 'ACTIVE',
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL
          )
        `),
        client.execute(`
          CREATE TABLE IF NOT EXISTS locations (
            locationId TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            address TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            geofenceRadiusMeters REAL DEFAULT 100,
            status TEXT DEFAULT 'ACTIVE',
            photoURL TEXT,
            googleDriveFileId TEXT,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL
          )
        `),
        client.execute(`
          CREATE TABLE IF NOT EXISTS organizations (
            organizationId TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            contactPerson TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            address TEXT,
            serviceLocationIds TEXT,
            contractStartDate TEXT NOT NULL,
            contractEndDate TEXT,
            contractPricing REAL,
            paymentTerms TEXT,
            status TEXT DEFAULT 'ACTIVE',
            notes TEXT,
            createdAt TEXT,
            updatedAt TEXT
          )
        `),
        client.execute(`
          CREATE TABLE IF NOT EXISTS invoices (
            invoiceId TEXT PRIMARY KEY,
            invoiceNumber TEXT NOT NULL,
            organizationId TEXT NOT NULL,
            organizationName TEXT NOT NULL,
            assignmentId TEXT,
            eventName TEXT,
            issueDate TEXT,
            dueDate TEXT NOT NULL,
            amount REAL NOT NULL,
            amountPaid REAL DEFAULT 0,
            status TEXT DEFAULT 'PENDING',
            description TEXT,
            items TEXT,
            notes TEXT,
            createdAt TEXT,
            updatedAt TEXT
          )
        `),
        client.execute(`
          CREATE TABLE IF NOT EXISTS payments (
            paymentId TEXT PRIMARY KEY,
            receiptNumber TEXT NOT NULL,
            invoiceId TEXT NOT NULL,
            invoiceNumber TEXT NOT NULL,
            organizationId TEXT NOT NULL,
            organizationName TEXT NOT NULL,
            assignmentId TEXT,
            eventName TEXT,
            amount REAL NOT NULL,
            paymentDate TEXT NOT NULL,
            paymentMethod TEXT NOT NULL,
            transactionId TEXT NOT NULL,
            status TEXT DEFAULT 'SUCCESS',
            recordedBy TEXT,
            recordedByName TEXT,
            notes TEXT,
            receiptUrl TEXT,
            createdAt TEXT,
            updatedAt TEXT
          )
        `),
      ]);

      await Promise.all([
        client.execute('ALTER TABLE users ADD COLUMN organizationId TEXT').catch(() => {}),
        client.execute('ALTER TABLE users ADD COLUMN organizationName TEXT').catch(() => {}),
        client.execute('ALTER TABLE users ADD COLUMN passwordHash TEXT').catch(() => {}),
        client.execute('ALTER TABLE users ADD COLUMN mustChangePassword INTEGER DEFAULT 0').catch(() => {}),
        client.execute('ALTER TABLE users ADD COLUMN failedLoginAttempts INTEGER DEFAULT 0').catch(() => {}),
        client.execute('ALTER TABLE users ADD COLUMN lockedUntil TEXT').catch(() => {}),
        client.execute("ALTER TABLE workers ADD COLUMN teamAssignmentStatus TEXT DEFAULT 'UNASSIGNED'").catch(() => {}),
        client.execute('ALTER TABLE locations ADD COLUMN photoURL TEXT').catch(() => {}),
        client.execute('ALTER TABLE locations ADD COLUMN googleDriveFileId TEXT').catch(() => {}),
        client.execute('ALTER TABLE assignments ADD COLUMN organizationId TEXT').catch(() => {}),
        client.execute('ALTER TABLE assignments ADD COLUMN organizationName TEXT').catch(() => {}),
        client.execute('ALTER TABLE assignments ADD COLUMN cleaningRequirements TEXT').catch(() => {}),
        client.execute('ALTER TABLE assignments ADD COLUMN requiredWorkersCount INTEGER').catch(() => {}),
        client.execute('ALTER TABLE assignments ADD COLUMN servicePrice REAL').catch(() => {}),
        client.execute('ALTER TABLE assignments ADD COLUMN paymentTerms TEXT').catch(() => {}),
      ]);

      this.schemaEnsured = true;
    } catch (e: any) {
      console.warn('[TURSO] Schema check notice:', e.message);
    } finally {
      this.schemaPromise = null;
    }
    })();
    return this.schemaPromise;
  }

  public async syncFromTurso(): Promise<void> {
    if (!this.tursoClient) return;
    try {
      const [uRes, wRes, tlRes, tRes, locRes, aRes, attRes, weRes, alRes, sRes, orgRes, invRes, payRes] = await Promise.all([
        this.tursoClient.execute('SELECT * FROM users'),
        this.tursoClient.execute('SELECT * FROM workers'),
        this.tursoClient.execute('SELECT * FROM teamLeaders'),
        this.tursoClient.execute('SELECT * FROM teams'),
        this.tursoClient.execute('SELECT * FROM locations'),
        this.tursoClient.execute('SELECT * FROM assignments'),
        this.tursoClient.execute('SELECT * FROM attendance'),
        this.tursoClient.execute('SELECT * FROM workEvidence'),
        this.tursoClient.execute('SELECT * FROM activityLogs ORDER BY timestamp DESC LIMIT 200'),
        this.tursoClient.execute("SELECT value FROM organizationSettings WHERE key = 'org_settings'").catch(() => ({ rows: [] })),
        this.tursoClient.execute('SELECT * FROM organizations').catch(() => ({ rows: [] })),
        this.tursoClient.execute('SELECT * FROM invoices').catch(() => ({ rows: [] })),
        this.tursoClient.execute('SELECT * FROM payments').catch(() => ({ rows: [] })),
      ]);

      // USERS
      this.data.users = uRes.rows ? uRes.rows.map((r: any) => ({
        uid: r.uid,
        role: r.role,
        displayName: r.displayName,
        phone: r.phone || undefined,
        email: r.email || undefined,
        photoURL: r.photoURL || undefined,
        organizationId: r.organizationId || undefined,
        organizationName: r.organizationName || undefined,
        active: Boolean(r.active),
        passwordHash: r.passwordHash || undefined,
        mustChangePassword: Boolean(r.mustChangePassword),
        failedLoginAttempts: Number(r.failedLoginAttempts || 0),
        lockedUntil: r.lockedUntil || undefined,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })) : [];

      const validUserIds = new Set(this.data.users.map(u => u.uid));

      // WORKERS (Must have a valid corresponding user account)
      const rawWorkers = wRes.rows ? wRes.rows.map((r: any) => ({
        workerId: r.workerId,
        userId: r.userId,
        name: r.name,
        phone: r.phone || undefined,
        email: r.email || undefined,
        photoURL: r.photoURL || undefined,
        address: r.address || undefined,
        primaryTeamId: r.primaryTeamId || undefined,
        primaryTeamName: r.primaryTeamName || undefined,
        teamAssignmentStatus: r.teamAssignmentStatus || (r.primaryTeamId ? 'ASSIGNED' : 'UNASSIGNED'),
        joiningDate: r.joiningDate || undefined,
        status: r.status || 'ACTIVE',
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })) : [];
      this.data.workers = rawWorkers.filter(w => validUserIds.has(w.userId));

      // TEAM LEADERS (Must have a valid corresponding user account in users table)
      const rawLeaders = tlRes.rows ? tlRes.rows.map((r: any) => ({
        leaderId: r.leaderId,
        userId: r.userId,
        name: r.name,
        phone: r.phone || undefined,
        email: r.email || undefined,
        photoURL: r.photoURL || undefined,
        managedTeamIds: safeJsonParse<string[]>(r.managedTeamIds, []),
        permissions: {
          canAddWorkers: true,
          canAssignJobs: true,
          canCorrectAttendance: true,
          canCreateTeams: true,
          ...safeJsonParse<any>(r.permissions, {}),
        },
        status: r.status || 'ACTIVE',
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })) : [];
      
      // Auto-clean any orphaned leaders from Turso if their user account was removed
      this.data.teamLeaders = [];
      for (const leader of rawLeaders) {
        if (validUserIds.has(leader.userId)) {
          this.data.teamLeaders.push(leader);
        } else {
          console.log(`[TURSO-CLEANUP] Pruning orphaned team leader ${leader.leaderId} (${leader.name}) missing user ${leader.userId}`);
          this.tursoClient.execute({
            sql: 'DELETE FROM teamLeaders WHERE leaderId = ?',
            args: [leader.leaderId],
          }).catch(() => {});
        }
      }

      // TEAMS (Strictly from database - empty if table is empty)
      this.data.teams = tRes.rows ? tRes.rows.map((r: any) => ({
        teamId: r.teamId,
        name: r.name,
        description: r.description || undefined,
        leaderIds: safeJsonParse<string[]>(r.leaderIds, []),
        memberWorkerIds: safeJsonParse<string[]>(r.memberWorkerIds, []),
        status: r.status || 'ACTIVE',
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })) : [];

      // LOCATIONS (Strictly from database)
      this.data.locations = locRes.rows ? locRes.rows.map((r: any) => ({
        locationId: r.locationId,
        name: r.name,
        address: r.address,
        latitude: Number(r.latitude),
        longitude: Number(r.longitude),
        geofenceRadiusMeters: Number(r.geofenceRadiusMeters || 100),
        status: r.status || 'ACTIVE',
        photoURL: r.photoURL || undefined,
        googleDriveFileId: r.googleDriveFileId || undefined,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })) : [];

      // ASSIGNMENTS (Strictly from database - empty if table is empty)
      this.data.assignments = aRes.rows ? aRes.rows.map((r: any) => ({
        assignmentId: r.assignmentId,
        title: r.title,
        description: r.description || undefined,
        locationId: r.locationId || undefined,
        locationName: r.locationName || undefined,
        locationAddress: r.locationAddress || undefined,
        locationLatitude: r.locationLatitude ? Number(r.locationLatitude) : undefined,
        locationLongitude: r.locationLongitude ? Number(r.locationLongitude) : undefined,
        assignedBy: r.assignedBy || undefined,
        assignedByName: r.assignedByName || undefined,
        teamIds: safeJsonParse<string[]>(r.teamIds, []),
        workerIds: safeJsonParse<string[]>(r.workerIds, []),
        date: r.date,
        startTime: r.startTime || undefined,
        endTime: r.endTime || undefined,
        priority: r.priority || 'HIGH',
        status: r.status || 'ASSIGNED',
        instructions: r.instructions || undefined,
        completionNote: r.completionNote || undefined,
        organizationId: r.organizationId || undefined,
        organizationName: r.organizationName || undefined,
        cleaningRequirements: r.cleaningRequirements || undefined,
        requiredWorkersCount: r.requiredWorkersCount ? Number(r.requiredWorkersCount) : undefined,
        servicePrice: r.servicePrice ? Number(r.servicePrice) : undefined,
        paymentTerms: r.paymentTerms || undefined,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })) : [];

      // ATTENDANCE (Strictly from database - empty if table is empty)
      this.data.attendance = attRes.rows ? attRes.rows.map((r: any) => ({
        attendanceId: r.attendanceId,
        workerId: r.workerId,
        workerName: r.workerName,
        workerCode: r.workerCode || r.workerId,
        teamId: r.teamId || undefined,
        teamName: r.teamName || undefined,
        assignmentId: r.assignmentId || undefined,
        assignmentTitle: r.assignmentTitle || undefined,
        date: r.date,
        checkInTime: r.checkInTime || undefined,
        checkInMethod: r.checkInMethod || undefined,
        checkInLatitude: r.checkInLatitude ? Number(r.checkInLatitude) : undefined,
        checkInLongitude: r.checkInLongitude ? Number(r.checkInLongitude) : undefined,
        checkInAccuracy: r.checkInAccuracy ? Number(r.checkInAccuracy) : undefined,
        checkInDistanceMeters: r.checkInDistanceMeters ? Number(r.checkInDistanceMeters) : undefined,
        checkOutTime: r.checkOutTime || undefined,
        checkOutMethod: r.checkOutMethod || undefined,
        checkOutLatitude: r.checkOutLatitude ? Number(r.checkOutLatitude) : undefined,
        checkOutLongitude: r.checkOutLongitude ? Number(r.checkOutLongitude) : undefined,
        checkOutAccuracy: r.checkOutAccuracy ? Number(r.checkOutAccuracy) : undefined,
        checkOutDistanceMeters: r.checkOutDistanceMeters ? Number(r.checkOutDistanceMeters) : undefined,
        workingMinutes: Number(r.workingMinutes || 0),
        status: r.status,
        verificationStatus: r.verificationStatus || 'UNVERIFIED',
        gpsStatus: r.gpsStatus || undefined,
        photoStatus: r.photoStatus || undefined,
        checkInPhotoId: r.checkInPhotoId || undefined,
        checkInPhotoUrl: r.checkInPhotoUrl || undefined,
        checkInAddress: r.checkInAddress || undefined,
        checkOutPhotoId: r.checkOutPhotoId || undefined,
        checkOutPhotoUrl: r.checkOutPhotoUrl || undefined,
        checkOutAddress: r.checkOutAddress || undefined,
        remarks: r.remarks || undefined,
        exceptionReason: r.exceptionReason || undefined,
        exceptionStatus: r.exceptionStatus || undefined,
        markedBy: r.markedBy || undefined,
        markedByName: r.markedByName || undefined,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })) : [];

      // WORK EVIDENCE (Strictly from database - empty if table is empty)
      this.data.workEvidence = weRes.rows ? weRes.rows.map((r: any) => ({
        evidenceId: r.evidenceId,
        workerId: r.workerId,
        workerName: r.workerName,
        assignmentId: r.assignmentId,
        assignmentTitle: r.assignmentTitle || undefined,
        locationId: r.locationId || undefined,
        locationName: r.locationName || undefined,
        teamId: r.teamId || undefined,
        photoId: r.photoId || undefined,
        photoUrl: r.photoUrl,
        watermarkUrl: r.watermarkUrl || undefined,
        category: r.category,
        description: r.description || undefined,
        latitude: Number(r.latitude || 0),
        longitude: Number(r.longitude || 0),
        accuracyMeters: Number(r.accuracyMeters || 10),
        detectedAddress: r.detectedAddress || undefined,
        capturedAt: r.capturedAt,
        uploadedAt: r.uploadedAt,
        reviewStatus: r.reviewStatus || 'PENDING',
        reviewedBy: r.reviewedBy || undefined,
        reviewedByName: r.reviewedByName || undefined,
        reviewedAt: r.reviewedAt || undefined,
        reviewNotes: r.reviewNotes || undefined,
        createdAt: r.createdAt,
      })) : [];

      // ACTIVITY LOGS (Strictly from database)
      this.data.activityLogs = alRes.rows ? alRes.rows.map((r: any) => ({
        logId: r.logId,
        actorId: r.actorId,
        actorName: r.actorName,
        actorRole: r.actorRole,
        action: r.action,
        entityType: r.entityType,
        entityId: r.entityId,
        changes: safeJsonParse<Record<string, any> | undefined>(r.changes, undefined),
        timestamp: r.timestamp,
      })) : [];

      // ORGANIZATION SETTINGS (Hydrated directly from Turso)
      if (sRes && (sRes as any).rows && (sRes as any).rows.length > 0) {
        try {
          const parsed = safeJsonParse((sRes as any).rows[0].value, {});
          this.data.settings = { ...this.data.settings, ...parsed };
        } catch (e: any) {
          console.warn('[TURSO] Error parsing organizationSettings from cloud database:', e.message);
        }
      }

      // B2B ORGANIZATIONS (Hydrated strictly from Turso)
      this.data.organizations = orgRes && (orgRes as any).rows
        ? (orgRes as any).rows.map((r: any) => ({
            organizationId: r.organizationId,
            name: r.name,
            contactPerson: r.contactPerson,
            email: r.email,
            phone: r.phone,
            address: r.address || undefined,
            serviceLocationIds: safeJsonParse<string[]>(r.serviceLocationIds, []),
            contractStartDate: r.contractStartDate,
            contractEndDate: r.contractEndDate,
            contractPricing: Number(r.contractPricing || 0),
            paymentTerms: r.paymentTerms || 'Net 30',
            status: r.status || 'ACTIVE',
            notes: r.notes || undefined,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
          }))
        : [];

      // B2B INVOICES (Hydrated strictly from Turso)
      this.data.invoices = invRes && (invRes as any).rows
        ? (invRes as any).rows.map((r: any) => ({
            invoiceId: r.invoiceId,
            invoiceNumber: r.invoiceNumber,
            organizationId: r.organizationId,
            organizationName: r.organizationName,
            assignmentId: r.assignmentId || undefined,
            eventName: r.eventName || undefined,
            issueDate: r.issueDate,
            dueDate: r.dueDate,
            amount: Number(r.amount || 0),
            amountPaid: Number(r.amountPaid || 0),
            status: r.status || 'PENDING',
            description: r.description || undefined,
            items: safeJsonParse<any[]>(r.items, []),
            notes: r.notes || undefined,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
          }))
        : [];

      // B2B PAYMENTS (Hydrated strictly from Turso)
      this.data.payments = payRes && (payRes as any).rows
        ? (payRes as any).rows.map((r: any) => ({
            paymentId: r.paymentId,
            receiptNumber: r.receiptNumber,
            invoiceId: r.invoiceId,
            invoiceNumber: r.invoiceNumber,
            organizationId: r.organizationId,
            organizationName: r.organizationName,
            assignmentId: r.assignmentId || undefined,
            eventName: r.eventName || undefined,
            amount: Number(r.amount || 0),
            paymentDate: r.paymentDate,
            paymentMethod: r.paymentMethod,
            transactionId: r.transactionId,
            status: r.status || 'SUCCESS',
            recordedBy: r.recordedBy || undefined,
            recordedByName: r.recordedByName || undefined,
            notes: r.notes || undefined,
            receiptUrl: r.receiptUrl || undefined,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
          }))
        : [];

      this.sanitizeState(this.data);
      this.saveData(this.data);
      console.log(`[TURSO] Successfully hydrated in-memory state directly from Turso relational tables: ${this.data.workers.length} workers, ${this.data.teamLeaders.length} leaders, ${this.data.teams.length} teams, ${this.data.locations.length} locations, ${this.data.assignments.length} assignments, ${this.data.attendance.length} attendance.`);
    } catch (err: any) {
      console.warn('[TURSO] Error syncing from relational tables, falling back to backup store:', err.message);
      try {
        const res = await this.tursoClient.execute(
          "SELECT data FROM workcrew_store WHERE collection = 'full_store' LIMIT 1"
        );
        if (res.rows && res.rows.length > 0 && res.rows[0].data) {
          const parsed = JSON.parse(res.rows[0].data as string);
          if (parsed.users && parsed.workers) {
            this.sanitizeState(parsed);
            this.data = parsed;
            this.saveData(this.data);
            console.log('[TURSO] Successfully hydrated in-memory state from Turso cloud store backup.');
          }
        }
      } catch (e: any) {
        console.warn('[TURSO] Sync from cloud store skipped, using local cache:', e.message);
      }
    }
  }

  private sanitizeState(data: DatabaseSchema) {
    if (!data.users) data.users = [];
    if (!data.workers) data.workers = [];
    if (!data.teamLeaders) data.teamLeaders = [];
    if (!data.teams) data.teams = [];
    if (!data.locations) data.locations = [];
    if (!data.assignments) data.assignments = [];
    if (!data.attendance) data.attendance = [];
    if (!data.workEvidence) data.workEvidence = [];
    if (!data.activityLogs) data.activityLogs = [];
    if (!data.passwordResetRequests) data.passwordResetRequests = [];
    if (!data.organizations) data.organizations = [];
    if (!data.invoices) data.invoices = [];
    if (!data.payments) data.payments = [];

    data.workers.forEach((w) => {
      if (!w.teamAssignmentStatus) {
        w.teamAssignmentStatus = w.primaryTeamId ? 'ASSIGNED' : 'UNASSIGNED';
      }
    });

    const defaultHash = bcrypt.hashSync('password123', 10);
    data.users.forEach((u) => {
      if (!u.passwordHash) {
        u.passwordHash = defaultHash;
      }
      if (u.failedLoginAttempts === undefined) {
        u.failedLoginAttempts = 0;
      }
      if (u.mustChangePassword === undefined) {
        u.mustChangePassword = false;
      }
    });
  }

  private ensureDataDir() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (_err) {
      // In readonly serverless environments (e.g. Vercel), disk writes are skipped
    }
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.users && parsed.workers) {
          this.sanitizeState(parsed);
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read existing store.json, re-seeding...', e);
    }

    const seeded = getSeedData();
    this.sanitizeState(seeded);
    this.saveData(seeded);
    return seeded;
  }

  private saveData(data: DatabaseSchema) {
    if (process.env.TURSO_DATABASE_URL || DEFAULT_TURSO_URL || process.env.VERCEL) {
      // 100% Online Cloud Database mode - Zero local disk writes
      return;
    }
    try {
      this.ensureDataDir();
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write database file', e);
    }
  }

  public persist() {
    this.saveData(this.data);
    if (this.tursoClient) {
      const raw = JSON.stringify(this.data);
      this.tursoClient
        .execute({
          sql: "INSERT OR REPLACE INTO workcrew_store (collection, data, updatedAt) VALUES ('full_store', ?, ?)",
          args: [raw, new Date().toISOString()],
        })
        .catch((err: any) => {
          console.warn('[TURSO] Cloud persist warning:', err.message);
        });
    }
  }

  public resetToSeed(): DatabaseSchema {
    this.data = getSeedData();
    this.persist();
    return this.data;
  }

  // --- USERS ---
  public getUsers() { return this.data.users; }
  public getUserByUid(uid: string) { return this.data.users.find(u => u.uid === uid); }

  public normalizePhone(raw: string): string {
    const cleaned = (raw || '').trim().replace(/[^\d+]/g, '');
    if (!cleaned) return '';
    if (cleaned.startsWith('+')) return cleaned;
    if (cleaned.length === 10) return `+91${cleaned}`;
    if (cleaned.length === 12 && cleaned.startsWith('91')) return `+${cleaned}`;
    return `+${cleaned}`;
  }

  public extractDigits(raw: string): string {
    return (raw || '').replace(/\D/g, '');
  }

  public getUsersByEmailOrPhone(identifier: string): User[] {
    if (!identifier) return [];
    const trimmed = identifier.trim().toLowerCase();
    const inputDigits = this.extractDigits(identifier);
    const normalizedInput = this.normalizePhone(identifier);

    return this.data.users.filter(u => {
      if (u.email && u.email.toLowerCase() === trimmed) return true;
      if (u.phone) {
        if (u.phone.trim() === identifier.trim()) return true;
        const userDigits = this.extractDigits(u.phone);
        if (inputDigits && userDigits) {
          if (inputDigits === userDigits) return true;
          if (inputDigits.length >= 6 && userDigits.length >= 6) {
            if (inputDigits.endsWith(userDigits) || userDigits.endsWith(inputDigits)) return true;
          }
        }
        const normUserPhone = this.normalizePhone(u.phone);
        if (normUserPhone && normUserPhone === normalizedInput) return true;
      }
      return false;
    });
  }

  public getUserByEmailOrPhone(identifier: string, preferredRole?: UserRole): User | undefined {
    const list = this.getUsersByEmailOrPhone(identifier);
    if (list.length === 0) return undefined;
    if (preferredRole) {
      const match = list.find(u => u.role === preferredRole);
      if (match) return match;
    }
    // If multiple accounts match, prioritize TEAM_LEADER > ADMIN > B2B_CLIENT > WORKER
    const priority: Record<UserRole, number> = { TEAM_LEADER: 1, ADMIN: 2, B2B_CLIENT: 3, WORKER: 4 };
    list.sort((a, b) => (priority[a.role] || 99) - (priority[b.role] || 99));
    return list[0];
  }
  public addUser(user: User) {
    this.data.users.push(user);
    this.persist();
    if (this.tursoClient) {
      this.tursoClient.execute({
        sql: `INSERT OR REPLACE INTO users (uid, role, displayName, phone, email, photoURL, active, passwordHash, mustChangePassword, failedLoginAttempts, lockedUntil, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          user.uid,
          user.role,
          user.displayName,
          user.phone || null,
          user.email || null,
          user.photoURL || null,
          user.active ? 1 : 0,
          user.passwordHash || null,
          user.mustChangePassword ? 1 : 0,
          user.failedLoginAttempts || 0,
          user.lockedUntil || null,
          user.createdAt,
          user.updatedAt,
        ],
      }).catch((e: any) => console.warn('[TURSO] user insert error:', e.message));
    }
    return user;
  }
  public updateUser(uid: string, updates: Partial<User>) {
    const idx = this.data.users.findIndex(u => u.uid === uid);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...updates, updatedAt: new Date().toISOString() };
      this.persist();
      const u = this.data.users[idx];
      if (this.tursoClient) {
        this.tursoClient.execute({
          sql: `UPDATE users SET displayName = ?, phone = ?, email = ?, photoURL = ?, active = ?, passwordHash = ?, mustChangePassword = ?, failedLoginAttempts = ?, lockedUntil = ?, updatedAt = ? WHERE uid = ?`,
          args: [
            u.displayName,
            u.phone || null,
            u.email || null,
            u.photoURL || null,
            u.active ? 1 : 0,
            u.passwordHash || null,
            u.mustChangePassword ? 1 : 0,
            u.failedLoginAttempts || 0,
            u.lockedUntil || null,
            u.updatedAt,
            uid,
          ],
        }).catch((e: any) => console.warn('[TURSO] user update error:', e.message));
      }
      return this.data.users[idx];
    }
    return null;
  }

  // --- WORKERS ---
  public getWorkers() { return this.data.workers; }
  public getWorkerById(workerId: string) { return this.data.workers.find(w => w.workerId === workerId); }
  public getWorkerByUserId(userId: string) { return this.data.workers.find(w => w.userId === userId); }

  public async fetchWorkersFromTurso(): Promise<Worker[]> {
    if (!this.tursoClient || this.isFresh('workers')) return this.data.workers;
    try {
      await this.ensureTursoB2BSchema();
      const [wRes, uRes] = await Promise.all([
        this.tursoClient.execute('SELECT * FROM workers'),
        this.tursoClient.execute('SELECT * FROM users'),
      ]);
      if (wRes.rows) {
        this.data.workers = wRes.rows.map((r: any) => ({
          workerId: r.workerId,
          userId: r.userId,
          name: r.name,
          phone: r.phone,
          email: r.email || undefined,
          photoURL: r.photoURL || undefined,
          address: r.address || undefined,
          primaryTeamId: r.primaryTeamId || undefined,
          primaryTeamName: r.primaryTeamName || undefined,
          teamAssignmentStatus: r.teamAssignmentStatus || (r.primaryTeamId ? 'ASSIGNED' : 'UNASSIGNED'),
          joiningDate: r.joiningDate || undefined,
          status: r.status || 'ACTIVE',
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        }));
      }
      if (uRes.rows) {
        this.data.users = uRes.rows.map((r: any) => ({
          uid: r.uid,
          role: r.role,
          displayName: r.displayName,
          phone: r.phone || undefined,
          email: r.email || undefined,
          photoURL: r.photoURL || undefined,
          organizationId: r.organizationId || undefined,
          organizationName: r.organizationName || undefined,
          active: Boolean(r.active),
          passwordHash: r.passwordHash || undefined,
          mustChangePassword: Boolean(r.mustChangePassword),
          failedLoginAttempts: Number(r.failedLoginAttempts || 0),
          lockedUntil: r.lockedUntil || null,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        }));
      }
      this.markFetched('workers');
    } catch (e: any) {
      console.warn('[TURSO] fetchWorkersFromTurso error:', e.message);
    }
    return this.data.workers;
  }

  public async persistUserToTurso(user: User): Promise<void> {
    if (!this.tursoClient) return;
    await this.tursoClient.execute({
      sql: `INSERT OR REPLACE INTO users (uid, role, displayName, phone, email, photoURL, active, passwordHash, mustChangePassword, failedLoginAttempts, lockedUntil, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        user.uid,
        user.role,
        user.displayName,
        user.phone || null,
        user.email || null,
        user.photoURL || null,
        user.active ? 1 : 0,
        user.passwordHash || null,
        user.mustChangePassword ? 1 : 0,
        user.failedLoginAttempts || 0,
        user.lockedUntil || null,
        user.createdAt,
        user.updatedAt,
      ],
    });
  }

  public async persistWorkerToTurso(worker: Worker): Promise<void> {
    this.invalidateFetch('workers');
    this.invalidateFetch('teams');
    if (!this.tursoClient) return;
    await this.tursoClient.execute({
      sql: `INSERT OR REPLACE INTO workers (workerId, userId, name, phone, email, photoURL, address, primaryTeamId, primaryTeamName, teamAssignmentStatus, joiningDate, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        worker.workerId,
        worker.userId,
        worker.name,
        worker.phone || null,
        worker.email || null,
        worker.photoURL || null,
        worker.address || null,
        worker.primaryTeamId || null,
        worker.primaryTeamName || null,
        worker.teamAssignmentStatus || 'UNASSIGNED',
        worker.joiningDate || null,
        worker.status || 'ACTIVE',
        worker.createdAt,
        worker.updatedAt,
      ],
    });
  }
  public addWorker(worker: Worker) {
    if (!worker.teamAssignmentStatus) {
      worker.teamAssignmentStatus = worker.primaryTeamId ? 'ASSIGNED' : 'UNASSIGNED';
    }
    this.data.workers.push(worker);
    this.persist();
    if (this.tursoClient) {
      this.tursoClient.execute({
        sql: `INSERT OR REPLACE INTO workers (workerId, userId, name, phone, email, photoURL, address, primaryTeamId, primaryTeamName, teamAssignmentStatus, joiningDate, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          worker.workerId,
          worker.userId,
          worker.name,
          worker.phone || null,
          worker.email || null,
          worker.photoURL || null,
          worker.address || null,
          worker.primaryTeamId || null,
          worker.primaryTeamName || null,
          worker.teamAssignmentStatus || 'UNASSIGNED',
          worker.joiningDate || null,
          worker.status || 'ACTIVE',
          worker.createdAt,
          worker.updatedAt,
        ],
      }).catch((e: any) => console.warn('[TURSO] worker insert error:', e.message));
    }
    return worker;
  }
  public updateWorker(workerId: string, updates: Partial<Worker>) {
    const idx = this.data.workers.findIndex(w => w.workerId === workerId);
    if (idx !== -1) {
      if (updates.primaryTeamId !== undefined) {
        if (updates.primaryTeamId) {
          updates.teamAssignmentStatus = 'ASSIGNED';
        } else {
          updates.teamAssignmentStatus = 'UNASSIGNED';
          updates.primaryTeamId = undefined;
          updates.primaryTeamName = undefined;
        }
      }
      this.data.workers[idx] = { ...this.data.workers[idx], ...updates, updatedAt: new Date().toISOString() };
      this.persist();
      const w = this.data.workers[idx];
      if (this.tursoClient) {
        this.tursoClient.execute({
          sql: `UPDATE workers SET name = ?, phone = ?, email = ?, photoURL = ?, address = ?, primaryTeamId = ?, primaryTeamName = ?, teamAssignmentStatus = ?, status = ?, updatedAt = ? WHERE workerId = ?`,
          args: [
            w.name,
            w.phone || null,
            w.email || null,
            w.photoURL || null,
            w.address || null,
            w.primaryTeamId || null,
            w.primaryTeamName || null,
            w.teamAssignmentStatus || 'UNASSIGNED',
            w.status || 'ACTIVE',
            w.updatedAt,
            workerId,
          ],
        }).catch((e: any) => console.warn('[TURSO] worker update error:', e.message));
      }
      return this.data.workers[idx];
    }
    return null;
  }

  // --- TEAM LEADERS ---
  public getTeamLeaders() { return this.data.teamLeaders; }
  public getLeaderById(leaderId: string) { return this.data.teamLeaders.find(l => l.leaderId === leaderId); }
  public getLeaderByUserId(userId: string) { return this.data.teamLeaders.find(l => l.userId === userId); }
  public addTeamLeader(leader: TeamLeader) {
    this.data.teamLeaders.push(leader);
    this.persist();
    if (this.tursoClient) {
      this.tursoClient.execute({
        sql: `INSERT OR REPLACE INTO teamLeaders (leaderId, userId, name, phone, email, photoURL, managedTeamIds, permissions, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [leader.leaderId, leader.userId, leader.name, leader.phone || null, leader.email || null, leader.photoURL || null, JSON.stringify(leader.managedTeamIds || []), JSON.stringify(leader.permissions || {}), leader.status || 'ACTIVE', leader.createdAt, leader.updatedAt],
      }).catch((e: any) => console.warn('[TURSO] leader insert error:', e.message));
    }
    return leader;
  }
  public updateTeamLeader(leaderId: string, updates: Partial<TeamLeader>) {
    const idx = this.data.teamLeaders.findIndex(l => l.leaderId === leaderId);
    if (idx !== -1) {
      this.data.teamLeaders[idx] = { ...this.data.teamLeaders[idx], ...updates, updatedAt: new Date().toISOString() };
      this.persist();
      const l = this.data.teamLeaders[idx];
      if (this.tursoClient) {
        this.tursoClient.execute({
          sql: `UPDATE teamLeaders SET name = ?, phone = ?, email = ?, photoURL = ?, managedTeamIds = ?, permissions = ?, status = ?, updatedAt = ? WHERE leaderId = ?`,
          args: [l.name, l.phone || null, l.email || null, l.photoURL || null, JSON.stringify(l.managedTeamIds || []), JSON.stringify(l.permissions || {}), l.status || 'ACTIVE', l.updatedAt, leaderId],
        }).catch((e: any) => console.warn('[TURSO] leader update error:', e.message));
      }
      return this.data.teamLeaders[idx];
    }
    return null;
  }
  public deleteTeamLeader(leaderId: string): boolean {
    const idx = this.data.teamLeaders.findIndex(l => l.leaderId === leaderId);
    if (idx === -1) return false;
    const leader = this.data.teamLeaders[idx];
    this.data.teamLeaders.splice(idx, 1);

    if (leader.userId) {
      const uIdx = this.data.users.findIndex(u => u.uid === leader.userId);
      if (uIdx !== -1) {
        this.data.users.splice(uIdx, 1);
      }
    }

    this.persist();

    if (this.tursoClient) {
      this.tursoClient.execute({
        sql: 'DELETE FROM teamLeaders WHERE leaderId = ?',
        args: [leaderId],
      }).catch((e: any) => console.warn('[TURSO] leader delete error:', e.message));

      if (leader.userId) {
        this.tursoClient.execute({
          sql: 'DELETE FROM users WHERE uid = ?',
          args: [leader.userId],
        }).catch((e: any) => console.warn('[TURSO] leader user delete error:', e.message));
      }
    }
    return true;
  }

  // --- TEAMS ---
  public getTeams() { return this.data.teams; }
  public getTeamById(teamId: string) { return this.data.teams.find(t => t.teamId === teamId); }
  public async fetchTeamsFromTurso(): Promise<Team[]> {
    if (!this.tursoClient || this.isFresh('teams')) return this.data.teams;
    try {
      await this.ensureTursoB2BSchema();
      const [tRes, wRes, tlRes] = await Promise.all([
        this.tursoClient.execute('SELECT * FROM teams'),
        this.tursoClient.execute('SELECT * FROM workers'),
        this.tursoClient.execute('SELECT * FROM teamLeaders'),
      ]);
      if (tRes.rows) {
        this.data.teams = tRes.rows.map((r: any) => ({
          teamId: r.teamId,
          name: r.name,
          description: r.description || undefined,
          leaderIds: safeJsonParse<string[]>(r.leaderIds, []),
          memberWorkerIds: safeJsonParse<string[]>(r.memberWorkerIds, []),
          status: r.status || 'ACTIVE',
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        }));
      }
      if (wRes.rows) {
        this.data.workers = wRes.rows.map((r: any) => ({
          workerId: r.workerId,
          userId: r.userId,
          name: r.name,
          phone: r.phone,
          email: r.email || undefined,
          photoURL: r.photoURL || undefined,
          address: r.address || undefined,
          primaryTeamId: r.primaryTeamId || undefined,
          primaryTeamName: r.primaryTeamName || undefined,
          teamAssignmentStatus: r.teamAssignmentStatus || (r.primaryTeamId ? 'ASSIGNED' : 'UNASSIGNED'),
          joiningDate: r.joiningDate || undefined,
          status: r.status || 'ACTIVE',
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        }));
      }
      if (tlRes.rows) {
        this.data.teamLeaders = tlRes.rows.map((r: any) => ({
          leaderId: r.leaderId,
          userId: r.userId,
          name: r.name,
          phone: r.phone,
          email: r.email || undefined,
          photoURL: r.photoURL || undefined,
          managedTeamIds: safeJsonParse<string[]>(r.managedTeamIds, []),
          permissions: safeJsonParse<any>(r.permissions, {}),
          status: r.status || 'ACTIVE',
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        }));
      }
      this.markFetched('teams');
    } catch (e: any) {
      console.warn('[TURSO] fetchTeamsFromTurso error:', e.message);
    }
    return this.data.teams;
  }

  public async persistTeamToTurso(team: Team): Promise<void> {
    this.invalidateFetch('teams');
    if (!this.tursoClient) return;
    await this.tursoClient.execute({
      sql: `INSERT OR REPLACE INTO teams (teamId, name, description, leaderIds, memberWorkerIds, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        team.teamId,
        team.name,
        team.description || null,
        JSON.stringify(team.leaderIds || []),
        JSON.stringify(team.memberWorkerIds || []),
        team.status || 'ACTIVE',
        team.createdAt,
        team.updatedAt,
      ],
    });
  }

  public addTeam(team: Team) {
    this.data.teams.push(team);
    this.persist();
    if (this.tursoClient) {
      this.tursoClient.execute({
        sql: `INSERT OR REPLACE INTO teams (teamId, name, description, leaderIds, memberWorkerIds, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [team.teamId, team.name, team.description || null, JSON.stringify(team.leaderIds || []), JSON.stringify(team.memberWorkerIds || []), team.status || 'ACTIVE', team.createdAt, team.updatedAt],
      }).catch((e: any) => console.warn('[TURSO] team insert error:', e.message));
    }
    return team;
  }
  public updateTeam(teamId: string, updates: Partial<Team>) {
    this.invalidateFetch('teams');
    const idx = this.data.teams.findIndex(t => t.teamId === teamId);
    if (idx !== -1) {
      this.data.teams[idx] = { ...this.data.teams[idx], ...updates, updatedAt: new Date().toISOString() };
      this.persist();
      const t = this.data.teams[idx];
      if (this.tursoClient) {
        this.tursoClient.execute({
          sql: `UPDATE teams SET name = ?, description = ?, leaderIds = ?, memberWorkerIds = ?, status = ?, updatedAt = ? WHERE teamId = ?`,
          args: [t.name, t.description || null, JSON.stringify(t.leaderIds || []), JSON.stringify(t.memberWorkerIds || []), t.status || 'ACTIVE', t.updatedAt, teamId],
        }).catch((e: any) => console.warn('[TURSO] team update error:', e.message));
      }
      return this.data.teams[idx];
    }
    return null;
  }

  // --- LOCATIONS ---
  public getLocations() { return this.data.locations; }
  public getLocationById(locationId: string) { return this.data.locations.find(l => l.locationId === locationId); }

  public async fetchLocationsFromTurso(): Promise<WorkLocation[]> {
    if (!this.tursoClient || this.isFresh('locations')) return this.data.locations;
    try {
      await this.ensureTursoB2BSchema();
      const locRes = await this.tursoClient.execute('SELECT * FROM locations');
      this.data.locations = locRes.rows
        ? locRes.rows.map((r: any) => ({
            locationId: r.locationId,
            name: r.name,
            address: r.address || '',
            latitude: Number(r.latitude),
            longitude: Number(r.longitude),
            geofenceRadiusMeters: Number(r.geofenceRadiusMeters || 100),
            status: r.status || 'ACTIVE',
            photoURL: r.photoURL || undefined,
            googleDriveFileId: r.googleDriveFileId || undefined,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
          }))
        : [];
      this.markFetched('locations');
    } catch (e: any) {
      console.warn('[TURSO] fetchLocationsFromTurso error:', e.message);
    }
    return this.data.locations;
  }

  public async deleteLocation(locationId: string): Promise<boolean> {
    this.invalidateFetch('locations');
    const idx = this.data.locations.findIndex(l => l.locationId === locationId);
    if (idx !== -1) {
      this.data.locations.splice(idx, 1);
      this.persist();
    }
    if (this.tursoClient) {
      await this.tursoClient.execute({
        sql: `DELETE FROM locations WHERE locationId = ?`,
        args: [locationId],
      });
    }
    return idx !== -1;
  }
  public addLocation(location: WorkLocation) {
    this.data.locations.push(location);
    this.persist();
    if (this.tursoClient) {
      this.tursoClient.execute({
        sql: `INSERT OR REPLACE INTO locations (locationId, name, address, latitude, longitude, geofenceRadiusMeters, status, photoURL, googleDriveFileId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          location.locationId,
          location.name,
          location.address || '',
          location.latitude,
          location.longitude,
          location.geofenceRadiusMeters || 100,
          location.status || 'ACTIVE',
          location.photoURL || null,
          location.googleDriveFileId || null,
          location.createdAt,
          location.updatedAt,
        ],
      }).catch((e: any) => console.warn('[TURSO] location insert error:', e.message));
    }
    return location;
  }

  public async persistLocationToTurso(location: WorkLocation): Promise<void> {
    this.invalidateFetch('locations');
    if (!this.tursoClient) return;
    await this.ensureTursoB2BSchema();
    await this.tursoClient.execute({
      sql: `INSERT OR REPLACE INTO locations (locationId, name, address, latitude, longitude, geofenceRadiusMeters, status, photoURL, googleDriveFileId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        location.locationId,
        location.name,
        location.address || '',
        location.latitude,
        location.longitude,
        location.geofenceRadiusMeters || 100,
        location.status || 'ACTIVE',
        location.photoURL || null,
        location.googleDriveFileId || null,
        location.createdAt,
        location.updatedAt,
      ],
    });
  }

  public updateLocation(locationId: string, updates: Partial<WorkLocation>) {
    const idx = this.data.locations.findIndex(l => l.locationId === locationId);
    if (idx !== -1) {
      this.data.locations[idx] = { ...this.data.locations[idx], ...updates, updatedAt: new Date().toISOString() };
      this.persist();
      const loc = this.data.locations[idx];
      if (this.tursoClient) {
        this.tursoClient.execute({
          sql: `UPDATE locations SET name = ?, address = ?, latitude = ?, longitude = ?, geofenceRadiusMeters = ?, status = ?, photoURL = ?, googleDriveFileId = ?, updatedAt = ? WHERE locationId = ?`,
          args: [
            loc.name,
            loc.address || '',
            loc.latitude,
            loc.longitude,
            loc.geofenceRadiusMeters || 100,
            loc.status || 'ACTIVE',
            loc.photoURL || null,
            loc.googleDriveFileId || null,
            loc.updatedAt,
            locationId,
          ],
        }).catch((e: any) => console.warn('[TURSO] location update error:', e.message));
      }
      return this.data.locations[idx];
    }
    return null;
  }

  // --- ASSIGNMENTS ---
  public getAssignments() { return this.data.assignments; }
  public getAssignmentById(id: string) { return this.data.assignments.find(a => a.assignmentId === id); }

  public async fetchAssignmentsFromTurso(): Promise<Assignment[]> {
    if (!this.tursoClient || this.isFresh('assignments')) return this.data.assignments;
    try {
      await this.ensureTursoB2BSchema();
      const [aRes, locRes] = await Promise.all([
        this.tursoClient.execute('SELECT * FROM assignments'),
        this.tursoClient.execute('SELECT * FROM locations'),
      ]);
      if (aRes.rows) {
        this.data.assignments = aRes.rows.map((r: any) => ({
          assignmentId: r.assignmentId,
          title: r.title,
          description: r.description || undefined,
          locationId: r.locationId || undefined,
          locationName: r.locationName || undefined,
          locationAddress: r.locationAddress || undefined,
          locationLatitude: r.locationLatitude ? Number(r.locationLatitude) : undefined,
          locationLongitude: r.locationLongitude ? Number(r.locationLongitude) : undefined,
          assignedBy: r.assignedBy || undefined,
          assignedByName: r.assignedByName || undefined,
          teamIds: safeJsonParse<string[]>(r.teamIds, []),
          workerIds: safeJsonParse<string[]>(r.workerIds, []),
          date: r.date,
          startTime: r.startTime || undefined,
          endTime: r.endTime || undefined,
          priority: r.priority || 'HIGH',
          status: r.status || 'ASSIGNED',
          instructions: r.instructions || undefined,
          completionNote: r.completionNote || undefined,
          organizationId: r.organizationId || undefined,
          organizationName: r.organizationName || undefined,
          cleaningRequirements: r.cleaningRequirements || undefined,
          requiredWorkersCount: r.requiredWorkersCount ? Number(r.requiredWorkersCount) : undefined,
          servicePrice: r.servicePrice ? Number(r.servicePrice) : undefined,
          paymentTerms: r.paymentTerms || undefined,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        }));
      }
      if (locRes.rows) {
        this.data.locations = locRes.rows.map((r: any) => ({
          locationId: r.locationId,
          name: r.name,
          address: r.address || '',
          latitude: Number(r.latitude),
          longitude: Number(r.longitude),
          geofenceRadiusMeters: Number(r.geofenceRadiusMeters || 100),
          status: r.status || 'ACTIVE',
          photoURL: r.photoURL || undefined,
          googleDriveFileId: r.googleDriveFileId || undefined,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        }));
      }
      this.markFetched('assignments');
    } catch (e: any) {
      console.warn('[TURSO] fetchAssignmentsFromTurso error:', e.message);
    }
    return this.data.assignments;
  }

  public async persistAssignmentToTurso(assignment: Assignment): Promise<void> {
    this.invalidateFetch('assignments');
    if (!this.tursoClient) return;
    await this.tursoClient.execute({
      sql: `INSERT OR REPLACE INTO assignments (assignmentId, title, description, locationId, locationName, locationAddress, locationLatitude, locationLongitude, assignedBy, assignedByName, teamIds, workerIds, date, startTime, endTime, priority, status, instructions, completionNote, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        assignment.assignmentId,
        assignment.title,
        assignment.description || null,
        assignment.locationId || null,
        assignment.locationName || null,
        assignment.locationAddress || null,
        assignment.locationLatitude || null,
        assignment.locationLongitude || null,
        assignment.assignedBy || null,
        assignment.assignedByName || null,
        JSON.stringify(assignment.teamIds || []),
        JSON.stringify(assignment.workerIds || []),
        assignment.date,
        assignment.startTime || null,
        assignment.endTime || null,
        assignment.priority || 'HIGH',
        assignment.status || 'ASSIGNED',
        assignment.instructions || null,
        assignment.completionNote || null,
        assignment.createdAt,
        assignment.updatedAt,
      ],
    });
  }
  public addAssignment(assignment: Assignment) {
    this.data.assignments.unshift(assignment);
    this.persist();
    if (this.tursoClient) {
      this.tursoClient.execute({
        sql: `INSERT OR REPLACE INTO assignments (assignmentId, title, description, locationId, locationName, locationAddress, locationLatitude, locationLongitude, assignedBy, assignedByName, teamIds, workerIds, date, startTime, endTime, priority, status, instructions, completionNote, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [assignment.assignmentId, assignment.title, assignment.description || null, assignment.locationId || null, assignment.locationName || null, assignment.locationAddress || null, assignment.locationLatitude || null, assignment.locationLongitude || null, assignment.assignedBy || null, assignment.assignedByName || null, JSON.stringify(assignment.teamIds || []), JSON.stringify(assignment.workerIds || []), assignment.date, assignment.startTime || null, assignment.endTime || null, assignment.priority || 'HIGH', assignment.status || 'ASSIGNED', assignment.instructions || null, assignment.completionNote || null, assignment.createdAt, assignment.updatedAt],
      }).catch((e: any) => console.warn('[TURSO] assignment insert error:', e.message));
    }
    return assignment;
  }
  public updateAssignment(id: string, updates: Partial<Assignment>) {
    const idx = this.data.assignments.findIndex(a => a.assignmentId === id);
    if (idx !== -1) {
      this.data.assignments[idx] = { ...this.data.assignments[idx], ...updates, updatedAt: new Date().toISOString() };
      this.persist();
      const a = this.data.assignments[idx];
      if (this.tursoClient) {
        this.tursoClient.execute({
          sql: `UPDATE assignments SET title = ?, description = ?, locationId = ?, locationName = ?, locationAddress = ?, locationLatitude = ?, locationLongitude = ?, assignedBy = ?, assignedByName = ?, teamIds = ?, workerIds = ?, date = ?, startTime = ?, endTime = ?, priority = ?, status = ?, instructions = ?, completionNote = ?, updatedAt = ? WHERE assignmentId = ?`,
          args: [a.title, a.description || null, a.locationId || null, a.locationName || null, a.locationAddress || null, a.locationLatitude || null, a.locationLongitude || null, a.assignedBy || null, a.assignedByName || null, JSON.stringify(a.teamIds || []), JSON.stringify(a.workerIds || []), a.date, a.startTime || null, a.endTime || null, a.priority || 'HIGH', a.status || 'ASSIGNED', a.instructions || null, a.completionNote || null, a.updatedAt, id],
        }).catch((e: any) => console.warn('[TURSO] assignment update error:', e.message));
      }
      return this.data.assignments[idx];
    }
    return null;
  }

  // --- ASSIGNMENT MEMBERS ---
  public getAssignmentMembers(assignmentId?: string, workerId?: string) {
    return this.data.assignmentMembers.filter(m => {
      if (assignmentId && m.assignmentId !== assignmentId) return false;
      if (workerId && m.workerId !== workerId) return false;
      return true;
    });
  }
  public addAssignmentMember(member: AssignmentMember) {
    this.data.assignmentMembers.push(member);
    this.persist();
    if (this.tursoClient) {
      this.tursoClient.execute({
        sql: `INSERT OR REPLACE INTO assignmentMembers (membershipId, assignmentId, workerId, teamId, individualStatus, acceptedAt, completedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [member.membershipId, member.assignmentId, member.workerId, member.teamId || null, member.individualStatus || 'ASSIGNED', member.acceptedAt || null, member.completedAt || null],
      }).catch((e: any) => console.warn('[TURSO] assignmentMember insert error:', e.message));
    }
    return member;
  }
  public updateAssignmentMember(membershipId: string, updates: Partial<AssignmentMember>) {
    const idx = this.data.assignmentMembers.findIndex(m => m.membershipId === membershipId);
    if (idx !== -1) {
      this.data.assignmentMembers[idx] = { ...this.data.assignmentMembers[idx], ...updates };
      this.persist();
      const m = this.data.assignmentMembers[idx];
      if (this.tursoClient) {
        this.tursoClient.execute({
          sql: `UPDATE assignmentMembers SET individualStatus = ?, acceptedAt = ?, completedAt = ? WHERE membershipId = ?`,
          args: [m.individualStatus || 'ASSIGNED', m.acceptedAt || null, m.completedAt || null, membershipId],
        }).catch((e: any) => console.warn('[TURSO] assignmentMember update error:', e.message));
      }
      return this.data.assignmentMembers[idx];
    }
    return null;
  }

  // --- ATTENDANCE ---
  public getAttendance() { return this.data.attendance; }
  public getAttendanceById(id: string) { return this.data.attendance.find(a => a.attendanceId === id); }

  public async fetchAttendanceFromTurso(): Promise<Attendance[]> {
    if (!this.tursoClient || this.isFresh('attendance')) return this.data.attendance;
    try {
      const attRes = await this.tursoClient.execute('SELECT * FROM attendance');
      if (attRes.rows) {
        this.data.attendance = attRes.rows.map((r: any) => ({
          attendanceId: r.attendanceId,
          workerId: r.workerId,
          workerName: r.workerName,
          workerCode: r.workerCode || r.workerId,
          teamId: r.teamId || undefined,
          teamName: r.teamName || undefined,
          assignmentId: r.assignmentId || undefined,
          assignmentTitle: r.assignmentTitle || undefined,
          date: r.date,
          checkInTime: r.checkInTime || undefined,
          checkInMethod: r.checkInMethod || undefined,
          checkInLatitude: r.checkInLatitude ? Number(r.checkInLatitude) : undefined,
          checkInLongitude: r.checkInLongitude ? Number(r.checkInLongitude) : undefined,
          checkInAccuracy: r.checkInAccuracy ? Number(r.checkInAccuracy) : undefined,
          checkInDistanceMeters: r.checkInDistanceMeters !== null && r.checkInDistanceMeters !== undefined ? Number(r.checkInDistanceMeters) : undefined,
          checkOutTime: r.checkOutTime || undefined,
          checkOutMethod: r.checkOutMethod || undefined,
          checkOutLatitude: r.checkOutLatitude ? Number(r.checkOutLatitude) : undefined,
          checkOutLongitude: r.checkOutLongitude ? Number(r.checkOutLongitude) : undefined,
          checkOutAccuracy: r.checkOutAccuracy ? Number(r.checkOutAccuracy) : undefined,
          checkOutDistanceMeters: r.checkOutDistanceMeters !== null && r.checkOutDistanceMeters !== undefined ? Number(r.checkOutDistanceMeters) : undefined,
          workingMinutes: Number(r.workingMinutes || 0),
          status: r.status || 'PRESENT',
          verificationStatus: r.verificationStatus || 'UNVERIFIED',
          gpsStatus: r.gpsStatus || undefined,
          photoStatus: r.photoStatus || undefined,
          checkInPhotoId: r.checkInPhotoId || undefined,
          checkInPhotoUrl: r.checkInPhotoUrl || undefined,
          checkInAddress: r.checkInAddress || undefined,
          checkOutPhotoId: r.checkOutPhotoId || undefined,
          checkOutPhotoUrl: r.checkOutPhotoUrl || undefined,
          checkOutAddress: r.checkOutAddress || undefined,
          remarks: r.remarks || undefined,
          exceptionReason: r.exceptionReason || undefined,
          exceptionStatus: r.exceptionStatus || undefined,
          markedBy: r.markedBy || undefined,
          markedByName: r.markedByName || undefined,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        }));
      }
      this.markFetched('attendance');
    } catch (e: any) {
      console.warn('[TURSO] fetchAttendanceFromTurso error:', e.message);
    }
    return this.data.attendance;
  }
  public addAttendance(record: Attendance) {
    this.invalidateFetch('attendance');
    this.data.attendance.unshift(record);
    this.persist();
    if (this.tursoClient) {
      this.tursoClient.execute({
        sql: `INSERT OR REPLACE INTO attendance (attendanceId, workerId, workerName, workerCode, teamId, teamName, assignmentId, assignmentTitle, date, checkInTime, checkInMethod, checkInLatitude, checkInLongitude, checkInAccuracy, checkInDistanceMeters, checkOutTime, checkOutMethod, checkOutLatitude, checkOutLongitude, checkOutAccuracy, checkOutDistanceMeters, workingMinutes, status, verificationStatus, gpsStatus, photoStatus, checkInPhotoId, checkInPhotoUrl, checkInAddress, checkOutPhotoId, checkOutPhotoUrl, checkOutAddress, remarks, exceptionReason, exceptionStatus, markedBy, markedByName, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          record.attendanceId, record.workerId, record.workerName, record.workerCode || record.workerId,
          record.teamId || null, record.teamName || null, record.assignmentId || null, record.assignmentTitle || null,
          record.date, record.checkInTime || null, record.checkInMethod || null, record.checkInLatitude ?? null,
          record.checkInLongitude ?? null, record.checkInAccuracy ?? null, record.checkInDistanceMeters ?? null,
          record.checkOutTime || null, record.checkOutMethod || null, record.checkOutLatitude ?? null,
          record.checkOutLongitude ?? null, record.checkOutAccuracy ?? null, record.checkOutDistanceMeters ?? null,
          record.workingMinutes || 0, record.status, record.verificationStatus || 'UNVERIFIED',
          record.gpsStatus || null, record.photoStatus || null, record.checkInPhotoId || null,
          record.checkInPhotoUrl || null, record.checkInAddress || null, record.checkOutPhotoId || null,
          record.checkOutPhotoUrl || null, record.checkOutAddress || null, record.remarks || null,
          record.exceptionReason || null, record.exceptionStatus || null, record.markedBy || null,
          record.markedByName || null, record.createdAt, record.updatedAt
        ] as any[],
      }).catch((e: any) => console.warn('[TURSO] attendance insert error:', e.message));
    }
    return record;
  }
  public updateAttendance(id: string, updates: Partial<Attendance>) {
    const idx = this.data.attendance.findIndex(a => a.attendanceId === id);
    if (idx !== -1) {
      this.data.attendance[idx] = { ...this.data.attendance[idx], ...updates, updatedAt: new Date().toISOString() };
      this.persist();
      const att = this.data.attendance[idx];
      if (this.tursoClient) {
        this.tursoClient.execute({
          sql: `UPDATE attendance SET workerName = ?, teamId = ?, teamName = ?, assignmentId = ?, assignmentTitle = ?, date = ?, checkInTime = ?, checkInMethod = ?, checkInLatitude = ?, checkInLongitude = ?, checkInAccuracy = ?, checkInDistanceMeters = ?, checkOutTime = ?, checkOutMethod = ?, checkOutLatitude = ?, checkOutLongitude = ?, checkOutAccuracy = ?, checkOutDistanceMeters = ?, workingMinutes = ?, status = ?, verificationStatus = ?, gpsStatus = ?, photoStatus = ?, checkInPhotoId = ?, checkInPhotoUrl = ?, checkInAddress = ?, checkOutPhotoId = ?, checkOutPhotoUrl = ?, checkOutAddress = ?, remarks = ?, exceptionReason = ?, exceptionStatus = ?, markedBy = ?, markedByName = ?, updatedAt = ? WHERE attendanceId = ?`,
          args: [
            att.workerName, att.teamId || null, att.teamName || null, att.assignmentId || null, att.assignmentTitle || null,
            att.date, att.checkInTime || null, att.checkInMethod || null, att.checkInLatitude ?? null,
            att.checkInLongitude ?? null, att.checkInAccuracy ?? null, att.checkInDistanceMeters ?? null,
            att.checkOutTime || null, att.checkOutMethod || null, att.checkOutLatitude ?? null,
            att.checkOutLongitude ?? null, att.checkOutAccuracy ?? null, att.checkOutDistanceMeters ?? null,
            att.workingMinutes || 0, att.status, att.verificationStatus || 'UNVERIFIED',
            att.gpsStatus || null, att.photoStatus || null, att.checkInPhotoId || null,
            att.checkInPhotoUrl || null, att.checkInAddress || null, att.checkOutPhotoId || null,
            att.checkOutPhotoUrl || null, att.checkOutAddress || null, att.remarks || null,
            att.exceptionReason || null, att.exceptionStatus || null, att.markedBy || null,
            att.markedByName || null, att.updatedAt, id
          ] as any[],
        }).catch((e: any) => console.warn('[TURSO] attendance update error:', e.message));
      }
      return this.data.attendance[idx];
    }
    return null;
  }

  // --- ATTENDANCE EVENTS (Audit) ---
  public getAttendanceEvents(attendanceId?: string) {
    if (attendanceId) {
      return this.data.attendanceEvents.filter(e => e.attendanceId === attendanceId);
    }
    return this.data.attendanceEvents;
  }
  public addAttendanceEvent(event: AttendanceEvent) {
    this.data.attendanceEvents.unshift(event);
    this.persist();
    if (this.tursoClient) {
      this.tursoClient.execute({
        sql: `INSERT OR REPLACE INTO attendanceEvents (eventId, attendanceId, workerId, eventType, eventSource, actorId, actorName, timestamp, location, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [event.eventId, event.attendanceId, event.workerId, event.eventType, event.eventSource || null, event.actorId || null, event.actorName || null, event.timestamp, JSON.stringify(event.location || {}), event.reason || null],
      }).catch((e: any) => console.warn('[TURSO] attendanceEvent insert error:', e.message));
    }
    return event;
  }

  // --- LEAVE REQUESTS ---
  public getLeaveRequests() { return this.data.leaveRequests; }
  public getLeaveById(id: string) { return this.data.leaveRequests.find(l => l.leaveId === id); }
  public addLeaveRequest(leave: LeaveRequest) {
    this.data.leaveRequests.unshift(leave);
    this.persist();
    if (this.tursoClient) {
      this.tursoClient.execute({
        sql: `INSERT OR REPLACE INTO leaveRequests (leaveId, workerId, workerName, teamId, startDate, endDate, leaveType, reason, status, reviewedBy, reviewComment, reviewedAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [leave.leaveId, leave.workerId, leave.workerName, leave.teamId || null, leave.startDate, leave.endDate, leave.leaveType, leave.reason, leave.status || 'PENDING', leave.reviewedBy || null, leave.reviewComment || null, leave.reviewedAt || null, leave.createdAt],
      }).catch((e: any) => console.warn('[TURSO] leaveRequest insert error:', e.message));
    }
    return leave;
  }
  public updateLeaveRequest(id: string, updates: Partial<LeaveRequest>) {
    const idx = this.data.leaveRequests.findIndex(l => l.leaveId === id);
    if (idx !== -1) {
      this.data.leaveRequests[idx] = { ...this.data.leaveRequests[idx], ...updates };
      this.persist();
      const l = this.data.leaveRequests[idx];
      if (this.tursoClient) {
        this.tursoClient.execute({
          sql: `UPDATE leaveRequests SET status = ?, reviewedBy = ?, reviewComment = ?, reviewedAt = ? WHERE leaveId = ?`,
          args: [l.status, l.reviewedBy || null, l.reviewComment || null, l.reviewedAt || null, id],
        }).catch((e: any) => console.warn('[TURSO] leaveRequest update error:', e.message));
      }
      return this.data.leaveRequests[idx];
    }
    return null;
  }

  // --- NOTIFICATIONS ---
  public getNotifications(recipientId?: string) {
    if (recipientId) {
      return this.data.notifications.filter(n => n.recipientId === recipientId);
    }
    return this.data.notifications;
  }
  public addNotification(notification: Notification) {
    this.data.notifications.unshift(notification);
    this.persist();
    if (this.tursoClient) {
      this.tursoClient.execute({
        sql: `INSERT OR REPLACE INTO notifications (notificationId, recipientId, title, message, type, read, relatedEntityId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [notification.notificationId, notification.recipientId, notification.title, notification.message, notification.type, notification.read ? 1 : 0, notification.relatedEntityId || null, notification.createdAt],
      }).catch((e: any) => console.warn('[TURSO] notification insert error:', e.message));
    }
    return notification;
  }
  public updateNotification(id: string, updates: Partial<Notification>) {
    const idx = this.data.notifications.findIndex(n => n.notificationId === id);
    if (idx !== -1) {
      this.data.notifications[idx] = { ...this.data.notifications[idx], ...updates };
      this.persist();
      const n = this.data.notifications[idx];
      if (this.tursoClient) {
        this.tursoClient.execute({
          sql: `UPDATE notifications SET read = ? WHERE notificationId = ?`,
          args: [n.read ? 1 : 0, id],
        }).catch((e: any) => console.warn('[TURSO] notification update error:', e.message));
      }
      return this.data.notifications[idx];
    }
    return null;
  }

  // --- ACTIVITY LOGS ---
  public getActivityLogs() { return this.data.activityLogs; }
  public logActivity(log: ActivityLog) {
    this.data.activityLogs.unshift(log);
    this.persist();
    if (this.tursoClient) {
      this.tursoClient.execute({
        sql: `INSERT OR REPLACE INTO activityLogs (logId, actorId, actorName, actorRole, action, entityType, entityId, changes, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [log.logId, log.actorId, log.actorName, log.actorRole, log.action, log.entityType, log.entityId, JSON.stringify(log.changes || {}), log.timestamp],
      }).catch((e: any) => console.warn('[TURSO] activityLogs insert error:', e.message));
    }
    return log;
  }

  // --- ATTENDANCE PHOTOS ---
  public getAttendancePhotos(filter?: { workerId?: string; teamId?: string; assignmentId?: string; photoType?: string }) {
    if (!this.data.attendancePhotos) this.data.attendancePhotos = [];
    return this.data.attendancePhotos.filter(p => {
      if (filter?.workerId && p.workerId !== filter.workerId) return false;
      if (filter?.teamId && p.teamId !== filter.teamId) return false;
      if (filter?.assignmentId && p.assignmentId !== filter.assignmentId) return false;
      if (filter?.photoType && p.photoType !== filter.photoType) return false;
      return true;
    });
  }
  public getAttendancePhotoById(photoId: string) {
    if (!this.data.attendancePhotos) this.data.attendancePhotos = [];
    return this.data.attendancePhotos.find(p => p.photoId === photoId);
  }
  public addAttendancePhoto(photo: AttendancePhoto) {
    if (!this.data.attendancePhotos) this.data.attendancePhotos = [];
    this.data.attendancePhotos.unshift(photo);
    this.persist();
    if (this.tursoClient) {
      this.tursoClient.execute({
        sql: `INSERT OR REPLACE INTO attendancePhotos (photoId, attendanceId, locationId, workerId, workerName, assignmentId, assignmentTitle, teamId, photoType, photoUrl, storagePath, thumbnailPath, watermarkPath, latitude, longitude, accuracyMeters, detectedAddress, deviceCapturedAt, serverUploadedAt, verificationStatus, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          photo.photoId, photo.attendanceId || null, photo.locationId || null, photo.workerId, photo.workerName || null,
          photo.assignmentId || null, photo.assignmentTitle || null, photo.teamId || null, photo.photoType,
          photo.photoUrl || null, photo.storagePath || null, photo.thumbnailPath || null, photo.watermarkPath || null,
          photo.latitude || null, photo.longitude || null, photo.accuracyMeters || null, photo.detectedAddress || null,
          photo.deviceCapturedAt || null, photo.serverUploadedAt || null, photo.verificationStatus || 'VERIFIED',
          photo.createdAt || new Date().toISOString()
        ],
      }).catch((e: any) => console.warn('[TURSO] attendancePhoto insert error:', e.message));
    }
    return photo;
  }

  // --- WORK EVIDENCE ---
  public getWorkEvidence(filter?: {
    workerId?: string;
    teamId?: string;
    assignmentId?: string;
    locationId?: string;
    category?: string;
    reviewStatus?: string;
  }) {
    if (!this.data.workEvidence) this.data.workEvidence = [];
    return this.data.workEvidence.filter(e => {
      if (filter?.workerId && e.workerId !== filter.workerId) return false;
      if (filter?.teamId && e.teamId !== filter.teamId) return false;
      if (filter?.assignmentId && e.assignmentId !== filter.assignmentId) return false;
      if (filter?.locationId && e.locationId !== filter.locationId) return false;
      if (filter?.category && e.category !== filter.category) return false;
      if (filter?.reviewStatus && e.reviewStatus !== filter.reviewStatus) return false;
      return true;
    });
  }
  public getWorkEvidenceById(evidenceId: string) {
    if (!this.data.workEvidence) this.data.workEvidence = [];
    return this.data.workEvidence.find(e => e.evidenceId === evidenceId);
  }
  public addWorkEvidence(evidence: WorkEvidence) {
    if (!this.data.workEvidence) this.data.workEvidence = [];
    this.data.workEvidence.unshift(evidence);
    this.persist();
    if (this.tursoClient) {
      this.tursoClient.execute({
        sql: `INSERT OR REPLACE INTO workEvidence (evidenceId, workerId, workerName, assignmentId, assignmentTitle, locationId, locationName, teamId, photoId, photoUrl, watermarkUrl, category, description, latitude, longitude, accuracyMeters, detectedAddress, capturedAt, uploadedAt, reviewStatus, reviewedBy, reviewedByName, reviewedAt, reviewNotes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          evidence.evidenceId, evidence.workerId, evidence.workerName, evidence.assignmentId,
          evidence.assignmentTitle || null, evidence.locationId || null, evidence.locationName || null,
          evidence.teamId || null, evidence.photoId || null, evidence.photoUrl, evidence.watermarkUrl || null,
          evidence.category, evidence.description || null, evidence.latitude ?? null, evidence.longitude ?? null,
          evidence.accuracyMeters ?? null, evidence.detectedAddress || null, evidence.capturedAt, evidence.uploadedAt,
          evidence.reviewStatus || 'PENDING', evidence.reviewedBy || null, evidence.reviewedByName || null,
          evidence.reviewedAt || null, evidence.reviewNotes || null, evidence.createdAt
        ] as any[],
      }).catch((e: any) => console.warn('[TURSO] workEvidence insert error:', e.message));
    }
    return evidence;
  }
  public updateWorkEvidence(evidenceId: string, updates: Partial<WorkEvidence>) {
    if (!this.data.workEvidence) this.data.workEvidence = [];
    const idx = this.data.workEvidence.findIndex(e => e.evidenceId === evidenceId);
    if (idx !== -1) {
      this.data.workEvidence[idx] = { ...this.data.workEvidence[idx], ...updates };
      this.persist();
      const ev = this.data.workEvidence[idx];
      if (this.tursoClient) {
        this.tursoClient.execute({
          sql: `UPDATE workEvidence SET reviewStatus = ?, reviewedBy = ?, reviewedByName = ?, reviewedAt = ?, reviewNotes = ? WHERE evidenceId = ?`,
          args: [ev.reviewStatus || 'PENDING', ev.reviewedBy || null, ev.reviewedByName || null, ev.reviewedAt || null, ev.reviewNotes || null, evidenceId],
        }).catch((e: any) => console.warn('[TURSO] workEvidence update error:', e.message));
      }
      return this.data.workEvidence[idx];
    }
    return null;
  }

  // --- PASSWORD RESET REQUESTS ---
  public getPasswordResetRequests() {
    if (!this.data.passwordResetRequests) this.data.passwordResetRequests = [];
    return this.data.passwordResetRequests;
  }
  public getPasswordResetRequestById(requestId: string) {
    if (!this.data.passwordResetRequests) this.data.passwordResetRequests = [];
    return this.data.passwordResetRequests.find(r => r.requestId === requestId);
  }
  public addPasswordResetRequest(request: PasswordResetRequest) {
    if (!this.data.passwordResetRequests) this.data.passwordResetRequests = [];
    this.data.passwordResetRequests.unshift(request);
    this.persist();
    if (this.tursoClient) {
      this.tursoClient.execute({
        sql: `INSERT OR REPLACE INTO passwordResetRequests (requestId, userId, name, phone, role, status, requestedAt, reviewedBy, reviewedAt, tempPasswordAssigned) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          request.requestId,
          request.userId,
          request.name,
          request.phone || null,
          request.role,
          request.status,
          request.createdAt,
          request.resolvedBy || null,
          request.resolvedAt || null,
          request.temporaryPasswordGenerated || null,
        ] as any[],
      }).catch((e: any) => console.warn('[TURSO] passwordResetRequest insert error:', e.message));
    }
    return request;
  }
  public updatePasswordResetRequest(requestId: string, updates: Partial<PasswordResetRequest>) {
    if (!this.data.passwordResetRequests) this.data.passwordResetRequests = [];
    const idx = this.data.passwordResetRequests.findIndex(r => r.requestId === requestId);
    if (idx !== -1) {
      this.data.passwordResetRequests[idx] = { ...this.data.passwordResetRequests[idx], ...updates };
      this.persist();
      const r = this.data.passwordResetRequests[idx];
      if (this.tursoClient) {
        this.tursoClient.execute({
          sql: `UPDATE passwordResetRequests SET status = ?, reviewedBy = ?, reviewedAt = ?, tempPasswordAssigned = ? WHERE requestId = ?`,
          args: [
            r.status,
            r.resolvedBy || null,
            r.resolvedAt || null,
            r.temporaryPasswordGenerated || null,
            requestId,
          ] as any[],
        }).catch((e: any) => console.warn('[TURSO] passwordResetRequest update error:', e.message));
      }
      return this.data.passwordResetRequests[idx];
    }
    return null;
  }

  // --- B2B CLIENT PORTAL ENTITIES ---
  public getOrganizations(): Organization[] {
    if (!this.data.organizations) this.data.organizations = [];
    return this.data.organizations;
  }

  public getOrganizationById(id: string): Organization | undefined {
    return this.getOrganizations().find(o => o.organizationId === id);
  }

  public createOrganization(org: Organization): Organization {
    if (!this.data.organizations) this.data.organizations = [];
    this.data.organizations.push(org);
    this.persist();
    if (this.tursoClient) {
      this.tursoClient.execute({
        sql: `INSERT OR REPLACE INTO organizations (organizationId, name, contactPerson, email, phone, address, serviceLocationIds, contractStartDate, contractEndDate, contractPricing, paymentTerms, status, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          org.organizationId,
          org.name,
          org.contactPerson,
          org.email,
          org.phone,
          org.address || null,
          JSON.stringify(org.serviceLocationIds || []),
          org.contractStartDate,
          org.contractEndDate,
          org.contractPricing,
          org.paymentTerms,
          org.status,
          org.notes || null,
          org.createdAt,
          org.updatedAt,
        ],
      }).catch((e: any) => console.warn('[TURSO] createOrganization error:', e.message));
    }
    return org;
  }

  public updateOrganization(id: string, updates: Partial<Organization>): Organization | undefined {
    if (!this.data.organizations) this.data.organizations = [];
    const idx = this.data.organizations.findIndex(o => o.organizationId === id);
    if (idx === -1) return undefined;
    this.data.organizations[idx] = {
      ...this.data.organizations[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    const org = this.data.organizations[idx];
    this.persist();
    if (this.tursoClient) {
      this.tursoClient.execute({
        sql: `UPDATE organizations SET name=?, contactPerson=?, email=?, phone=?, address=?, serviceLocationIds=?, contractStartDate=?, contractEndDate=?, contractPricing=?, paymentTerms=?, status=?, notes=?, updatedAt=? WHERE organizationId=?`,
        args: [
          org.name,
          org.contactPerson,
          org.email,
          org.phone,
          org.address || null,
          JSON.stringify(org.serviceLocationIds || []),
          org.contractStartDate,
          org.contractEndDate,
          org.contractPricing,
          org.paymentTerms,
          org.status,
          org.notes || null,
          org.updatedAt,
          id,
        ],
      }).catch((e: any) => console.warn('[TURSO] updateOrganization error:', e.message));
    }
    return org;
  }

  public deleteOrganization(id: string): boolean {
    if (!this.data.organizations) this.data.organizations = [];
    const idx = this.data.organizations.findIndex(o => o.organizationId === id);
    if (idx === -1) return false;

    this.data.organizations.splice(idx, 1);

    // Clean up linked B2B client users, invoices, and payments
    const linkedUserIds = (this.data.users || [])
      .filter(u => u.organizationId === id && u.role === 'B2B_CLIENT')
      .map(u => u.uid);
    if (this.data.users) {
      this.data.users = this.data.users.filter(u => !(u.organizationId === id && u.role === 'B2B_CLIENT'));
    }
    if (this.data.invoices) {
      this.data.invoices = this.data.invoices.filter(i => i.organizationId !== id);
    }
    if (this.data.payments) {
      this.data.payments = this.data.payments.filter(p => p.organizationId !== id);
    }

    this.persist();

    if (this.tursoClient) {
      this.tursoClient.execute({
        sql: `DELETE FROM organizations WHERE organizationId = ?`,
        args: [id],
      }).catch((e: any) => console.warn('[TURSO] deleteOrganization error:', e.message));

      for (const uid of linkedUserIds) {
        this.tursoClient.execute({
          sql: `DELETE FROM users WHERE uid = ?`,
          args: [uid],
        }).catch(() => {});
      }
      this.tursoClient.execute({
        sql: `DELETE FROM invoices WHERE organizationId = ?`,
        args: [id],
      }).catch(() => {});
      this.tursoClient.execute({
        sql: `DELETE FROM payments WHERE organizationId = ?`,
        args: [id],
      }).catch(() => {});
    }

    return true;
  }

  public getInvoices(organizationId?: string): Invoice[] {
    if (!this.data.invoices) this.data.invoices = [];
    if (organizationId) {
      return this.data.invoices.filter(i => i.organizationId === organizationId);
    }
    return this.data.invoices;
  }

  public getInvoiceById(id: string): Invoice | undefined {
    if (!this.data.invoices) this.data.invoices = [];
    return this.data.invoices.find(i => i.invoiceId === id || i.invoiceNumber === id);
  }

  public createInvoice(inv: Invoice): Invoice {
    if (!this.data.invoices) this.data.invoices = [];
    this.data.invoices.unshift(inv);
    this.persist();
    if (this.tursoClient) {
      this.tursoClient.execute({
        sql: `INSERT OR REPLACE INTO invoices (invoiceId, invoiceNumber, organizationId, organizationName, assignmentId, eventName, issueDate, dueDate, amount, amountPaid, status, description, items, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          inv.invoiceId,
          inv.invoiceNumber,
          inv.organizationId,
          inv.organizationName,
          inv.assignmentId || null,
          inv.eventName || null,
          inv.issueDate,
          inv.dueDate,
          inv.amount,
          inv.amountPaid,
          inv.status,
          inv.description || null,
          JSON.stringify(inv.items || []),
          inv.notes || null,
          inv.createdAt,
          inv.updatedAt,
        ],
      }).catch((e: any) => console.warn('[TURSO] createInvoice error:', e.message));
    }
    return inv;
  }

  public updateInvoice(id: string, updates: Partial<Invoice>): Invoice | undefined {
    if (!this.data.invoices) this.data.invoices = [];
    const idx = this.data.invoices.findIndex(i => i.invoiceId === id || i.invoiceNumber === id);
    if (idx === -1) return undefined;
    this.data.invoices[idx] = {
      ...this.data.invoices[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    const inv = this.data.invoices[idx];
    this.persist();
    if (this.tursoClient) {
      this.tursoClient.execute({
        sql: `UPDATE invoices SET amountPaid=?, status=?, notes=?, updatedAt=? WHERE invoiceId=? OR invoiceNumber=?`,
        args: [inv.amountPaid, inv.status, inv.notes || null, inv.updatedAt, id, id],
      }).catch((e: any) => console.warn('[TURSO] updateInvoice error:', e.message));
    }
    return inv;
  }

  public getPayments(organizationId?: string): Payment[] {
    if (!this.data.payments) this.data.payments = [];
    if (organizationId) {
      return this.data.payments.filter(p => p.organizationId === organizationId);
    }
    return this.data.payments;
  }

  public getPaymentById(id: string): Payment | undefined {
    if (!this.data.payments) this.data.payments = [];
    return this.data.payments.find(p => p.paymentId === id || p.receiptNumber === id || p.transactionId === id);
  }

  public createPayment(payment: Payment): Payment {
    if (!this.data.payments) this.data.payments = [];
    this.data.payments.unshift(payment);
    this.persist();
    if (this.tursoClient) {
      this.tursoClient.execute({
        sql: `INSERT OR REPLACE INTO payments (paymentId, receiptNumber, invoiceId, invoiceNumber, organizationId, organizationName, assignmentId, eventName, amount, paymentDate, paymentMethod, transactionId, status, recordedBy, recordedByName, notes, receiptUrl, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          payment.paymentId,
          payment.receiptNumber,
          payment.invoiceId,
          payment.invoiceNumber,
          payment.organizationId,
          payment.organizationName,
          payment.assignmentId || null,
          payment.eventName || null,
          payment.amount,
          payment.paymentDate,
          payment.paymentMethod,
          payment.transactionId,
          payment.status,
          payment.recordedBy || null,
          payment.recordedByName || null,
          payment.notes || null,
          payment.receiptUrl || null,
          payment.createdAt,
          payment.updatedAt,
        ],
      }).catch((e: any) => console.warn('[TURSO] createPayment error:', e.message));
    }
    return payment;
  }

  public getEventsForOrganization(organizationId: string): Assignment[] {
    return this.data.assignments.filter(a => a.organizationId === organizationId);
  }

  // --- SETTINGS ---
  public getSettings() { return this.data.settings; }
  public updateSettings(settings: Partial<OrganizationSettings>) {
    this.data.settings = { ...this.data.settings, ...settings };
    this.persist();
    if (this.tursoClient) {
      this.tursoClient.execute({
        sql: `INSERT OR REPLACE INTO organizationSettings (key, value, updatedAt) VALUES (?, ?, ?)`,
        args: ['org_settings', JSON.stringify(this.data.settings), new Date().toISOString()],
      }).catch((e: any) => console.warn('[TURSO] organizationSettings update error:', e.message));
    }
    return this.data.settings;
  }
}

export const db = new DatabaseService();
