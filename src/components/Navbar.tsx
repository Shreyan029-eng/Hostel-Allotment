import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Landmark, Shield, QrCode, UserCheck, LogOut, Home, CheckCircle2, ArrowRight } from 'lucide-react';
import { Student, AdminUser } from '@/lib/db/types';
import { createClient } from '@/lib/supabase/client';

interface NavbarProps {
  currentStudent?: Student | null;
  currentAdmin?: AdminUser | null;
  isPublished?: boolean;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentStudent: initialStudent,
  currentAdmin: initialAdmin,
  isPublished = false,
  onLogout,
}) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(initialStudent || null);
  const [admin, setAdmin] = useState<AdminUser | null>(initialAdmin || null);
  const [logoutModal, setLogoutModal] = useState<{
    isOpen: boolean;
    userType: 'student' | 'admin' | null;
    userName: string;
  }>({
    isOpen: false,
    userType: null,
    userName: '',
  });

  useEffect(() => {
    if (initialStudent !== undefined) {
      setStudent(initialStudent);
    } else {
      fetch('/api/auth/me')
        .then((res) => res.json())
        .then((data) => {
          if (data.authenticated && data.student) {
            setStudent(data.student);
          } else {
            setStudent(null);
          }
        })
        .catch(() => setStudent(null));
    }

    if (initialAdmin !== undefined) {
      setAdmin(initialAdmin);
    } else {
      fetch('/api/auth/admin/me')
        .then((res) => res.json())
        .then((data) => {
          if (data.authenticated && data.admin) {
            setAdmin(data.admin);
          } else {
            setAdmin(null);
          }
        })
        .catch(() => setAdmin(null));
    }
  }, [initialStudent, initialAdmin]);

  const handleStudentLogout = async () => {
    const studentName = student?.name || 'Student';
    try {
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut().catch(() => {});
      }
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    setStudent(null);
    if (onLogout) onLogout();
    setLogoutModal({
      isOpen: true,
      userType: 'student',
      userName: studentName,
    });
  };

  const handleAdminLogout = async () => {
    const adminName = admin?.name || 'Administrator';
    try {
      await fetch('/api/auth/admin/logout', { method: 'POST' });
    } catch (err) {
      console.error('Admin logout error:', err);
    }
    setAdmin(null);
    if (onLogout) onLogout();
    setLogoutModal({
      isOpen: true,
      userType: 'admin',
      userName: adminName,
    });
  };

  const handleCloseLogoutModal = () => {
    setLogoutModal({ isOpen: false, userType: null, userName: '' });
    navigate('/');
  };

  // Check if we are in student context
  const isStudentSession = Boolean(student) || pathname.startsWith('/student') || pathname === '/login/student' || pathname === '/login';

  return (
    <header className="bg-white border-b-2 border-slate-300 sticky top-0 z-50">
      {/* Official Government of India Top Banner */}
      <div className="bg-blue-950 text-white text-[11px] py-1 px-4 border-b border-blue-900">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-100">भारत सरकार | Government of India</span>
            <span className="text-blue-400">•</span>
            <span className="text-slate-300">शिक्षा मंत्रालय | Ministry of Education</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-blue-200 font-sans text-[11px]">
            <span>राष्ट्रीय महत्व का संस्थान (NIT Hamirpur)</span>
          </div>
        </div>
      </div>

      {/* Tricolor accent bar */}
      <div className="h-1 w-full flex">
        <div className="bg-[#FF9933] flex-1"></div>
        <div className="bg-white flex-1"></div>
        <div className="bg-[#138808] flex-1"></div>
      </div>

      {/* Institutional Masthead */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Institution Brand */}
          <Link to="/" className="flex items-center space-x-3.5 group">
            <div className="w-12 h-12 bg-blue-950 text-white border-2 border-blue-900 rounded flex flex-col items-center justify-center shrink-0 shadow-xs">
              <Landmark className="w-6 h-6 text-orange-400" />
              <span className="text-[8px] font-black tracking-tight leading-none text-white mt-0.5 font-mono">NITH</span>
            </div>
            <div>
              <div className="text-[11px] font-bold tracking-wider text-slate-700 uppercase font-sans">
                राष्ट्रीय प्रौद्योगिकी संस्थान हमीरपुर
              </div>
              <div className="font-extrabold text-base sm:text-lg text-blue-950 tracking-tight leading-tight">
                National Institute of Technology Hamirpur
              </div>
              <div className="text-xs text-orange-700 font-bold">
                Central Hostel Allotment &amp; Management Portal (Session 2026-27)
              </div>
            </div>
          </Link>

          {/* Right Status & Quick Profile */}
          <div className="flex items-center gap-3 self-end sm:self-center">
            {/* Session Indicator */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800">
              <span className="w-2 h-2 rounded-full bg-blue-900"></span>
              <span className="font-semibold text-slate-700">Round 1</span>
              <span className="text-slate-300">|</span>
              <span className={isPublished ? 'text-emerald-800 font-bold' : 'text-slate-700 font-medium'}>
                {isPublished ? 'Results Declared' : 'Choice Filling Active'}
              </span>
            </div>

            {/* Active Student Chip (When logged into student portal) */}
            {student && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-300 rounded px-3 py-1.5 text-xs text-blue-950">
                <div className="text-right">
                  <div className="font-bold truncate max-w-[150px]">{student.name}</div>
                  <div className="font-mono text-blue-900 text-[11px] font-semibold">{student.roll_no}</div>
                </div>
                <button
                  type="button"
                  onClick={handleStudentLogout}
                  title="Logout from Student Portal"
                  className="p-1 hover:bg-blue-100 rounded text-blue-900 hover:text-red-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Active Admin Chip (Only when admin is logged in and not in student portal) */}
            {admin && !student && !pathname.startsWith('/student') && !pathname.startsWith('/login/student') && (
              <div className="flex items-center gap-2 bg-slate-100 border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900">
                <div className="text-right">
                  <div className="font-bold truncate max-w-[150px]">{admin.name}</div>
                  <div className="text-slate-600 text-[11px] font-mono">
                    {admin.role === 'security_officer' ? 'Security Gate Terminal' : 'Allotment Administration'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAdminLogout}
                  title="Logout from Administration"
                  className="p-1 hover:bg-slate-200 rounded text-slate-600 hover:text-red-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Unauthenticated Quick Badges */}
            {!student && !admin && (
              <div className="flex items-center gap-2">
                {pathname.startsWith('/login/student') && (
                  <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                    Student Login Desk
                  </span>
                )}
                {pathname.startsWith('/login/admin') && (
                  <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded border border-slate-300">
                    Administrative Access
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navy Navigation Strip */}
      <nav className="bg-blue-900 text-white shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-1 h-10 text-xs font-medium">
            {/* Case 1: In Student Portal or Logged in as Student -> ONLY show Student Dashboard */}
            {isStudentSession ? (
              <Link
                to="/student"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-blue-950 text-white font-bold"
              >
                <UserCheck className="w-3.5 h-3.5 text-orange-400" />
                <span>Student Dashboard / छात्र डैशबोर्ड</span>
              </Link>
            ) : admin ? (
              /* Case 2: Admin is Logged In -> Strictly show ONLY their assigned module */
              admin.role === 'security_officer' ? (
                <Link
                  to="/admin/gate"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-950 text-white font-bold"
                >
                  <QrCode className="w-3.5 h-3.5 text-orange-400" />
                  <span>Gate Terminal / गेट टर्मिनल</span>
                </Link>
              ) : (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-950 text-white font-bold"
                >
                  <Shield className="w-3.5 h-3.5 text-orange-400" />
                  <span>Hostel Allotment Admin / आवंटन प्रशासन</span>
                </Link>
              )
            ) : (
              /* Case 3: Public / Unauthenticated Navigation */
              <Link
                to="/"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
                  pathname === '/' ? 'bg-blue-950 text-white font-bold' : 'text-blue-100 hover:bg-blue-800'
                }`}
              >
                <Home className="w-3.5 h-3.5 text-orange-400" />
                <span>Home / मुख्य पृष्ठ</span>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* LOGOUT CONFIRMATION POPUP MODAL                                           */}
      {/* ========================================================================= */}
      {logoutModal.isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border-2 border-slate-300 rounded-lg shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Institutional Header */}
            <div className="bg-blue-950 text-white px-5 py-3 border-b-2 border-orange-500 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-100">
                  NIT Hamirpur • Authentication Desk
                </span>
              </div>
              <span className="px-2 py-0.5 bg-blue-900 text-[10px] font-bold rounded text-blue-200 uppercase font-mono">
                Session Closed
              </span>
            </div>

            {/* Modal Body */}
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center mx-auto text-emerald-600 shadow-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Logged out of your account
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  You have been successfully logged out of{' '}
                  <strong className="text-slate-800">
                    {logoutModal.userType === 'student' ? 'the Student Portal' : 'the Administration Portal'}
                  </strong>
                  . All active session credentials and authorization tokens have been securely cleared.
                </p>
              </div>

              {logoutModal.userName && (
                <div className="bg-slate-50 border border-slate-200 rounded p-2.5 text-xs text-slate-700">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">User Account</span>
                  <span className="font-bold text-blue-950">{logoutModal.userName}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCloseLogoutModal}
                  className="w-full py-3 bg-blue-900 hover:bg-blue-950 text-white font-bold text-sm rounded shadow-xs flex items-center justify-center gap-2 transition-colors border border-blue-950 cursor-pointer"
                >
                  <Home className="w-4 h-4 text-orange-400" />
                  <span>Return to Main Dashboard / मुख्य डैशबोर्ड</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
