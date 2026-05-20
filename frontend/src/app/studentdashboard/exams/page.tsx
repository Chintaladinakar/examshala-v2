export default function StudentExamsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Exams</h1>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center text-slate-600">
        <p className="font-medium">No exams available yet.</p>
        <p className="text-sm text-slate-500 mt-1">Available practice/mock/live exams will appear here.</p>
      </div>
    </div>
  );
}

