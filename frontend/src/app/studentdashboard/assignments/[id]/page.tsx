'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Clock, 
  Calendar, 
  FileText, 
  Paperclip, 
  Upload, 
  Save, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  Check, 
  File
} from 'lucide-react';
import { ExamEngineInteractive } from '@/components/student/ExamEngineInteractive';

type Submission = {
  id: string;
  textSubmission: string;
  uploadedFiles: string[];
  submittedAt: string;
};

type AssignmentDetails = {
  id: string;
  title: string;
  description: string;
  subject: string;
  dueDate: string;
  attachments: string[];
  marks: number | null;
  teacherName: string;
  status: 'Pending' | 'Submitted' | 'Late' | 'Graded';
  submission: Submission | null;
};

const MOCK_EXAMS: Record<string, any> = {
  'math-final': {
    id: 'math-final',
    testTitle: 'Mathematics Term-End Assessment (Practice Mode)',
    duration: 90,
    assignedBy: 'Math Department',
    assignedByType: 'system',
    assignedAt: new Date().toISOString(),
    instructions: '1. This practice paper contains 5 questions.\n2. Each question carries 10 marks.\n3. Make sure to complete the exam in one sitting.\n4. Immersive mode/tab monitoring security is simulated.',
    isEligibleToStart: true,
  },
  'cs-mock': {
    id: 'cs-mock',
    testTitle: 'Computer Science Programming Lab Mock (Practice Mode)',
    duration: 60,
    assignedBy: 'CS Department',
    assignedByType: 'system',
    assignedAt: new Date().toISOString(),
    instructions: '1. This is a computer science mock test.\n2. Contains coding & analytical questions.\n3. Answer all questions to submit successfully.',
    isEligibleToStart: true,
  },
  'chem-practice': {
    id: 'chem-practice',
    testTitle: 'Organic Chemistry Practice Test',
    duration: 45,
    assignedBy: 'Chemistry Department',
    assignedByType: 'system',
    assignedAt: new Date().toISOString(),
    instructions: '1. Standard chemistry mock examination.\n2. Covers organic compounds, formulas, and reactions.\n3. Complete the quiz within 45 minutes.',
    isEligibleToStart: true,
  },
  'phys-mock': {
    id: 'phys-mock',
    testTitle: 'Physics Mechanics Mock Assessment (Practice Mode)',
    duration: 120,
    assignedBy: 'Physics Department',
    assignedByType: 'system',
    assignedAt: new Date().toISOString(),
    instructions: '1. High level physics dynamics practice exam.\n2. Ensure you have physical scratch papers to calculate answers.\n3. Duration: 120 minutes.',
    isEligibleToStart: true,
  }
};

export default function AssignmentOrExamPage() {
  const params = useParams();
  const id = params.id as string;

  const [isExam, setIsExam] = useState(false);
  const [examData, setExamData] = useState<any>(null);
  
  // Assignment State
  const [assignment, setAssignment] = useState<AssignmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Submission Form State
  const [textSubmission, setTextSubmission] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<{ name: string; size: number; type: string; base64?: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });
  const [countdown, setCountdown] = useState('');
  const [isSavedLocally, setIsSavedLocally] = useState(false);

  const autosaveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const getCookie = (name: string) => {
    if (typeof window === 'undefined') return '';
    return document.cookie
      .split('; ')
      .find(row => row.startsWith(`${name}=`))
      ?.split('=')[1] || '';
  };

  const loadData = async () => {
    // 1. Check if it's a mock exam key
    if (MOCK_EXAMS[id]) {
      setIsExam(true);
      setExamData(MOCK_EXAMS[id]);
      setLoading(false);
      return;
    }

    const token = getCookie('session_token');
    if (!token) {
      setError('Session expired. Please log in.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // 2. Try fetching as a Class Homework Assignment first
      const res = await fetch(`http://localhost:5000/api/assignments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = await res.json();
      
      if (payload.success) {
        setAssignment(payload.data);
        setIsExam(false);
        if (payload.data.submission) {
          setTextSubmission(payload.data.submission.textSubmission || '');
        } else {
          const savedDraft = localStorage.getItem(`draft_assignment_${id}`);
          if (savedDraft) {
            setTextSubmission(savedDraft);
            setIsSavedLocally(true);
          }
        }
        setError('');
      } else {
        // 3. Fallback: Try fetching as an Exam/Assessment ID
        const examRes = await fetch(`http://localhost:5000/api/student/assignments/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const examPayload = await examRes.json();

        if (examPayload.success) {
          setIsExam(true);
          setExamData(examPayload.data);
          setError('');
        } else {
          setError('Assignment or Exam not found.');
        }
      }
    } catch (e) {
      setError('Connection error. Could not contact API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Autosave setup (Every 10 seconds)
  useEffect(() => {
    if (assignment && !assignment.submission) {
      autosaveIntervalRef.current = setInterval(() => {
        if (textSubmission.trim()) {
          localStorage.setItem(`draft_assignment_${id}`, textSubmission);
          setIsSavedLocally(true);
          setTimeout(() => setIsSavedLocally(false), 2000);
        }
      }, 10000);
    }

    return () => {
      if (autosaveIntervalRef.current) clearInterval(autosaveIntervalRef.current);
    };
  }, [textSubmission, assignment, id]);

  // Countdown timer calculation
  useEffect(() => {
    if (!assignment) return;

    const timer = setInterval(() => {
      const due = new Date(assignment.dueDate);
      const now = new Date();
      const diffMs = due.getTime() - now.getTime();

      if (diffMs < 0) {
        setCountdown('Deadline Passed');
        clearInterval(timer);
      } else {
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        
        if (days > 0) {
          setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s remaining`);
        } else {
          setCountdown(`${hours}h ${minutes}m ${seconds}s remaining`);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [assignment]);

  // File Validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    const validated: typeof selectedFiles = [];
    let fileError = '';

    filesArray.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        fileError = `File ${file.name} is too large. Max limit is 10MB.`;
        return;
      }

      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg'];
      if (!allowedTypes.includes(file.type)) {
        fileError = `File ${file.name} has unsupported type. Allowed: PDF, Word Doc, PNG, JPG.`;
        return;
      }

      validated.push({
        name: file.name,
        size: file.size,
        type: file.type,
      });
    });

    if (fileError) {
      setSubmitMessage({ type: 'error', text: fileError });
    } else {
      setSelectedFiles(prev => [...prev, ...validated]);
      setSubmitMessage({ type: '', text: '' });
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleManualSave = () => {
    localStorage.setItem(`draft_assignment_${id}`, textSubmission);
    setIsSavedLocally(true);
    setTimeout(() => setIsSavedLocally(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textSubmission.trim() && selectedFiles.length === 0) {
      setSubmitMessage({ type: 'error', text: 'Please enter text or attach a file to submit.' });
      return;
    }

    const token = getCookie('session_token');
    if (!token) return;

    try {
      setUploading(true);
      setUploadProgress(10);

      const progressTimer = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressTimer);
            return 90;
          }
          return prev + 20;
        });
      }, 150);

      const fileNames = selectedFiles.map(f => f.name);

      const res = await fetch('http://localhost:5000/api/assignments/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          assignmentId: id,
          textSubmission,
          uploadedFiles: fileNames
        })
      });

      const payload = await res.json();
      clearInterval(progressTimer);
      setUploadProgress(100);

      setTimeout(async () => {
        setUploading(false);
        if (payload.success) {
          setSubmitMessage({ type: 'success', text: 'Assignment submitted successfully!' });
          localStorage.removeItem(`draft_assignment_${id}`);
          setSelectedFiles([]);
          await loadData();
        } else {
          setSubmitMessage({ type: 'error', text: payload.message || 'Submission failed.' });
        }
      }, 300);

    } catch (err) {
      setUploading(false);
      setSubmitMessage({ type: 'error', text: 'Server integration failed.' });
    }
  };

  const handleEditSubmission = async () => {
    if (!assignment?.submission) return;
    const token = getCookie('session_token');
    if (!token) return;

    try {
      setUploading(true);
      setUploadProgress(20);

      const fileNames = selectedFiles.map(f => f.name);

      const res = await fetch(`http://localhost:5000/api/assignments/submit/${assignment.submission.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          textSubmission,
          uploadedFiles: fileNames.length > 0 ? fileNames : assignment.submission.uploadedFiles
        })
      });

      const payload = await res.json();
      setUploadProgress(100);

      setTimeout(async () => {
        setUploading(false);
        if (payload.success) {
          setSubmitMessage({ type: 'success', text: 'Submission updated successfully!' });
          await loadData();
        } else {
          setSubmitMessage({ type: 'error', text: payload.message || 'Edit failed.' });
        }
      }, 300);

    } catch (e) {
      setUploading(false);
      setSubmitMessage({ type: 'error', text: 'Server integration failed.' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse select-none">
        <div className="h-8 w-24 bg-slate-100 rounded-lg"></div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-3xs space-y-4">
          <div className="h-6 w-1/3 bg-slate-200 rounded-md"></div>
          <div className="h-4 w-2/3 bg-slate-100 rounded-md"></div>
          <div className="h-16 w-full bg-slate-50 rounded-xl"></div>
        </div>
      </div>
    );
  }

  // Render the Exam Engine directly if dynamically identified as an Exam
  if (isExam && examData) {
    return <ExamEngineInteractive assignment={examData} />;
  }

  if (error || !assignment) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-100 shadow-3xs text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Error Loading Assignment</h2>
        <p className="text-sm text-slate-400 max-w-sm mb-6">{error || 'Assignment details could not be loaded.'}</p>
        <Link href="/studentdashboard/assignments" className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 font-bold text-slate-700 text-xs rounded-xl transition-colors">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const isPastDeadline = new Date() > new Date(assignment.dueDate);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Back Button & Title */}
      <div className="flex flex-col gap-4">
        <Link 
          href="/studentdashboard/assignments"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-teal-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-extrabold uppercase bg-teal-50 text-teal-600 px-2 py-0.5 rounded-md">
                {assignment.subject}
              </span>
              {assignment.marks !== null && (
                <span className="text-[10px] font-extrabold bg-teal-950 text-white px-2 py-0.5 rounded-md">
                  {assignment.marks} pts Max
                </span>
              )}
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">{assignment.title}</h1>
            <p className="text-xs text-slate-400 mt-1">Assigned by {assignment.teacherName}</p>
          </div>

          <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-2xl flex items-center gap-3 shrink-0 self-start md:self-auto">
            <Clock className="w-5 h-5 text-teal-600" />
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Time Remaining</div>
              <div className="text-xs font-bold text-slate-700">{countdown}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Assignment Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-3xs space-y-5">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 tracking-tight mb-2">Instructions</h2>
              <pre className="whitespace-pre-wrap text-sm text-slate-600 leading-relaxed font-sans bg-slate-50 border border-slate-100 rounded-2xl p-4">
                {assignment.description}
              </pre>
            </div>

            {assignment.attachments && assignment.attachments.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Reference Files / Attachments</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {assignment.attachments.map((file, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <Paperclip className="w-4 h-4 text-teal-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-700 truncate">{file}</div>
                        <div className="text-[10px] text-slate-400">PDF Document</div>
                      </div>
                      <a 
                        href={`/attachments/${file}`}
                        download 
                        className="text-[10px] font-bold text-teal-600 hover:text-teal-700 shrink-0"
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submission History Section */}
          {assignment.submission && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-3xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5">
                <CheckCircle className="w-5 h-5 text-emerald-600" /> Submitted Details
              </h3>
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-100 pb-2">
                  <span>Submitted on: {new Date(assignment.submission.submittedAt).toLocaleString()}</span>
                  <span className="font-bold text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded">Recorded</span>
                </div>
                {assignment.submission.textSubmission && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 mb-1">Your Submission:</h4>
                    <p className="text-xs text-slate-600 bg-white border border-slate-100 rounded-xl p-3 leading-relaxed whitespace-pre-wrap">
                      {assignment.submission.textSubmission}
                    </p>
                  </div>
                )}
                {assignment.submission.uploadedFiles && assignment.submission.uploadedFiles.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <h4 className="text-xs font-bold text-slate-700">Uploaded Attachments:</h4>
                    <div className="flex flex-wrap gap-2">
                      {assignment.submission.uploadedFiles.map((file, idx) => (
                        <div key={idx} className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-100 rounded-lg text-xs">
                          <File className="w-3.5 h-3.5 text-teal-600" />
                          <span className="font-medium text-slate-700">{file}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Submission Action Panel */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-3xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Submission Portal</h3>
              {isSavedLocally && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg flex items-center gap-1 animate-pulse">
                  <Check className="w-3.5 h-3.5" /> Draft Autosaved
                </span>
              )}
            </div>

            {submitMessage.text && (
              <div className={`p-3 rounded-xl text-xs font-semibold border ${submitMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                {submitMessage.text}
              </div>
            )}

            {isPastDeadline ? (
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-center space-y-2">
                <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
                <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider">Submissions Closed</h4>
                <p className="text-[11px] text-rose-600 leading-relaxed">The deadline has passed. Submissions are no longer accepted for this assignment.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Write Submission (Optional)</label>
                  <textarea 
                    placeholder="Type your response here..." 
                    value={textSubmission}
                    onChange={(e) => {
                      setTextSubmission(e.target.value);
                      setIsSavedLocally(false);
                    }}
                    className="w-full px-3.5 py-3 border border-slate-200 rounded-2xl text-xs min-h-[140px] focus:outline-none focus:ring-2 focus:ring-teal-500/20 leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Attach files</label>
                  <div className="border-2 border-dashed border-slate-200 hover:border-teal-500/50 rounded-2xl p-4 text-center cursor-pointer hover:bg-slate-50/50 transition-colors relative">
                    <input 
                      type="file" 
                      multiple 
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                    <span className="block text-xs font-semibold text-slate-600">Choose files or drag & drop</span>
                    <span className="block text-[9px] text-slate-400 mt-1">PDF, Word, PNG, JPG (Max 10MB)</span>
                  </div>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Attached Files</label>
                    <div className="space-y-1">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                          <span className="font-semibold text-slate-700 truncate max-w-[150px]">{file.name}</span>
                          <button 
                            type="button" 
                            onClick={() => removeFile(index)}
                            className="text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {uploading && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                      <span>Uploading files...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-600 transition-all duration-150" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={handleManualSave}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" /> Save Draft
                    </button>
                    {assignment.submission ? (
                      <button 
                        type="button"
                        onClick={handleEditSubmission}
                        disabled={uploading}
                        className="flex-1 py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {uploading ? 'Updating...' : 'Update Submit'}
                      </button>
                    ) : (
                      <button 
                        type="submit"
                        disabled={uploading}
                        className="flex-1 py-2.5 px-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {uploading ? 'Submitting...' : 'Submit'}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
