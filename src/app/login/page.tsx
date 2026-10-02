'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Building2,
  Sparkles,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';

export default function LoginPage() {
  const router = useRouter();
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
      setErrorMsg('Please enter your college email (roll_number@nith.ac.in) or roll number.');
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
        router.push('/student');
        router.refresh();
      }
    } catch {
      setErrorMsg('Connection error connecting to NITH authentication service.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          {/* Institution Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-indigo-900/50 border border-indigo-700/60 rounded-2xl shadow-lg mb-2">
              <GraduationCap className="w-8 h-8 text-indigo-400" />
            </div>
            <div className="text-xs uppercase tracking-wider text-indigo-400 font-bold">
              National Institute of Technology Hamirpur
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Student Hostel Allotment Portal
            </h1>
            <p className="text-xs text-slate-400">
              Sign in with your official college credentials to participate in Round 1 choice filling.
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

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
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
                    placeholder="e.g. 23bcs129@nith.ac.in"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Accepted format: <code className="text-indigo-400">roll_number@nith.ac.in</code> or roll number
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Institute Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    placeholder="Enter password or leave blank for instant SSO"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  'Authenticating...'
                ) : (
                  <>
                    Sign In to Student Portal
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Login Chips */}
            <div className="pt-4 border-t border-slate-800 space-y-2.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Quick Single-Click Demo Credentials (Batches 2023, 2024, 2025):
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
