import {
  User,
  Worker,
  TeamLeader,
  Team,
  WorkLocation,
  Assignment,
  Attendance,
  AttendancePhoto,
  AttendanceEvent,
  WorkEvidence,
  LeaveRequest,
  Notification,
  ActivityLog,
  OrganizationSettings,
  UserRole,
} from '../types';

class ApiService {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('workcrew_token');
    const role = localStorage.getItem('workcrew_role');
    const userId = localStorage.getItem('workcrew_userId');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (role) {
      headers['x-workcrew-role'] = role;
    }
    if (userId) {
      headers['x-workcrew-user-id'] = userId;
    }

    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(endpoint, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
    }

    return res.json();
  }

  // --- AUTH ---
  async getMe() {
    return this.request<{ user: User; worker?: Worker; leader?: TeamLeader; settings: OrganizationSettings }>('/api/auth/me');
  }

  async login(identifier: string, password?: string, role?: UserRole) {
    return this.request<{
      token: string;
      user: User;
      worker?: Worker;
      leader?: TeamLeader;
      redirectUrl: string;
      mustChangePassword?: boolean;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password, role }),
    });
  }

  async registerWorker(data: { name: string; phone: string; password: string; email?: string; role?: 'WORKER' | 'TEAM_LEADER' }) {
    return this.request<{
      message: string;
      token: string;
      user: User;
      worker?: Worker;
      leader?: TeamLeader;
      redirectUrl: string;
    }>('/api/auth/register-worker', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }


  async changePassword(newPassword: string, currentPassword?: string) {
    return this.request<{ success: boolean; message: string; user: User }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ newPassword, currentPassword }),
    });
  }

  async updateProfilePhoto(photoBase64: string) {
    return this.request<{
      success: boolean;
      photoURL: string;
      deletedPrevious: boolean;
      user: User;
      worker?: Worker;
      leader?: TeamLeader;
      message: string;
    }>('/api/auth/profile-photo', {
      method: 'POST',
      body: JSON.stringify({ photo: photoBase64 }),
    });
  }

  async forgotPasswordRequest(phone: string, reason?: string) {
    return this.request<{ success: boolean; message: string; requestId: string }>('/api/auth/forgot-password-request', {
      method: 'POST',
      body: JSON.stringify({ phone, reason }),
    });
  }

  async getResetRequests() {
    return this.request<any[]>('/api/auth/reset-requests');
  }

  async resetPassword(data: {
    targetUserId?: string;
    targetPhone?: string;
    temporaryPassword?: string;
    requestId?: string;
  }) {
    return this.request<{ success: boolean; message: string; temporaryPassword?: string }>(
      '/api/auth/reset-password',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async switchRole(role: UserRole, userId?: string) {
    return this.request<{
      token: string;
      user: User;
      worker?: Worker;
      leader?: TeamLeader;
      redirectUrl: string;
    }>('/api/auth/switch-role', {
      method: 'POST',
      body: JSON.stringify({ role, userId }),
    });
  }

  async resetSeed() {
    return this.request<{ success: boolean; message: string }>('/api/auth/reset-seed', {
      method: 'POST',
    });
  }

  // --- WORKERS ---
  async getWorkers(params?: { teamId?: string; status?: string; search?: string }) {
    const q = new URLSearchParams(params as any).toString();
    return this.request<Worker[]>(`/api/workers${q ? `?${q}` : ''}`);
  }

  async getWorker(id: string) {
    return this.request<{
      worker: Worker;
      team: Team | null;
      recentAssignments: Assignment[];
      attendanceSummary: { total: number; present: number; absent: number; late: number };
      attendanceHistory: Attendance[];
    }>(`/api/workers/${id}`);
  }

  async createWorker(data: Partial<Worker>) {
    return this.request<Worker>('/api/workers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }


  async assignWorkerToTeam(workerId: string, teamId: string) {
    return this.request<Worker>(`/api/workers/${workerId}/assign-team`, {
      method: 'POST',
      body: JSON.stringify({ teamId }),
    });
  }

  async updateWorker(id: string, data: Partial<Worker>) {
    return this.request<Worker>(`/api/workers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }


  async updateWorkerStatus(id: string, status: string) {
    return this.request<Worker>(`/api/workers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteWorker(id: string) {
    return this.updateWorkerStatus(id, 'INACTIVE');
  }

  async uploadWorkerPhoto(workerId: string, photoBase64: string) {
    return this.request<{
      success: boolean;
      worker: Worker;
      photoURL: string;
      googleDriveFolderId: string;
      googleDriveFolderUrl: string;
      driveCanonicalFilename: string;
      message: string;
    }>(`/api/workers/${workerId}/photo`, {
      method: 'POST',
      body: JSON.stringify({ photo: photoBase64 }),
    });
  }

  // --- FACIAL RECOGNITION & BIOMETRIC IDENTIFICATION ---
  async identifyPeopleInPhoto(photoBase64: string, threshold?: number) {
    return this.request<{
      success: boolean;
      totalIndexedProfiles: number;
      detectedPeople: Array<{
        personId: string;
        name: string;
        role: string;
        confidence: number;
        boundingBox: { x: number; y: number; width: number; height: number };
        isConfirmedMatch: boolean;
      }>;
      unmatchedFacesCount: number;
    }>('/api/recognition/identify', {
      method: 'POST',
      body: JSON.stringify({ photo: photoBase64, threshold }),
    });
  }

  async getIndexedBiometricProfiles() {
    return this.request<{
      totalIndexed: number;
      profiles: Array<{
        personId: string;
        name: string;
        role: string;
        signatureHash: string;
        metrics: any;
        indexedAt: string;
      }>;
    }>('/api/recognition/profiles');
  }

  async getWorkerDriveConfig() {
    return this.request<{
      folderId: string;
      folderUrl: string;
      folderName: string;
      description: string;
      antiMixupNamingFormat: string;
      driveCanonicalFormat: string;
      antiMixupGuarantee: string;
    }>('/api/workers/drive-config');
  }

  async syncAllWorkersToDrive() {
    return this.request<{
      message: string;
      totalSynced: number;
      results: Array<{ workerId: string; name: string; result: any }>;
    }>('/api/workers/drive-sync-all', {
      method: 'POST',
    });
  }

  // --- TEAM LEADERS ---
  async getLeaders() {
    return this.request<TeamLeader[]>('/api/leaders');
  }

  async createLeader(data: Partial<TeamLeader>) {
    return this.request<TeamLeader>('/api/leaders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }


  async updateLeader(id: string, data: Partial<TeamLeader>) {
    return this.request<TeamLeader>(`/api/leaders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }


  async deleteLeader(id: string) {
    return this.request<{ success: boolean; message: string }>(`/api/leaders/${id}`, {
      method: 'DELETE',
    });
  }

  // --- TEAMS ---
  async getTeams(managedOnly = false) {
    return this.request<Team[]>(`/api/teams?managedOnly=${managedOnly}`);
  }

  async getTeam(id: string) {
    return this.request<Team & { assignments: Assignment[]; todayAttendance: Attendance[] }>(`/api/teams/${id}`);
  }

  async createTeam(data: Partial<Team>) {
    return this.request<Team>('/api/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }


  async updateTeam(id: string, data: Partial<Team>) {
    return this.request<Team>(`/api/teams/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }


  async addTeamMember(teamId: string, workerId: string) {
    return this.request<Team>(`/api/teams/${teamId}/members`, {
      method: 'POST',
      body: JSON.stringify({ workerId }),
    });
  }

  async removeTeamMember(teamId: string, workerId: string) {
    return this.request<Team>(`/api/teams/${teamId}/members/${workerId}`, {
      method: 'DELETE',
    });
  }

  // --- LOCATIONS ---
  async getLocations() {
    return this.request<WorkLocation[]>('/api/locations');
  }

  async createLocation(data: Partial<WorkLocation> & { photo?: string }) {
    return this.request<WorkLocation>('/api/locations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }


  async updateLocation(id: string, data: Partial<WorkLocation> & { photo?: string }) {
    return this.request<WorkLocation>(`/api/locations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }


  // --- ASSIGNMENTS ---
  async getAssignments(params?: { date?: string; workerId?: string; teamId?: string; status?: string }) {
    const q = new URLSearchParams(params as any).toString();
    return this.request<Assignment[]>(`/api/assignments${q ? `?${q}` : ''}`);
  }

  async getAssignment(id: string) {
    return this.request<Assignment & { location?: WorkLocation; workers: Worker[]; teams: Team[] }>(`/api/assignments/${id}`);
  }

  async createAssignment(data: any) {
    return this.request<Assignment>('/api/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }


  async acceptAssignment(id: string) {
    return this.request<{ success: boolean; message: string }>(`/api/assignments/${id}/accept`, {
      method: 'POST',
    });
  }

  async completeAssignment(id: string, data: { completionNote?: string; completionEvidenceUrl?: string }) {
    return this.request<Assignment>(`/api/assignments/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }


  // --- ATTENDANCE ---
  async verifyTeamAttendancePhoto(data: {
    teamId?: string;
    photo: string;
    assignmentId?: string;
    locationId?: string;
    date?: string;
    latitude?: number;
    longitude?: number;
    autoMark?: boolean;
  }) {
    return this.request<{
      success: boolean;
      teamId: string;
      teamName: string;
      date: string;
      location?: { name: string; geofenceValid: boolean; distanceMeters: number } | null;
      photoProofUrl: string;
      summary: {
        totalCrew: number;
        presentCount: number;
        absentCount: number;
        ambiguousCount: number;
        gpsStatus: string;
      };
      verification: {
        presentWorkers: Array<{
          workerId: string;
          name: string;
          confidence: number;
          matchStatus: string;
          boundingBox: { x: number; y: number; width: number; height: number };
        }>;
        absentWorkers: Array<{
          workerId: string;
          name: string;
          confidence: number;
          matchStatus: string;
          reason: string;
        }>;
        ambiguousWorkers: Array<{
          workerId: string;
          name: string;
          confidence: number;
          matchStatus: string;
          reason: string;
        }>;
      };
      markedRecords: Attendance[];
    }>('/api/attendance/group-verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }


  async getAttendance(params?: { date?: string; workerId?: string; teamId?: string; status?: string }) {
    const q = new URLSearchParams(params as any).toString();
    return this.request<Attendance[]>(`/api/attendance${q ? `?${q}` : ''}`);
  }

  async getAttendanceHistory(workerId?: string) {
    return this.request<Attendance[]>(`/api/attendance/history${workerId ? `?workerId=${workerId}` : ''}`);
  }

  async getAttendanceDetail(id: string) {
    return this.request<Attendance & {
      worker?: Worker;
      assignment?: Assignment;
      checkInPhoto?: AttendancePhoto;
      checkOutPhoto?: AttendancePhoto;
      events?: AttendanceEvent[];
    }>(`/api/attendance/${id}`);
  }

  async checkIn(data: {
    assignmentId?: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    workerId?: string;
    photo?: string;
    detectedAddress?: string;
    deviceTimestamp?: string;
  }) {
    return this.request<{
      attendance: Attendance;
      photo?: AttendancePhoto;
      geofence: { isWithinGeofence: boolean; distanceMeters: number; message?: string };
      message: string;
    }>('/api/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }


  async checkOut(data: {
    attendanceId?: string;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    workerId?: string;
    photo?: string;
    detectedAddress?: string;
    deviceTimestamp?: string;
  }) {
    return this.request<{
      attendance: Attendance;
      photo?: AttendancePhoto;
      workingMinutes: number;
      message: string;
    }>('/api/attendance/check-out', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }


  async submitAttendanceException(data: {
    assignmentId?: string;
    reason: string;
    photo?: string;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    detectedAddress?: string;
  }) {
    return this.request<{
      attendance: Attendance;
      message: string;
    }>('/api/attendance/exception', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }


  async getAttendancePhotos(params?: { workerId?: string; teamId?: string; assignmentId?: string; photoType?: string }) {
    const q = new URLSearchParams(params as any).toString();
    return this.request<AttendancePhoto[]>(`/api/attendance/photos${q ? `?${q}` : ''}`);
  }

  async getAttendancePhotoById(id: string) {
    return this.request<AttendancePhoto>(`/api/attendance/photos/${id}`);
  }

  async markManualAttendance(data: { workerId: string; assignmentId?: string; date?: string; status: string; reason: string }) {
    return this.request<Attendance>('/api/attendance/manual', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }


  async requestCorrection(id: string, reason: string) {
    return this.request<{ success: boolean; attendance: Attendance }>(`/api/attendance/${id}/correction-request`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async reviewCorrection(id: string, data: { status?: string; remarks?: string; workingMinutes?: number; approved: boolean }) {
    return this.request<Attendance>(`/api/attendance/${id}/corrections`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }


  // --- WORK EVIDENCE ---
  async getWorkEvidence(params?: {
    assignmentId?: string;
    workerId?: string;
    teamId?: string;
    locationId?: string;
    category?: string;
    reviewStatus?: string;
    date?: string;
  }) {
    const q = new URLSearchParams(params as any).toString();
    return this.request<WorkEvidence[]>(`/api/work-evidence${q ? `?${q}` : ''}`);
  }

  async getWorkEvidenceById(id: string) {
    return this.request<WorkEvidence>(`/api/work-evidence/${id}`);
  }

  async submitWorkEvidence(data: {
    assignmentId: string;
    locationId?: string;
    category: string;
    description?: string;
    photo: string;
    watermarkPhoto?: string;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    detectedAddress?: string;
    capturedAt?: string;
  }) {
    return this.request<{
      evidence: WorkEvidence;
      message: string;
    }>('/api/work-evidence', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }


  async reviewWorkEvidence(id: string, reviewStatus: 'APPROVED' | 'REJECTED', reviewNotes?: string) {
    return this.request<WorkEvidence>(`/api/work-evidence/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ reviewStatus, reviewNotes }),
    });
  }

  // --- LOCATION VERIFICATION ---
  async verifyLocation(data: { latitude: number; longitude: number; accuracy?: number; locationId?: string; assignmentId?: string }) {
    return this.request<{
      status: 'VERIFIED' | 'OUTSIDE_GEOFENCE' | 'POOR_ACCURACY';
      isWithinGeofence: boolean;
      accuracyAcceptable: boolean;
      distanceMeters: number;
      geofenceRadiusMeters: number;
      accuracyMeters: number;
      detectedAddress: string;
      targetLocation: WorkLocation | null;
      message: string;
    }>('/api/location/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }


  // --- REPORTS ---
  async getAttendanceReport(params?: { startDate?: string; endDate?: string; teamId?: string; workerId?: string }) {
    const q = new URLSearchParams(params as any).toString();
    return this.request<{
      summary: {
        totalRecords: number;
        present: number;
        absent: number;
        late: number;
        halfDay: number;
        leave: number;
        attendanceRate: number;
        totalWorkingHours: string;
        averageHoursPerDay: string;
      };
      teamBreakdown: Array<{
        teamId: string;
        teamName: string;
        total: number;
        present: number;
        absent: number;
        rate: number;
      }>;
      records: Attendance[];
    }>(`/api/reports/attendance${q ? `?${q}` : ''}`);
  }

  async getAssignmentReport() {
    return this.request<{
      summary: {
        total: number;
        completed: number;
        inProgress: number;
        assigned: number;
        cancelled: number;
        completionRate: number;
      };
      assignments: Assignment[];
    }>('/api/reports/assignments');
  }

  getExportCsvUrl() {
    return '/api/reports/export-csv';
  }

  // --- NOTIFICATIONS ---
  async getNotifications() {
    return this.request<{ notifications: Notification[]; unreadCount: number }>('/api/notifications');
  }

  async markNotificationRead(id: string) {
    return this.request<Notification>(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsRead() {
    return this.request<{ success: boolean }>('/api/notifications/mark-all', {
      method: 'POST',
    });
  }

  // --- SETTINGS ---
  async getSettings() {
    return this.request<OrganizationSettings>('/api/settings');
  }

  async updateSettings(data: Partial<OrganizationSettings>) {
    return this.request<OrganizationSettings>('/api/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }


  // --- ACTIVITY LOGS ---
  async getActivityLogs() {
    return this.request<ActivityLog[]>('/api/activity-logs');
  }

  // --- LEAVES ---
  async getLeaves() {
    return this.request<LeaveRequest[]>('/api/leaves');
  }

  async applyLeave(data: { startDate: string; endDate: string; leaveType: string; reason: string; workerId?: string }) {
    return this.request<LeaveRequest>('/api/leaves', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }


  async reviewLeave(id: string, data: { status: 'APPROVED' | 'REJECTED'; reviewComment?: string }) {
    return this.request<LeaveRequest>(`/api/leaves/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

}

export const api = new ApiService();
