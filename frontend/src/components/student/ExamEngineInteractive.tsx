"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Clock, Calendar, CheckCircle2, AlertCircle, PlayCircle, ChevronLeft, ChevronRight, AlertTriangle, ShieldAlert, Maximize, Lock, Eye, Check } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ExamEngineInteractiveProps {
  assignment: {
    id: string;
    testTitle: string;
    duration: number; // minutes
    assignedBy: string;
    assignedByType: string;
    assignedAt: string;
    instructions: string;
    isEligibleToStart: boolean;
  };
}

interface Question {
  id: number;
  text: string;
  options: string[];
  correctOptionIndex: number;
  marks: number;
}

const MOCK_QUESTIONS: Question[] = [
  {
    id: 1,
    text: "What is the sum of the first 10 prime numbers?",
    options: ["A) 100", "B) 129", "C) 143", "D) 154"],
    correctOptionIndex: 1, // B
    marks: 10,
  },
  {
    id: 2,
    text: "If a triangle has sides of length 5, 12, and 13, what is its area?",
    options: ["A) 30", "B) 60", "C) 65", "D) 78"],
    correctOptionIndex: 0, // A
    marks: 10,
  },
  {
    id: 3,
    text: "Find the value of x in the equation: 3x + 7 = 2x + 19",
    options: ["A) 8", "B) 10", "C) 12", "D) 14"],
    correctOptionIndex: 2, // C
    marks: 10,
  },
  {
    id: 4,
    text: "What is the probability of rolling a sum of 7 with two six-sided dice?",
    options: ["A) 1/12", "B) 1/6", "C) 1/8", "D) 5/36"],
    correctOptionIndex: 1, // B
    marks: 10,
  },
  {
    id: 5,
    text: "Solve for the limit: lim (x -> 3) of (x^2 - 9)/(x - 3)",
    options: ["A) 3", "B) 6", "C) 9", "D) Undefined"],
    correctOptionIndex: 1, // B
    marks: 10,
  }
];

export function ExamEngineInteractive({ assignment }: ExamEngineInteractiveProps) {
  // --- A. PRE-EXAM STATE ---
  const [checklist, setChecklist] = useState({
    readInstructions: false,
    understandRules: false,
    readyToBegin: false,
  });

  // --- B. EXAM NAVIGATION & SESSION STATE ---
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<number, boolean>>({});
  
  // --- C. TIMER STATE ---
  const [timeLeft, setTimeLeft] = useState(assignment.duration * 60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- D. ANTI-CHEAT SECURITY STATE ---
  const [focusLossCount, setFocusLossCount] = useState(0);
  const [securityWarning, setSecurityWarning] = useState({ show: false, message: '' });
  const [fullscreenExitWarning, setFullscreenExitWarning] = useState(false);

  // --- E. SUBMISSION FLOW STATE ---
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [scoreData, setScoreData] = useState({ score: 0, maxScore: 50, correctCount: 0 });

  // Load progress and time from localStorage on mount (Autosave system check)
  useEffect(() => {
    try {
      const savedAnswers = localStorage.getItem(`exam_answers_${assignment.id}`);
      const savedReview = localStorage.getItem(`exam_review_${assignment.id}`);
      const savedTime = localStorage.getItem(`exam_time_${assignment.id}`);
      const savedStarted = localStorage.getItem(`exam_started_${assignment.id}`);
      const savedFocusLoss = localStorage.getItem(`exam_focus_${assignment.id}`);

      if (savedAnswers) setAnswers(JSON.parse(savedAnswers));
      if (savedReview) setMarkedForReview(JSON.parse(savedReview));
      if (savedFocusLoss) setFocusLossCount(parseInt(savedFocusLoss, 10));

      if (savedStarted === 'true') {
        setIsExamStarted(true);
        if (savedTime) {
          const parsedTime = parseInt(savedTime, 10);
          if (parsedTime > 0) setTimeLeft(parsedTime);
        }
      }
    } catch {
      // ignore
    }
  }, [assignment.id]);

  // Timer Countdown Controller
  useEffect(() => {
    if (!isExamStarted || isSubmitted) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        
        // Autosave time periodically every 10 seconds
        if (next % 10 === 0) {
          localStorage.setItem(`exam_time_${assignment.id}`, String(next));
        }

        if (next <= 0) {
          clearInterval(timerRef.current!);
          autoSubmitExam();
          return 0;
        }

        // Live alert warnings
        if (next === 600) { // 10 minutes left
          setSecurityWarning({ show: true, message: "⚠️ Attention: You have 10 minutes remaining!" });
        } else if (next === 300) { // 5 minutes left
          setSecurityWarning({ show: true, message: "⚠️ Warning: Only 5 minutes remaining! Ensure all questions are saved." });
        } else if (next === 60) { // 1 minute left
          setSecurityWarning({ show: true, message: "🚨 Critical: Only 1 minute left! Auto-submission will trigger in 60 seconds." });
        }

        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isExamStarted, isSubmitted, assignment.id]);

  // Anti-Cheating Event Listeners
  useEffect(() => {
    if (!isExamStarted || isSubmitted) return;

    const triggerFocusLossWarning = () => {
      setFocusLossCount((prevCount) => {
        const nextCount = prevCount + 1;
        localStorage.setItem(`exam_focus_${assignment.id}`, String(nextCount));
        
        if (nextCount >= 3) {
          autoSubmitExam(true); // Auto submit with cheating violations flag
        } else {
          setSecurityWarning({
            show: true,
            message: `🚨 DISTRICT SECURITY NOTICE: Tab switching or window focus loss detected! This is warning ${nextCount} of 3. Accumulating 3 violations will auto-submit your exam!`,
          });
        }
        return nextCount;
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) triggerFocusLossWarning();
    };

    const handleWindowBlur = () => {
      triggerFocusLossWarning();
    };

    const handleFullscreenChange = () => {
      const isFullscreen = document.fullscreenElement || 
                          (document as any).webkitFullscreenElement || 
                          (document as any).mozFullScreenElement || 
                          (document as any).msFullscreenElement;
      
      if (!isFullscreen && !isSubmitted) {
        setFullscreenExitWarning(true);
        triggerFocusLossWarning();
      } else {
        setFullscreenExitWarning(false);
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave? Your exam progress is autosaved, but the active timer will continue running!';
      return e.returnValue;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Block right-click context menus during exams
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isExamStarted, isSubmitted, assignment.id]);

  // Request Fullscreen locking
  const enterFullscreenImmersive = async () => {
    try {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen locking not permitted by browser:", err);
    }
  };

  const handleStartExam = async () => {
    setIsExamStarted(true);
    localStorage.setItem(`exam_started_${assignment.id}`, 'true');
    localStorage.setItem(`exam_time_${assignment.id}`, String(assignment.duration * 60));
    await enterFullscreenImmersive();
  };

  // Autosave and question palette actions
  const selectOption = (optIdx: number) => {
    const newAnswers = { ...answers, [currentQuestionIndex]: optIdx };
    setAnswers(newAnswers);
    // Autosave response immediately to localStorage
    localStorage.setItem(`exam_answers_${assignment.id}`, JSON.stringify(newAnswers));
  };

  const clearResponse = () => {
    const newAnswers = { ...answers };
    delete newAnswers[currentQuestionIndex];
    setAnswers(newAnswers);
    localStorage.setItem(`exam_answers_${assignment.id}`, JSON.stringify(newAnswers));
  };

  const toggleMarkForReview = () => {
    const newReview = { ...markedForReview, [currentQuestionIndex]: !markedForReview[currentQuestionIndex] };
    setMarkedForReview(newReview);
    localStorage.setItem(`exam_review_${assignment.id}`, JSON.stringify(newReview));
  };

  const handleNext = () => {
    if (currentQuestionIndex < MOCK_QUESTIONS.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  // Evaluate Score on Submit
  const evaluateScoreAndSubmit = (cheated = false) => {
    let score = 0;
    let correctCount = 0;
    
    MOCK_QUESTIONS.forEach((q, idx) => {
      const selected = answers[idx];
      if (selected !== undefined && selected === q.correctOptionIndex) {
        score += q.marks;
        correctCount++;
      }
    });

    setScoreData({
      score: cheated ? 0 : score, // Cheating yields 0 marks
      maxScore: 50,
      correctCount: cheated ? 0 : correctCount,
    });

    setIsSubmitted(true);
    setIsConfirmSubmitOpen(false);

    // Clear local storage exam progress data on complete submission
    try {
      localStorage.removeItem(`exam_answers_${assignment.id}`);
      localStorage.removeItem(`exam_review_${assignment.id}`);
      localStorage.removeItem(`exam_time_${assignment.id}`);
      localStorage.removeItem(`exam_started_${assignment.id}`);
      localStorage.removeItem(`exam_focus_${assignment.id}`);
      
      // Exit fullscreen if active
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    } catch {
      // ignore
    }
  };

  const autoSubmitExam = (cheated = false) => {
    evaluateScoreAndSubmit(cheated);
    if (cheated) {
      alert("🚨 Exam auto-submitted due to multiple window focus security violations!");
    } else {
      alert("⏳ Time's up! Your exam has been auto-submitted successfully.");
    }
  };

  // Counting specs for summary modal
  const answeredCount = Object.keys(answers).length;
  const reviewCount = Object.values(markedForReview).filter(Boolean).length;
  const unansweredCount = MOCK_QUESTIONS.length - answeredCount;

  // Formatter for countdown clock timer
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Checklist validator
  const isChecklistComplete = checklist.readInstructions && checklist.understandRules && checklist.readyToBegin;

  // --- 1. POST-EXAM RESULTS SCREEN ---
  if (isSubmitted) {
    const isPass = scoreData.score >= 25; // 50% passing marks
    const didCheat = focusLossCount >= 3;

    return (
      <div className="max-w-2xl mx-auto py-8 select-none">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center shadow-md space-y-6">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border",
            didCheat 
              ? "bg-rose-50 text-rose-600 border-rose-100" 
              : isPass 
                ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                : "bg-amber-50 text-amber-600 border-amber-100"
          )}>
            {didCheat ? <ShieldAlert className="w-8 h-8 animate-bounce" /> : <Check className="w-8 h-8" />}
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {didCheat ? "Submission Terminated" : "Exam Submitted Successfully!"}
            </h2>
            <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              {didCheat 
                ? "Your assessment attempt was automatically finalized due to repeated security tab-switching violations."
                : "Your graded paper evaluation has been calculated in real-time."
              }
            </p>
          </div>

          {/* Results specs cards */}
          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <div>
              <span className="text-[9px] uppercase font-extrabold text-slate-400 block tracking-wider">Score</span>
              <span className={cn(
                "text-2xl font-black block tracking-tight mt-0.5",
                didCheat ? "text-rose-600" : isPass ? "text-emerald-600" : "text-amber-600"
              )}>
                {scoreData.score} <span className="text-xs text-slate-400 font-bold">/ {scoreData.maxScore}</span>
              </span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-extrabold text-slate-400 block tracking-wider">Accuracy</span>
              <span className="text-2xl font-black text-slate-800 block tracking-tight mt-0.5">
                {didCheat ? 0 : Math.round((scoreData.correctCount / MOCK_QUESTIONS.length) * 100)}%
              </span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-extrabold text-slate-400 block tracking-wider">Status</span>
              <span className={cn(
                "text-xs font-black uppercase tracking-wider block mt-2 border px-2 py-0.5 rounded-md text-center max-w-[90px] mx-auto",
                didCheat 
                  ? "bg-rose-50 text-rose-700 border-rose-100" 
                  : isPass 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                    : "bg-amber-50 text-amber-700 border-amber-100"
              )}>
                {didCheat ? "Invalidated" : isPass ? "Passed" : "Practice"}
              </span>
            </div>
          </div>

          {/* Details metadata statistics */}
          <div className="text-left text-xs space-y-3 bg-slate-50/50 p-5 rounded-2xl border border-slate-100/50 text-slate-600">
            <h4 className="font-extrabold text-slate-800 uppercase tracking-widest text-[10px] border-b pb-2 mb-2">Evaluation Metrics</h4>
            <div className="flex justify-between">
              <span>Test Title:</span>
              <span className="font-bold text-slate-800">{assignment.testTitle}</span>
            </div>
            <div className="flex justify-between">
              <span>Correct Questions:</span>
              <span className="font-bold text-slate-800">{scoreData.correctCount} / {MOCK_QUESTIONS.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Focus Loss Violations:</span>
              <span className={cn("font-bold", focusLossCount > 0 ? "text-rose-600" : "text-emerald-600")}>
                {focusLossCount} {focusLossCount >= 3 ? "(Auto-submitted)" : ""}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Time Taken:</span>
              <span className="font-bold text-slate-800">
                {Math.floor((assignment.duration * 60 - timeLeft) / 60)}m { (assignment.duration * 60 - timeLeft) % 60 }s
              </span>
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <Link 
              href="/studentdashboard" 
              className="inline-flex items-center justify-center gap-1.5 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. IMMERSIVE EXAM TAKING SECTION ---
  if (isExamStarted) {
    const currentQ = MOCK_QUESTIONS[currentQuestionIndex];
    const selectedOpt = answers[currentQuestionIndex];

    return (
      <div 
        id="exam-immersive-env" 
        className="fixed inset-0 bg-[#FBFBFB] z-50 overflow-y-auto flex flex-col font-sans text-slate-800 selection:bg-teal-100 selection:text-teal-900"
      >
        {/* Anti-Cheating Alert Banner (High Visibility Overlay) */}
        {securityWarning.show && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-rose-600 text-white px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3.5 max-w-md border border-rose-500 animate-in fade-in slide-in-from-top-4 duration-300">
            <AlertTriangle className="w-6 h-6 text-white shrink-0 animate-bounce" />
            <div className="text-xs">
              <h5 className="font-extrabold uppercase tracking-wide">Security Warning</h5>
              <p className="mt-0.5 leading-relaxed font-semibold">{securityWarning.message}</p>
            </div>
            <button 
              onClick={() => setSecurityWarning({ show: false, message: '' })}
              className="text-white hover:text-rose-100 font-extrabold uppercase text-[10px] pl-2 tracking-wider shrink-0 cursor-pointer"
            >
              Acknowledge
            </button>
          </div>
        )}

        {/* Fullscreen Exit warning overlay */}
        {fullscreenExitWarning && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-45 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-3xl max-w-sm text-center border border-rose-100 shadow-2xl space-y-4">
              <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto animate-pulse" />
              <h3 className="text-lg font-black text-slate-900">Immersive Fullscreen Required</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Exiting fullscreen is treated as a suspicious focus violation! Click the button below immediately to restore the fullscreen locked interface.
              </p>
              <button 
                onClick={enterFullscreenImmersive}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Restore Fullscreen <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TOP BAR */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 h-16 flex items-center px-4 md:px-8 justify-between select-none">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 truncate max-w-[130px] sm:max-w-xs">{assignment.testTitle}</span>
          </div>

          {/* Centered live countdown clock */}
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 border rounded-xl shadow-3xs transition-colors",
            timeLeft < 300 
              ? "bg-rose-50 border-rose-200 text-rose-700 font-extrabold animate-pulse" 
              : "bg-slate-50 border-slate-200 text-slate-700 font-bold"
          )}>
            <Clock className="w-4 h-4 shrink-0" />
            <span className="text-sm font-mono tracking-wide">{formatTimer(timeLeft)}</span>
          </div>

          <button 
            onClick={() => setIsConfirmSubmitOpen(true)}
            className="px-4.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-3xs hover:shadow-xs cursor-pointer select-none"
          >
            Submit Assessment
          </button>
        </header>

        {/* CONTAINER MAIN & SIDEBAR */}
        <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 flex flex-col lg:flex-row gap-6">
          
          {/* MAIN LEFT SECTION: Question & Navigation */}
          <main className="flex-1 flex flex-col justify-between gap-6 min-w-0">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-3xs min-h-[350px] flex flex-col justify-between">
              
              {/* Question heading */}
              <div className="space-y-4">
                <div className="flex items-center justify-between select-none pb-4 border-b border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question {currentQ.id} of {MOCK_QUESTIONS.length}</span>
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/30">+{currentQ.marks} Marks</span>
                </div>
                
                <h2 className="text-lg md:text-xl font-extrabold text-slate-900 leading-relaxed tracking-tight">
                  {currentQ.text}
                </h2>
              </div>

              {/* Options selection */}
              <div className="mt-8 space-y-3 flex-1">
                {currentQ.options.map((opt, optIdx) => {
                  const isSelected = selectedOpt === optIdx;
                  return (
                    <button
                      key={optIdx}
                      onClick={() => selectOption(optIdx)}
                      className={cn(
                        "w-full text-left p-4 rounded-2xl border text-xs md:text-sm font-semibold transition-all duration-200 flex items-center justify-between group cursor-pointer",
                        isSelected 
                          ? "bg-teal-500/8 border-teal-600 text-teal-950 font-bold" 
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-350"
                      )}
                    >
                      <span>{opt}</span>
                      <div className={cn(
                        "w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 transition-all",
                        isSelected 
                          ? "border-teal-600 bg-teal-600 text-white" 
                          : "border-slate-300 group-hover:border-slate-400 bg-white"
                      )}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3px]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Quick option clear */}
              {selectedOpt !== undefined && (
                <div className="mt-4 text-right">
                  <button 
                    onClick={clearResponse}
                    className="text-[10px] text-slate-400 hover:text-slate-600 font-extrabold uppercase tracking-wider cursor-pointer"
                  >
                    Clear Response
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Question Navigation Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-3xs select-none">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  disabled={currentQuestionIndex === 0}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentQuestionIndex === MOCK_QUESTIONS.length - 1}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={toggleMarkForReview}
                className={cn(
                  "px-4.5 py-2 border text-xs font-bold rounded-xl transition-all cursor-pointer",
                  markedForReview[currentQuestionIndex]
                    ? "bg-amber-50 border-amber-200 text-amber-800"
                    : "border-slate-200 hover:bg-slate-50 text-slate-600"
                )}
              >
                {markedForReview[currentQuestionIndex] ? "★ Marked for Review" : "☆ Mark for Review"}
              </button>
            </div>
          </main>

          {/* RIGHT SIDEBAR PANEL: Palette */}
          <aside className="w-full lg:w-72 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-3xs flex flex-col justify-between shrink-0 select-none min-h-[350px] lg:min-h-0">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-3">Question Palette</h4>
              
              {/* Grid circle list */}
              <div className="grid grid-cols-5 gap-2.5">
                {MOCK_QUESTIONS.map((q, idx) => {
                  const isCurrent = currentQuestionIndex === idx;
                  const isAnswered = answers[idx] !== undefined;
                  const isMarked = markedForReview[idx];

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={cn(
                        "w-10 h-10 rounded-full font-black text-xs border flex items-center justify-center transition-all select-none cursor-pointer",
                        isCurrent 
                          ? "ring-2 ring-teal-600 border-teal-600 font-extrabold" 
                          : "",
                        isMarked 
                          ? "bg-amber-500 text-white border-amber-500 shadow-2xs" 
                          : isAnswered 
                            ? "bg-emerald-500 text-white border-emerald-500 shadow-2xs" 
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      {q.id}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color-code indicators summary */}
            <div className="mt-8 border-t border-slate-50 pt-5 space-y-2.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500" />
                <span>Marked for Review ({reviewCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-slate-100 border border-slate-200" />
                <span>Unanswered ({unansweredCount})</span>
              </div>
            </div>
          </aside>
        </div>

        {/* 6. SUBMISSION REVIEW SUMMARY MODAL */}
        {isConfirmSubmitOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-6 select-none animate-in fade-in zoom-in-95 duration-200">
              <div className="text-center space-y-2 border-b pb-4">
                <ShieldAlert className="w-10 h-10 text-teal-600 mx-auto" />
                <h3 className="text-lg font-black text-slate-900">Submit Assessment?</h3>
                <p className="text-xs text-slate-500">Review your responses summary before final evaluation.</p>
              </div>

              {/* palette summary details */}
              <div className="grid grid-cols-3 gap-2.5 text-center text-xs bg-slate-50 p-4 rounded-xl border border-slate-100 font-extrabold">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Answered</span>
                  <span className="text-xl text-emerald-600 font-black tracking-tight block">{answeredCount}</span>
                </div>
                <div className="space-y-1 border-x border-slate-200/60">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Unanswered</span>
                  <span className="text-xl text-slate-500 font-black tracking-tight block">{unansweredCount}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Review</span>
                  <span className="text-xl text-amber-600 font-black tracking-tight block">{reviewCount}</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                ⚠️ Once submitted, you cannot change your answers. Please ensure all marked-for-review questions are finalized.
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsConfirmSubmitOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Continue Exam
                </button>
                <button
                  onClick={() => evaluateScoreAndSubmit(false)}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-3xs transition-all cursor-pointer"
                >
                  Submit Final
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- 3. EXAM INSTRUCTIONS SCREEN ---
  return (
    <div className="max-w-4xl mx-auto py-4 select-none">
      <Link 
        href="/studentdashboard" 
        className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {/* Header Block */}
        <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-teal-800 bg-teal-50 border border-teal-200/50 px-2.5 py-0.5 rounded">
                  Live Assessment
                </span>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block"></span>
                  Assigned by <span className="font-semibold text-slate-600">{assignment.assignedBy}</span>
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-950 tracking-tight mb-4">{assignment.testTitle}</h1>
              
              <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-slate-500 font-semibold">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700">Duration: {assignment.duration} Minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Total Questions: 5 Qs • Total Marks: 50 Marks</span>
                </div>
              </div>
            </div>

            <div className="shrink-0">
              <div className="bg-emerald-50 text-emerald-700 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-emerald-100/50">
                <CheckCircle2 className="w-4 h-4" /> Exam Ready
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          {/* Instructions Block */}
          <div>
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">General Instructions</h2>
            <div className="text-xs text-slate-500 bg-slate-50 p-6 rounded-2xl border border-slate-100/80 leading-relaxed font-semibold max-h-[140px] overflow-y-auto">
              {(assignment.instructions || "No instructions provided.").split('\n').map((para: string, idx: number) => (
                <p key={idx} className="mb-3.5 last:mb-0">
                  {para}
                </p>
              ))}
            </div>
          </div>

          {/* Rules Block */}
          <div>
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">Professional Exam Rules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-500 bg-slate-50/50 p-5 rounded-2xl border border-slate-100/50 leading-relaxed">
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <p>Do not refresh the page or close the tab during the active assessment.</p>
              </div>
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <p>Ensure a stable internet connection before beginning.</p>
              </div>
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <p>Switching windows or tabs will trigger active warning alerts.</p>
              </div>
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <p>Exiting the locked fullscreen mode twice will result in auto-submission.</p>
              </div>
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <p>Answers are autosaved periodically to ensure progress preservation.</p>
              </div>
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <p>Accumulating 3 suspicious focus losses will trigger auto-submission.</p>
              </div>
            </div>
          </div>

          {/* Pre-Exam Checklist */}
          <div>
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">Pre-Exam Checklist</h2>
            <div className="space-y-2.5 bg-teal-500/5 p-5 rounded-2xl border border-teal-200/20 text-xs font-bold text-slate-700">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={checklist.readInstructions}
                  onChange={(e) => setChecklist(prev => ({ ...prev, readInstructions: e.target.checked }))}
                  className="w-4 h-4 text-teal-600 border-slate-350 focus:ring-teal-500 rounded cursor-pointer"
                />
                <span>I have read all assessment instructions carefully.</span>
              </label>
              
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={checklist.understandRules}
                  onChange={(e) => setChecklist(prev => ({ ...prev, understandRules: e.target.checked }))}
                  className="w-4 h-4 text-teal-600 border-slate-350 focus:ring-teal-500 rounded cursor-pointer"
                />
                <span>I understand the anti-cheat security rules and window monitoring.</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={checklist.readyToBegin}
                  onChange={(e) => setChecklist(prev => ({ ...prev, readyToBegin: e.target.checked }))}
                  className="w-4 h-4 text-teal-600 border-slate-350 focus:ring-teal-500 rounded cursor-pointer"
                />
                <span>I am ready to enter distraction-free fullscreen and begin my exam.</span>
              </label>
            </div>
          </div>

          {/* Start Actions */}
          <div className="mt-8 flex items-center justify-end border-t border-slate-100 pt-6">
            <button
              onClick={handleStartExam}
              disabled={!isChecklistComplete}
              className="inline-flex items-center gap-1.5 px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-3xs hover:shadow-xs transition-all select-none cursor-pointer"
            >
              Start Exam <Maximize className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
