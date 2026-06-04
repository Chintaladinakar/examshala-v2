import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSchoolAuth } from '@/lib/school/authz';
import { jsonOk, jsonError, mapAuthzError } from '@/lib/school/http';

export async function GET() {
  try {
    const ctx = await requireSchoolAuth();

    // Find any workspaces created by or belonging to this user
    // Requests have status = 'PENDING' or 'REJECTED'
    const requests = await prisma.workspace.findMany({
      where: {
        createdBy: {
          startsWith: `JSON_REQ:{"requesterId":"${ctx.userId}"`,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const parsedRequests = requests.map((w: any) => {
      try {
        const jsonStr = w.createdBy.replace('JSON_REQ:', '');
        const meta = JSON.parse(jsonStr);
        return {
          id: w.id,
          name: w.name,
          status: w.status || 'PENDING',
          createdAt: w.createdAt,
          ...meta,
        };
      } catch {
        return {
          id: w.id,
          name: w.name,
          status: w.status || 'PENDING',
          createdAt: w.createdAt,
        };
      }
    });

    return jsonOk(parsedRequests);
  } catch (err) {
    return mapAuthzError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireSchoolAuth();

    const body = (await req.json()) as {
      name: string;
      institutionType: string;
      description?: string;
      contactName: string;
      phone: string;
      altPhone?: string;
      email: string;
      studentsCount: string;
      teachersCount: string;
      academicType: string;
      country: string;
      state: string;
      city: string;
      address: string;
      website?: string;
      socialLinks?: Record<string, string>;
    };

    const name = (body.name || '').trim();
    const contactName = (body.contactName || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const phone = (body.phone || '').trim();

    if (!name || !contactName || !email || !phone) {
      return jsonError('BAD_REQUEST', 'Institution Name, Contact Person, Phone, and Email are required.');
    }

    // 1. Prevent duplicate workspace names
    const existingActive = await prisma.workspace.findFirst({
      where: { name, status: 'ACTIVE' },
    });
    if (existingActive) {
      return jsonError('BAD_REQUEST', 'An active workspace with this institution name already exists.');
    }

    // 2. Prevent duplicate workspace requests (Limit maximum 1 pending request per user)
    const userRequests = await prisma.workspace.findMany({
      where: {
        createdBy: {
          startsWith: `JSON_REQ:{"requesterId":"${ctx.userId}"`,
        },
      },
    });

    const hasPending = userRequests.some((w: any) => w.status === 'PENDING');
    if (hasPending) {
      return jsonError('BAD_REQUEST', 'You already have a pending workspace request. Limit 1 pending request per user.');
    }

    // Serialize details inside createdBy to ensure 100% database compatibility
    const metaData = {
      requesterId: ctx.userId,
      requesterName: ctx.role, // role placeholder or user name
      institutionType: body.institutionType,
      description: body.description || '',
      contactName,
      phone,
      altPhone: body.altPhone || '',
      email,
      studentsCount: body.studentsCount,
      teachersCount: body.teachersCount,
      academicType: body.academicType,
      country: body.country,
      state: body.state,
      city: body.city,
      address: body.address,
      website: body.website || '',
      socialLinks: body.socialLinks || {},
      rejectionReason: '',
    };

    /**
     * Generates a unique, short, and brand-consistent 8-character Workspace ID.
     * The ID is prefixed with 'ES-' (EDUsphere) followed by 5 random uppercase letters/numbers.
     * Exposes a user-friendly mnemonic code (e.g. ES-6MCED) instead of long UUID database keys,
     * protecting DB schema privacy and making it extremely easy for users to type and share.
     */
    const generateWorkspaceId = async (): Promise<string> => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let attempts = 0;
      while (attempts < 50) {
        let code = 'ES-';
        for (let i = 0; i < 5; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const existing = await prisma.workspace.findUnique({ where: { id: code } });
        if (!existing) return code;
        attempts++;
      }
      return `ES-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    };
    const workspaceId = await generateWorkspaceId();

    const workspace = await prisma.workspace.create({
      data: {
        id: workspaceId,
        name,
        status: 'PENDING',
        createdBy: `JSON_REQ:${JSON.stringify(metaData)}`,
      },
    });

    // Add Audit Log
    await prisma.schoolLog.create({
      data: {
        actionType: 'workspace_request_submitted',
        entityId: workspace.id,
        role: ctx.role,
        userId: ctx.userId,
      },
    });

    // Add Notification Alert for Super Admins
    const superAdmins = await prisma.user.findMany({
      where: { role: 'superadmin' },
      select: { id: true },
    });

    if (superAdmins.length > 0) {
      await prisma.notification.createMany({
        data: superAdmins.map((admin: any) => ({
          userId: admin.id,
          type: 'workspace_request_submitted',
          title: 'New Workspace Request',
          message: `Institution "${name}" has requested access. Pending review.`,
          isRead: false,
        })),
        skipDuplicates: true,
      });
    }

    return jsonOk({
      id: workspace.id,
      name: workspace.name,
      status: workspace.status,
      createdAt: workspace.createdAt,
      ...metaData,
    }, { status: 201 });
  } catch (err) {
    return mapAuthzError(err);
  }
}
