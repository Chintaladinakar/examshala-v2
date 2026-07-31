export type Permission =
  | 'assignment.view'
  | 'assignment.submit'
  | 'assignment.grade'
  | 'assignment.manage'
  | 'material.view'
  | 'material.download'
  | 'material.manage'
  | 'exam.view'
  | 'exam.attempt'
  | 'exam.manage'
  | 'attendance.view'
  | 'attendance.mark'
  | 'result.view'
  | 'result.manage'
  | 'announcement.view'
  | 'announcement.manage'
  | 'timetable.view'
  | 'timetable.manage'
  | 'message.send';

const STUDENT_PERMISSIONS: Permission[] = [
  'assignment.view',
  'assignment.submit',
  'material.view',
  'material.download',
  'exam.view',
  'exam.attempt',
  'attendance.view',
  'result.view',
  'announcement.view',
  'timetable.view',
  'message.send',
];

const TEACHER_PERMISSIONS: Permission[] = [
  'assignment.view',
  'assignment.grade',
  'assignment.manage',
  'material.view',
  'material.download',
  'material.manage',
  'exam.view',
  'exam.manage',
  'attendance.view',
  'attendance.mark',
  'result.view',
  'result.manage',
  'announcement.view',
  'timetable.view',
  'timetable.manage',
  'message.send',
];

const PRINCIPAL_PERMISSIONS: Permission[] = [
  ...TEACHER_PERMISSIONS,
  'announcement.manage',
];

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  student: STUDENT_PERMISSIONS,
  teacher: TEACHER_PERMISSIONS,
  principal: PRINCIPAL_PERMISSIONS,
  org_admin: [...new Set([...PRINCIPAL_PERMISSIONS])],
};

export function roleHasPermission(role: string | undefined, permission: Permission): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role.toLowerCase()];
  return !!permissions?.includes(permission);
}
