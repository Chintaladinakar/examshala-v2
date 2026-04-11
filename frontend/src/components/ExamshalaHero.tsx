import React from 'react';
import Link from 'next/link';

const ExamshalaHero = () => {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-800 font-sans selection:bg-teal-100 selection:text-teal-900 overflow-hidden">
      {/* Top Navbar */}
      <header className="px-6 py-5 max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 cursor-pointer">
          <div className="w-8 h-8 bg-teal-700 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-xl leading-none">E</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">Examshala</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <Link href="/coming-soon" className="hover:text-teal-700 transition-colors">Features</Link>
          <Link href="/coming-soon" className="hover:text-teal-700 transition-colors">Solutions</Link>
          <Link href="/coming-soon" className="hover:text-teal-700 transition-colors">Pricing</Link>
          <Link href="/coming-soon" className="hover:text-teal-700 transition-colors">Resources</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/signin" className="text-sm font-medium text-slate-600 hover:text-teal-700 transition-colors hidden sm:block">Log in</Link>
          <Link href="/signup" className="text-sm font-medium bg-white border border-slate-200 text-slate-800 px-4 py-2 rounded-lg shadow-sm hover:shadow hover:border-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-slate-200">
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Content */}
      <main className="max-w-7xl mx-auto px-6 pt-16 pb-24 md:pt-24 lg:pt-32 flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
        {/* Left Side: Copy & CTAs */}
        <div className="flex-1 max-w-2xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-100 mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-teal-600"></span>
            <span className="text-sm font-medium text-teal-800">Secure online exams for modern institutions</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1] mb-6">
            Conduct exams with <span className="text-teal-700">confidence</span>, speed, and complete control.
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 leading-relaxed mb-10 max-w-xl">
            Deliver secure exams, real-time monitoring, instant results, and streamlined exam management for schools, colleges, and training institutes.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-12">
            <Link href="/signup" className="w-full sm:w-auto px-8 py-3.5 bg-teal-700 text-white text-center font-medium rounded-xl shadow-sm hover:bg-teal-800 hover:shadow-md transition-all focus:ring-2 focus:ring-offset-2 focus:ring-teal-700 focus:outline-none">
              Get Started
            </Link>
            <Link href="/coming-soon" className="w-full sm:w-auto px-8 py-3.5 bg-white border border-slate-200 text-center text-slate-700 font-medium rounded-xl shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all focus:ring-2 focus:ring-offset-2 focus:ring-slate-200 focus:outline-none">
              Book a Demo
            </Link>
          </div>
          
          {/* Trust Points */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <span className="text-sm font-medium text-slate-600">Secure exams</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <span className="text-sm font-medium text-slate-600">Live monitoring</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <span className="text-sm font-medium text-slate-600">Instant results</span>
            </div>
          </div>
        </div>

        {/* Right Side: Product Preview */}
        <div className="flex-1 w-full lg:w-auto relative perspective-1000">
          {/* Decorative Background Glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-teal-100/50 blur-3xl rounded-full -z-10 pointer-events-none"></div>
          <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-amber-100/40 blur-3xl rounded-full -z-10 pointer-events-none"></div>
          
          <div className="bg-white rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-200/60 overflow-hidden transform transition-transform hover:-translate-y-1 duration-500">
            {/* Browser Header UI */}
            <div className="bg-[#F8F9FA] border-b border-slate-100 px-4 py-3 flex items-center gap-4">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#E5E7EB]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#E5E7EB]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#E5E7EB]"></div>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="w-1/2 h-5 bg-white border border-slate-200 rounded flex items-center px-3 justify-center shadow-sm">
                  <span className="text-[10px] font-mono text-slate-400">examshala.com/dashboard</span>
                </div>
              </div>
              <div className="w-10"></div> {/* Spacer for symmetry */}
            </div>
            
            {/* Dashboard App Preview Content */}
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className="text-sm font-semibold text-teal-700 mb-1 tracking-wide uppercase">Ongoing Exam</div>
                  <div className="text-xl font-bold text-slate-900">Advanced Mathematics Final</div>
                </div>
                <div className="px-3 py-1.5 bg-rose-50 text-rose-700 text-xs font-semibold rounded-md border border-rose-100 flex items-center gap-2 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  Live Monitoring
                </div>
              </div>

              {/* Grid of Student Webcams / Desktop View */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: "Alex J.", status: "Active", warning: false, progress: 45 },
                  { name: "Maria G.", status: "Warning", warning: true, progress: 62 },
                  { name: "James S.", status: "Active", warning: false, progress: 30 },
                  { name: "Sophia L.", status: "Active", warning: false, progress: 88 },
                ].map((student, i) => (
                  <div key={i} className={`p-3 rounded-xl border transition-colors ${student.warning ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100 bg-[#FAFAFA]'}`}>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-xs font-medium text-slate-700">{student.name}</span>
                      </div>
                      {student.warning && (
                        <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      )}
                    </div>
                    {/* Simulated Camera Feed */}
                    <div className="w-full aspect-video bg-slate-200/80 rounded-lg relative overflow-hidden mb-2 shadow-inner">
                      <div className="absolute inset-0 bg-slate-300/50"></div>
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-3/5 bg-slate-400/80 rounded-t-[20px]"></div>
                      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[22%] aspect-square bg-slate-400/80 rounded-full"></div>
                    </div>
                    {/* Progress Bar */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full" style={{ width: `${student.progress}%` }}></div>
                      </div>
                      <span className="text-[10px] font-medium text-slate-500">{student.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExamshalaHero;
