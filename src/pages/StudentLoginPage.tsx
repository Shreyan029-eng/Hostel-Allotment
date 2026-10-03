import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap,
  Mail,
  KeyRound,
  ArrowRight,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';

export default function StudentLoginPage() {
  const navigate = useNavigate();
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
      setErrorMsg('Please enter your Institute email (roll_number@nith.ac.in) or roll number.');
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
        setSuccessMsg(`A 6-digit verification code has been dispatched to ${data.email}.`);
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
        navigate('/student');
      }
    } catch {
      setErrorMsg('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-900 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Portal Home
          </Link>

          {/* Institution Header Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-4 text-center">
              <span className="text-[11px] uppercase tracking-wider text-blue-900 font-bold block">
                National Institute of Technology Hamirpur
              </span>
              <h1 className="text-xl font-bold text-slate-900 mt-1">
                Student OTP Login
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                Secure login via 6-digit one-time passcode sent to student email.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && !errorMsg && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-900 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-800 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Simulated Live Mail Delivery Box */}
            {receivedOtp && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <Mail className="w-3.5 h-3.5 text-blue-900" />
                    <span>NITH Mail Inbox Dispatch</span>
                  </div>
                  <span className="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-mono font-semibold">
                    Simulated SMS/Email
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <span className="text-[11px] text-slate-600">Verification Code:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold tracking-widest text-blue-950 font-mono bg-white px-2.5 py-0.5 rounded border border-slate-300">
                      {receivedOtp}
                    </span>
                    <button
                      type="button"
                      onClick={() => setOtp(receivedOtp)}
                      className="px-2 py-1 text-[11px] font-semibold bg-blue-900 hover:bg-blue-800 text-white rounded transition-colors"
                    >
                      Autofill
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 'ENTER_EMAIL' ? (
              /* STEP 1: ENTER INSTITUTE EMAIL */
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendOtp();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Institute Email / Roll Number
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. 25bee012@nith.ac.in or 25BEE012"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900 font-mono shadow-xs"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Format: <code className="text-blue-900 font-semibold font-mono">roll_number@nith.ac.in</code>
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs rounded shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    'Generating & Sending OTP...'
                  ) : (
                    <>
                      Send 6-Digit OTP
                      <ArrowRight className="w-3.5 h-3.5" />
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
                <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-0.5">
                  <div className="text-slate-500 text-[11px]">Signing in as:</div>
                  <div className="font-bold text-slate-900 text-xs">{studentInfo?.name}</div>
                  <div className="font-mono text-blue-900 text-[11px]">{studentInfo?.email}</div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Enter 6-Digit OTP
                    </label>
                    <button
                      type="button"
                      onClick={() => handleSendOtp(studentInfo?.email)}
                      className="text-[11px] text-blue-900 hover:underline font-medium inline-flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Resend Code
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="e.g. 583921"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded text-base tracking-widest text-center text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900 font-mono font-bold shadow-xs"
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
                    className="w-1/3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded border border-slate-300 transition-colors"
                  >
                    Change Email
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || otp.length !== 6}
                    className="flex-1 py-2 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      'Verifying...'
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verify &amp; Enter
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="text-xs text-blue-900 hover:underline font-semibold"
              >
                Use Standard Password Login instead &rarr;
              </Link>
            </div>

            {/* Quick Demo Login Chips */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Sample Student Profiles (Batches 2023, 2024, 2025):
              </span>
              <div className="space-y-1.5">
                {sampleLogins.map((item) => (
                  <button
                    key={item.email}
                    type="button"
                    onClick={() => {
                      setIdentifier(item.email);
                      handleSendOtp(item.email);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-300 border border-slate-200 rounded text-left text-xs transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">
                        {item.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">{item.email}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-blue-900 font-bold font-mono block">
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
