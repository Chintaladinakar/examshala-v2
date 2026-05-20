export default function StudentMessagesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Messages</h1>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center text-slate-600">
        <p className="font-medium">No messages yet.</p>
        <p className="text-sm text-slate-500 mt-1">Announcements and updates will appear here.</p>
      </div>
    </div>
  );
}

