import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';

export const getAssignments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const { subject, status, search, sortBy } = req.query;

    // 1. Fetch classes the student is in
    const studentClasses = await prisma.classStudent.findMany({
      where: { studentId },
      select: { classId: true },
    });
    const classIds = studentClasses.map(c => c.classId);

    // 2. Build the where clause
    const whereClause: any = {
      OR: [
        { classId: { in: classIds } },
        { studentId },
      ],
    };

    if (subject) {
      whereClause.subject = { equals: subject as string, mode: 'insensitive' };
    }

    if (search) {
      whereClause.title = { contains: search as string, mode: 'insensitive' };
    }

    // 3. Sorting options
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'dueDate') {
      orderBy = { dueDate: 'asc' };
    } else if (sortBy === 'subject') {
      orderBy = { subject: 'asc' };
    }

    // 4. Fetch assignments and their submissions
    const [assignments, total]: [any[], number] = await Promise.all([
      prisma.assignment.findMany({
        where: whereClause,
        include: {
          submissions: {
            where: { studentId },
          },
          Creator: {
            select: { name: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.assignment.count({ where: whereClause }),
    ]);

    // 5. Enhance status dynamically based on submissions and current time
    const enhancedAssignments = assignments.map(a => {
      const submission = a.submissions[0];
      const now = new Date();
      const isOverdue = now > new Date(a.dueDate);
      
      let computedStatus = 'Pending';
      if (submission) {
        if (a.marks !== null && a.marks !== undefined) {
          computedStatus = 'Graded';
        } else {
          computedStatus = new Date(submission.submittedAt) > new Date(a.dueDate) ? 'Late' : 'Submitted';
        }
      } else if (isOverdue) {
        computedStatus = 'Late'; // Overdue maps to Late status color
      }

      return {
        id: a.id,
        title: a.title,
        description: a.description,
        subject: a.subject || 'General',
        dueDate: a.dueDate,
        attachments: a.attachments,
        marks: a.marks,
        teacherName: a.Creator?.name || 'Teacher',
        status: computedStatus,
        submission: submission ? {
          id: submission.id,
          textSubmission: submission.textSubmission,
          uploadedFiles: submission.uploadedFiles,
          submittedAt: submission.submittedAt,
        } : null,
      };
    });

    // 6. Apply status filter in-memory to respect the dynamic status check
    let filteredAssignments = enhancedAssignments;
    if (status) {
      filteredAssignments = enhancedAssignments.filter(a => a.status.toLowerCase() === (status as string).toLowerCase());
    }

    res.json({
      success: true,
      data: filteredAssignments,
      pagination: {
        total: total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAssignmentDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.userId;
    const { id } = req.params;

    const assignment: any = await prisma.assignment.findUnique({
      where: { id: id as string },
      include: {
        submissions: {
          where: { studentId },
        },
        Creator: {
          select: { name: true },
        },
      },
    });

    if (!assignment) {
      res.status(404).json({ success: false, message: 'Assignment not found.' });
      return;
    }

    const submission = assignment.submissions[0];
    const now = new Date();
    const isOverdue = now > new Date(assignment.dueDate);
    
    let computedStatus = 'Pending';
    if (submission) {
      if (assignment.marks !== null && assignment.marks !== undefined) {
        computedStatus = 'Graded';
      } else {
        computedStatus = new Date(submission.submittedAt) > new Date(assignment.dueDate) ? 'Late' : 'Submitted';
      }
    } else if (isOverdue) {
      computedStatus = 'Late';
    }

    res.json({
      success: true,
      data: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        subject: assignment.subject || 'General',
        dueDate: assignment.dueDate,
        attachments: assignment.attachments,
        marks: assignment.marks,
        teacherName: assignment.Creator?.name || 'Teacher',
        status: computedStatus,
        submission: submission ? {
          id: submission.id,
          textSubmission: submission.textSubmission,
          uploadedFiles: submission.uploadedFiles,
          submittedAt: submission.submittedAt,
        } : null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.userId;

    const studentClasses: any[] = await prisma.classStudent.findMany({
      where: { studentId },
      select: { classId: true },
    });
    const classIds = studentClasses.map(c => c.classId);

    const assignments: any[] = await prisma.assignment.findMany({
      where: {
        OR: [
          { classId: { in: classIds } },
          { studentId },
        ],
      },
      include: {
        submissions: {
          where: { studentId },
        },
      },
    });

    const now = new Date();
    let pending = 0;
    let submitted = 0;
    let overdue = 0;
    let upcoming = 0;

    assignments.forEach(a => {
      const isSub = a.submissions.length > 0;
      const isPast = now > new Date(a.dueDate);
      const isWithinWeek = !isPast && (new Date(a.dueDate).getTime() - now.getTime()) <= 7 * 24 * 60 * 60 * 1000;

      if (isSub) {
        submitted++;
      } else if (isPast) {
        overdue++;
      } else {
        pending++;
        if (isWithinWeek) {
          upcoming++;
        }
      }
    });

    res.json({
      success: true,
      data: {
        pending,
        submitted,
        overdue,
        upcoming,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.userId;
    const { assignmentId, textSubmission, uploadedFiles } = req.body;

    if (!assignmentId) {
      res.status(400).json({ success: false, message: 'assignmentId is required.' });
      return;
    }

    const assignment: any = await prisma.assignment.findUnique({
      where: { id: assignmentId as string },
    });

    if (!assignment) {
      res.status(404).json({ success: false, message: 'Assignment not found.' });
      return;
    }

    // Prevent submission after deadline
    if (new Date() > new Date(assignment.dueDate)) {
      res.status(400).json({ success: false, message: 'Cannot submit after the deadline.' });
      return;
    }

    // Check if submission already exists
    const existing: any = await prisma.assignmentSubmission.findFirst({
      where: { assignmentId: assignmentId as string, studentId },
    });

    if (existing) {
      res.status(400).json({ success: false, message: 'Assignment already submitted. Use PUT to edit submission.' });
      return;
    }

    const submission = await prisma.assignmentSubmission.create({
      data: {
        assignmentId,
        studentId,
        textSubmission,
        uploadedFiles: uploadedFiles || [],
        fileUrl: uploadedFiles?.[0] || '',
      },
    });

    res.status(201).json({ success: true, data: submission });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const editSubmission = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.userId;
    const { id } = req.params; // Submission ID
    const { textSubmission, uploadedFiles } = req.body;

    const submission: any = await prisma.assignmentSubmission.findUnique({
      where: { id: id as string },
      include: { Assignment: true },
    });

    if (!submission) {
      res.status(404).json({ success: false, message: 'Submission not found.' });
      return;
    }

    if (submission.studentId !== studentId) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    // Prevent edit after deadline
    if (new Date() > new Date(submission.Assignment.dueDate)) {
      res.status(400).json({ success: false, message: 'Cannot edit submission after the deadline.' });
      return;
    }

    const updated: any = await prisma.assignmentSubmission.update({
      where: { id: id as string },
      data: {
        textSubmission,
        uploadedFiles: uploadedFiles || [],
        fileUrl: uploadedFiles?.[0] || submission.fileUrl,
      },
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
