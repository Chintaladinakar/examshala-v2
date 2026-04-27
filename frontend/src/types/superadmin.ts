export type WorkspaceRole = 'admin' | 'coadmin' | 'teacher' | 'student' | 'principal';

export type GlobalRole = 'superadmin' | 'user';

export interface UserWorkspace {
  workspaceId: string;
  workspaceName: string;
  role: WorkspaceRole;
}

export interface User {
  id: string;
  name: string;
  email: string;
  globalRole: GlobalRole;
  isActive: boolean;
  createdAt: string;
  workspaces: UserWorkspace[];
}

export interface Workspace {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  userCount: number;
}
