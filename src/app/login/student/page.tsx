'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap,
  Mail,
  KeyRound,
  ArrowRight,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';

export default function StudentLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [step, setStep] = useState<'ENTER_EMAIL' | 'ENTER_OTP'>('ENTER_EMAIL');
  const [otp, setOtp] = useState('');
  const [receivedOtp, setReceivedOtp] = useState<string | null>(null);
  const [studentInfo, setStudentInfo] = useState<{ name: string; email: string; roll_no: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const sampleLogins = [
    { email: '25bee012@nith.ac.in', name: 'ANIRUDH BHARDWAJ', batch: '2025 (Year 2)', cgpa: 7.38 },
    { email: '24bme039@nith.ac.in', name: 'HARSHIT THAKUR', batch: '2024 (Year 3)', cgpa: 8.40 },
    { email: '24bcs048@nith.ac.in', name: 'GURKHE RITESH RAJENDRA', batch: '2024 (Year 3)', cgpa: 8.28 },
    { email: '25bme076@nith.ac.in', name: 'PRISHA KHANDELWAL', batch: '2025 (Year 2 Girls)', cgpa: 8.93 },
    { email: '23bms022@nith.ac.in', name: 'MOHIT SHARMA', batch: '2023 (Year 4)', cgpa: 5.09 },
  ];

  // Step 1: Send 6-digit OTP
  const handleSendOtp = async (idToUse?: string) => {
    const id = (idToUse || identifier).trim().toLowerCase();
    if (!id) {
      setErrorMsg('Please enter your NITH college email (roll_number@nith.ac.in) or roll number.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/auth/student/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: id }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to dispatch verification OTP.');
      } else {
        setStudentInfo({ name: data.name, email: data.email, roll_no: data.roll_no });
        setReceivedOtp(data.otp);
        setStep('ENTER_OTP');
        setSuccessMsg(`A 6-digit OTP has been dispatched to ${data.email}.`);
      }
    } catch {
      setErrorMsg('Network error connecting to NITH authentication service.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify 6-digit OTP
  const handleVerifyOtp = async () => {
    if (!otp || otp.trim().length !== 6) {
      setErrorMsg('Please enter the 6-digit verification OTP.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/student/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: studentInfo?.roll_no || identifier,
          otp: otp.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Invalid or expired OTP code.');
      } else {
        router.push('/student');
        router.refresh();
      }
    } catch {
      setErrorMsg('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Portal Home
          </Link>

          {/* Institution Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-indigo-900/50 border border-indigo-700/60 rounded-2xl shadow-lg mb-2">
              <GraduationCap className="w-8 h-8 text-indigo-400" />
            </div>
            <div className="text-xs uppercase tracking-wider text-indigo-400 font-bold">
              National Institute of Technology Hamirpur
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Student Portal Login
            </h1>
            <p className="text-xs text-slate-400">
              Sign in with your official NITH college email and random 6-digit OTP verification.
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            {errorMsg && (
              <div className="p-3.5 bg-rose-950/60 border border-rose-700/60 rounded-xl text-rose-200 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Simulated Live Mail Delivery Box */}
            {receivedOtp && (
              <div className="p-4 bg-emerald-950/80 border border-emerald-600/60 rounded-xl text-xs text-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-emerald-300">
                    <Mail className="w-4 h-4" />
                    <span>NITH Mail Inbox (Simulated Dispatch)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-800/80 px-2 py-0.5 rounded-full font-mono">
                    Direct OTP
                  </span>
                </div>
                <p className="text-[11px] text-emerald-100">
                  Recipient: <span className="font-mono font-semibold">{studentInfo?.email}</span>
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-emerald-800/60">
                  <span className="text-[11px] text-emerald-300">One-Time Verification Code:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black tracking-widest text-white font-mono bg-emerald-900/90 px-3 py-1 rounded-lg border border-emerald-500/50">
                      {receivedOtp}
                    </span>
                    <button
                      type="button"
                      onClick={() => setOtp(receivedOtp)}
                      className="px-2 py-1 text-[10px] font-bold bg-emerald-700 hover:bg-emerald-600 text-white rounded transition-colors"
                    >
                      Autofill
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 'ENTER_EMAIL' ? (
              /* STEP 1: ENTER COLLEGE EMAIL */
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendOtp();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    NITH College Email / Roll Number
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. 25bee012@nith.ac.in or 25BEE012"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    College mail format: <code className="text-indigo-400">roll_number@nith.ac.in</code>
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    'Generating & Sending OTP...'
                  ) : (
                    <>
                      Send 6-Digit OTP
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* STEP 2: ENTER 6-DIGIT OTP */
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleVerifyOtp();
                }}
                className="space-y-4"
              >
                <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs space-y-1">
                  <div className="text-slate-400 text-[11px]">Signing in as:</div>
                  <div className="font-bold text-white text-sm">{studentInfo?.name}</div>
                  <div className="font-mono text-indigo-400 text-[11px]">{studentInfo?.email}</div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Enter 6-Digit OTP
                    </label>
                    <button
                      type="button"
                      onClick={() => handleSendOtp(studentInfo?.email)}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Resend Code
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="e.g. 583921"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-base tracking-widest text-center text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('ENTER_EMAIL');
                      setOtp('');
                      setErrorMsg(null);
                    }}
                    className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                  >
                    Change Email
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || otp.length !== 6}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      'Verifying...'
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Verify & Login
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Quick Demo Login Chips */}
            <div className="pt-4 border-t border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Quick Single-Click Demo Students:
                </span>
                <span className="text-[10px] text-indigo-400 flex items-center gap-1 font-semibold">
                  <Sparkles className="w-3 h-3" /> Auto-dispatches OTP
                </span>
              </div>
              <div className="space-y-1.5">
                {sampleLogins.map((item) => (
                  <button
                    key={item.email}
                    type="button"
                    onClick={() => {
                      setIdentifier(item.email);
                      handleSendOtp(item.email);
                    }}
                    className="w-full px-3 py-2 bg-slate-800/80 hover:bg-slate-750 hover:border-indigo-500/50 border border-slate-700 rounded-lg text-left text-xs transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-semibold text-slate-200 group-hover:text-indigo-300">
                        {item.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">{item.email}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-amber-400 font-bold block">
                        CGPA {item.cgpa.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-500">{item.batch}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
