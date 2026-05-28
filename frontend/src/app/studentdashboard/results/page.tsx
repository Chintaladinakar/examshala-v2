import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import ResultsDashboard from "@/components/student/ResultsDashboard";
import ResultsView from "@/components/ResultsView";
import { decodeJwtPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const mockResults = [
  {
    id: "mock-1",
    subject: "Mathematics",
    score: 85,
    totalMarks: 100,
    percentage: 85.0,
    grade: "A",
    status: "Passed",
    rank: 4,
    feedback: "Excellent work on trigonometry and calculus theorems.",
    createdAt: new Date('2026-05-10T10:00:00Z')
  },
  {
    id: "mock-2",
    subject: "Physics",
    score: 94,
    totalMarks: 100,
    percentage: 94.0,
    grade: "A+",
    status: "Passed",
    rank: 1,
    feedback: "Exceptional visual problem solving in mechanics.",
    createdAt: new Date('2026-05-15T14:30:00Z')
  }
];

export default async function ResultsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  
  if (!token) {
    redirect("/signin");
  }

  const decoded = decodeJwtPayload(token);
  const role = typeof decoded?.role === 'string' ? decoded.role : 'student';

  let resultsData: any[] = [];

  try {
    // Direct database access for the Server Component (Step 8 & 9)
    resultsData = await prisma.result.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (resultsData.length === 0) {
      resultsData = mockResults;
    }
  } catch (error) {
    console.error("Prisma lookup failed in ResultsPage, using mock fallback:", error);
    resultsData = mockResults;
  }

  if (role === 'student') {
    return <ResultsDashboard resultsData={resultsData} />;
  }

  // Fallback for tutor/manager roles to keep existing layout compatibility intact
  return <ResultsView role={role} resultsData={resultsData} />;
}
