import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/Navbar';
import { CheckCircle2, Loader2, ArrowLeft, RefreshCw, ShieldAlert } from 'lucide-react';

const STUDENT_EMAIL_REGEX = /^[0-9]{2}[a-z]{2,4}[0-9]{2,4}@\.?nith\.ac\.in$/i;
const ADMIN_EMAIL_REGEX = /@\.?nith\.ac\.in$/i;

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expectedFormat, setExpectedFormat] = useState<string>('roll_number@nith.ac.in');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [portalType, setPortalType] = useState<'student' | 'admin'>('student');

  useEffect(() => {
    let isMounted = true;

    async function handleAuthCallback() {
      try {
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

        // Determine intended portal (student vs admin)
        const portal =
          params.get('portal') ||
          hashParams.get('portal') ||
          localStorage.getItem('auth_portal_type') ||
          'student';

        const isUserAdmin = portal === 'admin';
        if (isMounted) {
          setPortalType(isUserAdmin ? 'admin' : 'student');
          setExpectedFormat(isUserAdmin ? '@nith.ac.in' : 'roll_number@nith.ac.in');
        }

        // 1. Check URL parameters for OAuth errors (e.g. database trigger rejection)
        const error = params.get('error') || hashParams.get('error');
        const errorDescription =
          params.get('error_description') || hashParams.get('error_description');

        if (error || errorDescription) {
          if (!isMounted) return;
          setStatus('error');
          const cleanDesc = decodeURIComponent(errorDescription || error || 'OAuth authentication failed.');
          setErrorMessage(
            cleanDesc.includes('Access denied')
              ? cleanDesc
              : isUserAdmin
              ? 'Access denied: Admin email must end with @nith.ac.in'
              : 'Access denied: Student email must be in the format roll_number@nith.ac.in'
          );
          return;
        }

        const supabase = createClient();
        if (!supabase) {
          if (!isMounted) return;
          setStatus('error');
          setErrorMessage('Supabase client could not be initialized.');
          return;
        }

        // 2. Exchange code if code flow
        const code = params.get('code');
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error('Code exchange error:', exchangeError);
          }
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          if (!isMounted) return;
          setStatus('error');
          setErrorMessage(sessionError.message);
          return;
        }

        if (!session || !session.user || !session.user.email) {
          // Listen once for auth state change
          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
            if (newSession?.user?.email) {
              subscription.unsubscribe();
              await processVerifiedUser(newSession.user.email, newSession.access_token, isUserAdmin);
            }
          });

          setTimeout(() => {
            if (isMounted && status === 'loading') {
              setStatus('error');
              setErrorMessage('Authentication timed out or no active Google session was detected.');
            }
          }, 6000);
          return;
        }

        await processVerifiedUser(session.user.email, session.access_token, isUserAdmin);
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Authentication verification failed.';
        setStatus('error');
        setErrorMessage(msg);
      }
    }

    async function processVerifiedUser(email: string, accessToken: string, isUserAdmin: boolean) {
      if (!isMounted) return;
      setUserEmail(email);
      const cleanEmail = email.trim().toLowerCase();

      // =========================================================================
      // CASE 1: ADMIN PORTAL AUTHENTICATION
      // Roll number is NOT required. Only checks for @nith.ac.in
      // =========================================================================
      if (isUserAdmin) {
        if (!ADMIN_EMAIL_REGEX.test(cleanEmail)) {
          setStatus('error');
          setExpectedFormat('@nith.ac.in');
          setErrorMessage(
            `Access denied. Official administrator account required. Expected format: @nith.ac.in`
          );
          const supabase = createClient();
          if (supabase) await supabase.auth.signOut();
          return;
        }

        try {
          const response = await fetch('/api/auth/google-admin-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail, access_token: accessToken }),
          });

          let data: { success?: boolean; error?: string; admin?: { role?: string } } | null = null;
          try {
            data = await response.json();
          } catch {
            throw new Error('Backend server returned non-JSON response. Ensure Express backend is running on port 5000.');
          }

          if (!response.ok || !data?.success) {
            setStatus('error');
            setExpectedFormat('@nith.ac.in');
            setErrorMessage(data?.error || 'Access denied: Admin email must end with @nith.ac.in');
            return;
          }

          setStatus('success');
          setTimeout(() => {
            if (data?.admin?.role === 'security_officer') {
              navigate('/admin/gate');
            } else {
              navigate('/admin');
            }
          }, 800);
        } catch (err: unknown) {
          console.error('Administrator verification failed:', err);
          setStatus('error');
          setErrorMessage('Failed to connect to NITH backend server to verify administrator session.');
        }
        return;
      }

      // =========================================================================
      // CASE 2: STUDENT PORTAL AUTHENTICATION
      // Strictly enforces roll number format: roll_number@nith.ac.in
      // =========================================================================
      if (!STUDENT_EMAIL_REGEX.test(cleanEmail)) {
        setStatus('error');
        setExpectedFormat('roll_number@nith.ac.in');
        setErrorMessage(
          `Access denied. Student email does not match institutional criteria. Expected format: roll_number@nith.ac.in`
        );
        const supabase = createClient();
        if (supabase) await supabase.auth.signOut();
        return;
      }

      try {
        const response = await fetch('/api/auth/google-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, access_token: accessToken }),
        });

        let data: { success?: boolean; error?: string } | null = null;
        try {
          data = await response.json();
        } catch {
          throw new Error('Backend server returned non-JSON response. Ensure Express backend is running on port 5000.');
        }

        if (!response.ok || !data?.success) {
          setStatus('error');
          setExpectedFormat('roll_number@nith.ac.in');
          setErrorMessage(
            data?.error || 'Access denied: Student email must be in the format roll_number@nith.ac.in'
          );
          return;
        }

        setStatus('success');
        setTimeout(() => {
          navigate('/student');
        }, 800);
      } catch (err: unknown) {
        console.error('Student session verification failed:', err);
        setStatus('error');
        setErrorMessage('Failed to connect to NITH backend server to verify student session.');
      }
    }

    handleAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-4 text-center">
            <span className="text-[11px] uppercase tracking-wider text-blue-900 font-bold block">
              National Institute of Technology Hamirpur
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              {portalType === 'admin' ? 'Admin Google Authentication' : 'Student Google Authentication'}
            </h1>
          </div>

          {status === 'loading' && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 text-blue-900 animate-spin" />
              <p className="text-sm font-medium text-slate-700">
                Verifying your NITH Google credentials...
              </p>
              <p className="text-xs text-slate-500">
                {portalType === 'admin'
                  ? 'Verifying administrative authorization (@nith.ac.in)...'
                  : 'Validating student format (roll_number@nith.ac.in)...'}
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              <p className="text-sm font-bold text-slate-900">
                Authentication Successful!
              </p>
              <p className="text-xs text-slate-600">
                Welcome, {userEmail}. Redirecting you to the {portalType === 'admin' ? 'Administration' : 'Student'} Portal...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-red-800">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                  <span>
                    {errorMessage?.includes('Failed to connect')
                      ? 'Server Connection Issue'
                      : 'Authentication Denied'}
                  </span>
                </div>
                <p className="text-red-700 leading-relaxed font-medium">{errorMessage}</p>

                {/* Show format helper ONLY when relevant to institutional email format failure */}
                {Boolean(
                  errorMessage &&
                    !errorMessage.includes('Failed to connect') &&
                    (errorMessage.toLowerCase().includes('format') ||
                      errorMessage.toLowerCase().includes('criteria') ||
                      errorMessage.toLowerCase().includes('denied') ||
                      errorMessage.toLowerCase().includes('expected'))
                ) && (
                  <div className="pt-2 border-t border-red-200/60 text-[11px] text-red-700 flex items-center justify-between">
                    <span>Expected format:</span>
                    <code className="font-mono font-bold bg-white text-red-900 px-2 py-0.5 rounded border border-red-200">
                      {expectedFormat}
                    </code>
                  </div>
                )}

                {/* Show troubleshooting steps if connection to backend failed */}
                {Boolean(errorMessage && errorMessage.includes('Failed to connect')) && (
                  <div className="pt-2 border-t border-red-200/60 text-[11px] text-red-800 space-y-1">
                    <p className="font-semibold text-slate-800">How to resolve:</p>
                    <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
                      <li>Start both backend and frontend together with <code className="bg-slate-100 text-slate-900 px-1 py-0.5 rounded font-mono font-bold">npm run dev</code></li>
                      <li>Check that the API server is listening on port 5000</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Link
                  to={portalType === 'admin' ? '/login/admin' : '/login/student'}
                  className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs rounded text-center shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Try Again with Authorized Account
                </Link>

                <Link
                  to="/"
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded text-center transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Portal Home
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
