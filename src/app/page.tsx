import React from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  ShieldCheck,
  Building2,
  Users,
  QrCode,
  ArrowRight,
  Database,
  Lock,
  Sparkles,
  Layers,
  Cpu,
  ShieldAlert,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* HERO ENTRY SECTION */}
        <div className="text-center space-y-6 max-w-4xl mx-auto pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-xs font-semibold shadow-inner">
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            <span>National Institute of Technology Hamirpur (NITH)</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Welcome to NITH <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-emerald-400 bg-clip-text text-transparent">
              Hostel Allotment Portal
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Official campus accommodation portal accommodating 5,000+ students. Decoupled dual-database
            architecture powering JOSAA-style batch room allocation and an admin-only gate entry system.
          </p>

          {/* TWO PRIMARY LOGIN BUTTONS */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 max-w-xl mx-auto">
            {/* 1. Student Login Button */}
            <Link
              href="/login/student"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 transition-all hover:scale-105 group border border-indigo-500/30"
            >
              <div className="p-1.5 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs text-indigo-200 uppercase tracking-wider font-semibold">
                  For Enrolled Students
                </div>
                <div className="text-base font-bold">Student Login</div>
              </div>
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* 2. Admin Login Button */}
            <Link
              href="/login/admin"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-700 to-slate-800 hover:from-emerald-600 hover:to-slate-700 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-emerald-950/40 flex items-center justify-center gap-3 transition-all hover:scale-105 group border border-emerald-600/40"
            >
              <div className="p-1.5 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
                <ShieldCheck className="w-5 h-5 text-emerald-300" />
              </div>
              <div className="text-left">
                <div className="text-xs text-emerald-200 uppercase tracking-wider font-semibold">
                  Wardens & Deans Only
                </div>
                <div className="text-base font-bold">Admin Login</div>
              </div>
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* TWO SEGREGATED DATABASE SYSTEMS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* System 1: Hostel Allotment Database */}
          <div className="p-8 bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950/40 border border-indigo-700/40 rounded-3xl space-y-5 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-indigo-950 border border-indigo-600/50 flex items-center justify-center text-indigo-400">
                <Database className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 bg-indigo-900/60 border border-indigo-600/50 text-indigo-300 text-xs font-bold rounded-full">
                DATABASE 1: ALLOTMENT DB
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white">Hostel Allotment System</h2>
              <p className="text-xs text-slate-400 mt-1">
                Isolated ACID PostgreSQL database handling 2,767 student records, dynamic eligibility,
                roommate pooling, and offline JOSAA batch scheduling.
              </p>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                <span><strong>2,767 Active Students</strong>: Cohorts 2025 (Y2), 2024 (Y3), 2023 (Y4).</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                <span><strong>Dynamic Eligibility</strong>: 2nd-yr sees 1 hostel; 3rd-yr sees 2; 4th-yr sees 3.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                <span><strong>Roommate Groups</strong>: Auto-computed highest <code className="text-indigo-300">max_cgpa</code>.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                <span><strong>JOSAA Batch Engine</strong>: <code className="text-indigo-300">SELECT FOR UPDATE</code> atomic row locking.</span>
              </li>
            </ul>

            <div className="pt-2">
              <Link
                href="/login/student"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Access Student Portal & Choice Filling &rarr;
              </Link>
            </div>
          </div>

          {/* System 2: Gate Entry Security Database (Admin Only) */}
          <div className="p-8 bg-gradient-to-br from-slate-900 via-slate-850 to-emerald-950/40 border border-emerald-700/40 rounded-3xl space-y-5 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-600/50 flex items-center justify-center text-emerald-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 bg-emerald-900/60 border border-emerald-600/50 text-emerald-300 text-xs font-bold rounded-full flex items-center gap-1">
                <Lock className="w-3 h-3" /> ADMINS ONLY
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white">Gate Entry Security System</h2>
              <p className="text-xs text-slate-400 mt-1">
                Dedicated security database decoupled from core allotment tables for ultra-high-throughput
                campus gate barcode scanning and curfew violation tracking.
              </p>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span><strong>Admin Restricted</strong>: Students cannot access gate logs or barcode scanner.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span><strong>Fast Barcode API</strong>: <code className="text-emerald-300">GET /api/student/[barcode_id]</code>.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span><strong>Curfew Violation Alerts</strong>: Flags late arrivals past 22:00:00.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span><strong>Automated Dispatch</strong>: Directly notifies assigned hostel warden via SMS/alert.</span>
              </li>
            </ul>

            <div className="pt-2">
              <Link
                href="/login/admin"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Access Admin Governance & Gate Terminal &rarr;
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
