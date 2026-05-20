import type { StudentDashboardData } from '@/lib/student/types';

export const studentDashboardMock: StudentDashboardData = {
  profile: {
    name: 'Student',
  },
  stats: {
    totalExamsTaken: 0,
    averageScore: 0,
    rank: undefined,
    percentile: undefined,
  },
  pendingWork: { groupedNotifications: {} },
  upcomingExams: [],
  recentResults: [],
  workspaceName: 'Student Portal',
};

