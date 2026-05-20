import {
  LayoutDashboard,
  Users,
  Building2,
  Shield,
  BarChart3,
  ScrollText,
  Trophy,
  Activity,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export type SuperAdminRouteItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
};

// Centralized platform-owner navigation (no duplicated href arrays in components).
export const superAdminRoutes: SuperAdminRouteItem[] = [
  { href: '/superadmin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/superadmin/users', label: 'Users', icon: Users },
  { href: '/superadmin/workspaces', label: 'Workspaces', icon: Building2 },
  { href: '/superadmin/roles', label: 'Roles', icon: Shield },
  { href: '/superadmin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/superadmin/logs', label: 'Logs', icon: ScrollText },
  { href: '/superadmin/gamification', label: 'Gamification', icon: Trophy },
  { href: '/superadmin/results', label: 'Results', icon: Activity },
  { href: '/superadmin/settings', label: 'Settings', icon: Settings },
];

