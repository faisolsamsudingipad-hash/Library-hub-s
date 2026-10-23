import React, { useState, useMemo } from 'react';
import { Member, LoanRecord, Book } from '../types/library';
import { BookCoverImage } from './BookCoverImage';
import {
  formatDateThai,
  getDaysDifference,
  calculateOverdueDays,
  calculateFine
} from '../utils/libraryUtils';
import {
  X,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  ArrowRight,
  Phone,
  Building,
  RotateCcw
} from 'lucide-react';

interface MemberHistoryModalProps {
  member: Member | null;
  loans: LoanRecord[];
  books: Book[];
  isOpen: boolean;
  onClose: () => void;
  onBorrowForMember: (member: Member) => void;
  onQuickReturn: (loan: LoanRecord) => void;
  onPayFine?: (loanId: string) => void;
}

export const MemberHistoryModal: React.FC<MemberHistoryModalProps> = ({
  member,
  loans,
  books,
  isOpen,
  onClose,
  onBorrowForMember,
  onQuickReturn,
  onPayFine
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'returned'>('all');

  // Filter loans for this specific member
  const memberLoans = useMemo(() => {
    if (!member) return [];
    return loans.filter((l) => l.memberId === member.id);
  }, [member, loans]);

  // Financial and status statistics
  const stats = useMemo(() => {
    let activeCount = 0;
    let returnedCount = 0;
    let unpaidFine = 0;
    let paidFine = 0;

    memberLoans.forEach((loan) => {
      if (loan.status === 'active' || loan.status === 'overdue') {
        activeCount += 1;
        const fine = calculateFine(loan.dueDate);
        if (fine > 0 && !loan.finePaid) {
          unpaidFine += fine;
        }
      } else if (loan.status === 'returned') {
        returnedCount += 1;
        if (loan.finePaid) {
          paidFine += loan.fine;
        } else if (loan.fine > 0) {
          unpaidFine += loan.fine;
        }
      }
    });

    return { activeCount, returnedCount, unpaidFine, paidFine, total: memberLoans.length };
  }, [memberLoans]);

  // Filtered by tab
  const displayedLoans = useMemo(() => {
    if (filterTab === 'active') {
      return memberLoans.filter((l) => l.status === 'active' || l.status === 'overdue');
    }
    if (filterTab === 'returned') {
      return memberLoans.filter((l) => l.status === 'returned');
    }
    return memberLoans;
  }, [memberLoans, filterTab]);

  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full p-5 sm:p-6 space-y-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              รายงานประวัติการยืม-คืนรายบุคคล (Member Statement)
            </h2>
            <p className="text-xs text-slate-500">
              ตรวจสอบประวัติการยืม ยอดหนังสือคงค้าง และคำนวณค่าปรับทั้งหมด
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Member Profile Card */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                {member.memberCode}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
                {member.type}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">{member.name}</h3>
            {member.department && (
              <p className="text-slate-500 flex items-center gap-1">
                <Building className="w-3.5 h-3.5" />
                <span>{member.department}</span>
              </p>
            )}
          </div>

          <div className="space-y-1 text-slate-600 sm:text-right">
            <p className="flex items-center sm:justify-end gap-1 font-mono">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{member.phone}</span>
            </p>
            {member.email && <p className="text-slate-500">{member.email}</p>}
          </div>
        </div>

        {/* Summary Metric Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 bg-white rounded-lg border border-slate-200 text-center">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
              กำลังยืมอยู่
            </span>
            <span className="text-lg font-bold font-mono tabular-nums text-slate-900">
              {stats.activeCount} <span className="text-xs font-normal text-slate-500">เล่ม</span>
            </span>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200 text-center">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
              คืนเรียบร้อยแล้ว
            </span>
            <span className="text-lg font-bold font-mono tabular-nums text-emerald-700">
              {stats.returnedCount} <span className="text-xs font-normal text-slate-500">เล่ม</span>
            </span>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200 text-center">
            <span className="text-[10px] uppercase tracking-wider text-rose-600 block font-medium">
              ยอดค้างชำระค่าปรับ
            </span>
            <span
              className={`text-lg font-bold font-mono tabular-nums ${
                stats.unpaidFine > 0 ? 'text-rose-600' : 'text-slate-700'
              }`}
            >
              ฿{stats.unpaidFine}
            </span>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200 text-center">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
              รวมยืมทั้งหมด
            </span>
            <span className="text-lg font-bold font-mono tabular-nums text-slate-800">
              {stats.total} <span className="text-xs font-normal text-slate-500">ครั้ง</span>
            </span>
          </div>
        </div>

        {/* Tab Filter */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              filterTab === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ทั้งหมด ({memberLoans.length})
          </button>
          <button
            onClick={() => setFilterTab('active')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              filterTab === 'active'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            กำลังยืมอยู่ ({stats.activeCount})
          </button>
          <button
            onClick={() => setFilterTab('returned')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              filterTab === 'returned'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            คืนแล้ว ({stats.returnedCount})
          </button>
        </div>

        {/* Loans List */}
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {displayedLoans.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-lg border border-slate-200">
              <BookOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs">ไม่มีรายการตามเงื่อนไขที่เลือก</p>
            </div>
          ) : (
            displayedLoans.map((loan) => {
              const isReturned = loan.status === 'returned';
              const diffDays = getDaysDifference(loan.dueDate);
              const isOverdue = !isReturned && diffDays < 0;
              const calculatedFineAmount = isOverdue ? calculateFine(loan.dueDate) : loan.fine;

              return (
                <div
                  key={loan.id}
                  className={`p-3 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isOverdue
                      ? 'bg-rose-50/50 border-rose-200'
                      : isReturned
                      ? 'bg-white border-slate-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-14 shrink-0 rounded overflow-hidden bg-slate-100 border border-slate-200">
                      <BookCoverImage
                        src={loan.bookCover}
                        title={loan.bookTitle}
                      />
                    </div>

                    <div className="space-y-1">
                      <p className="font-semibold text-slate-900 line-clamp-1">
                        {loan.bookTitle}
                      </p>
                      <p className="text-[11px] font-mono text-slate-500">
                        ISBN: {loan.bookIsbn} · ชั้น: {loan.bookShelf}
                      </p>
                      <div className="flex items-center gap-2 text-slate-600">
                        <span>ยืม: {formatDateThai(loan.borrowDate)}</span>
                        <span>·</span>
                        <span>กำหนดคืน: {formatDateThai(loan.dueDate)}</span>
                      </div>
                      {loan.returnDate && (
                        <p className="text-emerald-700 font-medium">
                          คืนแล้วเมื่อ: {formatDateThai(loan.returnDate)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div>
                      {isReturned ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>คืนแล้ว</span>
                        </span>
                      ) : isOverdue ? (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-bold">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>เกินกำหนด (ค่าปรับ ฿{calculatedFineAmount})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          <span>เหลือ {diffDays} วัน</span>
                        </span>
                      )}
                    </div>

                    {!isReturned && (
                      <button
                        onClick={() => {
                          onQuickReturn(loan);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>บันทึกคืน</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>พิมพ์รายงานประวัติ (Print)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              ปิด
            </button>
            <button
              onClick={() => {
                onBorrowForMember(member);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-sm transition-colors"
            >
              <span>ทำรายการยืมหนังสือใหม่</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
