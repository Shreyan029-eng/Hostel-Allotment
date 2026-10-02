'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { GateScanner } from '@/components/GateScanner';
import { Student, AdminUser } from '@/lib/db/types';
import { ShieldAlert, Lock, ArrowRight } from 'lucide-react';

export default function GatePage() {
  const router = useRouter();
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

      setAdmin(authData.admin);

      // Load registry data
      const dataRes = await fetch('/api/admin/data');
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="text-sm text-slate-400">Verifying security officer credentials...</p>
          </div>
        ) : !admin ? (
          /* Admin Access Denied Gate */
          <div className="max-w-md mx-auto my-16 bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-rose-950 border border-rose-700/60 flex items-center justify-center mx-auto text-rose-400 shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Security Terminal Restricted</h2>
              <p className="text-xs text-slate-400">
                The Gate Entry Barcode Scanner and Curfew Alert System is accessible only to authorized
                College Administrators, Wardens, and Security Officers.
              </p>
            </div>

            <Link
              href="/login/admin"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Sign In as Administrator / Warden
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 2 OPTIONS SYSTEM SWITCHER (Requirement 2) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs text-slate-300">
                  Signed in as <strong>{admin.name}</strong> ({admin.designation}) • <span className="font-mono text-emerald-400">Gate_Entry_DB</span>
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Link
                  href="/admin"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-2"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  <span>1. Hostel Allotment System</span>
                </Link>
                <div className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  <span>2. Gate Entry System (Active)</span>
                </div>
              </div>
            </div>

            <GateScanner students={students} onScanComplete={verifyAdminAuth} />
          </div>
        )}
      </main>
    </div>
  );
}
