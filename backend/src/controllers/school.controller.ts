import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';

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

    const { name } = req.body;
    if (!name || name.trim() === '') {
      res.status(400).json({ success: false, code: 'MISSING_NAME', message: 'Classroom name is required.' });
      return;
    }

    const classroom = await prisma.class.create({
      data: {
        name,
        workspaceId,
      },
    });

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

    const classes = await prisma.class.findMany({
      where: { workspaceId: user.workspaceId },
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
    
    // Create Student
    const student = await prisma.user.create({
      data: {
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
        role: 'teacher',
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

    const targetDate = new Date(new Date(date).setHours(0, 0, 0, 0));

    // Batch create or update
    const attendanceOps = records.map(record => {
      return prisma.attendance.upsert({
        where: {
          classId_studentId_date: {
            classId,
            studentId: record.studentId,
            date: targetDate,
          },
        },
        update: {
          status: record.status,
          lastUpdatedBy: userId!,
        },
        create: {
          classId,
          studentId: record.studentId,
          date: targetDate,
          status: record.status,
          markedByUserId: userId!,
          lastUpdatedBy: userId!,
          isLocked: false,
        },
      });
    });

    await prisma.$transaction(attendanceOps);

    // Write audit log
    await createSchoolLog(userId!, user.role, 'attendance_marked', classId);

    res.status(200).json({ success: true, message: 'Attendance records logged successfully.' });
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

    // Check Lock System
    // Enforce 24 hours lock
    const hoursDiff = (Date.now() - new Date(attendance.date).getTime()) / (1000 * 60 * 60);
    const isLocked = attendance.isLocked || hoursDiff >= 24;

    if (isLocked && user.role.toLowerCase() !== 'principal') {
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
        status,
        lastUpdatedBy: userId!,
        isLocked: isLocked, // Ensure database isLocked flag matches if it was auto-triggered
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

    const classroom = await prisma.class.findUnique({ where: { id: classId } });
    if (!classroom || classroom.workspaceId !== user.workspaceId) {
      res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Classroom belongs outside your workspace.' });
      return;
    }

    const where: any = { classId };

    if (dateStr) {
      const targetDate = new Date(new Date(dateStr).setHours(0, 0, 0, 0));
      where.date = targetDate;
    }

    const attendances = await prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        Student: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(200).json({ success: true, data: attendances });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: error.message || 'Internal server error',
    });
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

    const { title, description, dueDate, classId } = req.body;
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

    const createdRole = 'teacher';

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        classId,
        createdByUserId: userId!,
        createdRole,
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

    const assignments = await prisma.assignment.findMany({
      where: {
        Class: {
          workspaceId: user.workspaceId,
        },
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
      },
    });

    res.status(200).json({ success: true, data: assignments });
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
