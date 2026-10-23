import React, { useState, useMemo } from 'react';
import { LoanRecord, Book } from '../types/library';
import { BookCoverImage } from './BookCoverImage';
import {
  formatDateThai,
  getDaysDifference,
  calculateFine,
  addDaysToDate
} from '../utils/libraryUtils';
import {
  Search,
  AlertCircle,
  Clock,
  Phone,
  RotateCcw,
  CalendarPlus,
  Copy,
  Check,
  CheckCircle2,
  BookOpen
} from 'lucide-react';

interface BorrowedMonitorViewProps {
  loans: LoanRecord[];
  books: Book[];
  isAdmin?: boolean;
  onOpenReturnModal: (loan: LoanRecord) => void;
  onExtendLoan: (loanId: string) => void;
  onNavigateToBorrow: () => void;
}

export const BorrowedMonitorView: React.FC<BorrowedMonitorViewProps> = ({
  loans,
  books,
  isAdmin = false,
  onOpenReturnModal,
  onExtendLoan,
  onNavigateToBorrow
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'overdue' | 'due-soon'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Active (unreturned) loans only
  const activeLoans = useMemo(() => {
    return loans.filter((l) => l.status === 'active' || l.status === 'overdue');
  }, [loans]);

  // Derived loan statistics
  const stats = useMemo(() => {
    let overdueCount = 0;
    let dueSoonCount = 0;
    let totalFine = 0;

    activeLoans.forEach((loan) => {
      const diff = getDaysDifference(loan.dueDate);
      if (diff < 0) {
        overdueCount += 1;
        totalFine += calculateFine(loan.dueDate);
      } else if (diff <= 3) {
        dueSoonCount += 1;
      }
    });

    return {
      totalBorrowed: activeLoans.length,
      overdueCount,
      dueSoonCount,
      totalFine
    };
  }, [activeLoans]);

  // Filtered loans based on search and selected filter tab
  const filteredLoans = useMemo(() => {
    return activeLoans.filter((loan) => {
      const matchesSearch =
        loan.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.bookIsbn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.memberCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.bookShelf.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.memberPhone.includes(searchQuery);

      if (!matchesSearch) return false;

      const diff = getDaysDifference(loan.dueDate);
      if (filterType === 'overdue') {
        return diff < 0;
      }
      if (filterType === 'due-soon') {
        return diff >= 0 && diff <= 3;
      }
      return true;
    });
  }, [activeLoans, searchQuery, filterType]);

  const handleCopyPhone = (phone: string, id: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            ระบบเช็คหนังสือที่ถูกยืม (Active Borrowed Loans)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isAdmin
              ? 'ตรวจสอบสถานะหนังสือทุกเล่มที่กำลังถูกยืม รายชื่อผู้ยืม วันกำหนดคืน และติดตามรายการเกินกำหนดส่ง'
              : 'ตรวจสอบรายการหนังสือที่กำลังถูกยืมอยู่ทั้งหมด วันกำหนดคืน และสถานะคงค้างในห้องสมุด'}
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToBorrow}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition-colors whitespace-nowrap"
            >
              + บันทึกการยืมใหม่
            </button>
          </div>
        )}
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              หนังสือที่ถูกยืมอยู่ทั้งหมด
            </p>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              {stats.totalBorrowed}{' '}
              <span className="text-xs font-normal text-slate-500 font-sans">เล่ม</span>
            </p>
          </div>
          <div className="p-2.5 bg-slate-100 rounded-lg text-slate-700">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-amber-700 uppercase tracking-wider">
              ใกล้ครบกำหนด (ใน 3 วัน)
            </p>
            <p className="text-2xl font-bold font-mono tabular-nums text-amber-600 mt-1">
              {stats.dueSoonCount}{' '}
              <span className="text-xs font-normal text-slate-500 font-sans">เล่ม</span>
            </p>
          </div>
          <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-rose-700 uppercase tracking-wider">
              เกินกำหนดส่ง (Overdue)
            </p>
            <p className="text-2xl font-bold font-mono tabular-nums text-rose-600 mt-1">
              {stats.overdueCount}{' '}
              <span className="text-xs font-normal text-slate-500 font-sans">
                เล่ม (ค่าปรับรวม ฿{stats.totalFine.toLocaleString()})
              </span>
            </p>
          </div>
          <div className="p-2.5 bg-rose-50 rounded-lg text-rose-600">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Interactive Filter Segment */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อหนังสือ, ISBN, ชื่อผู้ยืม, รหัสสมาชิก หรือเบอร์โทร..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Segmented Filter Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md self-start md:self-auto shrink-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              filterType === 'all'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ทั้งหมด ({stats.totalBorrowed})
          </button>
          <button
            onClick={() => setFilterType('due-soon')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              filterType === 'due-soon'
                ? 'bg-white text-amber-800 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ใกล้ครบกำหนด ({stats.dueSoonCount})
          </button>
          <button
            onClick={() => setFilterType('overdue')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              filterType === 'overdue'
                ? 'bg-white text-rose-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            เกินกำหนด ({stats.overdueCount})
          </button>
        </div>
      </div>

      {/* Borrowed Books List */}
      {filteredLoans.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-lg border border-slate-200 shadow-sm">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">
            {searchQuery
              ? 'ไม่พบข้อมูลหนังสือที่ถูกยืมตามคำค้นหา'
              : filterType === 'overdue'
              ? 'ยอดเยี่ยม! ไม่มีหนังสือเกินกำหนดส่งในขณะนี้'
              : 'ขณะนี้ไม่มีหนังสือที่ถูกยืมอยู่ในระบบ'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery
              ? 'ลองค้นหาด้วยคำอื่น หรือกดล้างคำค้นหา'
              : 'สามารถดูรายการหนังสือทั้งหมดในคลัง หรือบันทึกการยืมหนังสือใหม่ได้'}
          </p>
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200"
            >
              ล้างคำค้นหา
            </button>
          ) : (
            <button
              onClick={onNavigateToBorrow}
              className="mt-4 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 shadow-sm"
            >
              ทำรายการยืมหนังสือ
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLoans.map((loan) => {
            const diffDays = getDaysDifference(loan.dueDate);
            const isOverdue = diffDays < 0;
            const isDueToday = diffDays === 0;
            const isDueSoon = diffDays > 0 && diffDays <= 3;
            const fineAmount = isOverdue ? calculateFine(loan.dueDate) : 0;

            // Find full book data if available
            const bookData = books.find((b) => b.id === loan.bookId);

            return (
              <div
                key={loan.id}
                className={`p-4 bg-white rounded-lg border transition-shadow hover:shadow-md ${
                  isOverdue
                    ? 'border-rose-200 bg-rose-50/20'
                    : isDueSoon
                    ? 'border-amber-200'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Book & Borrower Info */}
                  <div className="flex items-start gap-4">
                    {/* Book Thumbnail */}
                    <div className="w-16 h-22 sm:w-20 sm:h-28 shrink-0 overflow-hidden rounded bg-slate-100 border border-slate-200">
                      <BookCoverImage
                        src={loan.bookCover || bookData?.coverImage}
                        title={loan.bookTitle}
                        category={bookData?.category}
                      />
                    </div>

                    {/* Book Details */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono tabular-nums font-medium text-slate-700">
                          ISBN: {loan.bookIsbn}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{loan.bookShelf}</span>
                      </div>

                      <h3 className="text-base font-semibold text-slate-900 leading-snug line-clamp-2">
                        {loan.bookTitle}
                      </h3>

                      {/* Borrower Information */}
                      <div className="pt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                        <span className="font-medium text-slate-900">
                          ผู้ยืม: {loan.memberName}
                        </span>
                        <span aria-hidden="true" className="text-slate-300">
                          ·
                        </span>
                        <span className="font-mono tabular-nums text-slate-500">
                          รหัส: {loan.memberCode}
                        </span>
                        <span aria-hidden="true" className="text-slate-300">
                          ·
                        </span>
                        <div className="inline-flex items-center gap-1 text-slate-700">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span className="font-mono tabular-nums">{loan.memberPhone}</span>
                          <button
                            onClick={() => handleCopyPhone(loan.memberPhone, loan.id)}
                            title="คัดลอกเบอร์โทรศัพท์"
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"
                          >
                            {copiedId === loan.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      {loan.notes && (
                        <p className="text-xs text-slate-500 italic mt-1">
                          บันทึก: {loan.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Dates, Remaining status, and Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between lg:justify-end gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {/* Dates & Urgency status */}
                    <div className="text-left sm:text-right space-y-1">
                      <div className="text-xs text-slate-500">
                        <span>วันที่ยืม: {formatDateThai(loan.borrowDate)}</span>
                        <br />
                        <span className="font-medium text-slate-700">
                          กำหนดคืน: {formatDateThai(loan.dueDate)}
                        </span>
                      </div>

                      {/* Status indicator */}
                      <div>
                        {isOverdue ? (
                          <div className="text-xs font-semibold text-rose-600 flex items-center sm:justify-end gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              เกินกำหนด {Math.abs(diffDays)} วัน · ค่าปรับ ฿
                              <span className="font-mono tabular-nums">{fineAmount}</span>
                            </span>
                          </div>
                        ) : isDueToday ? (
                          <div className="text-xs font-semibold text-amber-600 flex items-center sm:justify-end gap-1">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>ครบกำหนดคืนวันนี้</span>
                          </div>
                        ) : isDueSoon ? (
                          <div className="text-xs font-semibold text-amber-600 flex items-center sm:justify-end gap-1">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>เหลือเวลาอีก {diffDays} วัน</span>
                          </div>
                        ) : (
                          <div className="text-xs text-emerald-700 flex items-center sm:justify-end gap-1 font-medium">
                            <span>เหลือเวลาอีก {diffDays} วัน</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {isAdmin ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => onExtendLoan(loan.id)}
                          title="ขยายเวลาเพิ่ม 7 วัน"
                          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
                          <span>ต่ออายุ +7 วัน</span>
                        </button>

                        <button
                          onClick={() => onOpenReturnModal(loan)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-md shadow-sm transition-colors whitespace-nowrap"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>บันทึกคืนหนังสือ</span>
                        </button>
                      </div>
                    ) : (
                      <div className="shrink-0 text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200 text-center">
                        ติดต่อเจ้าหน้าที่เพื่อคืน / ต่ออายุ
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
