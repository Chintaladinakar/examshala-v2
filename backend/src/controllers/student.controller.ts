import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as dashboardService from '../services/studentDashboard.service';
import * as assignmentService from '../services/assignment.service';
import * as parentLinkService from '../services/parentLink.service';

export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const workspaceIdContext = req.headers['x-workspace-id'] as string | undefined;

    const data = await dashboardService.getDashboardAggregatedData(studentId, workspaceIdContext);
    
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const { assignmentId } = req.params;

    const data = await assignmentService.getAssignmentDetails(studentId, assignmentId as string);
    
    res.json({ success: true, data });
  } catch (error: any) {
    if (error.message.includes('Access denied')) {
      return res.status(403).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const requestParentLink = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const { email, relation } = req.body;

    if (!email || !relation) {
      return res.status(400).json({ success: false, message: 'Email and relation are required' });
    }

    const data = await parentLinkService.requestParentLink(studentId, email, relation);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getParents = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const data = await parentLinkService.getStudentParents(studentId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeParentLink = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const { linkId } = req.body;
    
    if (!linkId) {
      return res.status(400).json({ success: false, message: 'linkId is required' });
    }

    const data = await parentLinkService.requestLinkRemoval(studentId, linkId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
