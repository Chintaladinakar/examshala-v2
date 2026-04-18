import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import ResultsView from "@/components/ResultsView";

export default async function ResultsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  
  if (!token) {
    redirect("/signin");
  }

  let role = "student";
  try {
    const payloadBase64 = token.split(".")[1];
    if (payloadBase64) {
      const payloadStr = Buffer.from(payloadBase64, "base64").toString("utf-8");
      const payload = JSON.parse(payloadStr);
      if (payload.role) {
        role = payload.role;
      }
    }
  } catch (error) {
    console.error("Error decoding token for role", error);
  }

  // Fetch results if backend API supports it, for now we will pass empty array to let component use dummy data
  // Or if it's integrated, do fetching here.
  let resultsData: any[] = [];
  try {
    const res = await fetch(`http://localhost:5000/api/${role === 'manager' || role === 'tutor' ? role : 'student'}/results`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });
    if (res.ok) {
      const payload = await res.json();
      if (payload.success && payload.data) {
         resultsData = Array.isArray(payload.data) ? payload.data : [];
      }
    }
  } catch (error) {
    console.error("Failed to fetch results", error);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <div className="flex-1 w-full p-4 md:p-8 lg:p-12 overflow-y-auto w-full max-w-7xl mx-auto">
        <ResultsView role={role} resultsData={resultsData} />
      </div>
    </div>
  );
}
