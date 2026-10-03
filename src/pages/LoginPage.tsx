import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';

export default function LoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sampleLogins = [
    { email: '25bee012@nith.ac.in', name: 'Anirudh Bhardwaj', batch: '2025 (Year 2)', cgpa: 7.38 },
    { email: '24bcs048@nith.ac.in', name: 'Gurkhe Ritesh Rajendra', batch: '2024 (Year 3)', cgpa: 8.28 },
    { email: '24bme039@nith.ac.in', name: 'Harshit Thakur', batch: '2024 (Year 3)', cgpa: 8.40 },
    { email: '23bcs129@nith.ac.in', name: 'Shriya Chaudhary', batch: '2023 (Year 4)', cgpa: 7.94 },
    { email: '23bch025@nith.ac.in', name: 'Hariom', batch: '2023 (Year 4)', cgpa: 9.13 },
  ];

  const handleLogin = async (idToUse?: string) => {
    const id = (idToUse || identifier).trim();
    if (!id) {
      setErrorMsg('Please enter your Institute email (roll_number@nith.ac.in) or roll number.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_or_roll: id }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to authenticate student credentials.');
      } else {
        navigate('/student');
      }
    } catch {
      setErrorMsg('Connection error connecting to NITH authentication service.');
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
                Student Sign In
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                Enter your Institute credentials to participate in Hostel Allotment Round 1.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
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
                    placeholder="e.g. 23bcs129@nith.ac.in"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900 font-mono shadow-xs"
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Format: <code className="text-blue-900 font-semibold">roll_number@nith.ac.in</code> or roll number
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Institute Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    placeholder="Enter password or leave blank for instant login"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900 shadow-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs rounded shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  'Authenticating...'
                ) : (
                  <>
                    Sign In &amp; Proceed
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2">
              <Link
                to="/login/student"
                className="text-xs text-blue-900 hover:underline font-semibold"
              >
                Prefer 6-Digit Email OTP Login? Click here &rarr;
              </Link>
            </div>

            {/* Quick Demo Login Chips */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Direct Verification Credentials:
              </span>
              <div className="space-y-1.5">
                {sampleLogins.map((item) => (
                  <button
                    key={item.email}
                    type="button"
                    onClick={() => {
                      setIdentifier(item.email);
                      handleLogin(item.email);
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
                      <span className="text-[10px] text-blue-900 font-bold block font-mono">
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
