import React from 'react';
import { Book, LoanRecord } from '../types/library';
import { BookCoverImage } from './BookCoverImage';
import { formatDateThai } from '../utils/libraryUtils';
import {
  X,
  BookOpen,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  UserCheck,
  AlertCircle,
  Heart,
  BookmarkCheck
} from 'lucide-react';

interface BookDetailsModalProps {
  book: Book | null;
  loans: LoanRecord[];
  isOpen: boolean;
  isAdmin?: boolean;
  wishlistBookIds?: string[];
  onToggleWishlist?: (bookId: string) => void;
  onReserveBook?: (book: Book) => void;
  onClose: () => void;
  onBorrowBook: (book: Book) => void;
  onEditBook: (book: Book) => void;
}

export const BookDetailsModal: React.FC<BookDetailsModalProps> = ({
  book,
  loans,
  isOpen,
  isAdmin = false,
  wishlistBookIds = [],
  onToggleWishlist,
  onReserveBook,
  onClose,
  onBorrowBook,
  onEditBook
}) => {
  if (!isOpen || !book) return null;

  // Active loans for this book
  const activeBookLoans = loans.filter(
    (l) => l.bookId === book.id && (l.status === 'active' || l.status === 'overdue')
  );

  const pastBookLoans = loans.filter(
    (l) => l.bookId === book.id && l.status === 'returned'
  );

  const isAvailable = book.availableCopies > 0;
  const isFavorited = wishlistBookIds.includes(book.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 space-y-5 my-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            รายละเอียดหนังสือ (Book Profile)
          </span>
          <div className="flex items-center gap-2">
            {onToggleWishlist && (
              <button
                type="button"
                onClick={() => onToggleWishlist(book.id)}
                className={`p-1.5 rounded-lg border transition-colors inline-flex items-center gap-1.5 text-xs font-medium ${
                  isFavorited
                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
                title={isFavorited ? 'นำออกจากเล่มโปรด' : 'บันทึกเป็นเล่มโปรด'}
              >
                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-600' : ''}`} />
                <span>{isFavorited ? 'บันทึกแล้ว' : 'เล่มโปรด'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-5">
          {/* Cover */}
          <div className="w-32 h-44 sm:w-40 sm:h-56 shrink-0 rounded overflow-hidden bg-slate-100 border border-slate-200 shadow-sm mx-auto sm:mx-0">
            <BookCoverImage
              src={book.coverImage}
              title={book.title}
              author={book.author}
              category={book.category}
            />
          </div>

          {/* Book Info */}
          <div className="space-y-3 flex-1">
            <div>
              <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                {book.category}
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1 leading-snug">
                {book.title}
              </h2>
              <p className="text-sm text-slate-600 mt-0.5">ผู้แต่ง: {book.author}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded border border-slate-100">
              <div>
                <span className="text-slate-400 block">เลข ISBN:</span>
                <span className="font-mono text-slate-900 font-medium">{book.isbn}</span>
              </div>
              <div>
                <span className="text-slate-400 block">ตำแหน่งชั้นวาง:</span>
                <span className="font-mono text-slate-900 font-medium">{book.shelf}</span>
              </div>
              <div>
                <span className="text-slate-400 block">สำนักพิมพ์:</span>
                <span className="text-slate-900">{book.publisher}</span>
              </div>
              <div>
                <span className="text-slate-400 block">ปีที่ตีพิมพ์:</span>
                <span className="font-mono tabular-nums text-slate-900">{book.publishedYear}</span>
              </div>
            </div>

            {/* Availability Badge */}
            <div className="flex items-center justify-between text-xs p-2.5 rounded border border-slate-200">
              <span className="font-medium text-slate-700">สถานะสต็อกในห้องสมุด:</span>
              <div className="font-mono tabular-nums">
                <span className="font-bold text-slate-900">{book.availableCopies}</span>
                <span className="text-slate-500"> / {book.totalCopies} เล่มว่าง</span>
                {isAvailable ? (
                  <span className="ml-2 text-emerald-700 font-sans font-medium">(พร้อมให้ยืม)</span>
                ) : (
                  <span className="ml-2 text-rose-600 font-sans font-medium">(ถูกยืมครบแล้ว)</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {book.description && (
          <div className="space-y-1 text-xs">
            <h4 className="font-semibold text-slate-700">เรื่องย่อสังเขป:</h4>
            <p className="text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded border border-slate-100">
              {book.description}
            </p>
          </div>
        )}

        {/* Current Borrowers Section (Only Admin can see borrower personal details) */}
        {isAdmin ? (
          <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
            <h4 className="font-semibold text-slate-800 flex items-center justify-between">
              <span>ผู้ที่กำลังยืมหนังสือเล่มนี้อยู่ในขณะนี้ ({activeBookLoans.length} คน)</span>
            </h4>

            {activeBookLoans.length === 0 ? (
              <p className="text-slate-400 italic py-2">
                ขณะนี้ไม่มีผู้ยืมหนังสือเล่มนี้ (สำเนาทั้งหมดอยู่บนชั้นวาง)
              </p>
            ) : (
              <div className="space-y-2">
                {activeBookLoans.map((loan) => (
                  <div
                    key={loan.id}
                    className="flex items-center justify-between p-2.5 rounded bg-slate-50 border border-slate-200"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{loan.memberName}</p>
                      <p className="text-slate-500">
                        รหัส: {loan.memberCode} · โทร: {loan.memberPhone}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-500">กำหนดคืน:</p>
                      <p
                        className={`font-semibold font-mono ${
                          loan.status === 'overdue' ? 'text-rose-600' : 'text-slate-900'
                        }`}
                      >
                        {formatDateThai(loan.dueDate)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* General User Privacy View: only show aggregate count if copies are borrowed */
          activeBookLoans.length > 0 && (
            <div className="border-t border-slate-100 pt-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-slate-600">
                <span className="font-medium">สถานะการยืมขณะนี้:</span>
                <span className="font-mono tabular-nums">มีผู้ยืมไปแล้ว {activeBookLoans.length} เล่ม</span>
              </div>
            </div>
          )
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {isAdmin ? (
            <button
              onClick={() => {
                onClose();
                onEditBook(book);
              }}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
            >
              แก้ไขข้อมูลหนังสือ
            </button>
          ) : (
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <span>ตำแหน่ง: ชั้นวาง <strong>{book.shelf}</strong></span>
              <span aria-hidden="true">·</span>
              <span>{isAvailable ? 'นำรหัสนี้ติดต่อยืมที่เคาน์เตอร์ได้' : 'สามารถกดจองคิวออนไลน์ได้'}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              ปิด
            </button>

            {/* If copies are available and admin is logged in: borrow action */}
            {isAdmin && isAvailable && (
              <button
                onClick={() => {
                  onClose();
                  onBorrowBook(book);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md shadow-sm transition-colors bg-slate-900 hover:bg-slate-800 text-white"
              >
                <span>ทำรายการยืมเล่มนี้</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {/* If copies are 0: show Reserve Book button */}
            {!isAvailable && (
              <button
                onClick={() => {
                  onClose();
                  if (onReserveBook) onReserveBook(book);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md shadow-sm transition-colors bg-amber-600 hover:bg-amber-700 text-white"
              >
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span>จองคิวออนไลน์ (Reserve)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
