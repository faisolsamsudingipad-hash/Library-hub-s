import React, { useState, useMemo, useRef } from 'react';
import { Book, LoanRecord } from '../types/library';
import { BookCoverImage } from './BookCoverImage';
import {
  Search,
  Filter,
  LayoutGrid,
  List as ListIcon,
  BookOpen,
  ArrowRight,
  Info,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Eye,
  Heart,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Clock
} from 'lucide-react';

interface BookCatalogViewProps {
  books: Book[];
  loans: LoanRecord[];
  isAdmin?: boolean;
  wishlistBookIds?: string[];
  onToggleWishlist?: (bookId: string) => void;
  onReserveBook?: (book: Book) => void;
  onSelectBookToBorrow: (book: Book) => void;
  onOpenEditBook: (book: Book) => void;
  onDeleteBook: (bookId: string) => void;
  onOpenBookDetails: (book: Book) => void;
  onOpenAddBook?: () => void;
}

export const BookCatalogView: React.FC<BookCatalogViewProps> = ({
  books,
  loans,
  isAdmin = false,
  wishlistBookIds = [],
  onToggleWishlist,
  onReserveBook,
  onSelectBookToBorrow,
  onOpenEditBook,
  onDeleteBook,
  onOpenBookDetails,
  onOpenAddBook
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'borrowed' | 'wishlist'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'title' | 'available' | 'year'>('title');

  // Carousel ref for horizontal scrolling
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set(books.map((b) => b.category));
    return Array.from(set);
  }, [books]);

  // Overall catalog stats
  const catalogStats = useMemo(() => {
    const totalTitles = books.length;
    const totalCopies = books.reduce((acc, b) => acc + b.totalCopies, 0);
    const availableCopies = books.reduce((acc, b) => acc + b.availableCopies, 0);
    const borrowedCopies = totalCopies - availableCopies;

    return { totalTitles, totalCopies, availableCopies, borrowedCopies };
  }, [books]);

  // Featured / Recommended showcase books
  const featuredBooks = useMemo(() => {
    // Pick 5 top books with badges
    return books.slice(0, 5).map((book, idx) => {
      let badge = 'หนังสือแนะนำ';
      let badgeColor = 'bg-emerald-600 text-white';
      let icon = <Sparkles className="w-3 h-3" />;

      if (book.publishedYear >= 2026) {
        badge = 'มาใหม่ล่าสุด 2026';
        badgeColor = 'bg-indigo-600 text-white';
        icon = <Clock className="w-3 h-3" />;
      } else if (idx === 1) {
        badge = 'ยอดนิยมอันดับ 1';
        badgeColor = 'bg-amber-600 text-white';
        icon = <TrendingUp className="w-3 h-3" />;
      } else if (book.availableCopies === 0) {
        badge = 'รอเปิดจองคิว';
        badgeColor = 'bg-rose-600 text-white';
        icon = <BookmarkCheck className="w-3 h-3" />;
      }

      return {
        book,
        badge,
        badgeColor,
        icon
      };
    });
  }, [books]);

  // Filtered & sorted books
  const filteredBooks = useMemo(() => {
    return books
      .filter((book) => {
        const matchesSearch =
          book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.isbn.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.shelf.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.category.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        if (selectedCategory !== 'all' && book.category !== selectedCategory) {
          return false;
        }

        if (statusFilter === 'available' && book.availableCopies <= 0) {
          return false;
        }

        if (statusFilter === 'borrowed' && book.availableCopies === book.totalCopies) {
          return false;
        }

        if (statusFilter === 'wishlist' && !wishlistBookIds.includes(book.id)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'available') {
          return b.availableCopies - a.availableCopies;
        }
        if (sortBy === 'year') {
          return b.publishedYear - a.publishedYear;
        }
        return a.title.localeCompare(b.title, 'th');
      });
  }, [books, searchQuery, selectedCategory, statusFilter, sortBy, wishlistBookIds]);

  return (
    <div className="space-y-6">
      {/* Title & Stats Ribbon */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            คลังรายการหนังสือ (Library Catalog)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ค้นหา ตรวจสอบสต็อกสำเนา ตำแหน่งชั้นวาง บันทึกเล่มโปรด และจองคิวหนังสือออนไลน์
          </p>
        </div>

        {/* Clean unboxed stats with typographic separators & optional Admin Add Book button */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-600 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
            <span>
              หนังสือทั้งหมด{' '}
              <strong className="font-mono tabular-nums text-slate-900">
                {catalogStats.totalTitles}
              </strong>{' '}
              รายการ
            </span>
            <span aria-hidden="true" className="text-slate-300">
              /
            </span>
            <span>
              พร้อมให้ยืม{' '}
              <strong className="font-mono tabular-nums text-emerald-700">
                {catalogStats.availableCopies}
              </strong>{' '}
              เล่ม
            </span>
            <span aria-hidden="true" className="text-slate-300">
              /
            </span>
            <span>
              กำลังถูกยืม{' '}
              <strong className="font-mono tabular-nums text-amber-700">
                {catalogStats.borrowedCopies}
              </strong>{' '}
              เล่ม
            </span>
          </div>

          {isAdmin && onOpenAddBook && (
            <button
              onClick={onOpenAddBook}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มหนังสือใหม่</span>
            </button>
          )}
        </div>
      </div>

      {/* FEATURE 4: RECOMMENDED & NEW ARRIVALS CAROUSEL / SHOWCASE */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-wide">
                  หนังสือน่าสนใจ & หนังสือมาใหม่ (Featured & New Arrivals)
                </h2>
                <p className="text-xs text-slate-300">
                  คัดสรรผลงานยอดนิยม หนังสือวิชาการ และวรรณกรรมอัปเดตล่าสุด
                </p>
              </div>
            </div>

            {/* Carousel navigation arrows */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => scrollCarousel('left')}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                title="เลื่อนไปทางซ้าย"
                aria-label="Previous items"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollCarousel('right')}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                title="เลื่อนไปทางขวา"
                aria-label="Next items"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Horizontal Scrolling Track */}
          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {featuredBooks.map(({ book, badge, badgeColor, icon }) => {
              const isAvailable = book.availableCopies > 0;
              const isFavorited = wishlistBookIds.includes(book.id);

              return (
                <div
                  key={`feat-${book.id}`}
                  className="w-72 sm:w-80 shrink-0 snap-start bg-white/10 backdrop-blur-sm rounded-xl p-3.5 border border-white/10 hover:border-white/25 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="flex gap-3">
                    {/* Cover */}
                    <div
                      onClick={() => onOpenBookDetails(book)}
                      className="w-20 h-28 shrink-0 rounded-lg overflow-hidden bg-slate-800 shadow-md cursor-pointer relative group"
                    >
                      <BookCoverImage
                        src={book.coverImage}
                        title={book.title}
                        author={book.author}
                        category={book.category}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}`}
                        >
                          {icon}
                          <span>{badge}</span>
                        </span>
                        {onToggleWishlist && (
                          <button
                            onClick={() => onToggleWishlist(book.id)}
                            className="p-1 text-slate-300 hover:text-rose-400 transition-colors"
                            title={isFavorited ? 'นำออกจากเล่มโปรด' : 'เพิ่มในเล่มโปรด'}
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                isFavorited ? 'text-rose-500 fill-rose-500' : ''
                              }`}
                            />
                          </button>
                        )}
                      </div>

                      <h3
                        onClick={() => onOpenBookDetails(book)}
                        className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-snug cursor-pointer hover:text-emerald-300 transition-colors"
                      >
                        {book.title}
                      </h3>

                      <p className="text-[11px] text-slate-300 truncate">{book.author}</p>

                      <div className="flex items-center justify-between text-[11px] text-slate-300 pt-0.5">
                        <span className="font-mono">ชั้น {book.shelf.split(' ')[0]}</span>
                        <span
                          className={`font-semibold ${
                            isAvailable ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isAvailable ? `ว่าง ${book.availableCopies} เล่ม` : 'ถูกยืมหมด'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onOpenBookDetails(book)}
                      className="text-xs text-slate-300 hover:text-white transition-colors"
                    >
                      ดูรายละเอียด
                    </button>

                    {isAvailable ? (
                      isAdmin ? (
                        <button
                          onClick={() => onSelectBookToBorrow(book)}
                          className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-900 rounded-md text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-xs"
                        >
                          <span>ยืมเล่มนี้</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <button
                          onClick={() => onOpenBookDetails(book)}
                          className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-md text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-xs"
                        >
                          <Eye className="w-3 h-3" />
                          <span>ดูพิกัดชั้น</span>
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => onReserveBook && onReserveBook(book)}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-md text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-xs"
                      >
                        <BookmarkCheck className="w-3.5 h-3.5" />
                        <span>จองคิว</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อเรื่อง, ผู้แต่ง, เลข ISBN, หมวดหมู่, หรือชั้นวาง..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-700"
            >
              <option value="all">ทุกหมวดหมู่ ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-700"
            >
              <option value="title">เรียงตาม: ชื่อหนังสือ</option>
              <option value="available">เรียงตาม: สำเนาว่างมากสุด</option>
              <option value="year">เรียงตาม: ปีที่พิมพ์ล่าสุด</option>
            </select>

            {/* View Mode Switcher */}
            <div className="hidden sm:flex items-center gap-1 p-1 bg-slate-100 rounded-md shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="มุมมองการ์ด"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="มุมมองตาราง"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Status Filter Segmented Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-md">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทั้งหมด ({books.length})
            </button>
            <button
              onClick={() => setStatusFilter('available')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                statusFilter === 'available'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              พร้อมให้ยืม ({books.filter((b) => b.availableCopies > 0).length})
            </button>
            <button
              onClick={() => setStatusFilter('borrowed')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                statusFilter === 'borrowed'
                  ? 'bg-white text-amber-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              มีผู้ยืมอยู่ ({books.filter((b) => b.availableCopies < b.totalCopies).length})
            </button>
            <button
              onClick={() => setStatusFilter('wishlist')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap inline-flex items-center gap-1 ${
                statusFilter === 'wishlist'
                  ? 'bg-white text-rose-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${statusFilter === 'wishlist' ? 'fill-rose-600 text-rose-600' : ''}`} />
              <span>เล่มโปรด ({wishlistBookIds.length})</span>
            </button>
          </div>

          <p className="text-xs text-slate-400">
            แสดงผล {filteredBooks.length} จาก {books.length} เล่ม
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredBooks.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-lg border border-slate-200 shadow-sm">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">ไม่พบหนังสือตามเงื่อนไขที่เลือก</h3>
          <p className="text-xs text-slate-500 mt-1">
            ลองปรับเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่น
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setStatusFilter('all');
            }}
            className="mt-4 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200"
          >
            รีเซ็ตตัวกรองทั้งหมด
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredBooks.map((book) => {
            const isAvailable = book.availableCopies > 0;
            const isFavorited = wishlistBookIds.includes(book.id);

            // Check active loans for this specific book
            const activeLoansForBook = loans.filter(
              (l) => l.bookId === book.id && (l.status === 'active' || l.status === 'overdue')
            );

            return (
              <div
                key={book.id}
                className="group flex flex-col justify-between bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow relative"
              >
                <div>
                  {/* Book Cover Container with 3:4 Aspect Ratio */}
                  <div
                    onClick={() => onOpenBookDetails(book)}
                    className="relative aspect-[3/4] w-full bg-slate-100 overflow-hidden cursor-pointer"
                  >
                    <BookCoverImage
                      src={book.coverImage}
                      title={book.title}
                      author={book.author}
                      category={book.category}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                    />

                    {/* Stock pill in corner */}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs px-2.5 py-1 rounded bg-black/75 backdrop-blur-md text-white font-mono tabular-nums">
                      <span>ว่าง {book.availableCopies}/{book.totalCopies} เล่ม</span>
                      <span className={isAvailable ? 'text-emerald-400 font-sans' : 'text-rose-400 font-sans'}>
                        {isAvailable ? 'พร้อมยืม' : 'ถูกยืมหมด'}
                      </span>
                    </div>

                    {/* Favorite Heart Button (FEATURE 3) */}
                    {onToggleWishlist && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWishlist(book.id);
                        }}
                        className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-all shadow-md ${
                          isFavorited
                            ? 'bg-rose-500 text-white hover:bg-rose-600'
                            : 'bg-black/40 text-white hover:bg-black/60 hover:scale-110'
                        }`}
                        title={isFavorited ? 'นำออกจากเล่มโปรด' : 'บันทึกเป็นเล่มโปรด'}
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            isFavorited ? 'fill-current' : ''
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  {/* Book Details */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>{book.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{book.publishedYear}</span>
                    </div>

                    <h3
                      onClick={() => onOpenBookDetails(book)}
                      className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2 hover:text-emerald-700 cursor-pointer transition-colors"
                      title={book.title}
                    >
                      {book.title}
                    </h3>

                    <p className="text-xs text-slate-600 truncate">{book.author}</p>

                    <p className="text-[11px] text-slate-500 font-mono truncate">
                      ชั้น: {book.shelf}
                    </p>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 pt-0 space-y-2">
                  <div className="flex items-center gap-2">
                    {isAdmin ? (
                      isAvailable ? (
                        <button
                          onClick={() => onSelectBookToBorrow(book)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-md transition-colors whitespace-nowrap bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
                        >
                          <span>ทำรายการยืม</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => onReserveBook && onReserveBook(book)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-md transition-colors whitespace-nowrap bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                        >
                          <BookmarkCheck className="w-3.5 h-3.5" />
                          <span>จองคิวแทน</span>
                        </button>
                      )
                    ) : (
                      isAvailable ? (
                        <button
                          onClick={() => onOpenBookDetails(book)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-md transition-colors whitespace-nowrap bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>ดูรายละเอียด & ชั้นวาง</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onReserveBook && onReserveBook(book)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-md transition-colors whitespace-nowrap bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                        >
                          <BookmarkCheck className="w-3.5 h-3.5" />
                          <span>จองคิว (Reserve)</span>
                        </button>
                      )
                    )}

                    <button
                      onClick={() => onOpenBookDetails(book)}
                      title="ดูรายละเอียดและประวัติยืม"
                      className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Active borrower hint if currently borrowed - Only visible to Admin */}
                  {isAdmin && activeLoansForBook.length > 0 && (
                    <div className="text-[11px] text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-100 truncate">
                      ยืมอยู่: {activeLoansForBook.map((l) => l.memberName).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW (High density for librarians) */
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="py-3 px-4">หนังสือ / ผู้แต่ง</th>
                <th className="py-3 px-4">หมวดหมู่</th>
                <th className="py-3 px-4">ตำแหน่งชั้นวาง</th>
                <th className="py-3 px-4 text-center">สำเนาคงเหลือ</th>
                <th className="py-3 px-4 text-center">สถานะ</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBooks.map((book) => {
                const isAvailable = book.availableCopies > 0;
                const isFavorited = wishlistBookIds.includes(book.id);

                return (
                  <tr key={book.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-11 bg-slate-100 rounded overflow-hidden shrink-0">
                          <BookCoverImage
                            src={book.coverImage}
                            title={book.title}
                            category={book.category}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p
                              onClick={() => onOpenBookDetails(book)}
                              className="font-semibold text-slate-900 hover:text-emerald-700 cursor-pointer line-clamp-1"
                            >
                              {book.title}
                            </p>
                            {onToggleWishlist && (
                              <button
                                onClick={() => onToggleWishlist(book.id)}
                                className={`p-0.5 text-slate-300 hover:text-rose-500 transition-colors ${
                                  isFavorited ? 'text-rose-500' : ''
                                }`}
                                title={isFavorited ? 'นำออกจากเล่มโปรด' : 'บันทึกเป็นเล่มโปรด'}
                              >
                                <Heart
                                  className={`w-3.5 h-3.5 ${
                                    isFavorited ? 'fill-rose-500' : ''
                                  }`}
                                />
                              </button>
                            )}
                          </div>
                          <p className="text-slate-500 text-xs">{book.author}</p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ISBN: {book.isbn}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700">
                        {book.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600">
                      {book.shelf}
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums">
                      <span className="font-semibold text-slate-900">
                        {book.availableCopies}
                      </span>{' '}
                      / {book.totalCopies}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isAvailable ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>พร้อมยืม</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-800 bg-rose-50 px-2 py-0.5 rounded">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          <span>ถูกยืมหมด</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isAdmin ? (
                          <>
                            {isAvailable ? (
                              <button
                                onClick={() => onSelectBookToBorrow(book)}
                                className="px-2.5 py-1 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors"
                              >
                                ยืมเล่มนี้
                              </button>
                            ) : (
                              <button
                                onClick={() => onReserveBook && onReserveBook(book)}
                                className="px-2.5 py-1 text-xs font-medium text-white bg-amber-600 rounded hover:bg-amber-700 transition-colors inline-flex items-center gap-1"
                              >
                                <BookmarkCheck className="w-3 h-3" />
                                <span>จองคิว</span>
                              </button>
                            )}

                            <button
                              onClick={() => onOpenEditBook(book)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                              title="แก้ไขข้อมูลหนังสือ"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `ต้องการลบหนังสือ "${book.title}" ออกจากระบบหรือไม่?`
                                  )
                                ) {
                                  onDeleteBook(book.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                              title="ลบหนังสือ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            {isAvailable ? (
                              <button
                                onClick={() => onOpenBookDetails(book)}
                                className="px-3 py-1 text-xs font-medium text-slate-700 bg-slate-100 rounded hover:bg-slate-200 transition-colors"
                              >
                                ดูชั้นวาง
                              </button>
                            ) : (
                              <button
                                onClick={() => onReserveBook && onReserveBook(book)}
                                className="px-3 py-1 text-xs font-medium text-white bg-amber-600 rounded hover:bg-amber-700 transition-colors inline-flex items-center gap-1"
                              >
                                <BookmarkCheck className="w-3 h-3" />
                                <span>จองคิว</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
