import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  ArrowLeft,
  Building2,
  QrCode,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';

export default function AdminLoginPage() {
  const navigate = useNavigate();
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
      setErrorMsg('Please enter your authorized Institute administrative email.');
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
          navigate('/admin/gate');
        } else {
          navigate('/admin');
        }
      }
    } catch {
      setErrorMsg('Connection error connecting to Admin Governance service.');
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
                Institute &amp; Warden Administration
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                Authorized access for Wardens, Deans, and Campus Security Staff.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Destination Toggle */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Target Administrative Module:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetDestination('allotment')}
                  className={`p-2.5 rounded border text-left transition-all ${
                    targetDestination === 'allotment'
                      ? 'bg-blue-50 border-blue-900 text-blue-950 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Building2 className="w-3.5 h-3.5 text-blue-900" />
                    <span>Hostel Allotment</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Allocation Engine</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetDestination('gate')}
                  className={`p-2.5 rounded border text-left transition-all ${
                    targetDestination === 'gate'
                      ? 'bg-blue-50 border-blue-900 text-blue-950 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <QrCode className="w-3.5 h-3.5 text-blue-900" />
                    <span>Gate Terminal</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Curfew &amp; Scanner</span>
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
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Administrative Email ID
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. admin@nith.ac.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900 font-mono shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Security Passkey
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    placeholder="Enter security key or leave blank for instant login"
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
                  'Verifying...'
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Sign In as Administrator
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Accounts */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Direct Administrative Roles:
              </span>
              <div className="space-y-1.5">
                {sampleAdmins.map((item) => (
                  <button
                    key={item.email}
                    type="button"
                    onClick={() => {
                      setEmail(item.email);
                      handleAdminLogin(item.email, item.target);
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
                      <span className="text-[10px] text-blue-900 font-bold block">
                        {item.role}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase font-mono">
                        &rarr; {item.target === 'gate' ? 'Gate Security' : 'Hostel Allotment'}
                      </span>
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
