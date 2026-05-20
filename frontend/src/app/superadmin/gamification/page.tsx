export default function SuperAdminGamificationPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gamification</h1>
        <p className="text-slate-500">Configure platform-wide XP and badges (coming soon).</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-600">
        <p className="font-medium">Gamification is not configured yet.</p>
        <p className="text-sm text-slate-500 mt-1">This page will manage XP rules and badges once backend support exists.</p>
      </div>
    </div>
  );
}

