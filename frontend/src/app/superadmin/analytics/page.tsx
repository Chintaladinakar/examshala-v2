export default function SuperAdminAnalyticsPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Platform Analytics</h1>
        <p className="text-slate-500">Usage and growth analytics across all workspaces (coming soon).</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-600">
        <p className="font-medium">Analytics endpoints are not wired yet.</p>
        <p className="text-sm text-slate-500 mt-1">This page will show platform-wide trends once backend support is added.</p>
      </div>
    </div>
  );
}

