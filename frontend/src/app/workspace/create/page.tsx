'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/ToastProvider';
import {
  Sparkles,
  Building2,
  Mail,
  Users,
  MapPin,
  Check,
  ChevronRight,
  ChevronLeft,
  Info,
  Globe
} from 'lucide-react';

async function apiPost<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const resBody = (await res.json().catch(() => null)) as any;
  if (!res.ok || !resBody?.success) {
    throw new Error(resBody?.error?.message || 'Failed to submit request');
  }
  return resBody.data as T;
}

export default function WorkspaceCreatePage() {
  const router = useRouter();
  const { showError, showMessage } = useToast();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Institution Info
  const [name, setName] = useState('');
  const [institutionType, setInstitutionType] = useState('Tuition Center');
  const [description, setDescription] = useState('');

  // Step 2: Contact
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [email, setEmail] = useState('');

  // Step 3: Size & Academic Type
  const [studentsCount, setStudentsCount] = useState('1-50');
  const [teachersCount, setTeachersCount] = useState('1-50');
  const [academicType, setAcademicType] = useState('Offline');

  // Step 4: Address & Links
  const [country, setCountry] = useState('India');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [twitter, setTwitter] = useState('');
  const [linkedin, setLinkedin] = useState('');

  const nextStep = () => {
    // Validation
    if (step === 1) {
      if (!name.trim()) return showMessage('Please provide the institution name.', 'info');
    }
    if (step === 2) {
      if (!contactName.trim() || !phone.trim() || !email.trim()) {
        return showMessage('Please fill all required contact parameters.', 'info');
      }
    }
    if (step === 4) {
      if (!city.trim() || !address.trim() || !state.trim()) {
        return showMessage('Please complete address coordinates.', 'info');
      }
    }
    setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await apiPost('/api/principal/workspace-request', {
        name,
        institutionType,
        description,
        contactName,
        phone,
        altPhone,
        email,
        studentsCount,
        teachersCount,
        academicType,
        country,
        state,
        city,
        address,
        website,
        socialLinks: { twitter, linkedin },
      });
      showMessage('Your Workspace Request has been submitted successfully!', 'success');
      router.push('/workspace/request-status');
    } catch (e: any) {
      showError(e);
    } finally {
      setLoading(false);
    }
  };

  const stepsList = [
    { title: 'Institution Info', icon: Building2 },
    { title: 'Contact Parameters', icon: Mail },
    { title: 'Sizing & Scale', icon: Users },
    { title: 'Locations', icon: MapPin },
    { title: 'Review & Submit', icon: Check },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-y-auto select-none">
      
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-[40%] h-[40%] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[40%] h-[40%] rounded-full bg-violet-500/5 blur-[120px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="max-w-7xl w-full mx-auto px-6 py-5 flex items-center justify-between border-b border-slate-900 z-10">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" className="w-7 h-7 object-contain rounded-lg shadow-md" alt="Logo" />
          <span className="font-extrabold text-base tracking-tight text-white">
            EDUsphere
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-extrabold uppercase bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
          Principal Portal Request
        </span>
      </header>

      {/* Progress Timeline Header */}
      <div className="max-w-4xl w-full mx-auto px-6 pt-10 z-10">
        <div className="flex justify-between items-center relative w-full">
          {/* Timeline Connector Line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -translate-y-1/2 z-0" />
          <div 
            className="absolute top-1/2 left-0 h-0.5 bg-teal-500 -translate-y-1/2 z-0 transition-all duration-300"
            style={{ width: `${((step - 1) / (stepsList.length - 1)) * 100}%` }}
          />

          {stepsList.map((item, index) => {
            const stepNum = index + 1;
            const isCompleted = stepNum < step;
            const isActive = stepNum === step;
            const Icon = item.icon;

            return (
              <div key={index} className="flex flex-col items-center z-10">
                <div 
                  className={`w-9 h-9 rounded-full flex items-center justify-center border font-bold text-xs transition-all duration-300 ${
                    isCompleted
                      ? 'bg-teal-500 text-slate-950 border-teal-500 shadow-teal-500/20 shadow-md'
                      : isActive
                      ? 'bg-slate-900 text-teal-400 border-teal-500/80 shadow-md ring-2 ring-teal-500/10'
                      : 'bg-slate-950 text-slate-500 border-slate-850'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span 
                  className={`text-[9px] font-extrabold uppercase mt-2 hidden sm:block tracking-wide ${
                    isActive ? 'text-teal-400 font-black' : isCompleted ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  {item.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Area */}
      <main className="max-w-xl w-full mx-auto px-6 py-10 flex-1 flex items-center justify-center z-10">
        <div className="bg-slate-900/60 border border-slate-850 rounded-3xl p-6 md:p-8 w-full shadow-2xl backdrop-blur-3xs space-y-6">
          
          {/* STEP 1: Institution Info */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white flex items-center gap-1.5">
                  Institution Information
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Please specify core credentials for the academy.</p>
              </div>

              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Workspace Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Oxford Excellence Tuition"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Institution Type *</label>
                  <select
                    value={institutionType}
                    onChange={e => setInstitutionType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500/50"
                  >
                    <option value="Tuition Center">Tuition Center</option>
                    <option value="School">School</option>
                    <option value="Coaching Institute">Coaching Institute</option>
                    <option value="College">College</option>
                    <option value="Training Center">Training Center</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Description</label>
                    <span className="text-[9px] font-extrabold text-slate-500 tracking-wider">
                      {description.length}/300
                    </span>
                  </div>
                  <textarea
                    maxLength={300}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Provide a brief summary of the institution curriculum..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500/50 min-h-24 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Contact Information */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white">Contact Information</h3>
                <p className="text-[10px] text-slate-400 font-medium">Verify channels for administrator communications.</p>
              </div>

              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Contact Person Name *</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={e => setContactName(e.target.value)}
                    placeholder="e.g. Dr. Ramesh Gupta"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Alternate Phone</label>
                  <input
                    type="text"
                    value={altPhone}
                    onChange={e => setAltPhone(e.target.value)}
                    placeholder="e.g. +91 95000 87654"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Official Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. admin@oxford.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500/50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Scale & Academic Type */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white">Sizing & Scale parameters</h3>
                <p className="text-[10px] text-slate-400 font-medium">Help us scale the infrastructure for your cohort size.</p>
              </div>

              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Estimated Student Count *</label>
                  <select
                    value={studentsCount}
                    onChange={e => setStudentsCount(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500/50"
                  >
                    <option value="1-50">1 - 50 Students</option>
                    <option value="51-100">51 - 100 Students</option>
                    <option value="101-250">101 - 250 Students</option>
                    <option value="251-500">251 - 500 Students</option>
                    <option value="500+">500+ Students</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Estimated Teacher Count *</label>
                  <select
                    value={teachersCount}
                    onChange={e => setTeachersCount(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500/50"
                  >
                    <option value="1-5">1 - 5 Tutors</option>
                    <option value="6-15">6 - 15 Tutors</option>
                    <option value="16-30">16 - 30 Tutors</option>
                    <option value="31-50">31 - 50 Tutors</option>
                    <option value="50+">50+ Tutors</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Academic Delivery Type *</label>
                  <select
                    value={academicType}
                    onChange={e => setAcademicType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500/50"
                  >
                    <option value="Offline">Offline Classroom Instruction</option>
                    <option value="Online">Online Virtual Academy</option>
                    <option value="Hybrid">Hybrid Cohort Delivery</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Locations & Websites */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white">Geographic parameters</h3>
                <p className="text-[10px] text-slate-400 font-medium">Verify primary physical coordinates of the campus.</p>
              </div>

              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Country *</label>
                    <input
                      type="text"
                      required
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">State *</label>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={e => setState(e.target.value)}
                      placeholder="e.g. Maharashtra"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="e.g. Mumbai"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Address Line *</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="e.g. 104 Park Avenue Road, Block B"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Institution Website (Optional)</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={website}
                      onChange={e => setWebsite(e.target.value)}
                      placeholder="e.g. www.oxford.com"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Review & Submit */}
          {step === 5 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white flex items-center gap-1">
                  Review & Confirm
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Verify your workspace details before registration submission.</p>
              </div>

              <div className="space-y-3.5 bg-slate-950/60 p-4 border border-slate-850 rounded-2xl text-xs max-h-72 overflow-y-auto">
                <div className="space-y-2">
                  <h4 className="text-[10px] font-extrabold text-teal-400 uppercase tracking-wider">Institution Parameters</h4>
                  <div className="grid grid-cols-2 gap-2 text-slate-300">
                    <div>Workspace Name:</div>
                    <div className="font-extrabold text-white text-right">{name}</div>
                    
                    <div>Institution Type:</div>
                    <div className="font-extrabold text-white text-right">{institutionType}</div>
                    
                    {description && (
                      <>
                        <div className="col-span-2 text-[10px] text-slate-400 border-t pt-1.5 mt-1">Bio Summary:</div>
                        <div className="col-span-2 bg-slate-900 border rounded-lg p-2.5 mt-1 font-medium">{description}</div>
                      </>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-850 pt-3 space-y-2">
                  <h4 className="text-[10px] font-extrabold text-teal-400 uppercase tracking-wider">Contact Person</h4>
                  <div className="grid grid-cols-2 gap-2 text-slate-300">
                    <div>Administrator:</div>
                    <div className="font-extrabold text-white text-right">{contactName}</div>
                    
                    <div>Mobile:</div>
                    <div className="font-extrabold text-white text-right">{phone}</div>
                    
                    <div>Official Email:</div>
                    <div className="font-extrabold text-white text-right">{email}</div>
                  </div>
                </div>

                <div className="border-t border-slate-850 pt-3 space-y-2">
                  <h4 className="text-[10px] font-extrabold text-teal-400 uppercase tracking-wider">Address Parameters</h4>
                  <div className="grid grid-cols-2 gap-2 text-slate-300">
                    <div>Coordinates:</div>
                    <div className="font-extrabold text-white text-right">{city}, {state}, {country}</div>
                    
                    <div>Full Address:</div>
                    <div className="font-extrabold text-white text-right">{address}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-950/40 p-3.5 border rounded-xl">
                <Info className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                  EDUsphere restricts workspaces to verified entities. Your request will enter the pending review queue. Super Admins will validate your institution credentials before activation.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex gap-3 pt-3 border-t border-slate-850">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center justify-center gap-1 px-4 py-2.5 border border-slate-800 hover:bg-slate-800 font-extrabold text-xs rounded-xl transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
            )}
            
            {step < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex-1 flex items-center justify-center gap-1 px-4 py-2.5 bg-teal-950 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Submitting request...' : 'Request Workspace'}
              </button>
            )}
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-6 text-[10px] text-slate-700 font-medium z-10 border-t border-slate-900">
        © {new Date().getFullYear()} EDUsphere Examination Portal.
      </footer>
    </div>
  );
}
