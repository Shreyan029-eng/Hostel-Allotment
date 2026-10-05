import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  Bell,
  CheckCircle2,
  Info,
  Landmark,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';

interface PublicStatus {
  is_published: boolean;
  round_number: number;
  total_rounds?: number;
  academic_year: string;
  published_at: string | null;
  next_release_time?: string | null;
  choice_filling_end_time?: string | null;
  final_round_active?: boolean;
  final_round_completed?: boolean;
  room_summary?: {
    total_rooms: number;
    available_rooms: number;
    occupied_rooms: number;
    occupancy_rate: number;
  };
}

export default function HomePage() {
  const [status, setStatus] = useState<PublicStatus | null>(null);

  // Fetch official live allotment status
  useEffect(() => {
    fetch('/api/public/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus({
            is_published: data.is_published,
            round_number: data.round_number || 1,
            total_rounds: data.total_rounds || 5,
            academic_year: data.academic_year || '2026-2027',
            published_at: data.published_at || null,
            next_release_time: data.next_release_time || null,
            choice_filling_end_time: data.choice_filling_end_time || null,
            final_round_active: Boolean(data.final_round_active),
            final_round_completed: Boolean(data.final_round_completed),
            room_summary: data.room_summary,
          });
        }
      })
      .catch(() => {
        setStatus(null);
      });
  }, []);

  const isPublished = Boolean(status?.is_published);
  const roundNum = status?.round_number || 1;
  const academicYear = status?.academic_year || '2026-2027';

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      <Navbar isPublished={isPublished} />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* ========================================================================= */}
        {/* INSTITUTIONAL TITLE BANNER (GOVERNMENT OF INDIA / NIT HAMIRPUR)           */}
        {/* ========================================================================= */}
        <div className="bg-white border-2 border-slate-300 rounded p-6 shadow-xs">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="w-16 h-16 rounded border-2 border-blue-950 bg-blue-50 flex flex-col items-center justify-center text-blue-950 shrink-0 shadow-xs">
                <Landmark className="w-8 h-8 text-blue-950" />
                <span className="font-black text-[9px] tracking-tight leading-none mt-0.5">NITH</span>
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  राष्ट्रीय प्रौद्योगिकी संस्थान हमीरपुर • National Institute of Technology Hamirpur
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-blue-950 tracking-tight">
                  Central Hostel Allotment &amp; Management Portal
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  Office of Dean (Student Welfare) &amp; Chief Warden • Academic Session {academicYear}
                </p>
              </div>
            </div>

            <div className="shrink-0 flex md:flex-col items-center md:items-end justify-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-200">
              <span className="px-3 py-1 bg-blue-900 text-white text-xs font-bold rounded">
                Academic Session: {academicYear}
              </span>
              <span
                className={`px-3 py-1 text-xs font-bold rounded border ${
                  status?.final_round_completed
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : status?.final_round_active
                    ? 'bg-amber-50 text-amber-900 border-amber-300 animate-pulse'
                    : isPublished
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-blue-50 text-blue-900 border-blue-200'
                }`}
              >
                {status?.final_round_completed
                  ? 'Allotment Cycle Concluded'
                  : status?.final_round_active
                  ? 'Final Spot Round Open'
                  : isPublished
                  ? `Round ${roundNum} of 5 Declared`
                  : `Round ${roundNum} In Progress`}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* LIVE ROOM OCCUPANCY & VACANCY SUMMARY (WHEN PUBLISHED)                    */}
        {/* ========================================================================= */}
        {isPublished && status?.room_summary && (
          <div className="bg-white border-2 border-slate-300 rounded p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Round {roundNum} Campus Room Occupancy Status / कमरा आवंटन स्थिति
              </span>
              <span className="text-[11px] font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {status.room_summary.available_rooms} Vacant Rooms Remaining
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2 border-r border-slate-100">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Rooms</span>
                <span className="text-xl font-black text-slate-900 font-mono">{status.room_summary.total_rooms}</span>
              </div>
              <div className="p-2 border-r border-slate-100 bg-emerald-50/50 rounded">
                <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Available Left</span>
                <span className="text-xl font-black text-emerald-900 font-mono">{status.room_summary.available_rooms}</span>
              </div>
              <div className="p-2 border-r border-slate-100">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Occupied Rooms</span>
                <span className="text-xl font-black text-blue-950 font-mono">{status.room_summary.occupied_rooms}</span>
              </div>
              <div className="p-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Occupancy Rate</span>
                <span className="text-xl font-black text-slate-900 font-mono">{status.room_summary.occupancy_rate}%</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PORTAL ACCESS SECTION: ONLY TWO BUTTONS (STUDENT & ADMIN PORTAL)          */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <div className="border-b-2 border-blue-900 pb-2 flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-blue-950 uppercase tracking-wide">
                Portal Access / ऑनलाइन पोर्टल प्रवेश
              </h2>
              <p className="text-xs text-slate-600">
                Please select your authorized portal to proceed with hostel services:
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-500 font-semibold hidden sm:inline-block">
              NIT Hamirpur Single Sign-On
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* BUTTON 1: STUDENT PORTAL */}
            <div className="bg-white border-2 border-slate-300 rounded shadow-xs overflow-hidden flex flex-col justify-between hover:border-blue-900 transition-colors">
              <div className="bg-blue-950 text-white px-5 py-3.5 border-b-2 border-orange-500 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-blue-900 rounded">
                    <GraduationCap className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest block">
                      Student Access / छात्र सेवा
                    </span>
                    <h3 className="font-bold text-base text-white">Student Portal (छात्र पोर्टल)</h3>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-blue-900 border border-blue-800 text-[10px] font-bold rounded">
                  UG &amp; PG
                </span>
              </div>

              <div className="p-6">
                <Link
                  to="/login/student"
                  className="w-full py-3.5 bg-blue-900 hover:bg-blue-950 text-white font-bold text-sm rounded shadow-xs flex items-center justify-center gap-2 transition-colors border border-blue-950"
                >
                  <GraduationCap className="w-4 h-4 text-orange-400" />
                  <span>Student Portal / छात्र पोर्टल में प्रवेश करें</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>

            {/* BUTTON 2: ADMIN PORTAL */}
            <div className="bg-white border-2 border-slate-300 rounded shadow-xs overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div className="bg-slate-900 text-white px-5 py-3.5 border-b-2 border-orange-500 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-slate-800 rounded">
                    <ShieldCheck className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block">
                      Official Governance / प्रशासनिक सेवा
                    </span>
                    <h3 className="font-bold text-base text-white">Admin Portal (प्रशासन पोर्टल)</h3>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-[10px] font-bold rounded">
                  Authorized
                </span>
              </div>

              <div className="p-6">
                <Link
                  to="/login/admin"
                  className="w-full py-3.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm rounded shadow-xs flex items-center justify-center gap-2 transition-colors border border-slate-950"
                >
                  <ShieldCheck className="w-4 h-4 text-orange-400" />
                  <span>Admin Portal / प्रशासन पोर्टल में प्रवेश करें</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* LIVE ACTIVITY NEWS (LOCATED AT THE BOTTOM OF THE LOGIN OPTIONS)           */}
        {/* ========================================================================= */}
        <div className="bg-white border-2 border-slate-300 rounded shadow-xs overflow-hidden">
          {/* Header strip */}
          <div className="bg-blue-950 text-white px-4 py-2.5 border-b-2 border-orange-500 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-orange-400" />
              <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wide">
                Live Activity News / नवीनतम गतिविधि सूचना
              </h3>
            </div>
            <span className="px-2 py-0.5 bg-orange-600 text-white text-[10px] font-black uppercase rounded tracking-wider shadow-2xs">
              Live Updates
            </span>
          </div>

          {/* Bulletin body */}
          <div className="p-5">
            {isPublished ? (
              /* Publication state: Results are OUT */
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-6 h-6 text-emerald-700" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded">
                      OFFICIAL DECLARATION
                    </span>
                    <span className="text-sm font-bold text-blue-950">
                      Round {roundNum} Seat Allotment Results for Session {academicYear} are OUT!
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                    The provisional hostel seat allocations for Round {roundNum} (Undergraduate 2nd, 3rd &amp;
                    4th Year students) have been officially finalized and published. Students can log in
                    to the <strong>Student Portal</strong> using their Institute credentials to view their
                    allotted hostel, room number, roommate list, and download their official Provisional Allotment
                    Confirmation Letter.
                  </p>
                  <div className="text-[11px] text-slate-500 font-mono pt-1">
                    Notice Ref: NITH/DSW/CW/{academicYear.slice(0, 4)}/RES-{roundNum} • Status: Active &amp; Published
                  </div>
                </div>
              </div>
            ) : (
              /* Pending state: Choice filling active / Results awaited */
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded bg-blue-100 border border-blue-300 text-blue-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Info className="w-6 h-6 text-blue-700" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-black uppercase tracking-wider text-blue-900 bg-blue-100 border border-blue-300 px-2 py-0.5 rounded">
                      ROUND {roundNum} STATUS
                    </span>
                    <span className="text-sm font-bold text-blue-950">
                      Online Choice Submission &amp; Group Locking in Progress
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                    Hostel seat allocation choice filling for Round {roundNum} (Academic Session {academicYear})
                    is currently accepting roommate cohort submissions. Round {roundNum} seat allotment results
                    will be declared immediately after the locking deadline. Eligible students are directed to
                    enter the <strong>Student Portal</strong> to finalize and lock their room preferences.
                  </p>
                  <div className="text-[11px] text-slate-500 font-mono pt-1">
                    Notice Ref: NITH/DSW/CW/{academicYear.slice(0, 4)}/SCH-{roundNum} • Allotment Engine: Central Merit
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sub-strip */}
          <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 text-[11px] text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-1">
            <span>Official Portal • National Institute of Technology Hamirpur (HP) 177005</span>
            <span className="font-medium text-slate-600">Office of the Chief Warden &amp; Dean (Student Welfare)</span>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* AUTHENTIC GOVERNMENT INSTITUTIONAL FOOTER                                 */}
      {/* ========================================================================= */}
      <footer className="bg-slate-900 text-slate-300 text-xs border-t-2 border-blue-900 mt-12 pt-8 pb-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-400">
            <div>
              <div className="font-bold text-white text-xs uppercase tracking-wider mb-2">
                About the Portal
              </div>
              <p className="leading-relaxed text-[11px]">
                Centralized Hostel Allotment and Student Access System for National Institute of Technology Hamirpur.
                Processes merit-based hostel seat allocation adhering to Institute standing guidelines.
              </p>
            </div>
            <div>
              <div className="font-bold text-white text-xs uppercase tracking-wider mb-2">
                Administrative Authority
              </div>
              <p className="leading-relaxed text-[11px]">
                Office of the Dean (Student Welfare) &amp; Chief Warden<br />
                National Institute of Technology Hamirpur<br />
                Hamirpur, Himachal Pradesh - 177005 (India)
              </p>
            </div>
            <div>
              <div className="font-bold text-white text-xs uppercase tracking-wider mb-2">
                Technical Maintenance
              </div>
              <p className="leading-relaxed text-[11px]">
                Designed, developed, and maintained by the Computer Centre (CC), NIT Hamirpur.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
            <span>
              © 2026 National Institute of Technology Hamirpur. All Rights Reserved.
            </span>
            <span>
              Ministry of Education, Government of India
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
