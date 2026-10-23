import React, { useState, useEffect } from 'react';
import { Book, Member, BookReservation } from '../types/library';
import { BookCoverImage } from './BookCoverImage';
import {
  X,
  BookmarkCheck,
  Search,
  User,
  Phone,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';

interface ReserveBookModalProps {
  book: Book | null;
  isOpen: boolean;
  members: Member[];
  existingReservations: BookReservation[];
  prefilledMember?: Member | null;
  onClose: () => void;
  onConfirmReservation: (book: Book, member: Member, notes?: string) => void;
}

export const ReserveBookModal: React.FC<ReserveBookModalProps> = ({
  book,
  isOpen,
  members,
  existingReservations,
  prefilledMember = null,
  onClose,
  onConfirmReservation
}) => {
  const [memberIdentifier, setMemberIdentifier] = useState('');
  const [matchedMember, setMatchedMember] = useState<Member | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (prefilledMember) {
        setMatchedMember(prefilledMember);
        setMemberIdentifier(prefilledMember.memberCode);
      } else {
        setMemberIdentifier('');
        setMatchedMember(null);
      }
      setLookupError(null);
      setNotes('');
    }
  }, [isOpen, prefilledMember]);

  if (!isOpen || !book) return null;

  // Active reservations for this book
  const waitingReservations = existingReservations.filter(
    (r) => r.bookId === book.id && (r.status === 'waiting' || r.status === 'ready')
  );
  const nextQueueNumber = waitingReservations.length + 1;

  // Check if matched member has already reserved this book
  const alreadyReserved = matchedMember
    ? waitingReservations.find((r) => r.memberId === matchedMember.id)
    : null;

  const handleMemberLookup = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = memberIdentifier.trim();
    if (!query) {
      setLookupError('กรุณากรอกรหัสสมาชิก หรือเบอร์โทรศัพท์');
      setMatchedMember(null);
      return;
    }

    const cleanCode = query.toLowerCase();
    const cleanDigits = query.replace(/[^0-9]/g, '');

    const found = members.find((m) => {
      const codeMatch = m.memberCode.toLowerCase() === cleanCode;
      const phoneDigits = m.phone.replace(/[^0-9]/g, '');
      const phoneMatch = cleanDigits.length >= 9 && phoneDigits === cleanDigits;
      return codeMatch || phoneMatch;
    });

    if (found) {
      setMatchedMember(found);
      setLookupError(null);
    } else {
      setMatchedMember(null);
      setLookupError('ไม่พบข้อมูลสมาชิกจากรหัสหรือเบอร์โทรนี้ กรุณาตรวจสอบอีกครั้ง');
    }
  };

  const handleConfirm = () => {
    if (!matchedMember) {
      setLookupError('กรุณาระบุและตรวจสอบข้อมูลสมาชิกก่อนทำการจอง');
      return;
    }
    if (alreadyReserved) {
      return;
    }
    onConfirmReservation(book, matchedMember, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 sm:p-6 space-y-5 my-8 animate-fade-in">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-50 rounded-lg text-amber-700">
              <BookmarkCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                จองคิวหนังสือออนไลน์ (Reserve Book)
              </h2>
              <p className="text-xs text-slate-500">
                จองคิวรับหนังสือเมื่อมีผู้ใช้ท่านอื่นนำมาคืนที่ห้องสมุด
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Book Preview */}
        <div className="flex items-start gap-3.5 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
          <div className="w-16 h-22 shrink-0 rounded overflow-hidden bg-slate-200 shadow-xs">
            <BookCoverImage
              src={book.coverImage}
              title={book.title}
              author={book.author}
              category={book.category}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-1 text-xs flex-1 min-w-0">
            <span className="inline-block px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-medium text-[10px]">
              {book.category}
            </span>
            <h3 className="font-semibold text-slate-900 text-sm line-clamp-2 leading-snug">
              {book.title}
            </h3>
            <p className="text-slate-600 truncate">ผู้แต่ง: {book.author}</p>
            <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px] pt-0.5">
              <span>ISBN: {book.isbn}</span>
              <span>·</span>
              <span>ชั้น: {book.shelf}</span>
            </div>
          </div>
        </div>

        {/* Queue Information Ribbon */}
        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs space-y-1">
          <div className="flex items-center justify-between font-medium text-amber-900">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-700" />
              <span>สถานะคิวการจองเล่มนี้</span>
            </span>
            <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded font-bold font-mono">
              คุณจะได้คิวที่ {nextQueueNumber}
            </span>
          </div>
          <p className="text-amber-800 text-[11px]">
            {waitingReservations.length === 0
              ? 'ยังไม่มีผู้ต่อคิวเล่มนี้ เมื่อมีผู้นำหนังสือมาคืน คุณจะได้รับสิทธิ์เป็นคิวแรก'
              : `ขณะนี้มีผู้ต่อคิวอยู่แล้ว ${waitingReservations.length} ท่าน ระบบจะส่งมอบตามลำดับคิว`}
          </p>
        </div>

        {/* Member Identification */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            ข้อมูลผู้จอง (Member Verification)
          </label>

          {!matchedMember ? (
            <div className="space-y-2">
              <form onSubmit={handleMemberLookup} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={memberIdentifier}
                    onChange={(e) => {
                      setMemberIdentifier(e.target.value);
                      if (lookupError) setLookupError(null);
                    }}
                    placeholder="พิมพ์รหัสสมาชิก หรือเบอร์โทรศัพท์..."
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors shrink-0"
                >
                  ยืนยันตัวตน
                </button>
              </form>
              {lookupError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{lookupError}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">{matchedMember.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {matchedMember.memberCode} · {matchedMember.phone}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMatchedMember(null);
                    setMemberIdentifier('');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  เปลี่ยน
                </button>
              </div>

              {alreadyReserved && (
                <div className="p-2 bg-rose-100/70 border border-rose-300 rounded text-xs text-rose-800 flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-700" />
                  <span>
                    คุณมีคิวจองหนังสือเล่มนี้อยู่แล้ว (คิวที่ {alreadyReserved.queuePosition})
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Notes input */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-600">
              หมายเหตุ / ช่องทางติดต่อเพิ่มเติม (ถ้ามี)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น แจ้งเตือนผ่านไลน์ หรือต้องการด่วนสำหรับงานวิจัย..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleConfirm}
            disabled={!matchedMember || !!alreadyReserved}
            className={`inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-lg shadow-sm transition-colors ${
              matchedMember && !alreadyReserved
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>ยืนยันการจองคิว (คิวที่ {nextQueueNumber})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
