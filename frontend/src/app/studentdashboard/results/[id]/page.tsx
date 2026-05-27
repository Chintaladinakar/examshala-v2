import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import ResultDetailPage from "@/components/student/ResultDetailPage";
import { getStudentResultById } from "@/lib/student/data";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ResultDetailPageWrapper({ params }: PageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  
  if (!token) {
    redirect("/signin");
  }

  const result = await getStudentResultById(token, id);

  if (!result) {
    redirect("/studentdashboard/results");
  }

  return <ResultDetailPage result={result} />;
}
