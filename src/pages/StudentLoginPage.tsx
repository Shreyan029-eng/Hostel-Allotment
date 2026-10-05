import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { createClient } from '@/lib/supabase/client';

export default function StudentLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);

      // Record portal type so callback validates student format
      localStorage.setItem('auth_portal_type', 'student');

      const supabase = createClient();
      if (!supabase) {
        setErrorMsg('Supabase client is not configured.');
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?portal=student`,
          queryParams: {
            hd: 'nith.ac.in',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setIsLoading(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google authentication failed';
      setErrorMsg(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-900 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Portal Home
          </Link>

          {/* Institution Header Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-5 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900 mb-3">
                <GraduationCap className="w-6 h-6 text-blue-900" />
              </div>
              <span className="text-[11px] uppercase tracking-wider text-blue-900 font-bold block">
                National Institute of Technology Hamirpur
              </span>
              <h1 className="text-xl font-bold text-slate-900 mt-1">
                Student Portal Sign In
              </h1>
              <p className="text-xs text-slate-600 mt-1.5">
                Central Hostel Allotment &amp; Roommate Choice Filling Portal
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-md text-red-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-red-900">Sign-in Failed</p>
                  <p>{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Sole Login Action: Google Authentication */}
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm border-2 border-slate-300 hover:border-blue-900 rounded-lg shadow-xs transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 text-blue-900 animate-spin" />
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign In with Google</span>
                  </>
                )}
              </button>

              <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-[11px] text-slate-600 space-y-1">
                <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-900" />
                  <span>Institutional Authentication Notice</span>
                </div>
                <p>
                  Only official NITH student emails are authorized. The expected format is:
                </p>
                <div className="pt-0.5">
                  <code className="font-mono font-bold text-blue-950 bg-white px-2 py-0.5 rounded border border-slate-200 block text-center">
                    roll_number@nith.ac.in
                  </code>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Are you a Warden or Admin?</span>
              <Link
                to="/login/admin"
                className="text-blue-900 hover:underline font-semibold"
              >
                Admin Sign In &rarr;
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
