import React, { useState, useMemo, useEffect } from 'react';
import QRCode from 'qrcode';
import { Member, LoanRecord, Book, BookReservation } from '../types/library';
import { BookCoverImage } from './BookCoverImage';
import { MemberCardModal } from './MemberCardModal';
import { formatDateThai, getDaysDifference, calculateFine } from '../utils/libraryUtils';
import {
  Search,
  User,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
  QrCode,
  Printer,
  ShieldCheck,
  Phone,
  Building,
  RotateCcw,
  ArrowRight,
  Heart,
  BookmarkCheck,
  Copy,
  Check,
  Maximize2,
  CreditCard,
  Calendar,
  Sparkles,
  Info,
  Trash2
} from 'lucide-react';

interface UserMemberLookupViewProps {
  members: Member[];
  loans: LoanRecord[];
  books: Book[];
  reservations: BookReservation[];
  wishlistBookIds: string[];
  onCancelReservation: (reservationId: string) => void;
  onToggleWishlist: (bookId: string) => void;
  onOpenBookDetails: (book: Book) => void;
  onReserveBook?: (book: Book) => void;
}

export const UserMemberLookupView: React.FC<UserMemberLookupViewProps> = ({
  members,
  loans,
  books,
  reservations,
  wishlistBookIds,
  onCancelReservation,
  onToggleWishlist,
  onOpenBookDetails,
  onReserveBook
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [cardQrUrl, setCardQrUrl] = useState<string>('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'loans' | 'reservations' | 'wishlist'>('loans');

  // Generate QR code for the in-page digital pass whenever selectedMember changes
  useEffect(() => {
    if (selectedMember) {
      QRCode.toDataURL(
        `MEMBER:${selectedMember.memberCode}|NAME:${selectedMember.name}|PHONE:${selectedMember.phone}`,
        {
          width: 200,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          }
        }
      )
        .then((url) => setCardQrUrl(url))
        .catch((err) => console.error('Failed to generate card QR:', err));
    } else {
      setCardQrUrl('');
    }
  }, [selectedMember]);

  // Search member strictly by exact code or phone number without leaking other profiles
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setSearchError('กรุณากรอกรหัสสมาชิก หรือเบอร์โทรศัพท์ของคุณ');
      setSelectedMember(null);
      setHasSearched(false);
      return;
    }

    const cleanCode = query.toLowerCase();
    const cleanDigits = query.replace(/[^0-9]/g, '');

    // Strict matching: Exact memberCode OR exact full phone digits
    const match = members.find((m) => {
      const codeMatch = m.memberCode.toLowerCase() === cleanCode;
      const phoneDigits = m.phone.replace(/[^0-9]/g, '');
      const phoneMatch = cleanDigits.length >= 9 && phoneDigits === cleanDigits;
      return codeMatch || phoneMatch;
    });

    setHasSearched(true);
    if (match) {
      setSelectedMember(match);
      setSearchError(null);
    } else {
      setSelectedMember(null);
      setSearchError('ไม่พบข้อมูลสมาชิกจากรหัส หรือเบอร์โทรศัพท์นี้ กรุณาตรวจสอบความถูกต้อง หรือติดต่อเจ้าหน้าที่ห้องสมุด');
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setSelectedMember(null);
    setHasSearched(false);
    setSearchError(null);
  };

  const handleCopyCode = () => {
    if (!selectedMember) return;
    navigator.clipboard.writeText(selectedMember.memberCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  // Loans for selected member
  const memberLoans = useMemo(() => {
    if (!selectedMember) return [];
    return loans.filter((l) => l.memberId === selectedMember.id);
  }, [selectedMember, loans]);

  const activeLoans = memberLoans.filter((l) => l.status === 'active' || l.status === 'overdue');
  const returnedLoans = memberLoans.filter((l) => l.status === 'returned');

  // Reservations for selected member
  const memberReservations = useMemo(() => {
    if (!selectedMember) return [];
    return reservations.filter(
      (r) => r.memberId === selectedMember.id && (r.status === 'waiting' || r.status === 'ready')
    );
  }, [selectedMember, reservations]);

  // Wishlist books
  const wishlistBooks = useMemo(() => {
    return books.filter((b) => wishlistBookIds.includes(b.id));
  }, [books, wishlistBookIds]);

  // Overdue fines
  const totalFine = activeLoans.reduce((sum, loan) => {
    return sum + (getDaysDifference(loan.dueDate) < 0 ? calculateFine(loan.dueDate) : 0);
  }, 0);

  // Barcode generator simulation
  const renderBarcodeBars = (code: string) => {
    return (
      <div className="flex items-stretch justify-center h-8 w-full gap-[2px] bg-white p-1 rounded">
        {code.split('').map((char, index) => {
          const charCode = char.charCodeAt(0);
          const widthClass =
            charCode % 3 === 0
              ? 'w-1 bg-slate-900'
              : charCode % 2 === 0
              ? 'w-[2px] bg-slate-900'
              : 'w-0.5 bg-slate-900';
          const spacerClass = charCode % 4 === 0 ? 'w-1' : 'w-0.5';
          return (
            <React.Fragment key={index}>
              <div className={widthClass} />
              <div className={spacerClass} />
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          ประวัติของฉัน & บัตรสมาชิกดิจิทัล (My Library Portal)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          ค้นหาด้วยรหัสสมาชิกหรือเบอร์โทรศัพท์ เพื่อแสดงบัตรดิจิทัลสำหรับสแกนยืม ตรวจสอบคิวจอง และหนังสือเล่มโปรด
        </p>
      </div>

      {/* Privacy-Preserving Search Box */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSearch} className="space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            ระบุรหัสสมาชิก หรือเบอร์โทรศัพท์ของคุณ
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (searchError) setSearchError(null);
                }}
                placeholder="พิมพ์รหัสสมาชิก (เช่น LIB-68-0104) หรือเบอร์โทรศัพท์ (เช่น 081-423-9981)..."
                className="w-full pl-10 pr-4 py-2.5 text-sm sm:text-base bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-lg shadow-sm transition-colors whitespace-nowrap"
              >
                <span>เปิดข้อมูล & บัตรดิจิทัล</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              {(selectedMember || hasSearched) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg border border-slate-200 transition-colors whitespace-nowrap"
                  title="ล้างข้อมูลการค้นหาเพื่อความเป็นส่วนตัว"
                >
                  ค้นหาใหม่
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Error / Not Found Message */}
        {searchError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs sm:text-sm text-rose-700 flex items-start gap-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{searchError}</p>
              <p className="text-xs text-rose-600 mt-0.5">
                เคล็ดลับ: กรุณากรอกรหัสสมาชิกแบบเต็ม (เช่น LIB-68-0104) หรือพิมพ์เบอร์โทรศัพท์ที่ลงทะเบียนไว้
              </p>
            </div>
          </div>
        )}

        {/* Privacy Assurance Notice (When not yet searched) */}
        {!selectedMember && !searchError && (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-2.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>การคุ้มครองความเป็นส่วนตัวสูงสุด:</strong> ระบบไม่เปิดเผยรายชื่อของผู้อื่น บัตรและประวัติส่วนตัวจะแสดงผลเฉพาะเมื่อยืนยันด้วยรหัสหรือเบอร์โทรของคุณเท่านั้น
            </span>
          </div>
        )}
      </div>

      {/* Member Details, Digital Card & Portals */}
      {selectedMember && (
        <div className="space-y-6">
          {/* DIGITAL MEMBER CARD (FEATURE 1) */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white shadow-xl border border-slate-800">
            {/* Holographic / Metallic accent background elements */}
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative p-6 sm:p-7 space-y-6">
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-md">
                    <BookOpen className="w-5 h-5 text-slate-950" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-300 font-semibold">
                        SMART LIBRARY PASS
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                      บัตรสมาชิกห้องสมุดดิจิทัล
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {selectedMember.type}
                  </span>
                  <button
                    onClick={() => setIsCardModalOpen(true)}
                    className="p-1.5 bg-white/10 hover:bg-white/20 text-slate-200 rounded-lg transition-colors"
                    title="ขยายบัตรเต็มจอ"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card Main Body */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Member Info (Left 7 cols) */}
                <div className="md:col-span-7 space-y-4">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-mono">
                      ชื่อ-นามสกุล สมาชิกผู้ถือบัตร
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5 tracking-tight">
                      {selectedMember.name}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="bg-white/5 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">
                        รหัสประจำตัวสมาชิก
                      </span>
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <span className="font-mono font-bold text-emerald-300 text-sm sm:text-base tracking-wider">
                          {selectedMember.memberCode}
                        </span>
                        <button
                          onClick={handleCopyCode}
                          className="p-1 text-slate-400 hover:text-white transition-colors"
                          title="คัดลอกรหัส"
                        >
                          {codeCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">
                        เบอร์โทรศัพท์ติดต่อ
                      </span>
                      <span className="font-mono text-slate-200 text-sm font-medium mt-0.5 block truncate">
                        {selectedMember.phone}
                      </span>
                    </div>
                  </div>

                  {selectedMember.department && (
                    <div className="text-xs text-slate-300 flex items-center gap-1.5 pt-0.5">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{selectedMember.department}</span>
                    </div>
                  )}

                  {/* Barcode section */}
                  <div className="pt-2">
                    <div className="bg-white p-2 rounded-lg border border-white/20 shadow-inner">
                      {renderBarcodeBars(selectedMember.memberCode)}
                      <p className="text-center font-mono text-[10px] font-bold text-slate-900 mt-1 tracking-widest">
                        *{selectedMember.memberCode}*
                      </p>
                    </div>
                  </div>
                </div>

                {/* QR Code Presentation Box (Right 5 cols) */}
                <div className="md:col-span-5 flex flex-col items-center justify-center bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10 text-center">
                  <div className="bg-white p-2.5 rounded-xl shadow-lg">
                    {cardQrUrl ? (
                      <img
                        src={cardQrUrl}
                        alt={`QR code for ${selectedMember.memberCode}`}
                        className="w-32 h-32 sm:w-36 sm:h-36 object-contain"
                      />
                    ) : (
                      <div className="w-32 h-32 flex items-center justify-center text-slate-400">
                        <QrCode className="w-10 h-10 animate-pulse" />
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-emerald-300 mt-2.5">
                    ยื่นสแกนหน้าเคาน์เตอร์ได้ทันที
                  </p>
                  <p className="text-[10px] text-slate-400">
                    รองรับทั้งเครื่องสแกนบาร์โค้ด และกล้องเว็บแคม
                  </p>
                </div>
              </div>

              {/* Card Footer Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10 text-xs">
                <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>บัตรได้รับการรับรองความถูกต้องโดยระบบห้องสมุดกลาง</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors"
                  >
                    {codeCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>คัดลอกรหัสแล้ว</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>คัดลอกรหัส</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setIsCardModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-colors shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>พิมพ์บัตร / บันทึกภาพ</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setActiveSubTab('loans')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${
                activeSubTab === 'loans'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>ประวัติการยืม-คืน</span>
              <span className={`px-1.5 py-0.2 rounded-full text-xs font-mono ${
                activeSubTab === 'loans' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {activeLoans.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('reservations')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${
                activeSubTab === 'reservations'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <BookmarkCheck className="w-4 h-4" />
              <span>คิวจองหนังสือออนไลน์ (Reservations)</span>
              <span className={`px-1.5 py-0.2 rounded-full text-xs font-mono ${
                activeSubTab === 'reservations' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
              }`}>
                {memberReservations.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('wishlist')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${
                activeSubTab === 'wishlist'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>เล่มโปรดของฉัน (My Wishlist)</span>
              <span className={`px-1.5 py-0.2 rounded-full text-xs font-mono ${
                activeSubTab === 'wishlist' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'
              }`}>
                {wishlistBooks.length}
              </span>
            </button>
          </div>

          {/* TAB 1: LOANS & OVERDUE */}
          {activeSubTab === 'loans' && (
            <div className="space-y-6">
              {/* Metric Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    หนังสือที่กำลังยืมอยู่
                  </span>
                  <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                    {activeLoans.length}{' '}
                    <span className="text-xs font-normal text-slate-500 font-sans">เล่ม</span>
                  </p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">
                    ประวัติคืนเรียบร้อยแล้ว
                  </span>
                  <p className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
                    {returnedLoans.length}{' '}
                    <span className="text-xs font-normal text-slate-500 font-sans">เล่ม</span>
                  </p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider block">
                    ยอดค่าปรับค้างชำระ
                  </span>
                  <p className="text-2xl font-bold font-mono tabular-nums text-rose-600 mt-1">
                    ฿{totalFine}{' '}
                    <span className="text-xs font-normal text-slate-500 font-sans">บาท</span>
                  </p>
                </div>
              </div>

              {/* Currently Borrowed Books */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center justify-between">
                  <span>รายการหนังสือที่กำลังยืมอยู่ ({activeLoans.length} เล่ม)</span>
                  {totalFine > 0 && (
                    <span className="text-xs text-rose-600 font-medium">
                      * กรุณาคืนหนังสือที่เกินกำหนดส่งที่เคาน์เตอร์ห้องสมุด
                    </span>
                  )}
                </h3>

                {activeLoans.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-lg border border-slate-100">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                    <p className="text-xs font-semibold text-slate-700">
                      คุณไม่มีหนังสือค้างยืมในระบบขณะนี้
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      สามารถเลือกดูและยืมหนังสือเล่มใหม่จากหน้ารายการหนังสือได้ตลอดเวลา
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeLoans.map((loan) => {
                      const daysDiff = getDaysDifference(loan.dueDate);
                      const isOverdue = daysDiff < 0;
                      const fine = isOverdue ? calculateFine(loan.dueDate) : 0;

                      return (
                        <div
                          key={loan.id}
                          className={`p-4 rounded-xl border transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                            isOverdue
                              ? 'bg-rose-50/40 border-rose-200'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start gap-3.5">
                            <div className="w-12 h-16 shrink-0 rounded overflow-hidden bg-slate-100 shadow-xs border border-slate-200">
                              <BookCoverImage
                                src={loan.bookCover}
                                title={loan.bookTitle}
                              />
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-sm font-semibold text-slate-900 leading-snug">
                                {loan.bookTitle}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                <span className="font-mono">ISBN: {loan.bookIsbn}</span>
                                <span aria-hidden="true">·</span>
                                <span>ชั้นวาง: <strong>{loan.bookShelf}</strong></span>
                              </div>
                              <p className="text-[11px] text-slate-500">
                                ยืมเมื่อ: {formatDateThai(loan.borrowDate)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                            <div className="text-right">
                              <span className="text-[11px] text-slate-500 block">กำหนดคืน:</span>
                              <p
                                className={`text-sm font-bold font-mono ${
                                  isOverdue ? 'text-rose-600' : 'text-slate-900'
                                }`}
                              >
                                {formatDateThai(loan.dueDate)}
                              </p>
                              {isOverdue ? (
                                <span className="inline-block px-2 py-0.5 mt-1 rounded bg-rose-100 text-rose-800 text-[10px] font-semibold">
                                  เกินกำหนด {Math.abs(daysDiff)} วัน (ปรับ ฿{fine})
                                </span>
                              ) : (
                                <span className="text-[11px] text-emerald-700 font-medium">
                                  เหลือเวลาอีก {daysDiff} วัน
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Past Returned Loans */}
              {returnedLoans.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                  <h3 className="text-base font-bold text-slate-900">
                    ประวัติการคืนหนังสือที่ผ่านมา ({returnedLoans.length} เล่ม)
                  </h3>
                  <div className="divide-y divide-slate-100">
                    {returnedLoans.map((loan) => (
                      <div
                        key={loan.id}
                        className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{loan.bookTitle}</p>
                          <p className="text-slate-500 text-[11px]">
                            ยืมเมื่อ {formatDateThai(loan.borrowDate)} · คืนสำเร็จเมื่อ{' '}
                            {loan.returnDate ? formatDateThai(loan.returnDate) : '-'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium text-[11px]">
                            คืนแล้ว
                          </span>
                          {loan.fine > 0 && (
                            <span className="text-[11px] text-slate-500 font-mono">
                              ค่าปรับ ฿{loan.fine} ({loan.finePaid ? 'ชำระแล้ว' : 'ค้างชำระ'})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BOOK RESERVATIONS (FEATURE 2) */}
          {activeSubTab === 'reservations' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <BookmarkCheck className="w-5 h-5 text-amber-600" />
                    <span>หนังสือที่ฉันได้จองคิวไว้ ({memberReservations.length} รายการ)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    เมื่อหนังสือที่มีผู้ยืมอยู่ถูกนำมาคืน ระบบจะจัดสรรให้ท่านตามลำดับคิว
                  </p>
                </div>
              </div>

              {memberReservations.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-lg border border-slate-100">
                  <BookmarkCheck className="w-8 h-8 mx-auto text-amber-500 mb-2 opacity-60" />
                  <p className="text-xs font-semibold text-slate-700">
                    คุณยังไม่มีรายการจองคิวหนังสือ
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    หากหนังสือที่คุณต้องการถูกยืมหมด คุณสามารถกดปุ่ม "จองคิว (Reserve)" ในหน้ารายการหนังสือได้ทันที
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {memberReservations.map((resv) => (
                    <div
                      key={resv.id}
                      className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/20 hover:bg-amber-50/40 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-12 h-16 shrink-0 rounded overflow-hidden bg-slate-100 shadow-xs border border-slate-200">
                          <BookCoverImage
                            src={resv.bookCover}
                            title={resv.bookTitle}
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md font-mono font-bold text-xs">
                              คิวที่ {resv.queuePosition}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              วันที่จอง: {formatDateThai(resv.reservedAt)}
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-slate-900 leading-snug">
                            {resv.bookTitle}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="font-mono">ISBN: {resv.bookIsbn}</span>
                            <span aria-hidden="true">·</span>
                            <span>ชั้นวาง: <strong>{resv.bookShelf}</strong></span>
                          </div>
                          {resv.notes && (
                            <p className="text-[11px] text-amber-800 bg-amber-100/60 px-2 py-0.5 rounded inline-block">
                              หมายเหตุ: {resv.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                        <button
                          onClick={() => {
                            if (window.confirm(`ต้องการยกเลิกการจองคิวหนังสือ "${resv.bookTitle}" หรือไม่?`)) {
                              onCancelReservation(resv.id);
                            }
                          }}
                          className="px-3 py-1.5 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors font-medium inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ยกเลิกการจอง</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WISHLIST / FAVORITES (FEATURE 3) */}
          {activeSubTab === 'wishlist' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-600 fill-rose-600" />
                    <span>หนังสือเล่มโปรดของฉัน (My Wishlist)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    รายการหนังสือที่คุณกดหัวใจบันทึกไว้ เพื่อติดตามหรือค้นหาตำแหน่งชั้นวางได้สะดวก
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold text-slate-600">
                  {wishlistBooks.length} เล่ม
                </span>
              </div>

              {wishlistBooks.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-lg border border-slate-100">
                  <Heart className="w-8 h-8 mx-auto text-rose-400 mb-2 opacity-50" />
                  <p className="text-xs font-semibold text-slate-700">
                    ยังไม่มีหนังสือในรายการเล่มโปรด
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    คลิกไอคอนรูปหัวใจที่มุมการ์ดหนังสือในหน้ารายการหนังสือ เพื่อบันทึกเก็บไว้ดูในภายหลัง
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {wishlistBooks.map((book) => {
                    const isAvailable = book.availableCopies > 0;
                    return (
                      <div
                        key={book.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-shadow flex flex-col justify-between space-y-3"
                      >
                        <div className="flex gap-3">
                          <div className="w-14 h-20 shrink-0 rounded overflow-hidden bg-slate-100 border border-slate-200">
                            <BookCoverImage
                              src={book.coverImage}
                              title={book.title}
                              author={book.author}
                              category={book.category}
                            />
                          </div>
                          <div className="space-y-1 min-w-0 flex-1">
                            <span className="text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded font-medium">
                              {book.category}
                            </span>
                            <h4
                              onClick={() => onOpenBookDetails(book)}
                              className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug cursor-pointer hover:text-emerald-700"
                            >
                              {book.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 truncate">{book.author}</p>
                            <p className="text-[10px] font-mono text-slate-400">
                              ชั้น: {book.shelf}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                          <span
                            className={`text-[11px] font-semibold ${
                              isAvailable ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            {isAvailable ? `ว่าง ${book.availableCopies} เล่ม` : 'ถูกยืมหมด'}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => onToggleWishlist(book.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              title="นำออกจากเล่มโปรด"
                            >
                              <Heart className="w-4 h-4 fill-rose-600" />
                            </button>
                            <button
                              onClick={() => onOpenBookDetails(book)}
                              className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                            >
                              ดูรายละเอียด
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Member Card Full View Modal */}
      <MemberCardModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        member={selectedMember}
      />
    </div>
  );
};
