'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Building2, Shield, QrCode, UserCheck, LogOut, LogIn, Lock } from 'lucide-react';
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
  const pathname = usePathname();
  const router = useRouter();
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
      router.push('/');
      router.refresh();
    } catch {
      router.push('/');
    }
  };

  const handleAdminLogout = async () => {
    try {
      await fetch('/api/auth/admin/logout', { method: 'POST' });
      setAdmin(null);
      if (onLogout) onLogout();
      router.push('/');
      router.refresh();
    } catch {
      router.push('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Portal Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="p-2 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl shadow-md group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                  HostelMatrix
                </span>
                <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-semibold bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 rounded-full">
                  NITH
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href={student ? '/student' : '/login/student'}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith('/student') || pathname === '/login/student'
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Student Portal</span>
            </Link>

            <Link
              href={admin ? '/admin' : '/login/admin'}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/admin' || pathname === '/login/admin'
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin & Wardens</span>
            </Link>

            <Link
              href={admin ? '/admin/gate' : '/login/admin'}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/admin/gate'
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>Gate Terminal</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded font-semibold ml-1">
                Admin
              </span>
            </Link>
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-3">
            {/* Round Status Indicator */}
            <div className="hidden lg:flex items-center space-x-2 px-3 py-1 bg-slate-800/80 rounded-full border border-slate-700/60 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-300 font-medium">Round 1</span>
              <span className="text-slate-500">•</span>
              <span className={isPublished ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                {isPublished ? 'Published' : 'Hidden'}
              </span>
            </div>

            {/* If Student Logged In */}
            {student && (
              <div className="flex items-center space-x-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-sm">
                <div className="text-right">
                  <div className="text-xs font-bold text-white truncate max-w-[130px] sm:max-w-[170px]">
                    {student.name}
                  </div>
                  <div className="text-[10px] font-mono text-indigo-300">
                    {student.roll_no} • Y{student.year}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleStudentLogout}
                  title="Sign out of student account"
                  className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* If Admin Logged In */}
            {admin && (
              <div className="flex items-center space-x-2.5 bg-emerald-950/60 border border-emerald-700/60 rounded-xl px-3 py-1.5 shadow-sm">
                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-200 truncate max-w-[130px] sm:max-w-[170px]">
                    {admin.name}
                  </div>
                  <div className="text-[10px] text-emerald-400">{admin.role}</div>
                </div>
                <button
                  type="button"
                  onClick={handleAdminLogout}
                  title="Sign out of admin session"
                  className="p-1.5 hover:bg-emerald-900/60 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* If neither logged in */}
            {!student && !admin && (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login/student"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
                >
                  Student Login
                </Link>
                <Link
                  href="/login/admin"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors hidden sm:inline-block"
                >
                  Admin Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
