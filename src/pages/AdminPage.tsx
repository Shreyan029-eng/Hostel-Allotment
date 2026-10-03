import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { AdminDashboard } from '@/components/AdminDashboard';
import { AdminUser } from '@/lib/db/types';
import { ShieldCheck, Lock, ArrowRight, Building2, QrCode } from 'lucide-react';

export default function AdminPage() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [adminData, setAdminData] = useState<any | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(false);
  const [isFetchingData, setIsFetchingData] = useState<boolean>(false);

  const verifyAdmin = async () => {
    setIsLoadingAuth(true);
    try {
      const res = await fetch('/api/auth/admin/me');
      const data = await res.json();
      if (data.authenticated && data.admin) {
        setAdmin(data.admin);
        setIsInitialLoading(true);
        await loadAdminData();
      } else {
        setAdmin(null);
      }
    } catch {
      setAdmin(null);
    } finally {
      setIsLoadingAuth(false);
      setIsInitialLoading(false);
    }
  };

  const loadAdminData = async (params?: {
    page?: number;
    limit?: number | string;
    search?: string;
    filter?: string;
    log_page?: number;
    log_limit?: number | string;
  }) => {
    setIsFetchingData(true);
    try {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit !== undefined) query.set('limit', String(params.limit));
      if (params?.search !== undefined && params.search.trim()) query.set('search', params.search.trim());
      if (params?.filter) query.set('filter', params.filter);
      if (params?.log_page) query.set('log_page', String(params.log_page));
      if (params?.log_limit !== undefined) query.set('log_limit', String(params.log_limit));

      const queryString = query.toString();
      const url = `/api/admin/data${queryString ? `?${queryString}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && !data.error) {
        setAdminData(data);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsFetchingData(false);
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    verifyAdmin();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar currentAdmin={admin} isPublished={adminData?.roundConfig?.is_published || false} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoadingAuth || (isInitialLoading && !adminData) ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <div className="w-8 h-8 border-3 border-blue-900/20 border-t-blue-900 rounded-full animate-spin"></div>
            <p className="text-xs text-slate-600 font-medium">Verifying administrative security credentials...</p>
          </div>
        ) : !admin ? (
          /* Admin Login Required Card */
          <div className="max-w-md mx-auto my-12 bg-white border border-slate-200 rounded-lg p-6 sm:p-8 text-center space-y-5 shadow-xs">
            <div className="w-12 h-12 rounded bg-slate-100 border border-slate-300 flex items-center justify-center mx-auto text-slate-800 shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] uppercase tracking-wider text-blue-900 font-bold block">
                Restricted Access
              </span>
              <h2 className="text-xl font-bold text-slate-900">Administrator Sign In Required</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hostel allotment governance, batch execution, and result publication are restricted to authorized Wardens and Institute Deans.
              </p>
            </div>

            <Link
              to="/login/admin"
              className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs rounded shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" />
              Sign In as Administrator / Warden
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : !adminData ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <div className="w-8 h-8 border-3 border-blue-900/20 border-t-blue-900 rounded-full animate-spin"></div>
            <p className="text-xs text-slate-600 font-medium">Loading administrative records...</p>
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
                {isFetchingData && (
                  <span className="text-[10px] text-blue-900 font-medium bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1 ml-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-900 animate-pulse"></span>
                    Syncing...
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="px-3 py-1.5 bg-blue-900 text-white font-semibold text-xs rounded flex items-center gap-1.5 shadow-xs">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Hostel Allotment Admin</span>
                </div>
                <Link
                  to="/admin/gate"
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-900 border border-slate-200 font-semibold text-xs rounded transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Gate Entry Terminal</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                </Link>
              </div>
            </div>

            <AdminDashboard
              stats={adminData.stats}
              students={adminData.students || []}
              pagination={adminData.pagination}
              hostels={adminData.hostels || []}
              rooms={adminData.rooms || []}
              groups={adminData.groups || []}
              allotments={adminData.allotments || []}
              roundConfig={adminData.roundConfig}
              gateLogs={adminData.gateLogs || []}
              gateLogsPagination={adminData.gateLogsPagination}
              isFetching={isFetchingData}
              onRefresh={loadAdminData}
              onFetchPage={loadAdminData}
            />
          </div>
        )}
      </main>
    </div>
  );
}
