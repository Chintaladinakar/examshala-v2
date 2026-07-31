import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import * as profileService from '../services/studentProfile.service';

export const ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'half_day', 'leave'] as const;
type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];
const normalizeAttendanceStatus = (status: string): AttendanceStatus =>
  (ATTENDANCE_STATUSES as readonly string[]).includes(status) ? (status as AttendanceStatus) : 'present';

// Helper to log audit activity
const createSchoolLog = async (userId: string, role: string, actionType: string, entityId: string) => {
  try {
    await prisma.schoolLog.create({
      data: {
        userId,
        role,
        actionType,
        entityId,
      },
    });
  } catch (error) {
    console.error('Failed to write SchoolLog audit entry:', error);
  }
};

// -------------------------------------------------------------
// 2. CLASSROOMS
// -------------------------------------------------------------

export const createClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.role.toLowerCase() !== 'principal') {
      res.status(403).json({
        success: false,
        code: 'ACCESS_DENIED',
        message: 'Only the Principal can create classrooms in this workspace.',
      });
      return;
    }

    const workspaceId = user.workspaceId;
    if (!workspaceId) {
      res.status(400).json({
        success: false,
        code: 'MISSING_WORKSPACE',
        message: 'Principal has no workspace assignment.',
      });
      return;
    }

    const { name, departmentId } = req.body;
    if (!name || name.trim() === '') {
      res.status(400).json({ success: false, code: 'MISSING_NAME', message: 'Classroom name is required.' });
      return;
    }

    let resolvedDepartmentId: string | null = null;
    if (departmentId) {
      const department = await prisma.department.findFirst({ where: { id: departmentId, workspaceId } });
      if (!department) {
        res.status(400).json({ success: false, code: 'BAD_REQUEST', message: 'Department not found in this workspace.' });
        return;
      }
      resolvedDepartmentId = department.id;
    }

    const existing = await prisma.class.findFirst({ where: { name, workspaceId } });
    if (existing) {
      res.status(400).json({ success: false, code: 'BAD_REQUEST', message: 'Class already exists.' });
      return;
    }

    const classroom = await prisma.class.create({
      data: {
        name,
        workspaceId,
        departmentId: resolvedDepartmentId,
      },
      include: { Department: { select: { id: true, name: true } } },
    });

    await createSchoolLog(userId!, user.role, 'class_created', classroom.id);

    res.status(201).json({
      success: true,
      message: 'Classroom created successfully',
      data: classroom,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: error.message || 'Internal server error',
    });
  }
};

export const getClasses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'User has no workspace mapping.' });
      return;
    }

    const isPrincipal = user.role.toLowerCase() === 'principal';
    const isTeacher = user.role.toLowerCase() === 'teacher';

    let classIdFilter: { in: string[] } | undefined;
    if (isTeacher && !isPrincipal) {
      const teacherLinks = await prisma.classTeacher.findMany({
        where: { teacherId: user.id, Class: { workspaceId: user.workspaceId } },
        select: { classId: true },
      });
      classIdFilter = { in: teacherLinks.map((t) => t.classId) };
    }

    const classes = await prisma.class.findMany({
      where: { workspaceId: user.workspaceId, ...(classIdFilter ? { id: classIdFilter } : {}) },
      orderBy: { createdAt: 'desc' },
      include: {
        teachers: {
          include: {
            Teacher: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        students: {
          include: {
            Student: {
              select: { id: true, name: true, email: true, isActive: true },
            },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: classes,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: error.message || 'Internal server error',
    });
  }
};

export const getScopedStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'User has no workspace mapping.' });
      return;
    }

    const isPrincipal = user.role.toLowerCase() === 'principal';
    const isTeacher = user.role.toLowerCase() === 'teacher';

    let classIdFilter: { in: string[] } | undefined;
    if (isTeacher && !isPrincipal) {
      const teacherLinks = await prisma.classTeacher.findMany({
        where: { teacherId: user.id, Class: { workspaceId: user.workspaceId } },
        select: { classId: true },
      });
      classIdFilter = { in: teacherLinks.map((t) => t.classId) };
    }

    const classes = await prisma.class.findMany({
      where: { workspaceId: user.workspaceId, ...(classIdFilter ? { id: classIdFilter } : {}) },
      select: { id: true },
    });
    const classIds = classes.map((c) => c.id);

    const classStudents = await prisma.classStudent.findMany({
      where: { classId: { in: classIds } },
      select: {
        studentId: true,
        Class: { select: { id: true, name: true } },
        Student: { select: { id: true, name: true, email: true, isActive: true, status: true } },
      },
    });

    const studentsMap = new Map<string, any>();
    for (const cs of classStudents) {
      if (!cs.Student) continue;
      if (!studentsMap.has(cs.studentId)) {
        studentsMap.set(cs.studentId, { ...cs.Student, classes: [cs.Class] });
      } else {
        studentsMap.get(cs.studentId).classes.push(cs.Class);
      }
    }

    res.status(200).json({ success: true, data: Array.from(studentsMap.values()) });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: error.message || 'Internal server error',
    });
  }
};

export const assignToClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.role.toLowerCase() !== 'principal') {
      res.status(403).json({ success: false, code: 'ACCESS_DENIED', message: 'Only the Principal can assign students/teachers.' });
      return;
    }
    if (!user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Principal has no workspace assignment.' });
      return;
    }

    const { classId, studentIds, teacherIds } = req.body as {
      classId?: string;
      studentIds?: string[];
      teacherIds?: string[];
    };
    if (!classId) {
      res.status(400).json({ success: false, code: 'BAD_REQUEST', message: 'classId required' });
      return;
    }

    const klass = await prisma.class.findFirst({ where: { id: classId, workspaceId: user.workspaceId } });
    if (!klass) {
      res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Class not found' });
      return;
    }

    const validStudentIds = Array.isArray(studentIds) ? studentIds : [];
    const validTeacherIds = Array.isArray(teacherIds) ? teacherIds : [];

    if (validStudentIds.length) {
      const validStudents = await prisma.user.findMany({
        where: { id: { in: validStudentIds }, workspaceId: user.workspaceId, role: { equals: 'student', mode: 'insensitive' } },
        select: { id: true },
      });
      await prisma.classStudent.deleteMany({ where: { classId: klass.id } });
      await prisma.classStudent.createMany({
        data: validStudents.map((s) => ({ classId: klass.id, studentId: s.id })),
        skipDuplicates: true,
      });
    }

    if (validTeacherIds.length) {
      const validTeachers = await prisma.user.findMany({
        where: { id: { in: validTeacherIds }, workspaceId: user.workspaceId, role: { equals: 'teacher', mode: 'insensitive' } },
        select: { id: true },
      });
      await prisma.classTeacher.deleteMany({ where: { classId: klass.id } });
      await prisma.classTeacher.createMany({
        data: validTeachers.map((t) => ({ classId: klass.id, teacherId: t.id })),
        skipDuplicates: true,
      });
    }

    await createSchoolLog(userId!, user.role, 'class_assignments_updated', klass.id);

    res.status(200).json({ success: true, message: 'Assignments updated successfully.', data: { classId: klass.id } });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: error.message || 'Internal server error',
    });
  }
};

export const linkTeacherToClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.role.toLowerCase() !== 'principal') {
      res.status(403).json({ success: false, code: 'ACCESS_DENIED', message: 'Only Principal can link teachers.' });
      return;
    }

    const { classId, teacherId } = req.body;
    if (!classId || !teacherId) {
      res.status(400).json({ success: false, code: 'MISSING_FIELDS', message: 'classId and teacherId are required.' });
      return;
    }

    // Verify class and teacher are in user's workspace
    const classroom = await prisma.class.findUnique({ where: { id: classId } });
    const targetTeacher = await prisma.user.findUnique({ where: { id: teacherId } });

    if (!classroom || !targetTeacher || classroom.workspaceId !== user.workspaceId || targetTeacher.workspaceId !== user.workspaceId) {
      res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Classroom and Teacher must exist in your workspace.' });
      return;
    }

    const link = await prisma.classTeacher.upsert({
      where: { classId_teacherId: { classId, teacherId } },
      update: {},
      create: { classId, teacherId },
    });

    res.status(200).json({ success: true, message: 'Teacher mapped to class successfully.', data: link });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: error.message || 'Internal server error',
    });
  }
};

// -------------------------------------------------------------
// 3. STUDENT MANAGEMENT
// -------------------------------------------------------------

export const addStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Caller workspace is missing.' });
      return;
    }

    // Principal or Teacher allowed
    const isPrincipal = user.role.toLowerCase() === 'principal';
    const isTeacher = user.role.toLowerCase() === 'teacher';
    if (!isPrincipal && !isTeacher) {
      res.status(403).json({ success: false, code: 'ACCESS_DENIED', message: 'Unauthorized profile role.' });
      return;
    }

    const { name, email, password, classId } = req.body;
    if (!name || !email) {
      res.status(400).json({ success: false, code: 'MISSING_FIELDS', message: 'Name and email are required.' });
      return;
    }

    // Validate email duplicate
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ success: false, code: 'USER_EXISTS', message: 'User with this email already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password || 'ExamStudent@123', 12);
    
    /**
     * Generates a unique, short, and brand-consistent 8-character User ID.
     * Combines a role-specific prefix (e.g. TR- for teachers, ST- for students, PR- for principals)
     * with a random 5-character alphanumeric block for maximum user readability and privacy.
     * Alphanumeric characters exclude highly confusing ones like 0, O, I, 1, and L to ensure
     * legibility when sharing.
     */
    const generateFancyUserId = async (userRole: string): Promise<string> => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let prefix = 'US-';
      const roleLower = userRole.toLowerCase();
      if (roleLower === 'student') prefix = 'ST-';
      else if (roleLower === 'tutor' || roleLower === 'teacher') prefix = 'TR-';
      else if (roleLower === 'principal') prefix = 'PR-';
      else if (roleLower === 'org_admin') prefix = 'AD-';

      let attempts = 0;
      while (attempts < 50) {
        let code = prefix;
        for (let i = 0; i < 5; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const existing = await prisma.user.findUnique({ where: { id: code } });
        if (!existing) return code;
        attempts++;
      }
      return `${prefix}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    };
    const studentId = await generateFancyUserId('student');

    // Create Student
    const student = await prisma.user.create({
      data: {
        id: studentId,
        name,
        email,
        passwordHash,
        role: 'student',
        status: 'ACTIVE',
        isActive: true,
        workspaceId: user.workspaceId,
        mode: 'student',
      },
    });

    // Optionally assign to Class Student mapping
    if (classId) {
      const targetClass = await prisma.class.findUnique({ where: { id: classId } });
      if (targetClass && targetClass.workspaceId === user.workspaceId) {
        await prisma.classStudent.create({
          data: {
            classId,
            studentId: student.id,
          },
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      data: { id: student.id, name: student.name, email: student.email },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: error.message || 'Internal server error',
    });
  }
};

export const activateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.role.toLowerCase() !== 'principal') {
      res.status(403).json({ success: false, code: 'ACCESS_DENIED', message: 'Only Principal can configure account statuses.' });
      return;
    }

    const { targetUserId, isActive } = req.body;
    if (!targetUserId || isActive === undefined) {
      res.status(400).json({ success: false, code: 'MISSING_FIELDS', message: 'targetUserId and isActive are required.' });
      return;
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser || targetUser.workspaceId !== user.workspaceId) {
      res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Target user does not belong to your workspace.' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { isActive, status: isActive ? 'ACTIVE' : 'INACTIVE' },
      select: { id: true, name: true, email: true, isActive: true },
    });

    res.status(200).json({ success: true, message: `Account state set to ${isActive ? 'Active' : 'Inactive'}`, data: updated });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: error.message || 'Internal server error',
    });
  }
};

export const getWorkspaceTeachers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.role.toLowerCase() !== 'principal') {
      res.status(403).json({ success: false, code: 'ACCESS_DENIED', message: 'Only Principal can fetch workspace staff.' });
      return;
    }

    const teachers = await prisma.user.findMany({
      where: {
        workspaceId: user.workspaceId,
        role: { equals: 'teacher', mode: 'insensitive' },
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        classTeachers: {
          include: {
            Class: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    res.status(200).json({ success: true, data: teachers });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: error.message || 'Internal server error',
    });
  }
};

// -------------------------------------------------------------
// 4. ATTENDANCE
// -------------------------------------------------------------

export const markAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
      return;
    }

    // Role verification
    const isPrincipal = user.role.toLowerCase() === 'principal';
    const isTeacher = user.role.toLowerCase() === 'teacher';
    if (!isPrincipal && !isTeacher) {
      res.status(403).json({ success: false, code: 'ACCESS_DENIED', message: 'Only teachers and principals can log attendance.' });
      return;
    }

    const { classId, date, records } = req.body; // records: { studentId, status: "present" | "absent" }[]
    if (!classId || !date || !records || !Array.isArray(records)) {
      res.status(400).json({ success: false, code: 'MISSING_FIELDS', message: 'classId, date, and records array are required.' });
      return;
    }

    // Verify class is in workspace
    const classroom = await prisma.class.findUnique({ where: { id: classId } });
    if (!classroom || classroom.workspaceId !== user.workspaceId) {
      res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Classroom must belong to your workspace.' });
      return;
    }

    if (isTeacher && !isPrincipal) {
      const assigned = await prisma.classTeacher.findFirst({
        where: { classId: classroom.id, teacherId: user.id },
        select: { id: true },
      });
      if (!assigned) {
        res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Not assigned to this class.' });
        return;
      }
    }

    const targetDate = new Date(new Date(date).setHours(0, 0, 0, 0));
    const isWithin24Hours = Date.now() - targetDate.getTime() <= 24 * 60 * 60 * 1000;

    const roster = await prisma.classStudent.findMany({
      where: { classId },
      select: { studentId: true },
    });
    const allowed = new Set(roster.map((r) => r.studentId));

    const existingRecords = await prisma.attendance.findMany({
      where: { classId, date: targetDate },
      select: { studentId: true, isLocked: true },
    });
    const existingByStudent = new Map(existingRecords.map((r) => [r.studentId, r]));

    const rejected: { studentId: string; reason: string }[] = [];
    const attendanceOps = records
      .filter((record: { studentId: string; status: string }) => {
        if (!allowed.has(record.studentId)) {
          rejected.push({ studentId: record.studentId, reason: 'NOT_IN_CLASS' });
          return false;
        }
        const existing = existingByStudent.get(record.studentId);
        if (existing?.isLocked && !isPrincipal) {
          rejected.push({ studentId: record.studentId, reason: 'LOCKED' });
          return false;
        }
        return true;
      })
      .map((record: { studentId: string; status: string }) => {
        const status = normalizeAttendanceStatus(record.status);
        return prisma.attendance.upsert({
          where: {
            classId_studentId_date: {
              classId,
              studentId: record.studentId,
              date: targetDate,
            },
          },
          update: {
            status,
            lastUpdatedBy: userId!,
            ...(isPrincipal ? { isLocked: false } : {}),
          },
          create: {
            classId,
            studentId: record.studentId,
            date: targetDate,
            status,
            markedByUserId: userId!,
            lastUpdatedBy: userId!,
            isLocked: !isWithin24Hours,
          },
        });
      });

    await prisma.$transaction(attendanceOps);

    // Write audit log
    await createSchoolLog(userId!, user.role, 'attendance_marked', classId);

    res.status(200).json({
      success: true,
      message: 'Attendance records logged successfully.',
      data: { markedCount: attendanceOps.length, rejected },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: error.message || 'Internal server error',
    });
  }
};

export const updateAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
      return;
    }

    const { attendanceId, status } = req.body;
    if (!attendanceId || !status) {
      res.status(400).json({ success: false, code: 'MISSING_FIELDS', message: 'attendanceId and status are required.' });
      return;
    }

    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: { Class: true },
    });

    if (!attendance || attendance.Class.workspaceId !== user.workspaceId) {
      res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Attendance record belongs outside your workspace.' });
      return;
    }

    const isPrincipal = user.role.toLowerCase() === 'principal';
    const isTeacher = user.role.toLowerCase() === 'teacher';
    if (isTeacher && !isPrincipal) {
      const assigned = await prisma.classTeacher.findFirst({
        where: { classId: attendance.classId, teacherId: user.id },
        select: { id: true },
      });
      if (!assigned) {
        res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Not assigned to this class.' });
        return;
      }
    }

    // Check Lock System
    // Enforce 24 hours lock
    const hoursDiff = (Date.now() - new Date(attendance.date).getTime()) / (1000 * 60 * 60);
    const isLocked = attendance.isLocked || hoursDiff >= 24;

    if (isLocked && !isPrincipal) {
      res.status(403).json({
        success: false,
        code: 'ATTENDANCE_LOCKED',
        message: 'Attendance is locked after 24 hours. Only the Principal can override this lock.',
      });
      return;
    }

    const updated = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        status: normalizeAttendanceStatus(status),
        lastUpdatedBy: userId!,
        isLocked: isPrincipal ? false : isLocked, // Principal edits unlock the record; otherwise preserve auto-lock state
      },
    });

    await createSchoolLog(userId!, user.role, 'attendance_updated', updated.id);

    res.status(200).json({ success: true, message: 'Attendance record updated successfully.', data: updated });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: error.message || 'Internal server error',
    });
  }
};

export const getClassAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
      return;
    }

    const classId = req.params.id as string;
    const dateStr = req.query.date as string;
    if (!dateStr) {
      res.status(400).json({ success: false, code: 'MISSING_FIELDS', message: 'date query param is required.' });
      return;
    }

    const classroom = await prisma.class.findUnique({ where: { id: classId } });
    if (!classroom || classroom.workspaceId !== user.workspaceId) {
      res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Classroom belongs outside your workspace.' });
      return;
    }

    const isPrincipal = user.role.toLowerCase() === 'principal';
    const isTeacher = user.role.toLowerCase() === 'teacher';
    if (isTeacher && !isPrincipal) {
      const assigned = await prisma.classTeacher.findFirst({
        where: { classId: classroom.id, teacherId: user.id },
        select: { id: true },
      });
      if (!assigned) {
        res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Not assigned to this class.' });
        return;
      }
    }

    const targetDate = new Date(new Date(dateStr).setHours(0, 0, 0, 0));
    if (Number.isNaN(targetDate.getTime())) {
      res.status(400).json({ success: false, code: 'BAD_REQUEST', message: 'invalid date' });
      return;
    }

    const roster = await prisma.classStudent.findMany({
      where: { classId: classroom.id },
      select: { Student: { select: { id: true, name: true, email: true, isActive: true } } },
      orderBy: { createdAt: 'asc' },
    });

    const attendance = await prisma.attendance.findMany({
      where: { classId: classroom.id, date: targetDate },
      select: { id: true, studentId: true, status: true, isLocked: true, createdAt: true, lastUpdatedBy: true },
    });
    const byStudent = new Map(attendance.map((a) => [a.studentId, a]));

    res.status(200).json({
      success: true,
      data: {
        class: { id: classroom.id, name: classroom.name },
        date: targetDate.toISOString(),
        students: roster.map((r) => ({
          ...r.Student,
          attendance: byStudent.get(r.Student.id) ?? null,
        })),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: error.message || 'Internal server error',
    });
  }
};

export const getAttendanceReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
      return;
    }

    const classId = req.query.classId as string;
    const year = Number(req.query.year);
    const month = Number(req.query.month);
    if (!classId || !year || !month || month < 1 || month > 12) {
      res.status(400).json({ success: false, code: 'BAD_REQUEST', message: 'classId, year, and month (1-12) are required.' });
      return;
    }

    const classroom = await prisma.class.findUnique({ where: { id: classId } });
    if (!classroom || classroom.workspaceId !== user.workspaceId) {
      res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Classroom belongs outside your workspace.' });
      return;
    }

    const isPrincipal = user.role.toLowerCase() === 'principal';
    const isTeacher = user.role.toLowerCase() === 'teacher';
    if (isTeacher && !isPrincipal) {
      const assigned = await prisma.classTeacher.findFirst({
        where: { classId: classroom.id, teacherId: user.id },
        select: { id: true },
      });
      if (!assigned) {
        res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Not assigned to this class.' });
        return;
      }
    }

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const roster = await prisma.classStudent.findMany({
      where: { classId },
      select: { Student: { select: { id: true, name: true } } },
      orderBy: { Student: { name: 'asc' } },
    });

    const records = await prisma.attendance.findMany({
      where: { classId, date: { gte: start, lte: end } },
      select: { studentId: true, status: true, date: true },
    });

    const totalDays = new Set(records.map((r) => r.date.toDateString())).size;

    const report = roster
      .filter((r) => r.Student)
      .map((r) => {
        const studentRecords = records.filter((rec) => rec.studentId === r.Student!.id);
        const present = studentRecords.filter((rec) => rec.status === 'present' || rec.status === 'late').length;
        const absent = studentRecords.filter((rec) => rec.status === 'absent').length;
        const leave = studentRecords.filter((rec) => rec.status === 'leave').length;
        const halfDay = studentRecords.filter((rec) => rec.status === 'half_day').length;
        const marked = studentRecords.length;
        const percentage = marked > 0 ? Math.round((present / marked) * 1000) / 10 : 0;

        return {
          studentId: r.Student!.id,
          name: r.Student!.name,
          present,
          absent,
          leave,
          halfDay,
          marked,
          totalDays,
          percentage,
        };
      });

    res.status(200).json({ success: true, data: { classId, year, month, report } });
  } catch (error: any) {
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message || 'Internal server error' });
  }
};

export const copyAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
      return;
    }

    const isPrincipal = user.role.toLowerCase() === 'principal';
    const isTeacher = user.role.toLowerCase() === 'teacher';
    if (!isPrincipal && !isTeacher) {
      res.status(403).json({ success: false, code: 'ACCESS_DENIED', message: 'Only teachers and principals can log attendance.' });
      return;
    }

    const { classId, fromDate, toDate } = req.body;
    if (!classId || !fromDate || !toDate) {
      res.status(400).json({ success: false, code: 'MISSING_FIELDS', message: 'classId, fromDate, and toDate are required.' });
      return;
    }

    const classroom = await prisma.class.findUnique({ where: { id: classId } });
    if (!classroom || classroom.workspaceId !== user.workspaceId) {
      res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Classroom must belong to your workspace.' });
      return;
    }
    if (isTeacher && !isPrincipal) {
      const assigned = await prisma.classTeacher.findFirst({
        where: { classId: classroom.id, teacherId: user.id },
        select: { id: true },
      });
      if (!assigned) {
        res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Not assigned to this class.' });
        return;
      }
    }

    const fromTargetDate = new Date(new Date(fromDate).setHours(0, 0, 0, 0));
    const toTargetDate = new Date(new Date(toDate).setHours(0, 0, 0, 0));

    const previousRecords = await prisma.attendance.findMany({
      where: { classId, date: fromTargetDate },
      select: { studentId: true, status: true },
    });

    if (previousRecords.length === 0) {
      res.status(200).json({ success: true, message: 'No attendance found for the source date.', data: { copiedCount: 0 } });
      return;
    }

    const isWithin24Hours = Date.now() - toTargetDate.getTime() <= 24 * 60 * 60 * 1000;

    const ops = previousRecords.map((rec) =>
      prisma.attendance.upsert({
        where: { classId_studentId_date: { classId, studentId: rec.studentId, date: toTargetDate } },
        update: { status: rec.status, lastUpdatedBy: userId! },
        create: {
          classId,
          studentId: rec.studentId,
          date: toTargetDate,
          status: rec.status,
          markedByUserId: userId!,
          lastUpdatedBy: userId!,
          isLocked: !isWithin24Hours,
        },
      })
    );

    await prisma.$transaction(ops);
    await createSchoolLog(userId!, user.role, 'attendance_marked', classId);

    res.status(200).json({ success: true, message: 'Previous day attendance copied.', data: { copiedCount: previousRecords.length } });
  } catch (error: any) {
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message || 'Internal server error' });
  }
};

export const getAnnouncements = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
      return;
    }

    const announcements = await prisma.notification.findMany({
      where: { workspaceId: user.workspaceId, type: 'announcement' },
      select: { id: true, title: true, message: true, actionUrl: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, data: announcements });
  } catch (error: any) {
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message || 'Internal server error' });
  }
};

export const createAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
      return;
    }

    const isPrincipal = user.role.toLowerCase() === 'principal';
    if (!isPrincipal) {
      res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Only principal can publish announcements.' });
      return;
    }

    const title = (req.body?.title || '').trim();
    const message = (req.body?.message || '').trim();
    if (!title || !message) {
      res.status(400).json({ success: false, code: 'BAD_REQUEST', message: 'Title and message are required.' });
      return;
    }

    const announcement = await prisma.notification.create({
      data: {
        workspaceId: user.workspaceId,
        userId: user.id,
        type: 'announcement',
        title,
        message,
        actionUrl: user.name || 'School Principal',
      },
    });

    await createSchoolLog(user.id, user.role, 'announcement_created', announcement.id);

    res.status(201).json({ success: true, data: announcement });
  } catch (error: any) {
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message || 'Internal server error' });
  }
};

// -------------------------------------------------------------
// 5. ASSIGNMENTS
// -------------------------------------------------------------

export const createAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
      return;
    }

    // Role checks:
    if (user.role.toLowerCase() === 'principal') {
      res.status(403).json({
        success: false,
        code: 'PRINCIPAL_BLOCKED',
        message: 'Assignment creation is blocked for Principals.',
      });
      return;
    }

    const isTeacher = user.role.toLowerCase() === 'teacher';
    if (!isTeacher) {
      res.status(403).json({ success: false, code: 'ACCESS_DENIED', message: 'Only teachers can create assignments.' });
      return;
    }

    const { title, description, dueDate, classId, subject, marks, attachments } = req.body;
    if (!title || !description || !dueDate || !classId) {
      res.status(400).json({ success: false, code: 'MISSING_FIELDS', message: 'title, description, dueDate, and classId are required.' });
      return;
    }

    // Workspace check
    const classroom = await prisma.class.findUnique({ where: { id: classId } });
    if (!classroom || classroom.workspaceId !== user.workspaceId) {
      res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Classroom must reside in your workspace.' });
      return;
    }

    // A teacher may only create assignments for classes they are actually assigned to.
    const assigned = await prisma.classTeacher.findFirst({
      where: { classId, teacherId: user.id },
      select: { id: true },
    });
    if (!assigned) {
      res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Not assigned to this class.' });
      return;
    }

    const createdRole = 'teacher';

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        classId,
        createdByUserId: userId!,
        createdRole,
        subject: subject || undefined,
        marks: typeof marks === 'number' ? marks : undefined,
        attachments: Array.isArray(attachments) ? attachments : undefined,
        status: 'PUBLISHED',
      },
    });

    await createSchoolLog(userId!, user.role, 'assignment_created', assignment.id);

    res.status(201).json({ success: true, message: 'Assignment created successfully.', data: assignment });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: error.message || 'Internal server error',
    });
  }
};

export const getAssignments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
      return;
    }

    const isPrincipal = user.role.toLowerCase() === 'principal';
    const isTeacher = user.role.toLowerCase() === 'teacher';
    if (!isPrincipal && !isTeacher) {
      res.status(403).json({ success: false, code: 'ACCESS_DENIED', message: 'Only teachers and principals can view assignments.' });
      return;
    }

    let classIdFilter: { in: string[] } | undefined;
    if (isTeacher && !isPrincipal) {
      const teacherLinks = await prisma.classTeacher.findMany({
        where: { teacherId: user.id, Class: { workspaceId: user.workspaceId } },
        select: { classId: true },
      });
      classIdFilter = { in: teacherLinks.map((t) => t.classId) };
    }

    const requestedClassId = req.query.classId as string | undefined;

    const assignments = await prisma.assignment.findMany({
      where: {
        Class: { workspaceId: user.workspaceId },
        ...(classIdFilter ? { classId: classIdFilter } : {}),
        ...(requestedClassId ? { classId: requestedClassId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        Class: {
          select: { id: true, name: true },
        },
        Creator: {
          select: { id: true, name: true, role: true },
        },
        feedbacks: {
          include: {
            Creator: {
              select: { id: true, name: true, role: true },
            },
          },
        },
        submissions: {
          select: { id: true, status: true, marksObtained: true },
        },
      },
    });

    const data = assignments.map((a) => {
      const total = a.submissions.length;
      const reviewed = a.submissions.filter((s) => s.status === 'reviewed').length;
      return { ...a, submissionCount: total, reviewedCount: reviewed, pendingReviewCount: total - reviewed };
    });

    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: error.message || 'Internal server error',
    });
  }
};

export const addFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
      return;
    }

    // Role check: Principal only
    if (user.role.toLowerCase() !== 'principal') {
      res.status(403).json({
        success: false,
        code: 'PRINCIPAL_ONLY',
        message: 'Feedback comments can only be added by a Principal.',
      });
      return;
    }

    const assignmentId = req.params.id as string;
    const { comment } = req.body;
    if (!comment || comment.trim() === '') {
      res.status(400).json({ success: false, code: 'MISSING_COMMENT', message: 'Feedback comment is required.' });
      return;
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Assignment not found.' });
      return;
    }

    const classroom = await prisma.class.findUnique({
      where: { id: assignment.classId },
    });

    if (!classroom || classroom.workspaceId !== user.workspaceId) {
      res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Assignment belongs outside your workspace.' });
      return;
    }

    const feedback = await prisma.assignmentFeedback.create({
      data: {
        assignmentId,
        comment,
        createdByUserId: userId!,
      },
    });

    await createSchoolLog(userId!, user.role, 'feedback_added', feedback.id);

    res.status(201).json({ success: true, message: 'Feedback logged successfully.', data: feedback });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: error.message || 'Internal server error',
    });
  }
};

const assertAssignmentOwnership = async (assignmentId: string, user: { id: string; workspaceId: string | null; role: string }) => {
  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) return { assignment: null, error: { status: 404, code: 'NOT_FOUND', message: 'Assignment not found.' } };

  const classroom = await prisma.class.findUnique({ where: { id: assignment.classId } });
  if (!classroom || classroom.workspaceId !== user.workspaceId) {
    return { assignment: null, error: { status: 403, code: 'FORBIDDEN', message: 'Assignment belongs outside your workspace.' } };
  }

  const isPrincipal = user.role.toLowerCase() === 'principal';
  if (!isPrincipal) {
    const assigned = await prisma.classTeacher.findFirst({
      where: { classId: assignment.classId, teacherId: user.id },
      select: { id: true },
    });
    if (!assigned) {
      return { assignment: null, error: { status: 403, code: 'FORBIDDEN', message: 'Not assigned to this class.' } };
    }
  }

  return { assignment, error: null };
};

export const updateAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
      return;
    }

    const assignmentId = req.params.id as string;
    const { assignment, error } = await assertAssignmentOwnership(assignmentId, user);
    if (error) {
      res.status(error.status).json({ success: false, code: error.code, message: error.message });
      return;
    }

    const { title, description, dueDate, subject, marks, status } = req.body;
    const updated = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(dueDate !== undefined ? { dueDate: new Date(dueDate) } : {}),
        ...(subject !== undefined ? { subject } : {}),
        ...(typeof marks === 'number' ? { marks } : {}),
        ...(status !== undefined ? { status } : {}),
      },
    });

    await createSchoolLog(userId!, user.role, 'assignment_updated', updated.id);

    res.status(200).json({ success: true, message: 'Assignment updated successfully.', data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message || 'Internal server error' });
  }
};

export const deleteAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
      return;
    }

    const assignmentId = req.params.id as string;
    const { error } = await assertAssignmentOwnership(assignmentId, user);
    if (error) {
      res.status(error.status).json({ success: false, code: error.code, message: error.message });
      return;
    }

    await prisma.assignment.delete({ where: { id: assignmentId } });
    await createSchoolLog(userId!, user.role, 'assignment_deleted', assignmentId);

    res.status(200).json({ success: true, message: 'Assignment deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message || 'Internal server error' });
  }
};

export const getAssignmentSubmissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
      return;
    }

    const assignmentId = req.params.id as string;
    const { assignment, error } = await assertAssignmentOwnership(assignmentId, user);
    if (error) {
      res.status(error.status).json({ success: false, code: error.code, message: error.message });
      return;
    }

    const [roster, submissions] = await Promise.all([
      prisma.classStudent.findMany({
        where: { classId: assignment!.classId },
        select: { Student: { select: { id: true, name: true, email: true } } },
      }),
      prisma.assignmentSubmission.findMany({
        where: { assignmentId },
        include: { Student: { select: { id: true, name: true, email: true } } },
      }),
    ]);

    const bySubmission = new Map(submissions.map((s) => [s.studentId, s]));
    const now = new Date();
    const rows = roster
      .filter((r) => r.Student)
      .map((r) => {
        const sub = bySubmission.get(r.Student!.id);
        return {
          studentId: r.Student!.id,
          name: r.Student!.name,
          email: r.Student!.email,
          submission: sub || null,
          isMissing: !sub && assignment!.dueDate < now,
        };
      });

    res.status(200).json({ success: true, data: { assignment, submissions: rows } });
  } catch (error: any) {
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message || 'Internal server error' });
  }
};

export const gradeSubmission = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
      return;
    }

    const submissionId = req.params.id as string;
    const submission = await prisma.assignmentSubmission.findUnique({ where: { id: submissionId } });
    if (!submission) {
      res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Submission not found.' });
      return;
    }

    const { error } = await assertAssignmentOwnership(submission.assignmentId, user);
    if (error) {
      res.status(error.status).json({ success: false, code: error.code, message: error.message });
      return;
    }

    const { marksObtained, feedbackComment } = req.body;
    if (marksObtained !== undefined && (typeof marksObtained !== 'number' || marksObtained < 0)) {
      res.status(400).json({ success: false, code: 'BAD_REQUEST', message: 'marksObtained must be a non-negative number.' });
      return;
    }

    const updated = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        ...(marksObtained !== undefined ? { marksObtained } : {}),
        ...(feedbackComment !== undefined ? { feedbackComment } : {}),
        status: 'reviewed',
        reviewedByUserId: userId!,
        reviewedAt: new Date(),
      },
    });

    await createSchoolLog(userId!, user.role, 'submission_reviewed', updated.id);

    res.status(200).json({ success: true, message: 'Submission graded successfully.', data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message || 'Internal server error' });
  }
};

// -------------------------------------------------------------
// RUBRIC-BASED GRADING
// -------------------------------------------------------------

export const upsertRubric = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
      return;
    }

    const assignmentId = req.params.id as string;
    const { error } = await assertAssignmentOwnership(assignmentId, user);
    if (error) {
      res.status(error.status).json({ success: false, code: error.code, message: error.message });
      return;
    }

    const { title, criteria } = req.body as { title?: string; criteria?: { title: string; maxPoints: number }[] };
    if (!title || !Array.isArray(criteria) || criteria.length === 0) {
      res.status(400).json({ success: false, code: 'BAD_REQUEST', message: 'title and a non-empty criteria array are required.' });
      return;
    }
    for (const c of criteria) {
      if (!c.title || typeof c.maxPoints !== 'number' || c.maxPoints <= 0) {
        res.status(400).json({ success: false, code: 'BAD_REQUEST', message: 'Each criterion needs a title and a positive maxPoints.' });
        return;
      }
    }

    // Replace-on-write: simplest correct model for a rubric that hasn't been scored yet.
    // (Rescoring after criteria change is a known limitation — out of scope for this pass.)
    await prisma.rubric.deleteMany({ where: { assignmentId } });
    const rubric = await prisma.rubric.create({
      data: {
        assignmentId,
        title,
        createdByUserId: userId!,
        criteria: { create: criteria.map((c, i) => ({ title: c.title, maxPoints: c.maxPoints, order: i })) },
      },
      include: { criteria: true },
    });

    res.status(201).json({ success: true, data: rubric });
  } catch (error: any) {
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message || 'Internal server error' });
  }
};

export const getRubric = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
      return;
    }

    const assignmentId = req.params.id as string;
    const { error } = await assertAssignmentOwnership(assignmentId, user);
    if (error) {
      res.status(error.status).json({ success: false, code: error.code, message: error.message });
      return;
    }

    const rubric = await prisma.rubric.findUnique({
      where: { assignmentId },
      include: { criteria: { orderBy: { order: 'asc' } } },
    });

    res.json({ success: true, data: rubric });
  } catch (error: any) {
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message || 'Internal server error' });
  }
};

export const scoreSubmissionRubric = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
      return;
    }

    const submissionId = req.params.id as string;
    const submission = await prisma.assignmentSubmission.findUnique({ where: { id: submissionId } });
    if (!submission) {
      res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Submission not found.' });
      return;
    }

    const { error } = await assertAssignmentOwnership(submission.assignmentId, user);
    if (error) {
      res.status(error.status).json({ success: false, code: error.code, message: error.message });
      return;
    }

    const rubric = await prisma.rubric.findUnique({ where: { assignmentId: submission.assignmentId }, include: { criteria: true } });
    if (!rubric) {
      res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'No rubric exists for this assignment.' });
      return;
    }

    const { scores } = req.body as { scores?: { criterionId: string; points: number; comment?: string }[] };
    if (!Array.isArray(scores) || scores.length === 0) {
      res.status(400).json({ success: false, code: 'BAD_REQUEST', message: 'scores must be a non-empty array.' });
      return;
    }

    const criterionMap = new Map(rubric.criteria.map((c) => [c.id, c]));
    for (const s of scores) {
      const criterion = criterionMap.get(s.criterionId);
      if (!criterion) {
        res.status(400).json({ success: false, code: 'BAD_REQUEST', message: `Unknown criterionId: ${s.criterionId}` });
        return;
      }
      if (typeof s.points !== 'number' || s.points < 0 || s.points > criterion.maxPoints) {
        res.status(400).json({ success: false, code: 'BAD_REQUEST', message: `points for "${criterion.title}" must be between 0 and ${criterion.maxPoints}.` });
        return;
      }
    }

    await prisma.$transaction(
      scores.map((s) =>
        prisma.rubricScore.upsert({
          where: { submissionId_criterionId: { submissionId, criterionId: s.criterionId } },
          update: { points: s.points, comment: s.comment || undefined },
          create: { submissionId, criterionId: s.criterionId, points: s.points, comment: s.comment || undefined },
        })
      )
    );

    const allScores = await prisma.rubricScore.findMany({ where: { submissionId } });
    const totalPoints = allScores.reduce((sum, s) => sum + s.points, 0);

    const updated = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: { marksObtained: Math.round(totalPoints), status: 'reviewed', reviewedByUserId: userId!, reviewedAt: new Date() },
    });

    await createSchoolLog(userId!, user.role, 'submission_reviewed', updated.id);

    res.json({ success: true, data: { submission: updated, scores: allScores } });
  } catch (error: any) {
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message || 'Internal server error' });
  }
};

// -------------------------------------------------------------
// PLAGIARISM STATUS (manual — no vendor wired up yet)
// -------------------------------------------------------------

const PLAGIARISM_STATUSES = ['not_checked', 'pending', 'checked', 'flagged'];

export const setPlagiarismStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
      return;
    }

    const submissionId = req.params.id as string;
    const submission = await prisma.assignmentSubmission.findUnique({ where: { id: submissionId } });
    if (!submission) {
      res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Submission not found.' });
      return;
    }

    const { error } = await assertAssignmentOwnership(submission.assignmentId, user);
    if (error) {
      res.status(error.status).json({ success: false, code: error.code, message: error.message });
      return;
    }

    const { plagiarismStatus, plagiarismScore, plagiarismReportUrl } = req.body;
    if (!PLAGIARISM_STATUSES.includes(plagiarismStatus)) {
      res.status(400).json({ success: false, code: 'BAD_REQUEST', message: `plagiarismStatus must be one of: ${PLAGIARISM_STATUSES.join(', ')}` });
      return;
    }

    const updated = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        plagiarismStatus,
        plagiarismScore: typeof plagiarismScore === 'number' ? plagiarismScore : undefined,
        plagiarismReportUrl: plagiarismReportUrl || undefined,
        plagiarismCheckedAt: new Date(),
      },
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message || 'Internal server error' });
  }
};

// -------------------------------------------------------------
// 6. SCHOOL AUDIT LOGS
// -------------------------------------------------------------

export const getSchoolLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
      return;
    }
    if (user.role.toLowerCase() !== 'principal') {
      res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Only the principal can view workspace audit logs.' });
      return;
    }

    const logs = await prisma.schoolLog.findMany({
      where: {
        User: {
          workspaceId: user.workspaceId,
        },
      },
      orderBy: { timestamp: 'desc' },
      include: {
        User: {
          select: { id: true, name: true, role: true, email: true },
        },
      },
    });

    res.status(200).json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: error.message || 'Internal server error',
    });
  }
};

export const getSchoolProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ success: false, code: 'USER_NOT_FOUND', message: 'User not found' });
      return;
    }

    const workspace = user.workspaceId ? await prisma.workspace.findUnique({ where: { id: user.workspaceId } }) : null;

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mode: user.role.toLowerCase() === 'principal' ? 'principal' : (user.mode || 'teacher'),
        isActive: user.isActive,
        workspaceId: user.workspaceId,
        workspaceName: workspace?.name || 'Unassigned Workspace',
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: error.message || 'Internal server error',
    });
  }
};

// -------------------------------------------------------------
// 7. TEACHER/PRINCIPAL SETTINGS
// -------------------------------------------------------------

export const changeSchoolPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, code: 'MISSING_FIELDS', message: 'currentPassword and newPassword are required.' });
      return;
    }
    const data = await profileService.changePassword(userId, currentPassword, newPassword);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const DEFAULT_NOTIFICATION_PREFS = {
  emailAssignmentSubmitted: true,
  emailExamCompleted: true,
  emailAnnouncements: true,
  emailMessages: true,
  inAppNotifications: true,
};

// "HH:mm" strings compare correctly lexicographically; two ranges overlap unless
// one ends at/before the other starts.
const rangesOverlap = (aStart: string, aEnd: string, bStart: string, bEnd: string): boolean =>
  aStart < bEnd && bStart < aEnd;

type TimetableConflict = { resource: 'teacher' | 'room'; slot: { id: string; classId: string; startTime: string; endTime: string } };

async function findTimetableConflict(params: {
  workspaceId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  teacherId?: string | null;
  room?: string | null;
  excludeSlotId?: string;
}): Promise<TimetableConflict | null> {
  const { workspaceId, dayOfWeek, startTime, endTime, teacherId, room, excludeSlotId } = params;

  if (teacherId) {
    const teacherSlots = await prisma.timetableSlot.findMany({
      where: { workspaceId, dayOfWeek, teacherId, ...(excludeSlotId ? { id: { not: excludeSlotId } } : {}) },
      select: { id: true, classId: true, startTime: true, endTime: true },
    });
    const clash = teacherSlots.find((s) => rangesOverlap(startTime, endTime, s.startTime, s.endTime));
    if (clash) return { resource: 'teacher', slot: clash };
  }

  if (room && room.trim()) {
    const roomSlots = await prisma.timetableSlot.findMany({
      where: { workspaceId, dayOfWeek, room: room.trim(), ...(excludeSlotId ? { id: { not: excludeSlotId } } : {}) },
      select: { id: true, classId: true, startTime: true, endTime: true },
    });
    const clash = roomSlots.find((s) => rangesOverlap(startTime, endTime, s.startTime, s.endTime));
    if (clash) return { resource: 'room', slot: clash };
  }

  return null;
}

export const createTimetableSlot = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
      return;
    }

    const isPrincipal = user.role.toLowerCase() === 'principal';
    const isTeacher = user.role.toLowerCase() === 'teacher';
    if (!isPrincipal && !isTeacher) {
      res.status(403).json({ success: false, code: 'ACCESS_DENIED', message: 'Only teachers and principals can manage the timetable.' });
      return;
    }

    const { classId, subjectId, teacherId, dayOfWeek, startTime, endTime, room, meetingUrl } = req.body;
    if (!classId || dayOfWeek === undefined || !startTime || !endTime) {
      res.status(400).json({ success: false, code: 'MISSING_FIELDS', message: 'classId, dayOfWeek, startTime, and endTime are required.' });
      return;
    }

    const classroom = await prisma.class.findUnique({ where: { id: classId } });
    if (!classroom || classroom.workspaceId !== user.workspaceId) {
      res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Classroom must belong to your workspace.' });
      return;
    }

    if (isTeacher && !isPrincipal) {
      const assigned = await prisma.classTeacher.findFirst({ where: { classId, teacherId: user.id }, select: { id: true } });
      if (!assigned) {
        res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Not assigned to this class.' });
        return;
      }
    }

    const resolvedTeacherId = teacherId || (isTeacher ? user.id : null);

    const conflict = await findTimetableConflict({
      workspaceId: user.workspaceId,
      dayOfWeek: Number(dayOfWeek),
      startTime,
      endTime,
      teacherId: resolvedTeacherId,
      room,
    });
    if (conflict) {
      res.status(409).json({
        success: false,
        code: 'CONFLICT',
        message: conflict.resource === 'teacher'
          ? 'This teacher is already scheduled for an overlapping slot at this time.'
          : 'This room is already booked for an overlapping slot at this time.',
        data: conflict,
      });
      return;
    }

    const slot = await prisma.timetableSlot.create({
      data: {
        workspaceId: user.workspaceId,
        classId,
        subjectId: subjectId || null,
        teacherId: resolvedTeacherId,
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
        room: room || null,
        meetingUrl: meetingUrl || null,
        createdByUserId: user.id,
      },
    });

    res.status(201).json({ success: true, data: slot });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ success: false, code: 'CONFLICT', message: 'A slot already exists for this class at this time.' });
      return;
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTimetableSlot = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
      return;
    }

    const isPrincipal = user.role.toLowerCase() === 'principal';
    const isTeacher = user.role.toLowerCase() === 'teacher';
    if (!isPrincipal && !isTeacher) {
      res.status(403).json({ success: false, code: 'ACCESS_DENIED', message: 'Only teachers and principals can manage the timetable.' });
      return;
    }

    const existing = await prisma.timetableSlot.findUnique({ where: { id: req.params.id as string } });
    if (!existing || existing.workspaceId !== user.workspaceId) {
      res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Timetable slot not found.' });
      return;
    }

    if (isTeacher && !isPrincipal) {
      const assigned = await prisma.classTeacher.findFirst({ where: { classId: existing.classId, teacherId: user.id }, select: { id: true } });
      if (!assigned) {
        res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Not assigned to this class.' });
        return;
      }
    }

    const { classId, subjectId, teacherId, dayOfWeek, startTime, endTime, room, meetingUrl } = req.body;

    let nextClassId = existing.classId;
    if (classId && classId !== existing.classId) {
      const classroom = await prisma.class.findUnique({ where: { id: classId } });
      if (!classroom || classroom.workspaceId !== user.workspaceId) {
        res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Classroom must belong to your workspace.' });
        return;
      }
      nextClassId = classId;
    }

    const nextDayOfWeek = dayOfWeek !== undefined ? Number(dayOfWeek) : existing.dayOfWeek;
    const nextStartTime = startTime || existing.startTime;
    const nextEndTime = endTime || existing.endTime;
    const nextTeacherId = teacherId !== undefined ? (teacherId || null) : existing.teacherId;
    const nextRoom = room !== undefined ? (room || null) : existing.room;

    const conflict = await findTimetableConflict({
      workspaceId: user.workspaceId,
      dayOfWeek: nextDayOfWeek,
      startTime: nextStartTime,
      endTime: nextEndTime,
      teacherId: nextTeacherId,
      room: nextRoom,
      excludeSlotId: existing.id,
    });
    if (conflict) {
      res.status(409).json({
        success: false,
        code: 'CONFLICT',
        message: conflict.resource === 'teacher'
          ? 'This teacher is already scheduled for an overlapping slot at this time.'
          : 'This room is already booked for an overlapping slot at this time.',
        data: conflict,
      });
      return;
    }

    const slot = await prisma.timetableSlot.update({
      where: { id: existing.id },
      data: {
        classId: nextClassId,
        subjectId: subjectId !== undefined ? (subjectId || null) : existing.subjectId,
        teacherId: nextTeacherId,
        dayOfWeek: nextDayOfWeek,
        startTime: nextStartTime,
        endTime: nextEndTime,
        room: nextRoom,
        meetingUrl: meetingUrl !== undefined ? (meetingUrl || null) : existing.meetingUrl,
      },
    });

    res.json({ success: true, data: slot });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ success: false, code: 'CONFLICT', message: 'A slot already exists for this class at this time.' });
      return;
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getClassTimetable = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
      return;
    }

    const classId = req.params.id as string;
    const classroom = await prisma.class.findUnique({ where: { id: classId } });
    if (!classroom || classroom.workspaceId !== user.workspaceId) {
      res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Classroom must belong to your workspace.' });
      return;
    }

    const slots = await prisma.timetableSlot.findMany({
      where: { classId },
      include: { Subject: { select: { id: true, name: true } }, Teacher: { select: { id: true, name: true } } },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    res.json({ success: true, data: slots });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTimetableSlot = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
      return;
    }

    const isPrincipal = user.role.toLowerCase() === 'principal';
    const isTeacher = user.role.toLowerCase() === 'teacher';
    if (!isPrincipal && !isTeacher) {
      res.status(403).json({ success: false, code: 'ACCESS_DENIED', message: 'Only teachers and principals can manage the timetable.' });
      return;
    }

    const slot = await prisma.timetableSlot.findUnique({ where: { id: req.params.id as string } });
    if (!slot || slot.workspaceId !== user.workspaceId) {
      res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Timetable slot not found.' });
      return;
    }

    await prisma.timetableSlot.delete({ where: { id: slot.id } });
    res.json({ success: true, data: { id: slot.id } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSchoolNotificationSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { notificationPrefs: true } });
    res.json({ success: true, data: { ...DEFAULT_NOTIFICATION_PREFS, ...(user?.notificationPrefs as object || {}) } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSchoolNotificationSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { notificationPrefs: true } });
    const merged = { ...DEFAULT_NOTIFICATION_PREFS, ...(user?.notificationPrefs as object || {}), ...req.body };
    const updated = await prisma.user.update({ where: { id: userId }, data: { notificationPrefs: merged } });
    res.json({ success: true, data: updated.notificationPrefs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------------------------
// PRINCIPAL WORKSPACE SETTINGS
// -------------------------------------------------------------

export const deleteClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role.toLowerCase() !== 'principal') {
      res.status(403).json({ success: false, code: 'ACCESS_DENIED', message: 'Only the Principal can archive classrooms.' });
      return;
    }

    const classId = req.params.id as string;
    const classroom = await prisma.class.findFirst({ where: { id: classId, workspaceId: user.workspaceId! } });
    if (!classroom) {
      res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Class not found.' });
      return;
    }

    await prisma.class.delete({ where: { id: classId } });
    await createSchoolLog(userId!, user.role, 'class_deleted', classId);

    res.json({ success: true, data: { id: classId } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateWorkspaceProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role.toLowerCase() !== 'principal') {
      res.status(403).json({ success: false, code: 'ACCESS_DENIED', message: 'Only the Principal can update workspace settings.' });
      return;
    }

    const { workspaceName, institutionType, address, contactNumber, contactEmail, academicYear, term, semester } = req.body;
    const name = (workspaceName || '').trim();
    if (!name) {
      res.status(400).json({ success: false, code: 'BAD_REQUEST', message: 'workspaceName is required.' });
      return;
    }

    const updated = await prisma.workspace.update({
      where: { id: user.workspaceId! },
      data: {
        name,
        ...(institutionType !== undefined ? { institutionType } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(contactNumber !== undefined ? { contactNumber } : {}),
        ...(contactEmail !== undefined ? { contactEmail } : {}),
        ...(academicYear !== undefined ? { academicYear } : {}),
        ...(term !== undefined ? { term } : {}),
        ...(semester !== undefined ? { semester } : {}),
      },
    });
    await createSchoolLog(userId!, user.role, 'workspace_updated', user.workspaceId!);

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPrincipalSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role.toLowerCase() !== 'principal') {
      res.status(403).json({ success: false, code: 'ACCESS_DENIED', message: 'Only the Principal can view workspace settings.' });
      return;
    }
    if (!user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Principal has no workspace assignment.' });
      return;
    }

    const filterUser = (req.query.userId as string) || '';
    const filterAction = (req.query.actionType as string) || '';

    const workspace = await prisma.workspace.findUnique({
      where: { id: user.workspaceId },
      select: {
        id: true,
        name: true,
        institutionType: true,
        address: true,
        contactNumber: true,
        contactEmail: true,
        academicYear: true,
        term: true,
        semester: true,
      },
    });

    const classes = await prisma.class.findMany({
      where: { workspaceId: user.workspaceId },
      include: {
        students: { select: { id: true } },
        teachers: { select: { id: true } },
        Department: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
    const classData = classes.map((c) => ({
      id: c.id,
      name: c.name,
      studentCount: c.students.length,
      teacherCount: c.teachers.length,
      department: c.Department ? { id: c.Department.id, name: c.Department.name } : null,
      status: 'Active',
    }));

    const subjects = await prisma.subject.findMany({ where: { workspaceId: user.workspaceId }, orderBy: { name: 'asc' } });
    const finalSubjects = subjects.map((s) => ({ id: s.id, name: s.name, status: 'Active' }));

    const logsWhere: any = { User: { workspaceId: user.workspaceId } };
    if (filterUser) logsWhere.userId = filterUser;
    if (filterAction) logsWhere.actionType = filterAction;

    const logs = await prisma.schoolLog.findMany({
      where: logsWhere,
      include: { User: { select: { name: true, email: true } } },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    const logData = logs.map((l) => {
      let module = 'General';
      if (l.actionType.includes('teacher')) module = 'Teachers';
      else if (l.actionType.includes('student')) module = 'Students';
      else if (l.actionType.includes('attendance')) module = 'Attendance';
      else if (l.actionType.includes('assignment')) module = 'Assignments';
      else if (l.actionType.includes('announcement')) module = 'Announcements';
      else if (l.actionType.includes('marks')) module = 'Evaluations';

      let actionText = l.actionType.replace(/_/g, ' ');
      actionText = actionText.charAt(0).toUpperCase() + actionText.slice(1);

      return { id: l.id, action: actionText, user: l.User.name, email: l.User.email, date: l.timestamp, module };
    });

    res.json({
      success: true,
      data: {
        workspace: workspace ? { ...workspace, name: workspace.name || 'Workspace' } : { id: user.workspaceId, name: 'Workspace' },
        academicSettings: {
          academicYear: workspace?.academicYear || null,
          term: workspace?.term || null,
          semester: workspace?.semester || null,
        },
        classes: classData,
        subjects: finalSubjects,
        auditLogs: logData,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
