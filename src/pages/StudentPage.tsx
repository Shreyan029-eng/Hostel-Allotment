import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { StudentPortal } from '@/components/StudentPortal';
import { Student } from '@/lib/db/types';
import { LogIn, GraduationCap, ArrowRight } from 'lucide-react';

export default function StudentPage() {
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
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
            <div className="w-8 h-8 border-3 border-blue-900/20 border-t-blue-900 rounded-full animate-spin"></div>
            <p className="text-xs text-slate-600 font-medium">Verifying student credentials...</p>
          </div>
        ) : !currentUser ? (
          /* Not Logged In State */
          <div className="max-w-md mx-auto my-12 bg-white border border-slate-200 rounded-lg p-6 sm:p-8 text-center space-y-5 shadow-xs">
            <div className="w-12 h-12 rounded bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-blue-900 shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] uppercase tracking-wider text-blue-900 font-bold block">
                Student Authentication Required
              </span>
              <h2 className="text-xl font-bold text-slate-900">Hostel Portal Access</h2>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                Choice filling, roommate pooling, and allocation letters require student authentication. Please sign in with your Institute student credentials.
              </p>
            </div>

            <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs text-slate-700 font-mono">
              Email Format: <span className="text-blue-900 font-bold">roll_number@nith.ac.in</span>
            </div>

            <Link
              to="/login/student"
              className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs rounded shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Student Sign In
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : isLoadingPortal || !portalData ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <div className="w-8 h-8 border-3 border-blue-900/20 border-t-blue-900 rounded-full animate-spin"></div>
            <p className="text-xs text-slate-600 font-medium">Loading student session &amp; eligibility matrix...</p>
          </div>
        ) : (
          <StudentPortal
            student={portalData.student}
            pathway={portalData.pathway}
            allowedHostels={portalData.allowedHostels}
            availableRooms={portalData.availableRooms}
            remainingRooms={portalData.remainingRooms || []}
            assignedRound={portalData.assignedRound || 1}
            canFillFinalChoices={portalData.canFillFinalChoices || false}
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
