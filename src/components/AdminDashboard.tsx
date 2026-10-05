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
  Timer,
  Zap,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Lock,
  DoorOpen,
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

  // Live countdown timer for the 2-hour auto-release interval
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (!roundConfig.is_published || !roundConfig.next_release_time || roundConfig.round_number >= 5) {
      setTimeRemaining('');
      return;
    }

    const updateTimer = () => {
      const target = new Date(roundConfig.next_release_time!).getTime();
      const diff = target - Date.now();
      if (diff <= 0) {
        setTimeRemaining('Releasing now...');
        onRefresh();
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeRemaining(
          `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        );
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [roundConfig.next_release_time, roundConfig.is_published, roundConfig.round_number]);

  // Live countdown timer for the 30-minute student choice modification window
  const [choiceLockRemaining, setChoiceLockRemaining] = useState<string>('');
  const [isChoiceWindowActive, setIsChoiceWindowActive] = useState<boolean>(false);

  useEffect(() => {
    if (!roundConfig.is_published || !roundConfig.choice_filling_end_time) {
      setChoiceLockRemaining('');
      setIsChoiceWindowActive(false);
      return;
    }

    const updateChoiceLockTimer = () => {
      const target = new Date(roundConfig.choice_filling_end_time!).getTime();
      const diff = target - Date.now();
      if (diff <= 0) {
        setChoiceLockRemaining('Choices Locked');
        setIsChoiceWindowActive(false);
      } else {
        setIsChoiceWindowActive(true);
        const mins = Math.floor(diff / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setChoiceLockRemaining(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    };

    updateChoiceLockTimer();
    const interval = setInterval(updateChoiceLockTimer, 1000);
    return () => clearInterval(interval);
  }, [roundConfig.choice_filling_end_time, roundConfig.is_published]);

  // Publish Next Round Immediately (Bypass 2-hour interval)
  const handlePublishNextRound = async () => {
    const nextRound = !roundConfig.is_published ? 1 : Math.min(5, roundConfig.round_number + 1);
    if (
      !confirm(
        `Publish Round ${nextRound} immediately? This will calculate and allocate rooms for the Round ${nextRound} merit batch and update student portals.`
      )
    ) {
      return;
    }

    setIsRunningAllotment(true);
    try {
      const res = await fetch('/api/admin/publish-next-round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academic_year: roundConfig.academic_year || '2026-2027' }),
      });
      const data = await res.json();
      if (data.success) {
        setLastRunResult(data.result);
        onRefresh();
      } else {
        alert('Error: ' + data.error);
      }
    } catch {
      alert('Network error publishing next round');
    } finally {
      setIsRunningAllotment(false);
    }
  };

  // Run Final Spot Round (Round 6)
  const handleRunFinalRound = async () => {
    if (
      !confirm(
        'Execute and publish the Final Spot Round? All remaining free rooms will be allotted to unallotted groups based on their submitted preferences and merit.'
      )
    ) {
      return;
    }

    setIsRunningAllotment(true);
    try {
      const res = await fetch('/api/admin/run-final-round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academic_year: roundConfig.academic_year || '2026-2027' }),
      });
      const data = await res.json();
      if (data.success) {
        setLastRunResult(data.result);
        onRefresh();
      } else {
        alert('Error: ' + data.error);
      }
    } catch {
      alert('Network error executing final round');
    } finally {
      setIsRunningAllotment(false);
    }
  };

  // Reset Allotment Cycle back to initial state
  const handleResetRounds = async () => {
    if (
      !confirm(
        'Reset all allotment rounds and room allocations back to Round 1 (unpublished)? Groups will be preserved.'
      )
    ) {
      return;
    }

    try {
      const res = await fetch('/api/admin/reset-rounds', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setLastRunResult(null);
        onRefresh();
      } else {
        alert('Error: ' + data.error);
      }
    } catch {
      alert('Network error resetting rounds');
    }
  };

  // Toggle Auto-Release
  const handleToggleAutoRelease = async (enabled: boolean) => {
    try {
      const res = await fetch('/api/admin/toggle-auto-release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      const data = await res.json();
      if (data.success) {
        onRefresh();
      }
    } catch {
      alert('Error updating auto-release setting');
    }
  };

  // Trigger batch room allotment
  const handleRunAllotment = async () => {
    await handlePublishNextRound();
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
          {/* CSV Export */}
          <a
            href={`/api/admin/export?filter=${filterType}`}
            download
            className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </a>

          {/* Reset Demo Database */}
          <button
            onClick={handleResetDb}
            title="Reset full database to seed defaults"
            className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-600 hover:text-slate-900 text-xs font-semibold rounded transition-colors shadow-xs flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Database Seed
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MULTI-ROUND ALLOTMENT & 2-HOUR INTERVAL GOVERNANCE CONSOLE                */}
      {/* ========================================================================= */}
      <div className="bg-white border-2 border-blue-900/40 rounded-lg p-5 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-900 text-[10px] font-bold uppercase rounded">
                Multi-Stage JOSAA Engine
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {roundConfig.total_rounds || 5} Regular Rounds + 1 Final Spot Round
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
              <span>Merit-Quintile Multi-Round Allocation &amp; Automated Release</span>
            </h2>
            <p className="text-xs text-slate-600 max-w-2xl mt-0.5">
              Applicants are partitioned into 5 equal merit quintiles per cohort. Results are automatically published every 2 hours, or immediately upon administrative trigger. Unallotted students enter the Final Spot Round choice filling.
            </p>
          </div>

          {/* Live Action Buttons & Countdown */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Auto-Release Interval Badge / Countdown */}
            {roundConfig.is_published && roundConfig.round_number < 5 && (
              <div className="px-3.5 py-2 bg-amber-50 border border-amber-300 rounded text-amber-900 flex items-center gap-2 shadow-xs">
                <Timer className="w-4 h-4 text-amber-600 animate-pulse" />
                <div className="text-xs">
                  <span className="font-semibold block text-[10px] uppercase tracking-wider text-amber-800">
                    Auto-Release Round {roundConfig.round_number + 1} In:
                  </span>
                  <span className="font-mono font-bold text-sm text-amber-950">
                    {timeRemaining || 'Calculating...'}
                  </span>
                </div>
              </div>
            )}

            {/* Action Trigger Buttons */}
            {!roundConfig.is_published ? (
              <button
                onClick={handlePublishNextRound}
                disabled={isRunningAllotment}
                className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded shadow-xs flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Play className={`w-4 h-4 ${isRunningAllotment ? 'animate-spin' : ''}`} />
                {isRunningAllotment ? 'Calculating Round 1...' : 'Start & Publish Round 1 (Top 20%)'}
              </button>
            ) : roundConfig.round_number < 5 ? (
              isChoiceWindowActive ? (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="px-3.5 py-2 bg-amber-50 border border-amber-300 rounded text-amber-950 flex items-center gap-2 shadow-xs">
                    <Clock className="w-4 h-4 text-amber-700 animate-pulse" />
                    <div className="text-xs">
                      <span className="font-semibold block text-[10px] uppercase tracking-wider text-amber-800">
                        Student Choice Window Active:
                      </span>
                      <span className="font-mono font-bold text-xs text-amber-950">
                        Choices Lock in: {choiceLockRemaining || '30:00'} (Early Publish Blocked)
                      </span>
                    </div>
                  </div>
                  <button
                    disabled={true}
                    title="Admins cannot publish next round during the 30-minute student choice modification window. Early publish will unlock once choices lock."
                    className="px-4 py-2.5 bg-slate-200 border border-slate-300 text-slate-500 font-bold text-xs rounded shadow-xs flex items-center gap-2 cursor-not-allowed opacity-75"
                  >
                    <Lock className="w-4 h-4 text-slate-500" />
                    Publish Round {roundConfig.round_number + 1} Locked ({choiceLockRemaining})
                  </button>
                </div>
              ) : (
                <button
                  onClick={handlePublishNextRound}
                  disabled={isRunningAllotment}
                  className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded shadow-xs flex items-center gap-2 transition-all disabled:opacity-50"
                  title="30-minute student choice window has ended. You can override the remaining 1h 30m timer and release Round next round now."
                >
                  <Zap className={`w-4 h-4 text-amber-300 ${isRunningAllotment ? 'animate-spin' : ''}`} />
                  {isRunningAllotment
                    ? `Calculating Round ${roundConfig.round_number + 1}...`
                    : `Publish Round ${roundConfig.round_number + 1} Early (Override 1h 30m Timer)`}
                </button>
              )
            ) : roundConfig.final_round_active ? (
              <button
                onClick={handleRunFinalRound}
                disabled={isRunningAllotment}
                className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded shadow-xs flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${isRunningAllotment ? 'animate-spin' : ''}`} />
                {isRunningAllotment ? 'Executing Spot Round...' : 'Execute & Publish Final Spot Round'}
              </button>
            ) : roundConfig.final_round_completed ? (
              <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-300 rounded text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Allotment Process Completed
              </div>
            ) : null}

            {/* Reset Allotment Cycle */}
            <button
              onClick={handleResetRounds}
              title="Reset all allotment rounds and room assignments"
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold rounded flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Rounds
            </button>
          </div>
        </div>

        {/* 6-STEP MULTI-ROUND VISUAL PROGRESSION */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { round: 1, title: 'Round 1', bracket: 'Top 20% Merit' },
            { round: 2, title: 'Round 2', bracket: '20% – 40% Merit' },
            { round: 3, title: 'Round 3', bracket: '40% – 60% Merit' },
            { round: 4, title: 'Round 4', bracket: '60% – 80% Merit' },
            { round: 5, title: 'Round 5', bracket: '80% – 100% Merit' },
            { round: 6, title: 'Final Round', bracket: 'Spot Round (Vacant Rooms)' },
          ].map((item) => {
            const isCompleted =
              item.round < roundConfig.round_number ||
              (item.round === roundConfig.round_number && roundConfig.is_published) ||
              (item.round === 6 && roundConfig.final_round_completed);

            const isNextToRelease =
              roundConfig.is_published &&
              roundConfig.round_number < 5 &&
              item.round === roundConfig.round_number + 1;

            const isFinalRoundActive =
              item.round === 6 && roundConfig.final_round_active && !roundConfig.final_round_completed;

            return (
              <div
                key={item.round}
                className={`p-3.5 rounded border transition-all flex flex-col justify-between ${
                  isCompleted
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                    : isNextToRelease
                    ? 'bg-blue-50/80 border-blue-400 text-blue-950 ring-2 ring-blue-300/60 shadow-xs'
                    : isFinalRoundActive
                    ? 'bg-amber-50 border-amber-400 text-amber-950 ring-2 ring-amber-300/60 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider">{item.title}</span>
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : isNextToRelease ? (
                      <Timer className="w-4 h-4 text-blue-700 animate-pulse" />
                    ) : isFinalRoundActive ? (
                      <Sparkles className="w-4 h-4 text-amber-600 animate-bounce" />
                    ) : (
                      <Clock className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div className="text-[11px] font-medium mt-1 opacity-90">{item.bracket}</div>
                </div>

                <div className="mt-3 pt-2 border-t border-black/5 flex items-center justify-between text-[11px] font-semibold">
                  {isCompleted ? (
                    <span className="text-emerald-800">Declared &amp; Published</span>
                  ) : isNextToRelease ? (
                    <span className="text-blue-900 font-mono">{timeRemaining || 'Releasing Next'}</span>
                  ) : isFinalRoundActive ? (
                    <span className="text-amber-800 font-bold">Choice Filling Open</span>
                  ) : (
                    <span className="text-slate-400">Scheduled</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Auto-Release Settings Bar */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Automated Release Cycle:</span>
            <span>2 Hours per Quintile</span>
            <span className="text-slate-300">•</span>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={roundConfig.auto_release_enabled ?? true}
                onChange={(e) => handleToggleAutoRelease(e.target.checked)}
                className="w-3.5 h-3.5 text-blue-900 rounded border-slate-300"
              />
              <span className="text-slate-700">Auto-release background scheduler active</span>
            </label>
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            {roundConfig.published_at ? (
              <span>Last Published: {new Date(roundConfig.published_at).toLocaleTimeString()}</span>
            ) : (
              <span>Cycle Not Yet Initialized</span>
            )}
          </div>
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
          {/* Top Campus Occupancy & Vacancy KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Total Campus Rooms</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-2xl font-black text-slate-900 font-mono">{rooms.length}</span>
                <span className="text-xs text-slate-400 font-medium">17 Hostels</span>
              </div>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-300 rounded-lg p-4 shadow-xs">
              <span className="text-[11px] font-bold text-emerald-800 uppercase block">Available Rooms Left</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-2xl font-black text-emerald-950 font-mono">
                  {rooms.filter((r) => r.status === 'free').length}
                </span>
                <span className="px-2 py-0.5 bg-emerald-200/80 text-emerald-900 text-[10px] font-bold rounded">
                  Vacant
                </span>
              </div>
            </div>

            <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-4 shadow-xs">
              <span className="text-[11px] font-bold text-blue-900 uppercase block">Occupied / Allotted</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-2xl font-black text-blue-950 font-mono">
                  {rooms.filter((r) => r.status === 'locked' || r.status === 'occupied').length}
                </span>
                <span className="px-2 py-0.5 bg-blue-200 text-blue-900 text-[10px] font-bold rounded">
                  Allotted
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Occupancy Rate</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {rooms.length > 0
                    ? ((rooms.filter((r) => r.status === 'locked' || r.status === 'occupied').length / rooms.length) * 100).toFixed(1)
                    : 0}%
                </span>
                <span className="text-xs text-slate-500 font-mono">Campus wide</span>
              </div>
            </div>
          </div>

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
                  {status === 'locked' ? 'Occupied' : status === 'free' ? 'Available' : 'All'}
                </button>
              ))}
            </div>
          </div>

          {filteredHostels.map((hostel) => {
            const allHostelRooms = rooms.filter((r) => r.hostel_id === hostel.hostel_id);
            const freeHostelRooms = allHostelRooms.filter((r) => r.status === 'free');
            const occupiedHostelRooms = allHostelRooms.filter((r) => r.status === 'locked' || r.status === 'occupied');

            let hostelRooms = allHostelRooms;
            if (roomStatusFilter === 'free') {
              hostelRooms = freeHostelRooms;
            } else if (roomStatusFilter === 'locked') {
              hostelRooms = occupiedHostelRooms;
            }

            return (
              <div
                key={hostel.hostel_id}
                className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{hostel.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Allowed: {hostel.gender_allowed} • Warden: {hostel.warden_name}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {freeHostelRooms.length} Available Left
                    </span>
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                      {occupiedHostelRooms.length} Occupied
                    </span>
                    <span className="text-xs text-slate-600 font-mono font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      Curfew: {hostel.curfew_time}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {hostelRooms.map((room) => {
                    const isOccupied = room.status === 'locked' || room.status === 'occupied';
                    const roomAllotments = allotments.filter((a) => a.room_id === room.room_id);
                    const occupants = roomAllotments
                      .map((a) => a.student?.name || a.roll_no)
                      .filter(Boolean);

                    return (
                      <div
                        key={room.room_id}
                        className={`p-2 rounded border text-center transition-all ${
                          isOccupied
                            ? 'bg-blue-50/70 border-blue-200 text-blue-950'
                            : 'bg-emerald-50/40 border-emerald-300 text-emerald-950 hover:border-emerald-600'
                        }`}
                        title={isOccupied ? `Occupants: ${occupants.join(', ')} (Round ${roomAllotments[0]?.round_number || 1})` : 'Available Room'}
                      >
                        <div className="text-xs font-bold font-mono">Room {room.room_number}</div>
                        <div className="text-[10px] mt-0.5 font-medium flex items-center justify-center gap-1">
                          <span>{room.capacity} Bed</span>
                          <span>•</span>
                          <span className={`font-bold ${isOccupied ? 'text-blue-800' : 'text-emerald-700'}`}>
                            {isOccupied ? `Occupied (${occupants.length})` : 'Vacant'}
                          </span>
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
