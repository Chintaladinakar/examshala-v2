import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import ResultsDashboard from "@/components/student/ResultsDashboard";
import ResultsView from "@/components/ResultsView";
import { getStudentResults } from "@/lib/student/data";
import { decodeJwtPayload } from "@/lib/auth";

export default async function ResultsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  
  if (!token) {
    redirect("/signin");
  }

  const decoded = decodeJwtPayload(token);
  const role = typeof decoded?.role === 'string' ? decoded.role : 'student';
  const resultsData = await getStudentResults(token);

  if (role === 'student') {
    return <ResultsDashboard resultsData={resultsData} />;
  }

  // Fallback for tutor/manager roles to keep existing layout compatibility intact
  return <ResultsView role={role} resultsData={resultsData} />;
}
