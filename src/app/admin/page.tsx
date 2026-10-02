'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { AdminDashboard } from '@/components/AdminDashboard';
import { AdminUser } from '@/lib/db/types';
import { ShieldCheck, Lock, ArrowRight } from 'lucide-react';

export default function AdminPage() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [adminData, setAdminData] = useState<any | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  const verifyAdmin = async () => {
    setIsLoadingAuth(true);
    try {
      const res = await fetch('/api/auth/admin/me');
      const data = await res.json();
      if (data.authenticated && data.admin) {
        setAdmin(data.admin);
        loadAdminData();
      } else {
        setAdmin(null);
      }
    } catch {
      setAdmin(null);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const loadAdminData = async () => {
    setIsLoadingData(true);
    try {
      const res = await fetch('/api/admin/data');
      const data = await res.json();
      setAdminData(data);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    verifyAdmin();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar isPublished={adminData?.roundConfig?.is_published || false} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoadingAuth ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="text-sm text-slate-400">Verifying administrative security credentials...</p>
          </div>
        ) : !admin ? (
          /* Admin Login Required Card */
          <div className="max-w-md mx-auto my-16 bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center mx-auto text-emerald-400 shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Administrator Access Required</h2>
              <p className="text-xs text-slate-400">
                Hostel allotment governance, batch engine triggers, results publishing, and data exports
                are restricted to authorized Wardens and Institute Deans.
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
        ) : isLoadingData || !adminData ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="text-sm text-slate-400">Loading administrative dashboards & database state...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 2 OPTIONS SYSTEM SWITCHER (Requirement 2) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs text-slate-300">
                  Signed in as <strong>{admin.name}</strong> ({admin.designation})
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>1. Hostel Allotment System (Active)</span>
                </div>
                <Link
                  href="/admin/gate"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-2"
                >
                  <span>2. Gate Entry System</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <AdminDashboard
              stats={adminData.stats}
              students={adminData.students}
              hostels={adminData.hostels}
              rooms={adminData.rooms}
              groups={adminData.groups}
              allotments={adminData.allotments}
              roundConfig={adminData.roundConfig}
              gateLogs={adminData.gateLogs}
              onRefresh={loadAdminData}
            />
          </div>
        )}
      </main>
    </div>
  );
}
