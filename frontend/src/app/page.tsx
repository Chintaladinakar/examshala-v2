import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-black text-slate-900">Welcome to Examshala</h1>
        <p className="text-slate-600">The ultimate virtual assessment platform.</p>
        <div className="flex justify-center gap-4">
          <Link 
            href="/signin" 
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
          >
            Sign In
          </Link>
          <Link 
            href="/signup" 
            className="px-6 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-colors"
          >
            Join Now
          </Link>
        </div>
      </div>
    </div>
  );
}
