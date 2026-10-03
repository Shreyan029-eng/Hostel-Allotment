import React, { useState, useEffect, useRef } from 'react';
import {
  Student,
  Hostel,
  Room,
  Group,
  Allotment,
  RoundConfig,
  GateLog,
} from '@/lib/db/types';
import {
  Play,
  Eye,
  EyeOff,
  RotateCcw,
  Search,
  CheckCircle2,
  Users,
  BedDouble,
  Shield,
  Clock,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  Building,
} from 'lucide-react';
import { AllotmentRunResult } from '@/lib/engine/allotment-engine';

interface AdminDashboardProps {
  stats: {
    totalStudents: number;
    totalHostels: number;
    totalRooms: number;
    occupiedRooms: number;
    freeRooms: number;
    totalGroups: number;
    lockedGroups: number;
    totalAllotments: number;
  };
  students: Student[];
  pagination?: {
    page: number;
    limit: number;
    offset: number;
    total: number;
    totalStudents: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    isAll?: boolean;
  };
  hostels: Hostel[];
  rooms: Room[];
  groups: any[];
  allotments: (Allotment & { student: Student; room: Room & { hostel: Hostel } })[];
  roundConfig: RoundConfig;
  gateLogs: GateLog[];
  gateLogsPagination?: {
    page: number;
    limit: number;
    offset?: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    isAll?: boolean;
  };
  onRefresh: (params?: any) => void;
  onFetchPage?: (params: {
    page?: number;
    limit?: number | string;
    search?: string;
    filter?: string;
    log_page?: number;
    log_limit?: number | string;
  }) => void;
  isFetching?: boolean;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  students,
  pagination,
  hostels,
  rooms,
  groups,
  allotments,
  roundConfig,
  gateLogs,
  gateLogsPagination,
  onRefresh,
  onFetchPage,
  isFetching = false,
}) => {
  const [isRunningAllotment, setIsRunningAllotment] = useState(false);
  const [isTogglingPublish, setIsTogglingPublish] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'allotted' | 'unallotted'>('all');
  const [lastRunResult, setLastRunResult] = useState<AllotmentRunResult | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'rooms' | 'logs'>('overview');

  // Pagination state
  const [page, setPage] = useState<number>(pagination?.page || 1);
  const [limit, setLimit] = useState<number | 'all'>(pagination?.limit || 25);
  const [logPage, setLogPage] = useState<number>(gateLogsPagination?.page || 1);
  const [logLimit, setLogLimit] = useState<number>(25);

  // Room Matrix Filter state
  const [selectedHostel, setSelectedHostel] = useState<string>('all');
  const [roomStatusFilter, setRoomStatusFilter] = useState<'all' | 'free' | 'locked'>('all');

  const prevSearchRef = useRef<string>(searchQuery);

  // Debounced search trigger: ONLY fires when user actively modifies searchQuery
  useEffect(() => {
    if (prevSearchRef.current === searchQuery) {
      return;
    }
    prevSearchRef.current = searchQuery;

    if (!onFetchPage) return;

    const timer = setTimeout(() => {
      setPage(1);
      onFetchPage({
        page: 1,
        limit,
        search: searchQuery,
        filter: filterType,
        log_page: logPage,
        log_limit: logLimit,
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle filter change
  const handleFilterChange = (type: 'all' | 'allotted' | 'unallotted') => {
    setFilterType(type);
    setPage(1);
    if (onFetchPage) {
      onFetchPage({
        page: 1,
        limit,
        search: searchQuery,
        filter: type,
        log_page: logPage,
        log_limit: logLimit,
      });
    }
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    if (onFetchPage) {
      onFetchPage({
        page: newPage,
        limit,
        search: searchQuery,
        filter: filterType,
        log_page: logPage,
        log_limit: logLimit,
      });
    }
  };

  // Handle limit change
  const handleLimitChange = (newLimitVal: string) => {
    const parsed = newLimitVal === 'all' ? 'all' : parseInt(newLimitVal, 10);
    setLimit(parsed);
    setPage(1);
    if (onFetchPage) {
      onFetchPage({
        page: 1,
        limit: parsed,
        search: searchQuery,
        filter: filterType,
        log_page: logPage,
        log_limit: logLimit,
      });
    }
  };

  // Handle log page change
  const handleLogPageChange = (newLogPage: number) => {
    setLogPage(newLogPage);
    if (onFetchPage) {
      onFetchPage({
        page,
        limit,
        search: searchQuery,
        filter: filterType,
        log_page: newLogPage,
        log_limit: logLimit,
      });
    }
  };

  // Trigger batch room allotment
  const handleRunAllotment = async () => {
    if (
      !confirm(
        'Execute batch room allocation for Round 1? This will allot available rooms to locked groups in order of merit score.'
      )
    ) {
      return;
    }

    setIsRunningAllotment(true);
    try {
      const res = await fetch('/api/admin/run-allotment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ round_number: 1, academic_year: '2026-2027' }),
      });
      const data = await res.json();
      if (data.success) {
        setLastRunResult(data.result);
        onRefresh();
      } else {
        alert('Allotment error: ' + data.error);
      }
    } catch {
      alert('Network error executing allotment');
    } finally {
      setIsRunningAllotment(false);
    }
  };

  // Toggle publishing round results
  const handleTogglePublish = async () => {
    const nextState = !roundConfig.is_published;
    setIsTogglingPublish(true);
    try {
      const res = await fetch('/api/admin/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: nextState }),
      });
      const data = await res.json();
      if (data.success) {
        onRefresh();
      } else {
        alert('Error updating publication status: ' + data.error);
      }
    } catch {
      alert('Network error updating round publication state');
    } finally {
      setIsTogglingPublish(false);
    }
  };

  // Reset database state to seed
  const handleResetDb = async () => {
    if (
      !confirm(
        'Reset entire system database to initial clean seed? All current groupings and allocations will be restored to defaults.'
      )
    ) {
      return;
    }

    try {
      const res = await fetch('/api/admin/data', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setLastRunResult(null);
        onRefresh();
      } else {
        alert('Reset error: ' + data.error);
      }
    } catch {
      alert('Network error resetting database');
    }
  };

  // Fallback client-side filtering if server pagination is disabled or data was fetched as all
  const isServerPaginated = Boolean(pagination && !pagination.isAll && onFetchPage);

  const clientFilteredStudents = students.filter((s) => {
    if (isServerPaginated) return true; // Server already filtered

    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roll_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.barcode_id && s.barcode_id.toLowerCase().includes(searchQuery.toLowerCase()));

    const isAllotted = allotments.some((a) => a.roll_no === s.roll_no);
    if (filterType === 'allotted') return matchesSearch && isAllotted;
    if (filterType === 'unallotted') return matchesSearch && !isAllotted;
    return matchesSearch;
  });

  const totalCount = isServerPaginated
    ? pagination?.total ?? students.length
    : clientFilteredStudents.length;

  const parsedLimit = typeof limit === 'number' ? limit : totalCount;
  const totalPages = isServerPaginated
    ? pagination?.totalPages ?? 1
    : Math.max(1, Math.ceil(totalCount / (parsedLimit || 1)));

  const currentPage = isServerPaginated ? pagination?.page ?? page : page;

  const displayedStudents = isServerPaginated
    ? students
    : limit === 'all'
    ? clientFilteredStudents
    : clientFilteredStudents.slice((currentPage - 1) * parsedLimit, currentPage * parsedLimit);

  const fromIndex =
    totalCount === 0
      ? 0
      : isServerPaginated
      ? (pagination?.offset ?? 0) + 1
      : (currentPage - 1) * parsedLimit + 1;

  const toIndex = isServerPaginated
    ? Math.min((pagination?.offset ?? 0) + displayedStudents.length, totalCount)
    : Math.min(currentPage * parsedLimit, totalCount);

  // Gate Logs Pagination calculations
  const isLogsServerPaginated = Boolean(
    gateLogsPagination && !gateLogsPagination.isAll && onFetchPage
  );
  const totalLogsCount = isLogsServerPaginated
    ? gateLogsPagination?.total ?? gateLogs.length
    : gateLogs.length;
  const logTotalPages = isLogsServerPaginated
    ? gateLogsPagination?.totalPages ?? 1
    : Math.max(1, Math.ceil(totalLogsCount / logLimit));
  const currentLogPage = isLogsServerPaginated ? gateLogsPagination?.page ?? logPage : logPage;

  const displayedLogs = isLogsServerPaginated
    ? gateLogs
    : gateLogs.slice((currentLogPage - 1) * logLimit, currentLogPage * logLimit);

  // Hostel Rooms Matrix Filter
  const filteredHostels =
    selectedHostel === 'all' ? hostels : hostels.filter((h) => h.hostel_id === selectedHostel);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-lg shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
              Administration &amp; Warden Governance
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-mono">Session 2026-27</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Hostel Allotment Control Console</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Execute merit-based allocation rounds, publish student allotment letters, and review occupancy matrices.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Batch Run Button */}
          <button
            onClick={handleRunAllotment}
            disabled={isRunningAllotment}
            className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isRunningAllotment ? 'animate-spin' : ''}`} />
            {isRunningAllotment ? 'Executing Batch...' : 'Run Allocation Engine'}
          </button>

          {/* Publish / Unpublish Toggle */}
          <button
            onClick={handleTogglePublish}
            disabled={isTogglingPublish}
            className={`px-3.5 py-2 text-xs font-semibold rounded shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50 border ${
              roundConfig.is_published
                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                : 'bg-blue-900 hover:bg-blue-800 text-white border-blue-900'
            }`}
          >
            {roundConfig.is_published ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                Unpublish Results
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                Publish Round 1 Results
              </>
            )}
          </button>

          {/* CSV Export */}
          <a
            href={`/api/admin/export?filter=${filterType}`}
            download
            className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </a>

          {/* Reset Demo */}
          <button
            onClick={handleResetDb}
            title="Reset database to seed defaults"
            className="p-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-500 hover:text-slate-800 rounded transition-colors shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 p-4 rounded shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Enrolled Students</span>
            <Users className="w-4 h-4 text-blue-900" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{stats.totalStudents}</div>
          <span className="text-[11px] text-slate-500">Years 2, 3, and 4</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Room Allocation</span>
            <BedDouble className="w-4 h-4 text-blue-900" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {stats.occupiedRooms} / {stats.totalRooms}
          </div>
          <span className="text-[11px] text-slate-600 font-mono">
            {stats.freeRooms} rooms available
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Locked Choice Groups</span>
            <CheckCircle2 className="w-4 h-4 text-blue-900" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {stats.lockedGroups} / {stats.totalGroups}
          </div>
          <span className="text-[11px] text-slate-500">Ready for processing</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Publication Status</span>
            <Shield className="w-4 h-4 text-blue-900" />
          </div>
          <div className="text-base font-bold text-slate-900 mt-1 truncate">
            {roundConfig.is_published ? (
              <span className="text-emerald-800 flex items-center gap-1 font-semibold text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Published (Live)
              </span>
            ) : (
              <span className="text-slate-600 flex items-center gap-1 font-semibold text-xs">
                <Clock className="w-3.5 h-3.5 text-slate-500" /> Unpublished (Internal)
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500">
            {roundConfig.is_published ? 'Visible to students' : 'Hidden from students'}
          </span>
        </div>
      </div>

      {/* LATEST BATCH RUN AUDIT TRAIL */}
      {lastRunResult && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-blue-900 rounded-xs"></span>
              Round {lastRunResult.roundNumber} Allocation Execution Summary
            </h2>
            <span className="text-xs text-slate-600 font-medium">
              Placed {lastRunResult.totalStudentsPlaced} students in {lastRunResult.totalAllottedGroups} groups
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Merit Rank</th>
                  <th className="py-2 px-3">Group Code</th>
                  <th className="py-2 px-3">Merit Score (Max CGPA)</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Allotted Hostel &amp; Room</th>
                  <th className="py-2 px-3">Evaluation Logic</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lastRunResult.auditTrail.map((log) => (
                  <tr key={log.groupId} className="hover:bg-slate-50/70">
                    <td className="py-2 px-3 font-bold text-slate-900">#{log.rank}</td>
                    <td className="py-2 px-3 font-mono text-blue-900 font-semibold">{log.groupCode}</td>
                    <td className="py-2 px-3 font-bold text-slate-900 font-mono">{log.maxCgpa.toFixed(2)}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === 'ALLOTTED'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      {log.allocatedHostelName ? (
                        <span>
                          {log.allocatedHostelName} •{' '}
                          <strong className="text-slate-900">Room {log.allocatedRoomNumber}</strong>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No available choices</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-[11px] text-slate-500">
                      {log.tieBreakerApplied ? 'Submission Timestamp' : 'Merit CGPA'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TABS NAVIGATION */}
      <div className="flex items-center space-x-1 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-t transition-colors ${
            activeTab === 'overview'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Student Allotments Directory
        </button>
        <button
          onClick={() => setActiveTab('rooms')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-t transition-colors ${
            activeTab === 'rooms'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Hostel Rooms Matrix
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-t transition-colors ${
            activeTab === 'logs'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Gate Movement Audit ({totalLogsCount})
        </button>
      </div>

      {/* TAB 1: STUDENTS & ALLOTMENTS DIRECTORY */}
      {activeTab === 'overview' && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          {/* Search & Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search name, roll no, or barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 text-xs text-slate-900 rounded focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900 shadow-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center space-x-1">
                {(['all', 'allotted', 'unallotted'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleFilterChange(type)}
                    className={`px-3 py-1 text-xs font-semibold rounded capitalize transition-colors ${
                      filterType === type
                        ? 'bg-blue-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Rows Per Page Selector */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600 ml-auto sm:ml-0">
                <span>Per page:</span>
                <select
                  value={limit}
                  onChange={(e) => handleLimitChange(e.target.value)}
                  className="bg-white border border-slate-300 text-slate-800 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none shadow-xs"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                  <option value="all">All</option>
                </select>
              </div>
            </div>
          </div>

          {/* Student Table */}
          <div className="overflow-x-auto border border-slate-200 rounded">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Roll No</th>
                  <th className="py-2 px-3">Student Name</th>
                  <th className="py-2 px-3">Year / Gender</th>
                  <th className="py-2 px-3">CGPA</th>
                  <th className="py-2 px-3">Barcode ID</th>
                  <th className="py-2 px-3">Round 1 Allocation</th>
                  <th className="py-2 px-3">Roommates</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No student records match the search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  displayedStudents.map((s) => {
                    const alloc = allotments.find((a) => a.roll_no === s.roll_no);
                    const roommates = alloc
                      ? allotments
                          .filter((a) => a.room_id === alloc.room_id && a.roll_no !== s.roll_no)
                          .map((a) => a.student?.name)
                      : [];

                    return (
                      <tr key={s.roll_no} className="hover:bg-slate-50/70">
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{s.roll_no}</td>
                        <td className="py-2 px-3 font-medium text-slate-900">{s.name}</td>
                        <td className="py-2 px-3">
                          Year {s.year} • {s.gender}
                        </td>
                        <td className="py-2 px-3 font-bold text-blue-900 font-mono">
                          {s.cgpa.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-500">{s.barcode_id}</td>
                        <td className="py-2 px-3">
                          {alloc ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                              {alloc.room?.hostel?.name || 'Hostel'} • Room {alloc.room?.room_number || 'N/A'}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Unallotted</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {roommates.length > 0 ? roommates.join(', ') : '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 text-xs text-slate-600">
            <div>
              Showing <strong className="text-slate-900 font-mono">{fromIndex}</strong> to{' '}
              <strong className="text-slate-900 font-mono">{toIndex}</strong> of{' '}
              <strong className="text-slate-900 font-mono">{totalCount}</strong> students
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage <= 1}
                className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="First Page"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 font-medium"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </button>

              <span className="px-3 py-1 font-mono font-semibold text-slate-900 bg-slate-100 rounded border border-slate-200">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 font-medium"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage >= totalPages}
                className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Last Page"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROOMS & HOSTELS MATRIX */}
      {activeTab === 'rooms' && (
        <div className="space-y-4">
          {/* Hostel Filters Strip */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-700 mr-1 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-blue-900" /> Hostel:
              </span>
              <button
                onClick={() => setSelectedHostel('all')}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                  selectedHostel === 'all'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                All Hostels ({hostels.length})
              </button>
              {hostels.map((h) => (
                <button
                  key={h.hostel_id}
                  onClick={() => setSelectedHostel(h.hostel_id)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                    selectedHostel === h.hostel_id
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {h.name.split(' ')[0]} ({h.hostel_id})
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500 mr-1">Status:</span>
              {(['all', 'free', 'locked'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setRoomStatusFilter(status)}
                  className={`px-2 py-0.5 text-xs font-medium rounded capitalize transition-colors ${
                    roomStatusFilter === status
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {status === 'locked' ? 'Allotted' : status}
                </button>
              ))}
            </div>
          </div>

          {filteredHostels.map((hostel) => {
            let hostelRooms = rooms.filter((r) => r.hostel_id === hostel.hostel_id);
            if (roomStatusFilter === 'free') {
              hostelRooms = hostelRooms.filter((r) => r.status === 'free');
            } else if (roomStatusFilter === 'locked') {
              hostelRooms = hostelRooms.filter((r) => r.status === 'locked');
            }

            return (
              <div
                key={hostel.hostel_id}
                className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{hostel.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Allowed: {hostel.gender_allowed} • Warden: {hostel.warden_name} ({hostel.warden_phone})
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 font-mono">
                      Showing {hostelRooms.length} rooms
                    </span>
                    <span className="text-xs text-slate-700 font-mono font-semibold bg-slate-50 px-2 py-1 rounded border border-slate-200">
                      Curfew: {hostel.curfew_time}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {hostelRooms.map((room) => {
                    const isLocked = room.status === 'locked';
                    const occupants = allotments
                      .filter((a) => a.room_id === room.room_id)
                      .map((a) => a.student?.name)
                      .filter(Boolean);

                    return (
                      <div
                        key={room.room_id}
                        className={`p-2 rounded border text-center transition-all ${
                          isLocked
                            ? 'bg-slate-100 border-slate-300 text-slate-800'
                            : 'bg-white border-slate-200 text-slate-800 hover:border-blue-900'
                        }`}
                        title={isLocked ? `Occupants: ${occupants.join(', ')}` : 'Vacant'}
                      >
                        <div className="text-xs font-bold font-mono">Room {room.room_number}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {room.capacity} Bed • {isLocked ? 'Allotted' : 'Free'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: GATE LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Campus Gate Movement Records</h3>
            <span className="text-xs text-slate-500 font-mono">
              Total Log Entries: {totalLogsCount}
            </span>
          </div>

          {displayedLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No gate movement events logged yet.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto border border-slate-200 rounded">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Timestamp</th>
                      <th className="py-2 px-3">Roll No</th>
                      <th className="py-2 px-3">Student Name</th>
                      <th className="py-2 px-3">Direction</th>
                      <th className="py-2 px-3">Curfew Status</th>
                      <th className="py-2 px-3">Warden Notification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedLogs.map((log) => (
                      <tr key={log.log_id} className="hover:bg-slate-50/70">
                        <td className="py-2 px-3 font-mono text-slate-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{log.roll_no}</td>
                        <td className="py-2 px-3 text-slate-800">{log.student?.name || 'N/A'}</td>
                        <td className="py-2 px-3 font-semibold">{log.direction}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.is_late
                                ? 'bg-red-50 text-red-800 border border-red-200'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {log.is_late ? 'LATE ARRIVAL' : 'ON TIME'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-[11px] text-slate-600">
                          {log.warden_alerted ? (
                            <span className="text-red-700 font-medium">
                              Alert sent to {log.warden_alert_details?.warden_name}
                            </span>
                          ) : (
                            'Normal transit'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Gate Logs Pagination Toolbar */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-xs text-slate-600">
                <span>
                  Page <strong className="text-slate-900 font-mono">{currentLogPage}</strong> of{' '}
                  <strong className="text-slate-900 font-mono">{logTotalPages}</strong>
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleLogPageChange(currentLogPage - 1)}
                    disabled={currentLogPage <= 1}
                    className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Previous
                  </button>
                  <button
                    onClick={() => handleLogPageChange(currentLogPage + 1)}
                    disabled={currentLogPage >= logTotalPages}
                    className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
