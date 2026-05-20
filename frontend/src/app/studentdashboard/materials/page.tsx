export default function StudentMaterialsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Materials</h1>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center text-slate-600">
        <p className="font-medium">No study materials yet.</p>
        <p className="text-sm text-slate-500 mt-1">Notes, PDFs, videos, and downloads will appear here.</p>
      </div>
    </div>
  );
}

