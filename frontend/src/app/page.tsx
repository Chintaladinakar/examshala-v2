"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import EDUsphereHero from '@/components/EDUsphereHero';
import EDUsphereFeatures from '@/components/EDUsphereFeatures';
import Footer from '@/components/Footer';

export default function Home() {
  // FAQ Accordion State (store active index, null if none is open)
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  // FAQ Data
  const faqs = [
    {
      question: "How does the virtual monitoring and anti-cheat mechanism work?",
      answer: "EDUsphere utilizes browser lock technologies combined with automated webcam proctoring. The system monitors browser focus, alerts invigilators when candidates try to leave the test window, tracks progress, and signals warnings in real-time."
    },
    {
      question: "Can it support large-scale examinations simultaneously?",
      answer: "Yes. Our cloud infrastructure is designed to scale dynamically. EDUsphere can handle tens of thousands of simultaneous test-takers with zero lag and extremely low latency for image feeds and test responses."
    },
    {
      question: "Is there support for different question types (MCQs, coding, essays)?",
      answer: "Absolutely! Instructors can create custom tests containing multiple-choice questions, interactive coding challenges, drag-and-drop matches, and open-ended essay questions with support for file attachments."
    },
    {
      question: "Does it integrate with learning management systems (LMS)?",
      answer: "Yes, our Enterprise tier includes seamless integrations with Canvas, Moodle, Blackboard, and custom internal systems using LTI standards."
    },
    {
      question: "How are the exam results calculated and exported?",
      answer: "Objective answers are graded instantly as soon as the candidate submits their exam. Results can be analyzed via an admin analytics dashboard and exported as CSV or PDF files in one click."
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans selection:bg-teal-100 selection:text-teal-900">
      
      {/* 1. Hero & Navigation Section */}
      <EDUsphereHero />

      {/* 2. Key Product Features Section */}
      <EDUsphereFeatures />

      {/* 3. Sarcastic Single-Plan Pricing Section */}
      <section className="bg-[#FDFBF7] py-24 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-white rounded-[2.5rem] border-2 border-teal-700 shadow-[0_20px_50px_rgba(15,118,110,0.06)] overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
              
              {/* Left Column: Sarcastic Explanation */}
              <div className="lg:col-span-7 p-8 md:p-12 flex flex-col justify-between bg-slate-50/50">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-100 mb-6 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
                    <span className="text-xs font-semibold text-teal-800">Our 'Single-Tier' Pricing Strategy</span>
                  </div>
                  
                  <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
                    Why have tiers when everything is <span className="text-teal-700">free</span>?
                  </h2>
                  
                  <p className="text-slate-600 leading-relaxed mb-6">
                    Usually, tech startups spend weeks creating complex subscription tiers, starter kits, and enterprise negotiation cycles. 
                  </p>
                  
                  <p className="text-slate-600 leading-relaxed mb-8">
                    We skipped all of that because setting up billing systems sounded like a lot of reading, and our hosting bill is currently being paid by a free trial credit. You get every single premium feature for absolutely nothing.
                  </p>
                </div>

                <div className="border-t border-slate-200/60 pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                      <span className="text-lg">⚠️</span>
                    </div>
                    <p className="text-xs text-amber-800 font-medium leading-relaxed">
                      <strong>Fair Warning:</strong> This plan will exist exactly until we run out of free cloud credits or we figure out how Stripe works. Whichever comes first.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: The "Everything" Card */}
              <div className="lg:col-span-5 bg-teal-950 p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
                {/* Decorative glow */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-teal-600/20 blur-3xl rounded-full pointer-events-none"></div>

                <div className="relative z-10">
                  <span className="text-teal-400 text-xs font-bold uppercase tracking-widest block mb-1">Current Offer</span>
                  <h3 className="text-2xl font-bold mb-4">The "Unlimited" Plan</h3>
                  
                  <div className="flex items-baseline mb-6">
                    <span className="text-5xl font-black text-white">$0</span>
                    <span className="text-teal-400 text-sm ml-2">/ while it lasts</span>
                  </div>

                  <div className="border-t border-teal-900/80 pt-6 mb-8">
                    <ul className="space-y-3.5">
                      {[
                        "Unlimited candidates & exams",
                        "Live proctoring & webcam feeds",
                        "AI automated flag monitoring",
                        "Full LMS integrations (Canvas/Moodle)",
                        "Priority support (meaning we answer fast)",
                        "Complete history & compliance archive"
                      ].map((feat, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-teal-100">
                          <svg className="w-5 h-5 text-teal-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Link
                  href="/signup"
                  className="w-full py-4 bg-white text-teal-950 font-extrabold text-center rounded-xl hover:bg-teal-50 transition-all shadow-md hover:scale-[1.02] duration-200 relative z-10"
                >
                  Grab Free Unlimited Access
                </Link>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 4. FAQ Accordion Section */}
      <section className="bg-[#FDFBF7] py-24 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4">
              Frequently asked questions
            </h2>
            <p className="text-lg text-slate-600">
              Everything you need to know about the EDUsphere proctoring and assessment experience.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div
                  key={index}
                  className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden transition-all shadow-[0_4px_20px_rgba(0,0,0,0.01)]"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left font-semibold text-slate-900 hover:text-teal-700 transition-colors focus:outline-none"
                  >
                    <span className="text-base md:text-lg">{faq.question}</span>
                    <span className={`w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200/50 shrink-0 ml-4 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-teal-50 border-teal-100 text-teal-700' : 'text-slate-500'}`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </span>
                  </button>
                  <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      isOpen ? 'max-h-60 border-t border-slate-100' : 'max-h-0'
                    }`}
                  >
                    <p className="px-6 py-5 text-sm md:text-base text-slate-600 leading-relaxed bg-[#FAFAFA]">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Sleek CTA Banner Section */}
      <section className="bg-[#FDFBF7] pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="relative rounded-[2.5rem] bg-gradient-to-br from-teal-800 to-teal-950 text-white overflow-hidden px-8 py-16 md:p-20 shadow-[0_20px_50px_rgba(13,148,136,0.15)]">
            {/* Background glowing decorations */}
            <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-teal-600/20 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-teal-700/20 blur-[100px] rounded-full pointer-events-none"></div>

            <div className="relative z-10 max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
                Ready to elevate your assessment integrity?
              </h2>
              <p className="text-lg md:text-xl text-teal-100 mb-10 leading-relaxed max-w-2xl mx-auto">
                Join hundreds of forward-thinking institutions using EDUsphere to conduct simple, secure, and stress-free digital exams.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/signup"
                  className="w-full sm:w-auto px-8 py-4 bg-white text-teal-900 font-bold rounded-xl shadow hover:bg-teal-50 transition-all text-center hover:scale-[1.02] duration-200"
                >
                  Create Free Account
                </Link>
                <Link
                  href="/coming-soon"
                  className="w-full sm:w-auto px-8 py-4 bg-teal-900/60 border border-teal-700 hover:border-teal-600 font-bold rounded-xl text-teal-100 hover:text-white transition-all text-center hover:scale-[1.02] duration-200"
                >
                  Schedule Live Demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Cohesive Premium Footer */}
      <Footer />

    </div>
  );
}
