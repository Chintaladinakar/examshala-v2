import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  FileText,
  Calendar,
  MessageSquare,
  FolderOpen,
  Trophy,
  User,
  Settings,
  CalendarCheck,
  Megaphone,
  type LucideIcon,
} from 'lucide-react';

export type StudentRouteItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
};

// Centralized student portal navigation.
// Keep all hrefs here (do not duplicate in components).
export const studentPortalRoutes: StudentRouteItem[] = [
  { href: '/studentdashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/studentdashboard/subjects', label: 'Subjects', icon: BookOpen },
  { href: '/studentdashboard/exams', label: 'Exams', icon: ClipboardList },
  { href: '/studentdashboard/results', label: 'Results', icon: FileText },
  { href: '/studentdashboard/attendance', label: 'Attendance', icon: CalendarCheck },
  { href: '/studentdashboard/timetable', label: 'Timetable', icon: Calendar },
  { href: '/studentdashboard/schedule', label: 'Schedule', icon: Calendar },
  { href: '/studentdashboard/calendar', label: 'Calendar', icon: Calendar },
  { href: '/studentdashboard/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/studentdashboard/profile', label: 'Profile', icon: User },
  { href: '/studentdashboard/settings', label: 'Settings', icon: Settings },
];

