import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { GateScanner } from '@/components/GateScanner';
import { Student, AdminUser } from '@/lib/db/types';
import { ShieldCheck, Lock, ArrowRight, QrCode } from 'lucide-react';

export default function GatePage() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const verifyAdminAuth = async () => {
    setIsLoading(true);
    try {
      const authRes = await fetch('/api/auth/admin/me');
      const authData = await authRes.json();

      if (!authData.authenticated || !authData.admin) {
        setAdmin(null);
        setIsLoading(false);
        return;
      }

      if (authData.admin.role !== 'security_officer') {
        navigate('/admin', { replace: true });
        return;
      }

      setAdmin(authData.admin);

      // Load sample student registry data for quick-scan buttons
      const dataRes = await fetch('/api/admin/data?limit=12');
      const data = await dataRes.json();
      if (data.students) setStudents(data.students);
    } catch (err) {
      console.error('Error authenticating admin:', err);
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    verifyAdminAuth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar
        currentAdmin={admin}
        onLogout={() => {
          setAdmin(null);
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <div className="w-8 h-8 border-3 border-blue-900/20 border-t-blue-900 rounded-full animate-spin"></div>
            <p className="text-xs text-slate-600 font-medium">Verifying security credentials...</p>
          </div>
        ) : !admin ? (
          /* Admin Access Denied Gate */
          <div className="max-w-md mx-auto my-12 bg-white border border-slate-200 rounded-lg p-6 sm:p-8 text-center space-y-5 shadow-xs">
            <div className="w-12 h-12 rounded bg-slate-100 border border-slate-300 flex items-center justify-center mx-auto text-slate-800 shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] uppercase tracking-wider text-blue-900 font-bold block">
                Restricted Terminal
              </span>
              <h2 className="text-xl font-bold text-slate-900">Security Terminal Access</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Campus Gate Barcode Scanner and movement logs are accessible only to authorized Institute Administrators, Wardens, and Security Staff.
              </p>
            </div>

            <Link
              to="/login/admin"
              className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs rounded shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" />
              Sign In as Administrator / Security Officer
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Session strip */}
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-blue-900"></span>
                <span className="text-slate-600">
                  Signed in as <strong className="text-slate-900">{admin.name}</strong> ({admin.designation})
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="px-3 py-1.5 bg-blue-900 text-white font-semibold text-xs rounded flex items-center gap-1.5 shadow-xs">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Gate Entry Terminal</span>
                </div>
              </div>
            </div>

            <GateScanner students={students} />
          </div>
        )}
      </main>
    </div>
  );
}
