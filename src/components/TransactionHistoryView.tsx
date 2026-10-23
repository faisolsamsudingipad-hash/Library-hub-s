import React, { useState, useMemo } from 'react';
import { LoanRecord } from '../types/library';
import { formatDateThai, exportLoansToCsv } from '../utils/libraryUtils';
import {
  Search,
  Download,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText
} from 'lucide-react';

interface TransactionHistoryViewProps {
  loans: LoanRecord[];
}

export const TransactionHistoryView: React.FC<TransactionHistoryViewProps> = ({ loans }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'returned' | 'overdue'>('all');
  const [selectedLoanSlip, setSelectedLoanSlip] = useState<LoanRecord | null>(null);

  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      const matchesSearch =
        loan.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.bookIsbn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.memberCode.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter !== 'all' && loan.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [loans, searchQuery, statusFilter]);

  const handleExportCsv = () => {
    exportLoansToCsv(filteredLoans);
  };

  return (
    <div className="space-y-6">
      {/* Title & Action Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            ประวัติการทำรายการยืม-คืน (Transaction Logs)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            บันทึกประวัติการยืมและคืนทั้งหมดในระบบ สามารถค้นหา กรองสถานะ และส่งออกเป็นไฟล์ Excel/CSV ได้
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>ส่งออกรายงาน (CSV)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อหนังสือ, รหัส ISBN, หรือชื่อผู้ยืม..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md self-start md:self-auto shrink-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ทั้งหมด ({loans.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              statusFilter === 'active'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            กำลังยืม ({loans.filter((l) => l.status === 'active').length})
          </button>
          <button
            onClick={() => setStatusFilter('overdue')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              statusFilter === 'overdue'
                ? 'bg-white text-rose-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            เกินกำหนด ({loans.filter((l) => l.status === 'overdue').length})
          </button>
          <button
            onClick={() => setStatusFilter('returned')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              statusFilter === 'returned'
                ? 'bg-white text-emerald-800 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            คืนแล้ว ({loans.filter((l) => l.status === 'returned').length})
          </button>
        </div>
      </div>

      {/* Transaction Table */}
      {filteredLoans.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-lg border border-slate-200 shadow-sm">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">ไม่พบประวัติรายการที่ค้นหา</h3>
          <p className="text-xs text-slate-500 mt-1">
            ลองปรับเปลี่ยนคำค้นหา หรือเลือกตัวกรองสถานะอื่น
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="py-3 px-4">รหัสรายการ</th>
                <th className="py-3 px-4">หนังสือ</th>
                <th className="py-3 px-4">ผู้ยืม</th>
                <th className="py-3 px-4">วันที่ยืม</th>
                <th className="py-3 px-4">กำหนดคืน</th>
                <th className="py-3 px-4">วันที่คืน</th>
                <th className="py-3 px-4 text-center">สถานะ</th>
                <th className="py-3 px-4 text-right">ค่าปรับ</th>
                <th className="py-3 px-4 text-right">ใบเสร็จ/สลิป</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLoans.map((loan) => {
                const isReturned = loan.status === 'returned';
                const isOverdue = loan.status === 'overdue';

                return (
                  <tr key={loan.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">
                      {loan.id}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-900 line-clamp-1">{loan.bookTitle}</p>
                      <p className="text-[11px] font-mono text-slate-400">ISBN: {loan.bookIsbn}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-slate-800 font-medium">{loan.memberName}</p>
                      <p className="text-[11px] font-mono text-slate-400">{loan.memberCode}</p>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-600">
                      {loan.borrowDate}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-600">
                      {loan.dueDate}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-600">
                      {loan.returnDate || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isReturned ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>คืนแล้ว</span>
                        </span>
                      ) : isOverdue ? (
                        <span className="inline-flex items-center gap-1 text-rose-600 text-xs font-medium">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>เกินกำหนด</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-700 text-xs font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          <span>กำลังยืม</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {loan.fine > 0 ? (
                        <span className="text-rose-600 font-medium">฿{loan.fine}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedLoanSlip(loan)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded inline-flex items-center gap-1"
                        title="ดูรายละเอียดใบยืม/คืน"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Loan Slip Modal */}
      {selectedLoanSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                รายละเอียดใบยืม-คืน (Transaction Slip)
              </h3>
              <button
                onClick={() => setSelectedLoanSlip(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded border border-slate-100 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">รหัสรายการ:</span>
                  <span className="font-mono text-slate-900">{selectedLoanSlip.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">สถานะ:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedLoanSlip.status === 'returned'
                      ? 'คืนเรียบร้อยแล้ว'
                      : selectedLoanSlip.status === 'overdue'
                      ? 'เกินกำหนดส่ง'
                      : 'กำลังอยู่ระหว่างการยืม'}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-slate-900 text-sm">
                  {selectedLoanSlip.bookTitle}
                </p>
                <p className="text-slate-500 font-mono">
                  ISBN: {selectedLoanSlip.bookIsbn} · {selectedLoanSlip.bookShelf}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-2 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">ผู้ยืม:</span>
                  <span className="font-medium text-slate-900">{selectedLoanSlip.memberName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">รหัสสมาชิก:</span>
                  <span className="font-mono text-slate-700">{selectedLoanSlip.memberCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">เบอร์โทรศัพท์:</span>
                  <span className="font-mono text-slate-700">{selectedLoanSlip.memberPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">วันที่ยืม:</span>
                  <span className="font-medium text-slate-800">
                    {formatDateThai(selectedLoanSlip.borrowDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">กำหนดส่งคืน:</span>
                  <span className="font-medium text-slate-800">
                    {formatDateThai(selectedLoanSlip.dueDate)}
                  </span>
                </div>
                {selectedLoanSlip.returnDate && (
                  <div className="flex justify-between text-emerald-800 font-medium">
                    <span>วันที่คืนจริง:</span>
                    <span>{formatDateThai(selectedLoanSlip.returnDate)}</span>
                  </div>
                )}
                {selectedLoanSlip.fine > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold border-t border-slate-100 pt-1">
                    <span>ค่าปรับล่าช้า:</span>
                    <span className="font-mono">฿{selectedLoanSlip.fine} บาท</span>
                  </div>
                )}
                {selectedLoanSlip.condition && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">สภาพหนังสือเมื่อคืน:</span>
                    <span className="font-medium text-slate-800">
                      {selectedLoanSlip.condition}
                    </span>
                  </div>
                )}
                {selectedLoanSlip.notes && (
                  <div className="border-t border-slate-100 pt-1 text-slate-500">
                    <span>หมายเหตุ: {selectedLoanSlip.notes}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLoanSlip(null)}
                className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
