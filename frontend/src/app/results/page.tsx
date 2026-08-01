import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import ResultsView from "@/components/ResultsView";
import DashboardSidebar from "@/components/DashboardSidebar";
import { decodeJwtPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ResultsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  
  if (!token) {
    redirect("/signin");
  }

  const decoded = decodeJwtPayload(token);
  const role = typeof decoded?.role === 'string' ? decoded.role.toLowerCase() : 'student';
  const userId = typeof decoded?.userId === 'string' ? decoded.userId : null;

  if (!userId) {
    redirect('/signin');
  }

  let resultsData: any[] = [];
  try {
    const caller = await prisma.user.findUnique({ where: { id: userId as string }, select: { workspaceId: true } });
    const isStudent = role === 'student';

    const dbResults = await prisma.result.findMany({
      where: isStudent
        ? { studentId: userId as string }
        : { student: { workspaceId: caller?.workspaceId ?? '__none__' } },
      include: {
        student: {
          select: {
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    resultsData = dbResults.map(r => ({
      id: r.id,
      studentName: r.student?.name || 'Unknown Student',
      studentEmail: r.student?.email || '',
      testName: r.subject || 'Assessment',
      score: r.score,
      maxScore: r.totalMarks,
      percentage: r.percentage,
      grade: r.grade,
      status: r.status,
      feedback: r.feedback || 'Assessment completed successfully.',
      timeTaken: r.timeTaken,
      evaluatedAt: r.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Prisma lookup failed in ResultsPage, using mock fallback:", error);
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <ResultsView role={role} resultsData={resultsData} />
        </div>
      </main>
    </div>
  );
}
