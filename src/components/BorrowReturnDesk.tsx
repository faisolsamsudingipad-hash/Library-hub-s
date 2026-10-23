import React, { useState, useEffect } from 'react';
import { Book, Member, LoanRecord } from '../types/library';
import { BookCoverImage } from './BookCoverImage';
import {
  getTodayString,
  addDaysToDate,
  formatDateThai,
  calculateOverdueDays,
  calculateFine
} from '../utils/libraryUtils';
import { playBarcodeBeep } from '../utils/audioBeep';
import {
  BookOpen,
  User,
  Calendar,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Search,
  ScanLine,
  Barcode,
  Sparkles
} from 'lucide-react';

interface BorrowReturnDeskProps {
  books: Book[];
  members: Member[];
  loans: LoanRecord[];
  preSelectedBook?: Book | null;
  preSelectedMember?: Member | null;
  onClearPreSelectedBook?: () => void;
  onClearPreSelectedMember?: () => void;
  onOpenBarcodeModal: () => void;
  onConfirmBorrow: (newLoan: Omit<LoanRecord, 'id'>, bookId: string) => void;
  onConfirmReturn: (
    loanId: string,
    bookId: string,
    condition: 'ปกติ' | 'ชำรุดเล็กน้อย' | 'ชำรุดมาก',
    fine: number,
    notes?: string
  ) => void;
}

export const BorrowReturnDesk: React.FC<BorrowReturnDeskProps> = ({
  books,
  members,
  loans,
  preSelectedBook,
  preSelectedMember,
  onClearPreSelectedBook,
  onClearPreSelectedMember,
  onOpenBarcodeModal,
  onConfirmBorrow,
  onConfirmReturn
}) => {
  const [activeMode, setActiveMode] = useState<'borrow' | 'return'>('borrow');

  // QUICK SCAN BARCODE INPUT
  const [quickBarcode, setQuickBarcode] = useState('');

  // BORROW STATE
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [borrowDurationDays, setBorrowDurationDays] = useState<number>(14);
  const [customDueDate, setCustomDueDate] = useState<string>('');
  const [borrowNotes, setBorrowNotes] = useState<string>('');
  const [bookSearchQuery, setBookSearchQuery] = useState('');

  // RETURN STATE
  const [returnSearchQuery, setReturnSearchQuery] = useState('');
  const [selectedLoanIdToReturn, setSelectedLoanIdToReturn] = useState<string>('');
  const [returnCondition, setReturnCondition] = useState<'ปกติ' | 'ชำรุดเล็กน้อย' | 'ชำรุดมาก'>('ปกติ');
  const [returnNotes, setReturnNotes] = useState<string>('');
  const [finePaid, setFinePaid] = useState<boolean>(true);

  // Success Feedback Message
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Synchronize preSelectedBook from catalog or scanner
  useEffect(() => {
    if (preSelectedBook) {
      setSelectedBookId(preSelectedBook.id);
      setActiveMode('borrow');
    }
  }, [preSelectedBook]);

  // Synchronize preSelectedMember from Member Management
  useEffect(() => {
    if (preSelectedMember) {
      setSelectedMemberId(preSelectedMember.id);
      setActiveMode('borrow');
    }
  }, [preSelectedMember]);

  // Active unreturned loans
  const activeLoans = loans.filter((l) => l.status === 'active' || l.status === 'overdue');

  // Currently selected book object
  const currentSelectedBook = books.find((b) => b.id === selectedBookId);
  const currentSelectedMember = members.find((m) => m.id === selectedMemberId);

  // Quick Barcode Instant Detection
  const handleQuickBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = quickBarcode.trim();
    if (!code) return;

    // Search book by ISBN or ID
    const matchedBook = books.find(
      (b) =>
        b.isbn.replace(/[^0-9X]/gi, '') === code.replace(/[^0-9X]/gi, '') ||
        b.isbn.toLowerCase() === code.toLowerCase() ||
        b.id.toLowerCase() === code.toLowerCase()
    );

    if (!matchedBook) {
      playBarcodeBeep(false);
      setFeedbackMessage({
        type: 'error',
        text: `ไม่พบบาร์โค้ดหรือรหัสหนังสือ "${code}" ในระบบ`
      });
      return;
    }

    playBarcodeBeep(true);

    // Check if there is an active loan for this book
    const activeLoan = activeLoans.find((l) => l.bookId === matchedBook.id);

    if (activeLoan) {
      // Automatically route to return desk for this book!
      setActiveMode('return');
      setSelectedLoanIdToReturn(activeLoan.id);
      setFeedbackMessage({
        type: 'success',
        text: `ตรวจพบบาร์โค้ด "${matchedBook.title}" ซึ่งมีผู้ยืมอยู่ ระบบเปิดโหมดบันทึกการคืนให้ทันที`
      });
    } else {
      // Automatically route to borrow desk for this book!
      setActiveMode('borrow');
      setSelectedBookId(matchedBook.id);
      setFeedbackMessage({
        type: 'success',
        text: `สแกนพบหนังสือ "${matchedBook.title}" (ว่าง ${matchedBook.availableCopies} เล่ม) พร้อมบันทึกการยืม`
      });
    }

    setQuickBarcode('');
  };

  // Filter available books for selection
  const selectableBooks = books.filter((b) => {
    if (!bookSearchQuery) return true;
    return (
      b.title.toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
      b.isbn.toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(bookSearchQuery.toLowerCase())
    );
  });

  // Filter active loans for return search
  const selectableActiveLoans = activeLoans.filter((l) => {
    if (!returnSearchQuery) return true;
    return (
      l.bookTitle.toLowerCase().includes(returnSearchQuery.toLowerCase()) ||
      l.bookIsbn.toLowerCase().includes(returnSearchQuery.toLowerCase()) ||
      l.memberName.toLowerCase().includes(returnSearchQuery.toLowerCase()) ||
      l.memberCode.toLowerCase().includes(returnSearchQuery.toLowerCase())
    );
  });

  // Calculate borrow dates
  const today = getTodayString();
  const calculatedDueDate =
    borrowDurationDays === 0 && customDueDate
      ? customDueDate
      : addDaysToDate(today, borrowDurationDays);

  // Handle Borrow Submit
  const handleBorrowSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSelectedBook) {
      setFeedbackMessage({ type: 'error', text: 'กรุณาเลือกหนังสือที่ต้องการยืม' });
      return;
    }
    if (currentSelectedBook.availableCopies <= 0) {
      setFeedbackMessage({
        type: 'error',
        text: 'หนังสือเล่มนี้ถูกยืมไปครบทุกสำเนาแล้ว ไม่สามารถทำรายการยืมได้'
      });
      return;
    }
    if (!currentSelectedMember) {
      setFeedbackMessage({ type: 'error', text: 'กรุณาเลือกสมาชิกผู้ยืม' });
      return;
    }

    const newLoanData: Omit<LoanRecord, 'id'> = {
      bookId: currentSelectedBook.id,
      bookTitle: currentSelectedBook.title,
      bookIsbn: currentSelectedBook.isbn,
      bookCover: currentSelectedBook.coverImage,
      bookShelf: currentSelectedBook.shelf,
      memberId: currentSelectedMember.id,
      memberName: currentSelectedMember.name,
      memberCode: currentSelectedMember.memberCode,
      memberPhone: currentSelectedMember.phone,
      borrowDate: today,
      dueDate: calculatedDueDate,
      returnDate: null,
      status: 'active',
      fine: 0,
      notes: borrowNotes
    };

    onConfirmBorrow(newLoanData, currentSelectedBook.id);
    setFeedbackMessage({
      type: 'success',
      text: `บันทึกการยืมสำเร็จ! หนังสือ "${currentSelectedBook.title}" ให้กับ ${currentSelectedMember.name}`
    });

    // Reset form
    setSelectedBookId('');
    setSelectedMemberId('');
    setBorrowNotes('');
    if (onClearPreSelectedBook) onClearPreSelectedBook();
    if (onClearPreSelectedMember) onClearPreSelectedMember();

    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  // Currently selected loan for return
  const currentLoanToReturn = activeLoans.find((l) => l.id === selectedLoanIdToReturn);
  const overdueDays = currentLoanToReturn ? calculateOverdueDays(currentLoanToReturn.dueDate) : 0;
  const calculatedFine = currentLoanToReturn ? calculateFine(currentLoanToReturn.dueDate) : 0;

  // Handle Return Submit
  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLoanToReturn) {
      setFeedbackMessage({ type: 'error', text: 'กรุณาเลือกรายการหนังสือที่ต้องการบันทึกคืน' });
      return;
    }

    onConfirmReturn(
      currentLoanToReturn.id,
      currentLoanToReturn.bookId,
      returnCondition,
      calculatedFine,
      returnNotes
    );

    setFeedbackMessage({
      type: 'success',
      text: `บันทึกการรับคืนสำเร็จ! หนังสือ "${currentLoanToReturn.bookTitle}" กลับเข้าคลังเรียบร้อยแล้ว`
    });

    setSelectedLoanIdToReturn('');
    setReturnNotes('');
    setReturnCondition('ปกติ');

    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            เคาน์เตอร์บันทึกการยืม-คืน (Circulation Desk)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ทำรายการยืมหนังสือใหม่ หรือบันทึกการรับคืนพร้อมคำนวณค่าปรับและตรวจสอบสภาพ
          </p>
        </div>

        {/* Mode Toggle Buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-lg self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveMode('borrow')}
            className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeMode === 'borrow'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>[1] บันทึกการยืมหนังสือ</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('return')}
            className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeMode === 'return'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="w-4 h-4 text-indigo-600" />
            <span>[2] บันทึกการคืนหนังสือ</span>
            {activeLoans.length > 0 && (
              <span className="font-mono tabular-nums text-xs px-1.5 py-0.2 bg-slate-100 rounded text-slate-600">
                {activeLoans.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* QUICK BARCODE SCANNER STRIP */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-lg text-white shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg text-emerald-400">
            <Barcode className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>สแกนบาร์โค้ดด่วน (Quick Barcode / ISBN)</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                Smart Detect
              </span>
            </h3>
            <p className="text-xs text-slate-300">
              ยิงบาร์โค้ดเพื่อค้นหาและสลับไปยังการยืมหรือการคืนโดยอัตโนมัติ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <form onSubmit={handleQuickBarcodeSubmit} className="flex-1 md:w-80">
            <div className="relative">
              <input
                type="text"
                value={quickBarcode}
                onChange={(e) => setQuickBarcode(e.target.value)}
                placeholder="สแกนหรือพิมพ์เลขบาร์โค้ด..."
                className="w-full pl-3 pr-20 py-2 text-xs sm:text-sm bg-white/10 border border-white/20 rounded-md focus:bg-white focus:text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-white placeholder-slate-400 font-mono"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded transition-colors"
              >
                ตรวจ
              </button>
            </div>
          </form>

          <button
            type="button"
            onClick={onOpenBarcodeModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-900 bg-white hover:bg-slate-100 rounded-md shadow-sm transition-colors whitespace-nowrap shrink-0"
          >
            <ScanLine className="w-4 h-4 text-emerald-700" />
            <span>เปิดเครื่องสแกน</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 border ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="text-sm font-medium">{feedbackMessage.text}</span>
        </div>
      )}

      {/* MODE 1: BORROW FORM */}
      {activeMode === 'borrow' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form (7 cols) */}
          <form
            onSubmit={handleBorrowSubmit}
            className="lg:col-span-7 bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-5"
          >
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-semibold text-slate-900">
                ขั้นตอนการบันทึกการยืมหนังสือ
              </h2>
              <p className="text-xs text-slate-500">กรอกข้อมูลหนังสือและสมาชิกผู้ยืม</p>
            </div>

            {/* Step 1: Select Book */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                1. เลือกหนังสือที่จะยืม <span className="text-rose-500">*</span>
              </label>

              {/* Book search / filter */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="พิมพ์ค้นหาชื่อหนังสือ หรือ ISBN..."
                  value={bookSearchQuery}
                  onChange={(e) => setBookSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
                />
              </div>

              <select
                value={selectedBookId}
                onChange={(e) => setSelectedBookId(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800"
              >
                <option value="">-- กรุณาเลือกหนังสือ --</option>
                {selectableBooks.map((b) => (
                  <option
                    key={b.id}
                    value={b.id}
                    disabled={b.availableCopies <= 0}
                  >
                    {b.title} (ว่าง {b.availableCopies}/{b.totalCopies} เล่ม) {b.availableCopies <= 0 ? '- [หมด]' : ''}
                  </option>
                ))}
              </select>

              {currentSelectedBook && (
                <div
                  className={`p-3 rounded-md border text-xs flex items-center justify-between ${
                    currentSelectedBook.availableCopies > 0
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <div>
                    <p className="font-semibold">{currentSelectedBook.title}</p>
                    <p className="text-slate-600 mt-0.5">
                      ชั้นวาง: {currentSelectedBook.shelf} · ISBN: {currentSelectedBook.isbn}
                    </p>
                  </div>
                  <div className="font-mono tabular-nums font-semibold text-right shrink-0">
                    {currentSelectedBook.availableCopies > 0 ? (
                      <span className="text-emerald-700">พร้อมยืม ({currentSelectedBook.availableCopies} เล่ม)</span>
                    ) : (
                      <span className="text-rose-600">ถูกยืมหมดชั่วคราว</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Select Member */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                2. เลือกสมาชิกผู้ยืม <span className="text-rose-500">*</span>
              </label>

              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800"
              >
                <option value="">-- กรุณาเลือกสมาชิก --</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.memberCode}) - {m.type}
                  </option>
                ))}
              </select>

              {currentSelectedMember && (
                <div className="p-3 bg-slate-50 rounded-md border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-900">{currentSelectedMember.name}</span>
                    <span className="mx-1.5 text-slate-300">·</span>
                    <span>{currentSelectedMember.department}</span>
                  </div>
                  <div className="font-mono tabular-nums text-slate-700">
                    โทร: {currentSelectedMember.phone}
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Loan Duration */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                3. ระยะเวลาการยืม
              </label>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '7 วัน (ทั่วไป)', days: 7 },
                  { label: '14 วัน (มาตรฐาน)', days: 14 },
                  { label: '30 วัน (วิจัย)', days: 30 },
                  { label: 'กำหนดเอง', days: 0 }
                ].map((item) => (
                  <button
                    type="button"
                    key={item.days}
                    onClick={() => {
                      setBorrowDurationDays(item.days);
                      if (item.days === 0 && !customDueDate) {
                        setCustomDueDate(addDaysToDate(today, 10));
                      }
                    }}
                    className={`py-2 px-2 text-xs font-medium rounded-md border transition-colors whitespace-nowrap text-center ${
                      borrowDurationDays === item.days
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {borrowDurationDays === 0 && (
                <div className="pt-2">
                  <label className="block text-xs text-slate-500 mb-1">
                    ระบุวันกำหนดคืนเอง:
                  </label>
                  <input
                    type="date"
                    min={today}
                    value={customDueDate}
                    onChange={(e) => setCustomDueDate(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
              )}
            </div>

            {/* Step 4: Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                4. หมายเหตุเพิ่มเติม (ถ้ามี)
              </label>
              <input
                type="text"
                value={borrowNotes}
                onChange={(e) => setBorrowNotes(e.target.value)}
                placeholder="เช่น ยืมทำสัมมนา, สำเนาที่ 1"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                !currentSelectedBook ||
                currentSelectedBook.availableCopies <= 0 ||
                !currentSelectedMember
              }
              className={`w-full py-3 px-4 text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 ${
                !currentSelectedBook ||
                currentSelectedBook.availableCopies <= 0 ||
                !currentSelectedMember
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ยืนยันการบันทึกการยืมหนังสือ</span>
            </button>
          </form>

          {/* Right Preview Slip (5 cols) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                พรีวิวใบยืมหนังสือ (Loan Slip Preview)
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>

            {currentSelectedBook ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-16 h-22 rounded bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    <BookCoverImage
                      src={currentSelectedBook.coverImage}
                      title={currentSelectedBook.title}
                      category={currentSelectedBook.category}
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 line-clamp-2">
                      {currentSelectedBook.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{currentSelectedBook.author}</p>
                    <p className="text-[11px] font-mono text-slate-500 mt-1">
                      ISBN: {currentSelectedBook.isbn}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">ผู้ยืม:</span>
                    <span className="font-medium text-slate-900">
                      {currentSelectedMember ? currentSelectedMember.name : '(ยังไม่เลือก)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">รหัสสมาชิก:</span>
                    <span className="font-mono text-slate-700">
                      {currentSelectedMember ? currentSelectedMember.memberCode : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">วันที่ยืม:</span>
                    <span className="font-medium text-slate-700">{formatDateThai(today)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200/60 pt-2">
                    <span className="text-slate-700 font-semibold">วันกำหนดคืน:</span>
                    <span className="font-semibold text-emerald-700 font-mono">
                      {formatDateThai(calculatedDueDate)}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 text-center">
                  * หากคืนเกินกำหนดส่ง มีอัตราค่าปรับ 5 บาท / วัน
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">เลือกหนังสือและสมาชิกเพื่อดูตัวอย่างใบยืม</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* MODE 2: RETURN FORM */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Return Selection & Form (7 cols) */}
          <form
            onSubmit={handleReturnSubmit}
            className="lg:col-span-7 bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-5"
          >
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-semibold text-slate-900">
                ขั้นตอนการบันทึกการคืนหนังสือ
              </h2>
              <p className="text-xs text-slate-500">
                ค้นหารายการที่ต้องการคืน ระบบจะตรวจสอบกำหนดส่งและคำนวณค่าปรับอัตโนมัติ
              </p>
            </div>

            {/* Search active loan */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                1. ค้นหาและเลือกรายการที่กำลังยืมอยู่ <span className="text-rose-500">*</span>
              </label>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อหนังสือ, ISBN, หรือชื่อผู้ยืม..."
                  value={returnSearchQuery}
                  onChange={(e) => setReturnSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
                />
              </div>

              {activeLoans.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded border border-slate-200 text-center text-xs text-slate-500">
                  ขณะนี้ไม่มีหนังสือที่ค้างยืมในระบบ
                </div>
              ) : (
                <select
                  value={selectedLoanIdToReturn}
                  onChange={(e) => setSelectedLoanIdToReturn(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800"
                >
                  <option value="">-- กรุณาเลือกรายการที่ต้องการคืน ({activeLoans.length} รายการ) --</option>
                  {selectableActiveLoans.map((loan) => (
                    <option key={loan.id} value={loan.id}>
                      {loan.bookTitle} - ผู้ยืม: {loan.memberName} ({loan.memberCode}) [กำหนด: {loan.dueDate}]
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Condition Check */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                2. สภาพหนังสือเมื่อรับคืน
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['ปกติ', 'ชำรุดเล็กน้อย', 'ชำรุดมาก'] as const).map((cond) => (
                  <button
                    type="button"
                    key={cond}
                    onClick={() => setReturnCondition(cond)}
                    className={`py-2 px-3 text-xs font-medium rounded-md border transition-colors ${
                      returnCondition === cond
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cond}
                  </button>
                ))}
              </div>
            </div>

            {/* Return Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                3. บันทึกเพิ่มเติมการรับคืน
              </label>
              <input
                type="text"
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="เช่น คืนเรียบร้อย สันปกสมบูรณ์"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800"
              />
            </div>

            {/* Submit Return */}
            <button
              type="submit"
              disabled={!currentLoanToReturn}
              className={`w-full py-3 px-4 text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 ${
                !currentLoanToReturn
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>ยืนยันการรับคืนหนังสือเข้าคลัง</span>
            </button>
          </form>

          {/* Right Return Summary (5 cols) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                สรุปผลการคืนและค่าปรับ (Return Calculation)
              </span>
              <Clock className="w-4 h-4 text-indigo-600" />
            </div>

            {currentLoanToReturn ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">
                    {currentLoanToReturn.bookTitle}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ผู้ยืม: {currentLoanToReturn.memberName} ({currentLoanToReturn.memberCode})
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">วันที่ยืม:</span>
                    <span className="font-mono text-slate-700">
                      {formatDateThai(currentLoanToReturn.borrowDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">กำหนดคืนเดิม:</span>
                    <span className="font-mono text-slate-700">
                      {formatDateThai(currentLoanToReturn.dueDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">วันที่ทำรายการคืน:</span>
                    <span className="font-mono text-slate-900 font-semibold">
                      {formatDateThai(today)}
                    </span>
                  </div>

                  {/* Overdue assessment */}
                  <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                    <span className="font-medium text-slate-700">สถานะการส่งคืน:</span>
                    {overdueDays > 0 ? (
                      <span className="text-rose-600 font-semibold font-mono tabular-nums">
                        เกินกำหนด {overdueDays} วัน
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-semibold">
                        ตรงตามกำหนดเวลา
                      </span>
                    )}
                  </div>

                  {/* Fine calculation */}
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-800">ค่าปรับ (5 บาท/วัน):</span>
                    <span
                      className={`text-base font-bold font-mono tabular-nums ${
                        calculatedFine > 0 ? 'text-rose-600' : 'text-slate-700'
                      }`}
                    >
                      ฿{calculatedFine} บาท
                    </span>
                  </div>
                </div>

                {calculatedFine > 0 && (
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer p-2 rounded bg-amber-50 border border-amber-200">
                    <input
                      type="checkbox"
                      checked={finePaid}
                      onChange={(e) => setFinePaid(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>ผู้ยืมได้ชำระค่าปรับเรียบร้อยแล้ว</span>
                  </label>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <RotateCcw className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">เลือกรายการหนังสือที่ต้องการคืนเพื่อดูผลคำนวณ</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
