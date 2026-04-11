import React from 'react';

const ExamshalaFeatures = () => {
  return (
    <div className="bg-[#FDFBF7] text-slate-800 font-sans pb-24 md:pb-32">
      
      {/* Why Examshala Block */}
      <section className="max-w-7xl mx-auto px-6 py-20 lg:py-28">
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-start">
          
          <div className="lg:w-1/3 pt-4">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
              Why leading institutions choose <span className="text-teal-700">Examshala</span>
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              We provide a robust testing foundation that prioritizes academic integrity while completely eliminating the administrative overhead of traditional examinations.
            </p>
          </div>

          <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Card 1 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-transform duration-300">
              <div className="w-12 h-12 bg-teal-50 text-teal-700 rounded-xl flex items-center justify-center mb-6">
                 {/* Lock Icon */}
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Secure Exams</h3>
              <p className="text-slate-600 leading-relaxed text-sm">Advanced anti-cheat mechanisms, intelligent lockdown browsers, and verifiable identity verification keep your tests completely secure.</p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-transform duration-300">
              <div className="w-12 h-12 bg-teal-50 text-teal-700 rounded-xl flex items-center justify-center mb-6">
                 {/* Eye Icon */}
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Real-time Monitoring</h3>
              <p className="text-slate-600 leading-relaxed text-sm">Track candidate progress, spot behavioral anomalies instantly, and intervene securely without disrupting other test-takers.</p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-transform duration-300">
              <div className="w-12 h-12 bg-teal-50 text-teal-700 rounded-xl flex items-center justify-center mb-6">
                 {/* Bolt Icon */}
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Faster Workflows</h3>
              <p className="text-slate-600 leading-relaxed text-sm">Automated evaluation, robust analytics dashboards, and one-click result publishing save hundreds of hours of manual administrative work.</p>
            </div>
          </div>

        </div>
      </section>

      {/* How It Works Block */}
      <section className="max-w-5xl mx-auto px-6 py-12 lg:py-20 mt-8">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4">How it works</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">A delightfully simple three-step process to manage your entire assessment lifecycle end-to-end.</p>
        </div>

        <div className="relative">
          {/* Connecting Line between steps (desktop only) */}
          <div className="hidden md:block absolute top-[48px] left-[15%] right-[15%] h-[2px] bg-slate-200"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 text-center relative z-10">
            {/* Step 1 */}
            <div>
              <div className="w-24 h-24 mx-auto bg-white border-4 border-[#FDFBF7] shadow-[0_12px_40px_rgb(0,0,0,0.08)] rounded-[2rem] flex items-center justify-center mb-8 transform transition-transform hover:scale-105 duration-300">
                 <div className="w-12 h-12 bg-slate-50 text-slate-700 rounded-2xl flex items-center justify-center font-bold text-xl">1</div>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Create & Configure</h3>
              <p className="text-slate-600 leading-relaxed text-sm px-4">Draft your questions, set precise security parameters, configure timing rules, and invite candidates easily.</p>
            </div>

            {/* Step 2 */}
            <div>
              <div className="w-24 h-24 mx-auto bg-white border-4 border-[#FDFBF7] shadow-[0_12px_40px_rgb(0,0,0,0.08)] rounded-[2rem] flex items-center justify-center mb-8 transform transition-transform hover:scale-105 duration-300">
                 <div className="w-12 h-12 bg-teal-50 text-teal-700 rounded-2xl flex items-center justify-center font-bold text-xl shadow-inner">2</div>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Conduct & Monitor</h3>
              <p className="text-slate-600 leading-relaxed text-sm px-4">Candidates take the exam in a protected environment while your invigilators seamlessly monitor feeds via a single dashboard.</p>
            </div>

            {/* Step 3 */}
            <div>
              <div className="w-24 h-24 mx-auto bg-white border-4 border-[#FDFBF7] shadow-[0_12px_40px_rgb(0,0,0,0.08)] rounded-[2rem] flex items-center justify-center mb-8 transform transition-transform hover:scale-105 duration-300">
                 <div className="w-12 h-12 bg-slate-50 text-slate-700 rounded-2xl flex items-center justify-center font-bold text-xl">3</div>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Evaluate & Publish</h3>
              <p className="text-slate-600 leading-relaxed text-sm px-4">Automatically grade objective questions, efficiently review open-text answers, and securely generate deep analytics.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default ExamshalaFeatures;
