import React, { useMemo } from 'react';
import { Book, Member, LoanRecord } from '../types/library';
import { BookCoverImage } from './BookCoverImage';
import { exportBooksToCsv, exportLoansToCsv, getDaysDifference } from '../utils/libraryUtils';
import {
  BookOpen,
  Users,
  RotateCcw,
  AlertCircle,
  TrendingUp,
  Download,
  Award,
  BarChart3,
  CheckCircle2,
  ScanLine,
  ArrowRight,
  FileSpreadsheet
} from 'lucide-react';

interface DashboardViewProps {
  books: Book[];
  members: Member[];
  loans: LoanRecord[];
  onNavigateToTab: (tab: any) => void;
  onOpenBarcodeScanner: () => void;
  onSelectBook: (book: Book) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  books,
  members,
  loans,
  onNavigateToTab,
  onOpenBarcodeScanner,
  onSelectBook
}) => {
  // Aggregate KPIs
  const stats = useMemo(() => {
    const totalTitles = books.length;
    const totalCopies = books.reduce((acc, b) => acc + b.totalCopies, 0);
    const availableCopies = books.reduce((acc, b) => acc + b.availableCopies, 0);
    const borrowedCopies = totalCopies - availableCopies;

    const activeLoans = loans.filter((l) => l.status === 'active' || l.status === 'overdue');
    const overdueLoans = activeLoans.filter((l) => getDaysDifference(l.dueDate) < 0);
    const totalMembers = members.length;

    // Circulation rate
    const circulationRate = totalCopies > 0 ? Math.round((borrowedCopies / totalCopies) * 100) : 0;

    return {
      totalTitles,
      totalCopies,
      availableCopies,
      borrowedCopies,
      activeLoansCount: activeLoans.length,
      overdueLoansCount: overdueLoans.length,
      totalMembers,
      circulationRate
    };
  }, [books, members, loans]);

  // Top Most Borrowed Books Ranking
  const topBorrowedBooks = useMemo(() => {
    const countMap: Record<string, number> = {};
    loans.forEach((loan) => {
      countMap[loan.bookId] = (countMap[loan.bookId] || 0) + 1;
    });

    const ranked = books
      .map((book) => ({
        book,
        borrowCount: countMap[book.id] || 0
      }))
      .sort((a, b) => b.borrowCount - a.borrowCount)
      .slice(0, 5);

    return ranked;
  }, [books, loans]);

  // Category Breakdown
  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    loans.forEach((loan) => {
      const book = books.find((b) => b.id === loan.bookId);
      if (book) {
        map[book.category] = (map[book.category] || 0) + 1;
      }
    });

    const totalLoans = loans.length || 1;
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);

    return entries.map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / totalLoans) * 100)
    }));
  }, [books, loans]);

  // Borrower Type Distribution
  const memberTypeDistribution = useMemo(() => {
    const students = members.filter((m) => m.type === 'นักศึกษา').length;
    const staff = members.filter((m) => m.type === 'อาจารย์/บุคลากร').length;
    const publicType = members.filter((m) => m.type === 'บุคคลทั่วไป').length;
    return { students, staff, publicType };
  }, [members]);

  const handleExportBooks = () => {
    exportBooksToCsv(books);
  };

  const handleExportLoans = () => {
    exportLoansToCsv(loans);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            ภาพรวมระบบและสถิติห้องสมุด (Library Dashboard)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            สรุปข้อมูลสถิติคลังหนังสือ อันดับหนังสือยอดนิยม รายงานการยืม และส่งออกข้อมูลเป็นไฟล์ Excel
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={onOpenBarcodeScanner}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition-colors whitespace-nowrap"
          >
            <ScanLine className="w-4 h-4 text-emerald-700" />
            <span>สแกนด่วน</span>
          </button>

          <button
            onClick={() => onNavigateToTab('transaction')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            <span>เคาน์เตอร์ ยืม-คืน</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS (4 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Books */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              หนังสือทั้งหมด
            </span>
            <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900">
              {stats.totalCopies}{' '}
              <span className="text-xs font-normal text-slate-500 font-sans">
                เล่ม ({stats.totalTitles} ชื่อเรื่อง)
              </span>
            </p>
            <p className="text-xs text-emerald-700 font-medium pt-1">
              พร้อมให้ยืม {stats.availableCopies} เล่ม
            </p>
          </div>
          <div className="p-2.5 bg-slate-100 rounded-lg text-slate-700">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Borrowed */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              ถูกยืมอยู่ขณะนี้
            </span>
            <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-amber-600">
              {stats.borrowedCopies}{' '}
              <span className="text-xs font-normal text-slate-500 font-sans">
                เล่ม ({stats.activeLoansCount} รายการ)
              </span>
            </p>
            <p className="text-xs text-slate-500 font-mono tabular-nums pt-1">
              อัตราหมุนเวียน {stats.circulationRate}%
            </p>
          </div>
          <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600">
            <RotateCcw className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Members */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              สมาชิกห้องสมุด
            </span>
            <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900">
              {stats.totalMembers}{' '}
              <span className="text-xs font-normal text-slate-500 font-sans">คน</span>
            </p>
            <p className="text-xs text-slate-500 pt-1">
              นักศึกษา {memberTypeDistribution.students} · อาจารย์ {memberTypeDistribution.staff}
            </p>
          </div>
          <div className="p-2.5 bg-slate-100 rounded-lg text-slate-700">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4: Overdue */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
              เกินกำหนดส่ง
            </span>
            <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-rose-600">
              {stats.overdueLoansCount}{' '}
              <span className="text-xs font-normal text-slate-500 font-sans">รายการ</span>
            </p>
            <p className="text-xs text-rose-600 pt-1">
              {stats.overdueLoansCount > 0 ? 'จำเป็นต้องติดตามส่งคืน' : 'ไม่มีรายการค้างส่ง'}
            </p>
          </div>
          <div className="p-2.5 bg-rose-50 rounded-lg text-rose-600">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* DATA EXPORT CENTER STRIP */}
      <div className="p-5 bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 rounded-xl text-white shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              ศูนย์ส่งออกข้อมูลรายงาน (Export Data to Excel / CSV)
            </h3>
          </div>
          <p className="text-xs text-slate-300">
            ดาวน์โหลดไฟล์พร้อมระบบ UTF-8 BOM รองรับการเปิดภาษาไทยใน Microsoft Excel ได้อย่างถูกต้องสมบูรณ์
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleExportBooks}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>ดาวน์โหลดคลังหนังสือ (CSV)</span>
          </button>

          <button
            onClick={handleExportLoans}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ดาวน์โหลดประวัติยืม-คืน (CSV)</span>
          </button>
        </div>
      </div>

      {/* TWO COLUMN GRID: TOP BOOKS & CATEGORY BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Top 5 Most Borrowed Books (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900">
                อันดับหนังสือยอดฮิต (Most Borrowed Books)
              </h3>
            </div>
            <span className="text-xs text-slate-400">คำนวณจากประวัติการยืมทั้งหมด</span>
          </div>

          <div className="space-y-3">
            {topBorrowedBooks.map(({ book, borrowCount }, index) => {
              const rankMedals = ['🥇 อันดับ 1', '🥈 อันดับ 2', '🥉 อันดับ 3', '#4', '#5'];
              const isTop3 = index < 3;

              return (
                <div
                  key={book.id}
                  onClick={() => onSelectBook(book)}
                  className="group flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {/* Rank label */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        index === 0
                          ? 'bg-amber-100 text-amber-900'
                          : index === 1
                          ? 'bg-slate-200 text-slate-800'
                          : index === 2
                          ? 'bg-orange-100 text-orange-900'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {index + 1}
                    </div>

                    {/* Book Cover */}
                    <div className="w-10 h-14 rounded overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      <BookCoverImage
                        src={book.coverImage}
                        title={book.title}
                        category={book.category}
                      />
                    </div>

                    {/* Title & Category */}
                    <div className="space-y-0.5">
                      <h4 className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                        {book.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {book.author} · {book.category}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400">
                        ชั้นวาง: {book.shelf}
                      </p>
                    </div>
                  </div>

                  {/* Borrow Count & Stock */}
                  <div className="text-right shrink-0">
                    <span className="text-xs sm:text-sm font-bold font-mono tabular-nums text-slate-900 block">
                      ยืมแล้ว {borrowCount} ครั้ง
                    </span>
                    <span className="text-[11px] font-mono text-emerald-700">
                      ว่าง {book.availableCopies}/{book.totalCopies} เล่ม
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Category Breakdown & Member Overview (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Category Progress Bars */}
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  สัดส่วนการยืมตามหมวดหมู่
                </h3>
              </div>
            </div>

            <div className="space-y-3">
              {categoryStats.slice(0, 5).map((item) => (
                <div key={item.category} className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-700 font-medium">
                    <span className="truncate pr-2">{item.category}</span>
                    <span className="font-mono tabular-nums text-slate-900 shrink-0">
                      {item.count} ครั้ง ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(item.percentage, 5)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Member Types Strip */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              สัดส่วนประเภทสมาชิกผู้ยืม
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-500 block">นักศึกษา</span>
                <span className="font-bold text-base font-mono text-slate-900">
                  {memberTypeDistribution.students}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-500 block">อาจารย์/เจ้าหน้าที่</span>
                <span className="font-bold text-base font-mono text-slate-900">
                  {memberTypeDistribution.staff}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-500 block">บุคคลทั่วไป</span>
                <span className="font-bold text-base font-mono text-slate-900">
                  {memberTypeDistribution.publicType}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
