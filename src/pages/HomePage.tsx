import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  FileText,
  Clock,
  PhoneCall,
  Bell,
  QrCode,
  Download,
  CheckCircle2,
  Calendar,
  ExternalLink,
  ChevronRight,
  FileDown,
  AlertTriangle,
  Info,
  ShieldAlert,
  Search,
  Printer,
  X,
  Building2,
  Eye,
  BookOpen,
  Pin,
  Sparkles,
  Landmark,
  Play,
  Pause,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';

interface PublicStatus {
  is_published: boolean;
  round_number: number;
  academic_year: string;
  published_at: string | null;
}

interface NoticeItem {
  id: string;
  day: string;
  month: string;
  year: string;
  dateStr: string;
  title: string;
  tab: 'public' | 'news' | 'advisories';
  refNo: string;
  issuedBy: string;
  fileSize: string;
  isNew?: boolean;
  isPinned?: boolean;
  summary: string;
  clauses: string[];
  signatory: {
    name: string;
    designation: string;
    department: string;
  };
  copyTo: string[];
  actionLink?: string;
  actionText?: string;
  showOnlyWhenPublished?: boolean;
}

export default function HomePage() {
  const [status, setStatus] = useState<PublicStatus | null>(null);
  const [activeTab, setActiveTab] = useState<'public' | 'news' | 'advisories'>('public');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState<boolean>(false);

  // Fetch live round publication status
  useEffect(() => {
    fetch('/api/public/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus({
            is_published: data.is_published,
            round_number: data.round_number || 1,
            academic_year: data.academic_year || '2026-2027',
            published_at: data.published_at || null,
          });
        }
      })
      .catch(() => {
        setStatus(null);
      });
  }, []);

  const isPublished = Boolean(status?.is_published);

  // Official Institutional Notices
  const allNotices: NoticeItem[] = [
    // --- TAB: PUBLIC NOTICES ---
    {
      id: 'not-01',
      day: '03',
      month: '10',
      year: '2026',
      dateStr: '03-10-2026',
      title: 'Public Notice regarding Declaration of Round 1 Seat Allocation Results for Session 2026-27',
      tab: 'public',
      refNo: 'NITH/DSW/CW/2026/RESULT-01',
      issuedBy: 'Office of the Chief Warden & Dean (Student Welfare)',
      fileSize: '340 KB',
      isNew: true,
      isPinned: true,
      summary:
        'Merit-based room allocations for 2nd, 3rd, and 4th-year students have been processed according to Central Merit guidelines. Log in to the Student Portal to view your confirmed room and download your allotment confirmation letter.',
      clauses: [
        'The First Round of Hostel Seat Allocation for Undergraduate students (2nd, 3rd, and 4th Year) for Academic Session 2026-27 has been finalized and officially published on the Smart Hostel Allotment Portal as approved by the Senate Committee.',
        'Room allocations have been processed strictly on merit (highest CGPA in roommate cohorts) across Kailash, Himadri, Dhauladhar, Neelkanth, Ambika, and Parvati Hostels.',
        'All provisionally allotted students are directed to download their Provisional Allotment Confirmation Letter from the Student Portal and report to their respective Hostel Caretaker for physical room key handover between 20th Oct 2026 and 22nd Oct 2026.',
        'Students failing to take physical possession of their allotted rooms before 22nd Oct 2026 (17:00 IST) shall forfeit their claim, and the vacant seats shall be automatically surrendered to Round 2 Open Float.',
      ],
      signatory: {
        name: 'Prof. (Dr.) S. K. Sharma',
        designation: 'Chief Warden & Dean (Student Welfare)',
        department: 'NIT Hamirpur',
      },
      copyTo: [
        'Director Secretariat for kind information of the Director',
        'Registrar, NIT Hamirpur',
        'All Hostel Wardens (HBH, AGH, KBH, DBH, NBH, PBH)',
        'Chief Security Officer (Main Gate Terminal)',
        'Head, Computer Centre for web portal display',
        'All Institute and Hostel Notice Boards',
      ],
      actionLink: '/login/student',
      actionText: 'View Allotment Letter',
      showOnlyWhenPublished: true,
    },
    {
      id: 'not-02',
      day: '01',
      month: '10',
      year: '2026',
      dateStr: '01-10-2026',
      title: 'Public Notice regarding Schedule of Round 1 Online Choice Submission & Group Locking for UG Students',
      tab: 'public',
      refNo: 'NITH/DSW/CW/2026/SCH-04',
      issuedBy: 'Dean (Student Welfare) Secretariat',
      fileSize: '410 KB',
      isNew: !isPublished,
      isPinned: !isPublished,
      summary:
        'Eligible students of 2nd, 3rd, and 4th years are requested to form roommate cohorts (Triplets/Fourlets) and submit ranked room choices before closing date. Unlocked choices will not be considered.',
      clauses: [
        'Online choice filling and roommate group formation for eligible 2nd, 3rd, and 4th Year students commences on the official portal.',
        'Students are permitted to form roommate cohorts (Triplets/Fourlets) as per the architectural configuration of designated hostels (Himadri Boys Hostel, Ambika Girls Hostel, etc.).',
        'The cohort leader must lock preferences before the final cutoff (15 Oct 2026, 23:59 IST). Unlocked lobbies will not be evaluated in the Central Merit engine.',
        'In accordance with Institute privacy directives, students can only invite and join peers from their respective academic year and gender.',
      ],
      signatory: {
        name: 'Prof. (Dr.) S. K. Sharma',
        designation: 'Dean (Student Welfare)',
        department: 'NIT Hamirpur',
      },
      copyTo: ['Registrar, NIT Hamirpur', 'All Hostel Wardens', 'Institute Notice Boards'],
      actionLink: '/login/student',
      actionText: 'Enter Choice Filling',
      showOnlyWhenPublished: false,
    },
    {
      id: 'not-03',
      day: '28',
      month: '09',
      year: '2026',
      dateStr: '28-09-2026',
      title: 'Public Notice: Directives on Campus Curfew Timings & Main Gate Barcode Verification',
      tab: 'public',
      refNo: 'NITH/SEC/2026/CIRC-12',
      issuedBy: 'Chief Security Officer & Proctorial Board',
      fileSize: '290 KB',
      isNew: false,
      isPinned: false,
      summary:
        'Strict curfew of 21:30 hrs (Girls Hostels) and 22:00 hrs (Boys Hostels) is active. Mandatory barcode scanning at the main campus terminal applies to all transit movements. Late arrivals trigger automated warden notifications.',
      clauses: [
        'In pursuance of the recommendations of the Proctorial Board, biometric barcode scanning at the Main Campus Gate is mandatory for all resident students.',
        'Hostel in-timings/curfew timings are strictly enforced: Girls Hostels (Ambika, Parvati, Aravali) at 21:30 hrs; Boys Hostels (Himadri, Kailash, Dhauladhar, Neelkanth) at 22:00 hrs.',
        'Any transit after the curfew deadline is automatically recorded by the digital gate terminal and flagged to the respective Hostel Warden and Chief Warden Office.',
        'Repeated late entries without prior written gate pass from the Warden will result in disciplinary action and revocation of hostel allotment.',
      ],
      signatory: {
        name: 'Col. (Retd.) R. K. Jaswal',
        designation: 'Chief Security Officer',
        department: 'NIT Hamirpur',
      },
      copyTo: ['Dean (SW) & Chief Warden', 'All Hostel Wardens', 'Security Desk (Main Gate)'],
      actionLink: '/admin/gate',
      actionText: 'Gate Protocol',
      showOnlyWhenPublished: false,
    },
    {
      id: 'not-04',
      day: '22',
      month: '09',
      year: '2026',
      dateStr: '22-09-2026',
      title: 'Public Notice: Mandatory Online Anti-Ragging Undertakings Submission on AntiRagging.in Portal',
      tab: 'public',
      refNo: 'NITH/DSW/AR/2026/09',
      issuedBy: 'Anti-Ragging Committee & Dean (SW)',
      fileSize: '380 KB',
      isNew: false,
      isPinned: false,
      summary:
        'Mandatory submission of online Anti-Ragging undertakings at www.antiragging.in. Hard copy must be deposited during physical room possession.',
      clauses: [
        'As per directives of the Hon\'ble Supreme Court of India and UGC Regulations, ragging in any form within or outside the hostel/campus premises is strictly prohibited.',
        'Every resident student and their parent/guardian must submit the mandatory online Anti-Ragging Undertaking at www.antiragging.in and deposit a hard copy with the Caretaker during room key possession.',
        'The Institute maintains 24x7 Anti-Ragging flying squads. Strict penal actions including immediate expulsion and lodging of FIR with local police will be initiated against violators.',
        'National 24x7 Toll-Free Anti-Ragging Helpline: 1800-180-5522.',
      ],
      signatory: {
        name: 'Prof. (Dr.) S. K. Sharma',
        designation: 'Dean (Student Welfare) & Chairman Anti-Ragging Committee',
        department: 'NIT Hamirpur',
      },
      copyTo: ['All Wardens', 'Main Gate Security', 'Institute Website'],
      showOnlyWhenPublished: false,
    },

    // --- TAB: NEWS & EVENTS ---
    {
      id: 'not-05',
      day: '03',
      month: '10',
      year: '2026',
      dateStr: '03-10-2026',
      title: 'Opening and Closing Cutoff CGPA (OR-CR) for Round 1 Hostel Allocation Declared',
      tab: 'news',
      refNo: 'NITH/DSW/ORCR/2026/01',
      issuedBy: 'Hostel Admissions Committee',
      fileSize: '520 KB',
      isNew: true,
      isPinned: true,
      summary:
        'Official opening and closing CGPA merit cutoffs for each hostel (Himadri, Ambika, Kailash, Dhauladhar, Neelkanth) across departments for Academic Session 2026-27.',
      clauses: [
        'The comprehensive Opening and Closing Cutoff CGPA (OR-CR) data for Round 1 seat allocation is officially released for student reference.',
        'Hostel room allocations reflect the highest academic CGPA within each roommate cohort.',
        'Branch-wise and category-wise cutoffs have been archived and are accessible in the Student Portal.',
      ],
      signatory: {
        name: 'Dr. Vivek Kumar',
        designation: 'Convener, Hostel Admissions Committee',
        department: 'NIT Hamirpur',
      },
      copyTo: ['Dean (SW)', 'All Hostel Wardens', 'CC Webmaster'],
      showOnlyWhenPublished: true,
    },
    {
      id: 'not-06',
      day: '25',
      month: '09',
      year: '2026',
      dateStr: '25-09-2026',
      title: 'Information Brochure, Room Types, Seat Matrix & Allocation Pathway Guidelines (2026-27)',
      tab: 'news',
      refNo: 'NITH/DSW/CW/2026/DOC-02',
      issuedBy: 'Council of Wardens, NIT Hamirpur',
      fileSize: '2.4 MB',
      isNew: false,
      isPinned: false,
      summary:
        'Comprehensive overview of available capacities across Kailash, Himadri, Dhauladhar, Neelkanth, Ambika, and Parvati Hostels along with floor layouts and mess facilities.',
      clauses: [
        'The comprehensive Information Brochure detailing hostel seat matrices, floor layouts, mess amenities, and fee structure for Academic Year 2026-27 is promulgated for all students.',
        'The total hostel seat capacity across all 8 hostels stands at 2,450 beds.',
        'Students must submit proof of hostel and mess dues payment at the time of physical check-in.',
        'Strict prohibition on motorized two-wheelers/four-wheelers on campus as per Institute standing rules.',
      ],
      signatory: {
        name: 'Prof. (Dr.) S. K. Sharma',
        designation: 'Dean (Student Welfare)',
        department: 'NIT Hamirpur',
      },
      copyTo: ['Director, NIT Hamirpur', 'Chief Warden Office', 'Student Notice Boards'],
      showOnlyWhenPublished: false,
    },
    {
      id: 'not-07',
      day: '19',
      month: '09',
      year: '2026',
      dateStr: '19-09-2026',
      title: 'Mess Rebate Rules, Dining Hall Timings & Catering Code of Conduct for Session 2026-27',
      tab: 'news',
      refNo: 'NITH/CW/MESS/2026/03',
      issuedBy: 'Mess Management Committee, NIT Hamirpur',
      fileSize: '220 KB',
      isNew: false,
      isPinned: false,
      summary:
        'Official mess operating schedules, dining hall code of conduct, and rebate submission rules for Academic Session 2026-27.',
      clauses: [
        'Mess operations for Odd Semester 2026-27 commence from 18th October 2026 across all hostel dining halls.',
        'Meal Timings: Breakfast: 07:30 to 09:15 hrs | Lunch: 12:15 to 14:00 hrs | Evening Snacks: 17:00 to 18:15 hrs | Dinner: 19:45 to 21:30 hrs.',
        'A minimum of 4 consecutive days of approved absence prior to leave is required to claim mess rebate through the Warden\'s office.',
        'Taking mess utensils or food items to hostel rooms is strictly prohibited.',
      ],
      signatory: {
        name: 'Dr. Rajesh Kumar',
        designation: 'Convener, Mess Management Committee',
        department: 'NIT Hamirpur',
      },
      copyTo: ['Chief Warden Office', 'All Hostel Mess Supervisors', 'Student Mess Reps'],
      showOnlyWhenPublished: false,
    },
    {
      id: 'not-08',
      day: '15',
      month: '09',
      year: '2026',
      dateStr: '15-09-2026',
      title: 'Official Contact Directory of Hostel Wardens, Caretakers & Medical Emergency Desk',
      tab: 'news',
      refNo: 'NITH/CW/2026/HELP-01',
      issuedBy: 'Chief Warden Office, NIT Hamirpur',
      fileSize: '180 KB',
      isNew: false,
      isPinned: false,
      summary:
        'Official telephone extensions and institutional email addresses for Chief Warden Office, individual hostel wardens, medical dispensary, and campus security dispatch.',
      clauses: [
        'Contact directory of key hostel functionaries, medical dispensary, and emergency security dispatch is hereby notified for 24x7 assistance.',
        'Chief Warden Office: 01972-254011 / chiefwarden@nith.ac.in',
        'Medical Dispensary / Ambulance: 01972-254555',
        'Himadri Boys Hostel Warden: 01972-254020 | Ambika Girls Hostel Warden: 01972-254025',
        'Main Security Gate Control: 01972-254100',
      ],
      signatory: {
        name: 'Prof. (Dr.) S. K. Sharma',
        designation: 'Chief Warden & Dean (Student Welfare)',
        department: 'NIT Hamirpur',
      },
      copyTo: ['Security Control Room', 'All Hostel Reception Desks', 'Medical Centre'],
      showOnlyWhenPublished: false,
    },

    // --- TAB: ADVISORIES & GUIDELINES ---
    {
      id: 'not-09',
      day: '30',
      month: '09',
      year: '2026',
      dateStr: '30-09-2026',
      title: 'Advisory for Students regarding Roommate Cohort Formation (Triplets & Fourlets)',
      tab: 'advisories',
      refNo: 'NITH/DSW/ADV/2026/02',
      issuedBy: 'Dean (Student Welfare) Secretariat',
      fileSize: '195 KB',
      isNew: false,
      isPinned: false,
      summary:
        'Important instructions on roommate lobby creation, peer invite etiquette, CGPA averaging mechanics, and cohort leader locking responsibilities.',
      clauses: [
        'Students must ensure that all invited cohort members belong strictly to the same academic year and gender.',
        'The cohort merit rank will be determined by the Highest CGPA among the group members.',
        'Once a choice group is locked by the cohort leader, no addition, removal, or preference reordering can be performed.',
      ],
      signatory: {
        name: 'Prof. (Dr.) S. K. Sharma',
        designation: 'Dean (Student Welfare)',
        department: 'NIT Hamirpur',
      },
      copyTo: ['All Hostel Wardens', 'Student Representatives'],
      showOnlyWhenPublished: false,
    },
    {
      id: 'not-10',
      day: '29',
      month: '09',
      year: '2026',
      dateStr: '29-09-2026',
      title: 'Step-by-Step User Manual for Online Choice Filling & Group Locking Process',
      tab: 'advisories',
      refNo: 'NITH/DSW/GUIDE/2026/01',
      issuedBy: 'Computer Centre & DSW',
      fileSize: '1.2 MB',
      isNew: false,
      isPinned: false,
      summary:
        'Pictorial walkthrough illustrating student portal login via OTP, invitation acceptance, drag-and-drop hostel room preference ordering, and choice locking.',
      clauses: [
        'Detailed screenshots and instructions for navigating the Smart Hostel Allotment Portal.',
        'Troubleshooting OTP delivery failures on student institutional email accounts (@nith.ac.in).',
        'Verification of locked choices and generation of locked choice submission PDF receipt.',
      ],
      signatory: {
        name: 'Head, Computer Centre',
        designation: 'Coordinator, Portal Operations',
        department: 'NIT Hamirpur',
      },
      copyTo: ['Dean (SW)', 'Notice Boards'],
      showOnlyWhenPublished: false,
    },
    {
      id: 'not-11',
      day: '26',
      month: '09',
      year: '2026',
      dateStr: '26-09-2026',
      title: 'Standard Operating Procedure (SOP) for Physical Room Key Handover & Inventory Check',
      tab: 'advisories',
      refNo: 'NITH/CW/SOP/2026/05',
      issuedBy: 'Council of Wardens',
      fileSize: '280 KB',
      isNew: false,
      isPinned: false,
      summary:
        'Mandatory protocol to be followed by students at the respective hostel caretaker office during physical key collection and inventory sign-off.',
      clauses: [
        'Students must produce a printed copy of the Provisional Allotment Confirmation Letter.',
        'Inspection of room furniture (study table, chair, cot, almirah) and signing of duplicate room inventory ledger.',
        'Collection of hostel gate identity card and registration for biometric mess entry.',
      ],
      signatory: {
        name: 'Council of Wardens',
        designation: 'Hostel Administration',
        department: 'NIT Hamirpur',
      },
      copyTo: ['All Hostel Caretakers', 'Hostel Notice Boards'],
      showOnlyWhenPublished: false,
    },
  ];

  const triggerDownloadDocument = (docName: string, docSize: string) => {
    setDownloadSuccessToast(`Downloading official PDF: ${docName} (${docSize})`);
    setTimeout(() => setDownloadSuccessToast(null), 4000);
  };

  const displayedNotices = allNotices.filter((n) => {
    if (n.showOnlyWhenPublished && !isPublished) return false;
    if (n.tab !== activeTab) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.refNo.toLowerCase().includes(q) ||
        n.summary.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getTabCount = (tabName: 'public' | 'news' | 'advisories') => {
    return allNotices.filter(
      (n) => n.tab === tabName && (!n.showOnlyWhenPublished || isPublished)
    ).length;
  };

  // Duplicate items for continuous seamless downward loop
  const loopNotices =
    displayedNotices.length > 0
      ? displayedNotices.length <= 2
        ? [...displayedNotices, ...displayedNotices, ...displayedNotices, ...displayedNotices]
        : [...displayedNotices, ...displayedNotices]
      : [];

  const isMotionActive = !isAutoScrollPaused && !searchFilter.trim() && displayedNotices.length > 0;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Downward news marquee animation style */}
      <style>{`
        @keyframes newsMoveDownward {
          0% {
            transform: translateY(-50%);
          }
          100% {
            transform: translateY(0%);
          }
        }
        .animate-news-downward {
          animation: newsMoveDownward 30s linear infinite;
        }
        .animate-news-downward:hover {
          animation-play-state: paused !important;
        }
      `}</style>

      <Navbar isPublished={isPublished} />

      {/* ========================================================================= */}
      {/* TOP TICKER / MARQUEE RIBBON                                               */}
      {/* ========================================================================= */}
      <div className="bg-blue-950 text-white border-b-2 border-orange-500 py-1.5 px-4 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center gap-3 text-xs sm:text-sm">
          <div className="bg-orange-600 text-white font-extrabold px-2.5 py-0.5 rounded text-[11px] uppercase tracking-wider shrink-0 flex items-center gap-1 shadow-2xs">
            <Bell className="w-3 h-3 text-white" />
            <span>LATEST NEWS:</span>
          </div>
          <div className="overflow-hidden whitespace-nowrap text-white/95 font-medium truncate flex-1">
            <span>
              {isPublished
                ? 'Round 1 Seat Allocation Results for UG 2nd, 3rd & 4th Year are Declared! Students can login under Student Activity Board to download confirmed allotment letter • Physical key handover starts 20-Oct-2026 • Mandatory curfew biometric scanning active.'
                : 'Choice filling for Round 1 Hostel Allocation is actively accepting roommate cohort submissions. Please lock preferences before closing cutoff • Mandatory curfew scanning active: 21:30 (Girls) / 22:00 (Boys).'}
            </span>
          </div>
        </div>
      </div>

      {/* DOWNLOAD TOAST ALERT */}
      {downloadSuccessToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-blue-950 text-white border-2 border-orange-400 px-4 py-3 rounded-md shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Download className="w-5 h-5 text-orange-400 animate-bounce" />
          <div className="text-xs font-medium">
            <span className="font-bold text-orange-300 block">Download Initiated</span>
            {downloadSuccessToast}
          </div>
          <button
            onClick={() => setDownloadSuccessToast(null)}
            className="text-white/70 hover:text-white ml-2 p-1"
          >
            ✕
          </button>
        </div>
      )}

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ========================================================================= */}
        {/* INSTITUTIONAL TITLE BANNER (NIT HAMIRPUR)                                 */}
        {/* ========================================================================= */}
        <div className="bg-white border-2 border-slate-300 rounded-lg p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-14 h-14 rounded-full border-2 border-blue-900 bg-blue-50 flex flex-col items-center justify-center text-blue-950 shrink-0 shadow-xs font-sans">
              <Landmark className="w-6 h-6 text-blue-900" />
              <span className="font-black text-[9px] tracking-tight">NITH</span>
            </div>
            <div>
              <span className="text-xs font-bold text-orange-600 uppercase tracking-widest block">
                Centralized Merit Allocation System
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-blue-950 tracking-tight">
                Central Hostel Allotment &amp; Student Access Portal (2026-27)
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
                National Institute of Technology Hamirpur • Office of Dean (Student Welfare) &amp; Chief Warden
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-800">Academic Year</div>
              <div className="text-sm font-black text-blue-900 font-mono">2026-2027</div>
            </div>
            <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded text-xs font-bold text-blue-900">
              Round 1 Active
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CONDITIONAL PUBLISHED RESULTS ANNOUNCEMENT BANNER                         */}
        {/* ========================================================================= */}
        {isPublished && (
          <div className="bg-emerald-50 border-2 border-emerald-600 rounded-lg p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 transition-all">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-emerald-600 text-white rounded-md shrink-0 shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-950 bg-emerald-200 px-2 py-0.2 rounded">
                    Official Declaration
                  </span>
                  <span className="text-xs font-bold text-emerald-900 font-mono">
                    Round 1 Allotment Declared
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-950/90 font-medium mt-0.5">
                  Provisional seat allocations are now published. Students must log in to the Student Activity Board to verify their allotted room and download their confirmation letter.
                </p>
              </div>
            </div>

            <Link
              to="/login/student"
              className="w-full sm:w-auto px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded shadow-xs shrink-0 flex items-center justify-center gap-2 transition-all"
            >
              <span>Check Allotment Result</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CORE GRID: NOTICE BOARD (LEFT) + STUDENT ACTIVITY BOARD (RIGHT)           */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ===================================================================== */}
          {/* COLUMN 1: THE CLEAN NOTICE BOARD WITH MOVING DOWNWARD NEWS (7 COLS)   */}
          {/* ===================================================================== */}
          <div className="lg:col-span-7 space-y-6">
            {/* The Notice Board Container */}
            <div className="bg-white border-2 border-slate-300 rounded-lg shadow-xs overflow-hidden flex flex-col">
              {/* Notice Board Header with Controls & Tabs */}
              <div className="bg-blue-950 text-white border-b-2 border-orange-500">
                <div className="px-4 py-2.5 flex items-center justify-between border-b border-blue-900 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-orange-400" />
                    <h2 className="font-bold text-sm sm:text-base uppercase tracking-wide">
                      Notice Board / सूचना पट्ट
                    </h2>
                  </div>

                  {/* Auto-Scroll Motion Controls (Pause / Resume & Status) */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsAutoScrollPaused(!isAutoScrollPaused)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-2xs ${
                        isAutoScrollPaused
                          ? 'bg-amber-400 text-amber-950 hover:bg-amber-300'
                          : 'bg-blue-900 text-blue-100 hover:text-white hover:bg-blue-800 border border-blue-700'
                      }`}
                      title={isAutoScrollPaused ? 'Resume moving downward news' : 'Pause downward motion'}
                    >
                      {isAutoScrollPaused ? (
                        <>
                          <Play className="w-3 h-3 text-amber-950 fill-amber-950" />
                          <span>Resume Motion</span>
                        </>
                      ) : (
                        <>
                          <Pause className="w-3 h-3 text-orange-400 fill-orange-400" />
                          <span>Pause Motion</span>
                        </>
                      )}
                    </button>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-blue-200 font-medium">
                      <span className="text-orange-400 font-bold">↓</span> Moving Downward
                    </span>
                  </div>
                </div>

                {/* Official Tabs */}
                <div className="flex flex-wrap gap-1 px-3 pt-2 bg-blue-900/60">
                  {[
                    { id: 'public', label: 'Public Notices', count: getTabCount('public') },
                    { id: 'news', label: 'News & Events', count: getTabCount('news') },
                    { id: 'advisories', label: 'Advisories & Guidelines', count: getTabCount('advisories') },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-3 py-2 text-xs font-bold rounded-t transition-all flex items-center gap-1.5 ${
                        activeTab === tab.id
                          ? 'bg-white text-blue-950 font-black shadow-xs'
                          : 'text-blue-100 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          activeTab === tab.id
                            ? 'bg-orange-600 text-white font-bold'
                            : 'bg-blue-950 text-blue-200'
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Search & Filter Strip */}
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    placeholder="Search circulars, reference numbers, or keywords..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full pl-8 pr-7 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-900"
                  />
                  {searchFilter && (
                    <button
                      onClick={() => setSearchFilter('')}
                      className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-700 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 font-mono hidden sm:block shrink-0">
                  {isMotionActive ? '(Hover to pause)' : '(Manual scroll)'}
                </div>
              </div>

              {/* =============================================================== */}
              {/* MOVING DOWNWARD NEWS VIEWPORT                                   */}
              {/* Continuous downwards sliding loop with instant hover freeze    */}
              {/* =============================================================== */}
              <div className="relative h-[390px] overflow-hidden bg-white">
                {/* Subtle top & bottom shadow gradient masks for seamless entry/exit */}
                <div className="pointer-events-none absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-white to-transparent z-10" />
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent z-10" />

                {displayedNotices.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs space-y-1">
                    <p>No notices found matching your search query.</p>
                    <button
                      onClick={() => setSearchFilter('')}
                      className="text-blue-900 font-bold hover:underline"
                    >
                      Clear search
                    </button>
                  </div>
                ) : isMotionActive ? (
                  /* Downward scrolling track */
                  <div
                    className="animate-news-downward hover:[animation-play-state:paused]"
                    style={{
                      animationDuration: `${Math.max(20, displayedNotices.length * 7)}s`,
                    }}
                  >
                    <ul className="divide-y divide-slate-200">
                      {loopNotices.map((notice, idx) => (
                        <li
                          key={`${notice.id}-loop-${idx}`}
                          className={`p-3.5 sm:p-4 hover:bg-blue-50/60 transition-colors flex items-start gap-3 group/item ${
                            notice.isPinned ? 'bg-amber-50/20' : ''
                          }`}
                        >
                          {/* Red PDF Icon */}
                          <div className="shrink-0 mt-0.5">
                            <div className="w-8 h-8 rounded bg-red-100 border border-red-300 text-red-700 flex flex-col items-center justify-center font-bold text-[9px] shadow-2xs group-hover/item:bg-red-600 group-hover/item:text-white transition-colors">
                              <FileText className="w-4 h-4" />
                              <span className="leading-none text-[8px] font-mono">PDF</span>
                            </div>
                          </div>

                          {/* Notice Title & Metadata */}
                          <div className="flex-1 space-y-1">
                            <div className="flex items-start gap-2 flex-wrap">
                              <button
                                onClick={() => setSelectedNotice(notice)}
                                className="text-left text-xs sm:text-sm font-semibold text-blue-950 group-hover/item:text-blue-700 group-hover/item:underline leading-snug"
                              >
                                {notice.title}
                              </button>
                              {notice.isNew && (
                                <span className="inline-flex items-center px-1.5 py-0.2 bg-red-600 text-white text-[10px] font-black rounded uppercase tracking-wider animate-pulse shadow-2xs">
                                  NEW
                                </span>
                              )}
                              {notice.isPinned && (
                                <span className="px-1.5 py-0.2 bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-bold rounded">
                                  PINNED
                                </span>
                              )}
                            </div>

                            {/* Metadata Strip: Date, Size, Ref */}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500 font-mono">
                              <span>
                                <strong className="text-slate-700 font-sans">Date:</strong> {notice.dateStr}
                              </span>
                              <span>•</span>
                              <span>
                                <strong className="text-slate-700 font-sans">Size:</strong> {notice.fileSize}
                              </span>
                              <span>•</span>
                              <span className="text-slate-400">Ref: {notice.refNo}</span>
                            </div>
                          </div>

                          {/* Direct Actions */}
                          <div className="shrink-0 flex items-center gap-1.5 pt-0.5">
                            <button
                              onClick={() => setSelectedNotice(notice)}
                              className="px-2 py-1 text-blue-900 hover:text-white hover:bg-blue-900 rounded border border-blue-200 hover:border-blue-900 text-xs font-semibold transition-colors flex items-center gap-1 shadow-2xs"
                              title="View Official Notice"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">View</span>
                            </button>
                            <button
                              onClick={() => triggerDownloadDocument(notice.title, notice.fileSize)}
                              className="px-2 py-1 text-red-700 hover:text-white hover:bg-red-600 rounded border border-red-200 hover:border-red-600 text-xs font-semibold transition-colors flex items-center gap-1 shadow-2xs"
                              title={`Download PDF document (${notice.fileSize})`}
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">PDF</span>
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  /* Static Scrollable View (when paused or searching) */
                  <div className="h-full overflow-y-auto">
                    <ul className="divide-y divide-slate-200">
                      {displayedNotices.map((notice) => (
                        <li
                          key={notice.id}
                          className={`p-3.5 sm:p-4 hover:bg-blue-50/60 transition-colors flex items-start gap-3 group/item ${
                            notice.isPinned ? 'bg-amber-50/20' : ''
                          }`}
                        >
                          <div className="shrink-0 mt-0.5">
                            <div className="w-8 h-8 rounded bg-red-100 border border-red-300 text-red-700 flex flex-col items-center justify-center font-bold text-[9px] shadow-2xs group-hover/item:bg-red-600 group-hover/item:text-white transition-colors">
                              <FileText className="w-4 h-4" />
                              <span className="leading-none text-[8px] font-mono">PDF</span>
                            </div>
                          </div>

                          <div className="flex-1 space-y-1">
                            <div className="flex items-start gap-2 flex-wrap">
                              <button
                                onClick={() => setSelectedNotice(notice)}
                                className="text-left text-xs sm:text-sm font-semibold text-blue-950 group-hover/item:text-blue-700 group-hover/item:underline leading-snug"
                              >
                                {notice.title}
                              </button>
                              {notice.isNew && (
                                <span className="inline-flex items-center px-1.5 py-0.2 bg-red-600 text-white text-[10px] font-black rounded uppercase tracking-wider animate-pulse shadow-2xs">
                                  NEW
                                </span>
                              )}
                              {notice.isPinned && (
                                <span className="px-1.5 py-0.2 bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-bold rounded">
                                  PINNED
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500 font-mono">
                              <span>
                                <strong className="text-slate-700 font-sans">Date:</strong> {notice.dateStr}
                              </span>
                              <span>•</span>
                              <span>
                                <strong className="text-slate-700 font-sans">Size:</strong> {notice.fileSize}
                              </span>
                              <span>•</span>
                              <span className="text-slate-400">Ref: {notice.refNo}</span>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-1.5 pt-0.5">
                            <button
                              onClick={() => setSelectedNotice(notice)}
                              className="px-2 py-1 text-blue-900 hover:text-white hover:bg-blue-900 rounded border border-blue-200 hover:border-blue-900 text-xs font-semibold transition-colors flex items-center gap-1 shadow-2xs"
                              title="View Official Notice"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">View</span>
                            </button>
                            <button
                              onClick={() => triggerDownloadDocument(notice.title, notice.fileSize)}
                              className="px-2 py-1 text-red-700 hover:text-white hover:bg-red-600 rounded border border-red-200 hover:border-red-600 text-xs font-semibold transition-colors flex items-center gap-1 shadow-2xs"
                              title={`Download PDF document (${notice.fileSize})`}
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">PDF</span>
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Notice Board Footer */}
              <div className="bg-slate-50 border-t border-slate-200 p-2.5 px-4 flex items-center justify-between text-xs text-slate-600">
                <span className="font-medium">
                  Central Notice Repository • NIT Hamirpur
                </span>
                <button
                  onClick={() => alert('Central Notice Archive (2024-2026): All past gazettes are archived on the NITH Intranet Server.')}
                  className="font-bold text-blue-900 hover:underline flex items-center gap-1"
                >
                  <span>View More / Archives</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Official Allotment Schedule Table */}
            <div className="bg-white border-2 border-slate-300 rounded-lg shadow-xs overflow-hidden">
              <div className="bg-blue-950 text-white px-4 py-2.5 border-b-2 border-orange-500 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-400" />
                  <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wide">
                    Hostel Allotment Schedule (Session 2026-27)
                  </h3>
                </div>
                <span className="text-[10px] text-blue-200 font-mono">Round 1</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                      <th className="py-2 px-3">Counselling Activity</th>
                      <th className="py-2 px-3">Start Date</th>
                      <th className="py-2 px-3">End Date</th>
                      <th className="py-2 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold">Online Choice Submission &amp; Group Locking</td>
                      <td className="py-2 px-3 font-mono">10-10-2026</td>
                      <td className="py-2 px-3 font-mono">15-10-2026</td>
                      <td className="py-2 px-3 text-right">
                        <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 font-bold rounded text-[10px]">
                          Closed
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 bg-emerald-50/40">
                      <td className="py-2 px-3 font-semibold text-emerald-950">Declaration of Round 1 Seat Allotment</td>
                      <td className="py-2 px-3 font-mono text-emerald-900" colSpan={2}>
                        18-10-2026 (Published)
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span className="px-1.5 py-0.2 bg-emerald-600 text-white font-black rounded text-[10px]">
                          Active
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold">Physical Room Key Handover at Hostel</td>
                      <td className="py-2 px-3 font-mono">20-10-2026</td>
                      <td className="py-2 px-3 font-mono">22-10-2026</td>
                      <td className="py-2 px-3 text-right">
                        <span className="px-1.5 py-0.2 bg-blue-100 text-blue-900 font-bold rounded text-[10px]">
                          Upcoming
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold">Mess Dues Clearance &amp; Undertaking Deposit</td>
                      <td className="py-2 px-3 font-mono" colSpan={2}>
                        Within 7 days of room check-in
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 font-bold rounded text-[10px]">
                          Mandatory
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* COLUMN 2: STUDENT ACTIVITY BOARD (5 COLUMNS)                           */}
          {/* ===================================================================== */}
          <div className="lg:col-span-5 space-y-6">
            {/* THE STUDENT ACTIVITY BOARD */}
            <div className="bg-white border-2 border-slate-300 rounded-lg shadow-xs overflow-hidden">
              <div className="bg-blue-950 text-white px-4 py-3 border-b-2 border-orange-500 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-orange-400" />
                  <h3 className="font-bold text-sm sm:text-base uppercase tracking-wide">
                    Student Activity Board
                  </h3>
                </div>
                <span className="text-[10px] bg-blue-900 text-blue-200 px-2 py-0.5 rounded font-mono">
                  Online Services
                </span>
              </div>

              <div className="p-3.5 space-y-2.5 bg-slate-50/50">
                {/* 1. SEAT ALLOTMENT RESULT */}
                <Link
                  to="/login/student"
                  className={`block p-3 rounded-md border-2 transition-all group ${
                    isPublished
                      ? 'bg-emerald-50 border-emerald-500 hover:bg-emerald-100/70 hover:shadow-xs'
                      : 'bg-white border-slate-300 hover:border-blue-900 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-900">
                        View Round 1 Seat Allocation Result
                      </span>
                      {isPublished ? (
                        <span className="px-1.5 py-0.2 bg-emerald-600 text-white text-[10px] font-black rounded uppercase tracking-wider animate-pulse">
                          DECLARED
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 bg-amber-500 text-amber-950 text-[10px] font-bold rounded uppercase">
                          UPCOMING
                        </span>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-900 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Check assigned hostel, confirmed room number, roommate list and download provisional allotment letter.
                  </p>
                </Link>

                {/* 2. CHOICE FILLING & GROUP LOCKING */}
                <Link
                  to="/login/student"
                  className="block p-3 bg-white rounded-md border-2 border-slate-300 hover:border-blue-900 hover:shadow-xs transition-all group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-900">
                        Online Choice Filling &amp; Group Locking
                      </span>
                      {!isPublished && (
                        <span className="px-1.5 py-0.2 bg-red-600 text-white text-[10px] font-black rounded uppercase tracking-wider animate-pulse">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-900 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Form Triplet/Fourlet roommate lobbies with peers and submit ranked room choices before closing date.
                  </p>
                </Link>

                {/* 3. GATE ENTRY TERMINAL */}
                <Link
                  to="/admin/gate"
                  className="block p-3 bg-white rounded-md border-2 border-slate-300 hover:border-blue-900 hover:shadow-xs transition-all group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-900">
                        Campus Main Gate Barcode Terminal
                      </span>
                      <span className="px-1.5 py-0.2 bg-slate-200 text-slate-800 text-[10px] font-bold rounded">
                        Security Pass
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-900 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Live transit logging, student ID barcode scanning, curfew verification (21:30 / 22:00) and warden alerts.
                  </p>
                </Link>

                {/* 4. ADMINISTRATION & WARDEN CONSOLE */}
                <Link
                  to="/login/admin"
                  className="block p-3 bg-white rounded-md border-2 border-slate-300 hover:border-blue-900 hover:shadow-xs transition-all group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-900">
                        Administration &amp; Warden Portal
                      </span>
                      <span className="px-1.5 py-0.2 bg-blue-100 text-blue-900 text-[10px] font-bold rounded">
                        Authorized
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-900 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Execute Central Merit batch allotment algorithm, inspect merit CGPA ranking logs, manage occupancy matrices and publish results.
                  </p>
                </Link>
              </div>
            </div>

            {/* e-SERVICES & IMPORTANT LINKS BOX */}
            <div className="bg-white border-2 border-slate-300 rounded-lg shadow-xs overflow-hidden">
              <div className="bg-blue-950 text-white px-4 py-2.5 border-b-2 border-orange-500 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileDown className="w-4 h-4 text-orange-400" />
                  <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wide">
                    e-Services &amp; Important Links
                  </h3>
                </div>
              </div>

              <div className="p-3 bg-slate-50/50">
                <ul className="divide-y divide-slate-200 text-xs">
                  {[
                    { title: 'Hostel Seat Matrix & Room Capacity 2026-27', size: '2.4 MB' },
                    { title: 'Business Rules for Central Merit Seat Allocation', size: '480 KB' },
                    { title: 'Opening & Closing Cutoffs (Round 1 OR-CR)', size: '520 KB' },
                    { title: 'Anti-Ragging Undertaking by Student & Parent', size: '380 KB' },
                    { title: 'Room Inventory Handover & Clearance Slip', size: '210 KB' },
                    { title: 'Mess Rebate & Fee Clearance Performa', size: '180 KB' },
                  ].map((item, idx) => (
                    <li key={idx} className="py-2 px-1">
                      <button
                        onClick={() => triggerDownloadDocument(item.title, item.size)}
                        className="w-full text-left flex items-center justify-between gap-2 group hover:text-blue-900"
                      >
                        <span className="truncate text-slate-700 group-hover:text-blue-950 group-hover:underline font-medium">
                          • {item.title}
                        </span>
                        <span className="text-[10px] text-slate-400 group-hover:text-blue-900 font-mono shrink-0 flex items-center gap-1">
                          <Download className="w-3 h-3 text-red-600" />
                          {item.size}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* HELPLINE / CONTACT SUPPORT BOX */}
            <div className="bg-amber-50/80 border-2 border-amber-300 rounded-lg p-3.5 shadow-xs space-y-2 text-xs text-amber-950">
              <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px] text-amber-900 border-b border-amber-300 pb-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-800" />
                <span>Statutory Helplines &amp; Query Desk</span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div>
                  <span className="text-amber-800 block font-bold">National Anti-Ragging Helpline (Toll Free 24x7):</span>
                  <strong className="text-amber-950 font-mono text-xs block">1800-180-5522</strong>
                </div>
                <div>
                  <span className="text-amber-800 block font-bold">Chief Warden Office &amp; Helpdesk:</span>
                  <strong className="text-amber-950 font-mono text-xs block">01972-254011 / chiefwarden@nith.ac.in</strong>
                </div>
                <div>
                  <span className="text-amber-800 block font-bold">Campus Security Dispatch (Main Gate):</span>
                  <strong className="text-amber-950 font-mono text-xs block">01972-254100</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* OFFICIAL NOTICE READER MODAL                                              */}
      {/* ========================================================================= */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg border-2 border-slate-400 shadow-2xl max-w-3xl w-full my-6 overflow-hidden text-slate-900 flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-blue-950 text-white px-4 sm:px-6 py-3 flex items-center justify-between gap-3 border-b-2 border-orange-500">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-400" />
                <span className="text-xs sm:text-sm font-bold tracking-wide uppercase">
                  Official Public Notice • NIT Hamirpur
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/20"
                  title="Print Official Notice"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print / Save PDF</span>
                </button>
                <button
                  onClick={() => setSelectedNotice(null)}
                  className="p-1 hover:bg-white/20 rounded text-white/80 hover:text-white transition-colors"
                  aria-label="Close Notice"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Notice Paper Document */}
            <div className="p-6 sm:p-10 space-y-6 overflow-y-auto max-h-[75vh] font-serif bg-white text-slate-900 print:p-0">
              {/* University Header / Letterhead */}
              <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                <div className="flex justify-center mb-2">
                  <div className="w-14 h-14 rounded-full border-2 border-blue-950 flex flex-col items-center justify-center bg-blue-50 text-blue-950 shadow-xs font-sans">
                    <Landmark className="w-6 h-6 text-blue-950" />
                    <span className="font-extrabold text-[9px] tracking-tighter">NITH</span>
                  </div>
                </div>
                <div className="text-sm font-bold text-slate-800 tracking-wider">
                  राष्ट्रीय प्रौद्योगिकी संस्थान हमीरपुर
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-blue-950 uppercase tracking-tight">
                  National Institute of Technology Hamirpur
                </h2>
                <p className="text-[11px] text-slate-600 font-sans">
                  (An Institute of National Importance under Ministry of Education, Govt. of India)
                </p>
                <div className="pt-2 text-xs font-bold text-slate-900 font-sans uppercase tracking-wide">
                  कार्यालय अधिष्ठाता (छात्र कल्याण) एवं मुख्य वार्डन
                </div>
                <div className="text-xs font-extrabold text-blue-950 font-sans uppercase tracking-wide">
                  OFFICE OF THE DEAN (STUDENT WELFARE) &amp; CHIEF WARDEN
                </div>
                <p className="text-[10px] text-slate-500 font-sans">
                  Hamirpur (Himachal Pradesh) - 177005 • Phone: 01972-254011 • Web: www.nith.ac.in
                </p>
              </div>

              {/* Ref No & Date */}
              <div className="flex justify-between items-center text-xs font-mono text-slate-800 border-b border-slate-200 pb-2">
                <div>
                  <strong>Ref. No.:</strong> {selectedNotice.refNo}
                </div>
                <div>
                  <strong>Date:</strong> {selectedNotice.dateStr}
                </div>
              </div>

              {/* Notification Subject */}
              <div className="space-y-2">
                <div className="text-center font-black text-sm uppercase tracking-widest text-slate-900 underline font-sans">
                  PUBLIC NOTICE / सार्वजनिक सूचना
                </div>
                <div className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                  <u>Sub:</u> {selectedNotice.title}
                </div>
              </div>

              {/* Numbered Clauses */}
              <div className="space-y-3.5 text-xs sm:text-sm text-slate-800 leading-relaxed font-sans">
                {selectedNotice.clauses.map((clause, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <span className="font-bold text-slate-900 shrink-0">{idx + 1}.</span>
                    <span>{clause}</span>
                  </div>
                ))}
              </div>

              {/* Signatory Block */}
              <div className="pt-6 flex justify-end font-sans">
                <div className="text-right space-y-1 text-xs">
                  <div className="font-serif italic text-blue-900 font-semibold mb-2">
                    [Approved Digitally by Authority]
                  </div>
                  <div className="font-extrabold text-slate-900 text-sm">{selectedNotice.signatory.name}</div>
                  <div className="text-slate-700 font-medium">{selectedNotice.signatory.designation}</div>
                  <div className="text-slate-500">{selectedNotice.signatory.department}</div>
                </div>
              </div>

              {/* Distribution / Copy To */}
              <div className="pt-4 border-t border-slate-300 font-sans text-[11px] text-slate-600 space-y-1">
                <div className="font-bold text-slate-800">Copy forwarded for information &amp; necessary compliance to:</div>
                <ol className="list-decimal list-inside space-y-0.5 pl-1">
                  {selectedNotice.copyTo.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-100 border-t border-slate-300 px-6 py-3 flex items-center justify-between gap-4 font-sans text-xs">
              <span className="text-slate-500 hidden sm:inline">
                Official Electronic Document • Reference: {selectedNotice.refNo}
              </span>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {selectedNotice.actionLink && (
                  <Link
                    to={selectedNotice.actionLink}
                    className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded shadow-xs"
                  >
                    {selectedNotice.actionText || 'Proceed to Portal'}
                  </Link>
                )}
                <button
                  onClick={() => setSelectedNotice(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold rounded"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INSTITUTIONAL FOOTER */}
      <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-800 mt-12 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
          <span>National Institute of Technology Hamirpur • Central Hostel Allotment System</span>
          <span className="font-mono text-slate-400">Computer Centre (CC) • NIT Hamirpur (H.P.) 177005</span>
        </div>
      </footer>
    </div>
  );
}
