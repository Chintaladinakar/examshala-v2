export type StudentProfile = {
  name?: string;
  email?: string;
  phone?: string;
  enrollmentId?: string;
  courseOrBatch?: string;
  photoUrl?: string;
};

export type StudentDashboardStats = {
  totalExamsTaken?: number;
  averageScore?: number;
  linkedParentCount?: number;
  rank?: number;
  percentile?: number;
};

export type StudentNotificationItem = {
  id?: string;
  title?: string;
  message?: string;
  actionUrl?: string;
  createdAt?: string;
  assignedByType?: string;
  assignedByName?: string;
};

export type StudentUpcomingExam = {
  id?: string;
  title?: string;
  duration?: number;
  assignedType?: string;
  assignedBy?: string;
  assignedAt?: string;
};

export type StudentRecentResult = {
  id?: string;
  title?: string;
  score?: number;
  maxScore?: number;
  submittedAt?: string;
};

export type StudentDashboardData = {
  profile?: StudentProfile;
  stats?: StudentDashboardStats;
  pendingWork?: {
    groupedNotifications?: Record<string, StudentNotificationItem[]>;
  };
  upcomingExams?: StudentUpcomingExam[];
  recentResults?: StudentRecentResult[];
  workspaceName?: string;
};

export type StudentParentsData = unknown[];

export type StudentResultsData = unknown[];

