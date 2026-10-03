import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Building2, Shield, QrCode, UserCheck, LogOut, Home } from 'lucide-react';
import { Student, AdminUser } from '@/lib/db/types';

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
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setStudent(null);
      if (onLogout) onLogout();
      navigate('/');
    } catch {
      navigate('/');
    }
  };

  const handleAdminLogout = async () => {
    try {
      await fetch('/api/auth/admin/logout', { method: 'POST' });
      setAdmin(null);
      if (onLogout) onLogout();
      navigate('/');
    } catch {
      navigate('/');
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      {/* Top Masthead */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Institution Brand */}
          <Link to="/" className="flex items-center space-x-3.5 group">
            <div className="w-11 h-11 bg-blue-900 text-white rounded-lg flex items-center justify-center shrink-0 shadow-xs">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase font-mono">
                राष्ट्रीय प्रौद्योगिकी संस्थान हमीरपुर
              </div>
              <div className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-tight">
                National Institute of Technology Hamirpur
              </div>
              <div className="text-xs text-blue-900 font-semibold">
                Central Hostel Allotment &amp; Allocation System (2026-27)
              </div>
            </div>
          </Link>

          {/* Right Status & Quick Profile */}
          <div className="flex items-center gap-3 self-end sm:self-center">
            {/* Session Indicator */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700">
              <span className="w-2 h-2 rounded-full bg-blue-900"></span>
              <span className="font-medium">Round 1</span>
              <span className="text-slate-300">|</span>
              <span className={isPublished ? 'text-emerald-700 font-bold' : 'text-slate-600 font-medium'}>
                {isPublished ? 'Results Declared' : 'Choice Filling Active'}
              </span>
            </div>

            {/* Active User Chip */}
            {student && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 text-xs text-blue-950">
                <div className="text-right">
                  <div className="font-bold truncate max-w-[130px]">{student.name}</div>
                  <div className="font-mono text-blue-900 text-[11px]">{student.roll_no}</div>
                </div>
                <button
                  type="button"
                  onClick={handleStudentLogout}
                  title="Logout"
                  className="p-1 hover:bg-blue-100 rounded text-blue-900 hover:text-red-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {admin && (
              <div className="flex items-center gap-2 bg-slate-100 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900">
                <div className="text-right">
                  <div className="font-bold truncate max-w-[130px]">{admin.name}</div>
                  <div className="text-slate-600 text-[11px] font-mono">{admin.role}</div>
                </div>
                <button
                  type="button"
                  onClick={handleAdminLogout}
                  title="Logout"
                  className="p-1 hover:bg-slate-200 rounded text-slate-600 hover:text-rose-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {!student && !admin && (
              <div className="flex items-center gap-2">
                <Link
                  to="/login/student"
                  className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
                >
                  Student Login
                </Link>
                <Link
                  to="/login/admin"
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-md transition-colors shadow-xs hidden sm:inline-block"
                >
                  Admin / Warden
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navy Navigation Strip */}
      <nav className="bg-blue-900 text-white shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-1 h-11 text-xs font-medium">
            <Link
              to="/"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
                pathname === '/' ? 'bg-blue-950 text-white font-bold' : 'text-blue-100 hover:bg-blue-800'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>

            <Link
              to={student ? '/student' : '/login/student'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
                pathname.startsWith('/student') || pathname === '/login/student'
                  ? 'bg-blue-950 text-white font-bold'
                  : 'text-blue-100 hover:bg-blue-800'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Student Portal</span>
            </Link>

            <Link
              to={admin ? '/admin' : '/login/admin'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
                pathname === '/admin' || pathname === '/login/admin'
                  ? 'bg-blue-950 text-white font-bold'
                  : 'text-blue-100 hover:bg-blue-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Administration</span>
            </Link>

            <Link
              to={admin ? '/admin/gate' : '/login/admin'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
                pathname === '/admin/gate'
                  ? 'bg-blue-950 text-white font-bold'
                  : 'text-blue-100 hover:bg-blue-800'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Gate Terminal</span>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};
