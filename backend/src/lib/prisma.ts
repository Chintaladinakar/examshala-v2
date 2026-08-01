import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma';
import { getCurrentWorkspaceId } from './tenantContext';

// pg defaults to a pool size of 10 with no cap otherwise coming from DATABASE_URL. That's fine
// for one instance, but at N horizontally-scaled backend instances it's N*10 connections
// against a single Postgres/Neon database with a hard per-plan connection ceiling — sizing it
// explicitly here (and keeping it modest) means "how many connections does this app use" is a
// reviewable constant instead of an emergent property of however many instances happen to be
// running. Tune DB_POOL_MAX alongside Neon's pooled (`-pooler`) endpoint / PgBouncer.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DB_POOL_MAX) || 10,
  idleTimeoutMillis: 30_000,
});

const adapter = new PrismaPg(pool);

const basePrisma = new PrismaClient({ adapter });

// Models that carry a direct `workspaceId` column. List/bulk operations (findMany, count,
// updateMany, deleteMany) against these models get an automatic `workspaceId` filter injected
// from the current request's tenant context (lib/tenantContext.ts) whenever the caller didn't
// already specify one — a defense-in-depth backstop for the "one missed check away" risk of
// hand-rolling the workspace check in every controller, on top of (not instead of) those
// explicit checks. findUnique/findFirst/update/delete are deliberately left untouched: they're
// `where: { id }`-shaped single-row lookups where Prisma's unique-where validation makes blind
// filter injection fragile, and every call site in this codebase already re-verifies
// workspaceId on the row it fetched.
const TENANT_SCOPED_MODELS = new Set([
  'Exam', 'Class', 'Department', 'Subject', 'Question', 'Material', 'LeaveRequest', 'Result',
  'TimetableSlot', 'UploadedFile', 'CalendarEvent', 'Conversation', 'Notification', 'Invite',
  'AssessmentAssignment',
]);

function withTenantFilter(model: string, where: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!TENANT_SCOPED_MODELS.has(model)) return where;
  const workspaceId = getCurrentWorkspaceId();
  // No request-scoped workspace (background jobs, scripts, or a platform admin with no home
  // workspace) — nothing to constrain by, leave the query as the caller wrote it.
  if (!workspaceId) return where;
  // Caller already scoped this explicitly (including cross-workspace admin queries using
  // `workspaceId: { in: [...] }`) — don't override it.
  if (where && 'workspaceId' in where) return where;
  return { ...(where || {}), workspaceId };
}

const prisma = basePrisma.$extends({
  name: 'tenant-scoping',
  query: {
    $allModels: {
      async findMany({ model, args, query }) {
        args.where = withTenantFilter(model, args.where as any);
        return query(args);
      },
      async count({ model, args, query }) {
        args.where = withTenantFilter(model, args.where as any);
        return query(args);
      },
      async updateMany({ model, args, query }) {
        args.where = withTenantFilter(model, args.where as any);
        return query(args);
      },
      async deleteMany({ model, args, query }) {
        args.where = withTenantFilter(model, args.where as any);
        return query(args);
      },
    },
  },
});

export default prisma;
