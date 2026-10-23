import React, { useState } from 'react';
import { LoanRecord } from '../types/library';
import {
  formatDateThai,
  getTodayString,
  calculateOverdueDays,
  calculateFine
} from '../utils/libraryUtils';
import { X, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface QuickReturnModalProps {
  loan: LoanRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmReturn: (
    loanId: string,
    bookId: string,
    condition: 'ปกติ' | 'ชำรุดเล็กน้อย' | 'ชำรุดมาก',
    fine: number,
    notes?: string
  ) => void;
}

export const QuickReturnModal: React.FC<QuickReturnModalProps> = ({
  loan,
  isOpen,
  onClose,
  onConfirmReturn
}) => {
  const [condition, setCondition] = useState<'ปกติ' | 'ชำรุดเล็กน้อย' | 'ชำรุดมาก'>('ปกติ');
  const [returnNotes, setReturnNotes] = useState('');
  const [finePaid, setFinePaid] = useState(true);

  if (!isOpen || !loan) return null;

  const today = getTodayString();
  const overdueDays = calculateOverdueDays(loan.dueDate);
  const fine = calculateFine(loan.dueDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmReturn(loan.id, loan.bookId, condition, fine, returnNotes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-bold text-slate-900">
              บันทึกการคืนหนังสือ
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-md border border-slate-100 space-y-1.5 text-xs">
            <p className="font-semibold text-slate-900 text-sm line-clamp-2">
              {loan.bookTitle}
            </p>
            <p className="text-slate-500">
              ผู้ยืม: <span className="text-slate-800 font-medium">{loan.memberName}</span> ({loan.memberCode})
            </p>
            <div className="flex justify-between pt-1 text-slate-600">
              <span>วันที่ยืม: {formatDateThai(loan.borrowDate)}</span>
              <span>กำหนดคืน: {formatDateThai(loan.dueDate)}</span>
            </div>
          </div>

          {/* Overdue alert */}
          {overdueDays > 0 ? (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>เกินกำหนดส่ง {overdueDays} วัน</span>
              </div>
              <p>
                ค่าปรับคำนวณอัตรา 5 บาท/วัน รวม: <strong className="font-mono text-sm">฿{fine}</strong> บาท
              </p>
              <label className="flex items-center gap-2 pt-1 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={finePaid}
                  onChange={(e) => setFinePaid(e.target.checked)}
                  className="rounded text-rose-600"
                />
                <span>ชำระค่าปรับเรียบร้อยแล้ว</span>
              </label>
            </div>
          ) : (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>คืนตรงตามกำหนด ไม่มีค่าปรับ</span>
            </div>
          )}

          {/* Condition */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              สภาพหนังสือเมื่อรับคืน
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['ปกติ', 'ชำรุดเล็กน้อย', 'ชำรุดมาก'] as const).map((cond) => (
                <button
                  type="button"
                  key={cond}
                  onClick={() => setCondition(cond)}
                  className={`py-1.5 px-2 text-xs font-medium rounded border transition-colors ${
                    condition === cond
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cond}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              หมายเหตุการคืน (ถ้ามี)
            </label>
            <input
              type="text"
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              placeholder="เช่น ตรวจสอบความเรียบร้อยแล้ว"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-md shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span>ยืนยันการรับคืน</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
