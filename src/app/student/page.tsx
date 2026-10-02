'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { StudentPortal } from '@/components/StudentPortal';
import { Student } from '@/lib/db/types';
import { LogIn, ShieldAlert, GraduationCap, ArrowRight } from 'lucide-react';

export default function StudentPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const [portalData, setPortalData] = useState<any | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [isLoadingPortal, setIsLoadingPortal] = useState<boolean>(false);

  // Check auth session
  const verifySession = async () => {
    setIsLoadingAuth(true);
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated && data.student) {
        setCurrentUser(data.student);
        loadStudentData(data.student.roll_no);
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // Load student portal details
  const loadStudentData = async (rollNo: string) => {
    setIsLoadingPortal(true);
    try {
      const res = await fetch(`/api/student/me?roll_no=${encodeURIComponent(rollNo)}`);
      const data = await res.json();
      setPortalData(data);
    } catch (err) {
      console.error('Error fetching student data:', err);
    } finally {
      setIsLoadingPortal(false);
    }
  };

  useEffect(() => {
    verifySession();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        currentStudent={currentUser}
        isPublished={portalData?.roundConfig?.is_published || false}
        onLogout={() => {
          setCurrentUser(null);
          setPortalData(null);
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoadingAuth ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="text-sm text-slate-400">Verifying NITH student credentials...</p>
          </div>
        ) : !currentUser ? (
          /* Not Logged In State */
          <div className="max-w-lg mx-auto my-12 bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-indigo-950 border border-indigo-700/60 flex items-center justify-center mx-auto text-indigo-400 shadow-inner">
              <GraduationCap className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Student Authentication Required</h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Hostel choice filling, roommate grouping, and room allotment letters are private to
                each student. Please log in with your official NITH college ID.
              </p>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-xs text-slate-300 font-mono">
              College Email Format: <span className="text-indigo-400 font-bold">roll_number@nith.ac.in</span>
            </div>

            <Link
              href="/login/student"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Sign In with College ID
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : isLoadingPortal || !portalData ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="text-sm text-slate-400">Loading student session & eligibility matrices...</p>
          </div>
        ) : (
          <StudentPortal
            student={portalData.student}
            pathway={portalData.pathway}
            allowedHostels={portalData.allowedHostels}
            availableRooms={portalData.availableRooms}
            groupDetails={portalData.groupDetails}
            incomingInvites={portalData.incomingInvites || []}
            roundConfig={portalData.roundConfig}
            allotment={portalData.allotment}
            onRefresh={() => loadStudentData(currentUser.roll_no)}
          />
        )}
      </main>
    </div>
  );
}
