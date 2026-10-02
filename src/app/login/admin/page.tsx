'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  ArrowLeft,
  Building2,
  QrCode,
  ShieldAlert,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [targetDestination, setTargetDestination] = useState<'allotment' | 'gate'>('allotment');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sampleAdmins = [
    { email: 'admin@nith.ac.in', name: 'Prof. Anup Kumar', role: 'Chief Warden & Dean', target: 'allotment' as const },
    { email: 'warden.himadri@nith.ac.in', name: 'Dr. Rohit Dhiman', role: 'Warden, Himadri (HBH)', target: 'allotment' as const },
    { email: 'warden.ambika@nith.ac.in', name: 'Dr. Sunita Rao', role: 'Warden, Ambika (AGH)', target: 'allotment' as const },
    { email: 'security@nith.ac.in', name: 'Insp. Vikram Rathore', role: 'Main Gate Security Officer', target: 'gate' as const },
  ];

  const handleAdminLogin = async (emailToUse?: string, destination?: 'allotment' | 'gate') => {
    const targetEmail = (emailToUse || email).trim();
    const dest = destination || targetDestination;

    if (!targetEmail) {
      setErrorMsg('Please enter your authorized admin or warden email.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Invalid administrator authorization.');
      } else {
        if (dest === 'gate') {
          router.push('/admin/gate');
        } else {
          router.push('/admin');
        }
        router.refresh();
      }
    } catch {
      setErrorMsg('Connection error connecting to Admin Governance service.');
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

          {/* Admin Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-emerald-950/80 border border-emerald-700/60 rounded-2xl shadow-lg mb-2 text-emerald-400">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="text-xs uppercase tracking-wider text-emerald-400 font-bold">
              Restricted Access • Security Protocol
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Admin & Warden Governance
            </h1>
            <p className="text-xs text-slate-400">
              Select your administrative destination below: Gate Security or Hostel Allotment Engine.
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

            {/* 2 OPTIONS SELECTOR: Gate Entry System vs Hostel Allotment System */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Select System Destination (2 Options):
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setTargetDestination('allotment')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    targetDestination === 'allotment'
                      ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-md shadow-indigo-900/40'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-750'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Hostel Allotment</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">JOSAA Batch Engine</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetDestination('gate')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    targetDestination === 'gate'
                      ? 'bg-emerald-950/80 border-emerald-500 text-white shadow-md shadow-emerald-900/40'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-750'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                    <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Gate Entry</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Curfew & Scanner</span>
                </button>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAdminLogin();
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Official Administrative Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. admin@nith.ac.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Security Passkey
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    placeholder="Enter security key or leave blank for instant SSO"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    'Verifying Access...'
                  ) : (
                    <>
                      Enter {targetDestination === 'gate' ? 'Gate Entry System' : 'Hostel Allotment System'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick Demo Credentials */}
            <div className="pt-4 border-t border-slate-800 space-y-2.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Quick Single-Click Demo Credentials:
              </span>
              <div className="space-y-1.5">
                {sampleAdmins.map((item) => (
                  <button
                    key={item.email}
                    type="button"
                    onClick={() => {
                      setEmail(item.email);
                      setTargetDestination(item.target);
                      handleAdminLogin(item.email, item.target);
                    }}
                    className="w-full px-3 py-2 bg-slate-800/80 hover:bg-slate-750 hover:border-emerald-500/50 border border-slate-700 rounded-lg text-left text-xs transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-semibold text-slate-200 group-hover:text-emerald-300">
                        {item.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">{item.email}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-400 font-medium block">{item.role}</span>
                      <span className="text-[9px] text-slate-500 uppercase">{item.target === 'gate' ? 'Gate DB' : 'Allotment DB'}</span>
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
