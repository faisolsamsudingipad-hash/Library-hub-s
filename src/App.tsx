import React, { useState, useEffect } from 'react';
import { Book, Member, LoanRecord, ActiveTab, BookReservation } from './types/library';
import { INITIAL_BOOKS, INITIAL_MEMBERS, INITIAL_LOANS, INITIAL_RESERVATIONS } from './data/initialData';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { BookCatalogView } from './components/BookCatalogView';
import { BorrowedMonitorView } from './components/BorrowedMonitorView';
import { BorrowReturnDesk } from './components/BorrowReturnDesk';
import { MemberManagementView } from './components/MemberManagementView';
import { TransactionHistoryView } from './components/TransactionHistoryView';
import { AddBookModal } from './components/AddBookModal';
import { AddMemberModal } from './components/AddMemberModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { QuickReturnModal } from './components/QuickReturnModal';
import { BookDetailsModal } from './components/BookDetailsModal';
import { UserMemberLookupView } from './components/UserMemberLookupView';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ReserveBookModal } from './components/ReserveBookModal';
import { getTodayString, addDaysToDate, getDaysDifference } from './utils/libraryUtils';
import { RotateCcw, CheckCircle2, Library, Lock } from 'lucide-react';

export default function App() {
  // User vs Admin Authentication Mode (Default: User View as required)
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);

  // Persistent Books State
  const [books, setBooks] = useState<Book[]>(() => {
    try {
      const saved = localStorage.getItem('library_books_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse books from localStorage', e);
    }
    return INITIAL_BOOKS;
  });

  // Persistent Members State
  const [members, setMembers] = useState<Member[]>(() => {
    try {
      const saved = localStorage.getItem('library_members_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse members from localStorage', e);
    }
    return INITIAL_MEMBERS;
  });

  // Persistent Loans State
  const [loans, setLoans] = useState<LoanRecord[]>(() => {
    try {
      const saved = localStorage.getItem('library_loans_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse loans from localStorage', e);
    }
    return INITIAL_LOANS;
  });

  // Persistent Book Reservations State
  const [reservations, setReservations] = useState<BookReservation[]>(() => {
    try {
      const saved = localStorage.getItem('library_reservations_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse reservations from localStorage', e);
    }
    return INITIAL_RESERVATIONS;
  });

  // Persistent User Wishlist / Bookmarks State
  const [wishlistBookIds, setWishlistBookIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('library_wishlist_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse wishlist from localStorage', e);
    }
    return ['book-001', 'book-003'];
  });

  // Active navigation tab (User View defaults to catalog search)
  const [activeTab, setActiveTab] = useState<ActiveTab>('catalog');

  // Modals & Drawers state
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [bookToEdit, setBookToEdit] = useState<Book | null>(null);
  const [bookDetails, setBookDetails] = useState<Book | null>(null);

  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);

  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [quickReturnLoan, setQuickReturnLoan] = useState<LoanRecord | null>(null);
  const [preSelectedBookForBorrow, setPreSelectedBookForBorrow] = useState<Book | null>(null);
  const [preSelectedMemberForBorrow, setPreSelectedMemberForBorrow] = useState<Member | null>(null);

  // Reservation Modal state
  const [bookToReserve, setBookToReserve] = useState<Book | null>(null);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('library_books_v1', JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem('library_members_v1', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('library_loans_v1', JSON.stringify(loans));
  }, [loans]);

  useEffect(() => {
    localStorage.setItem('library_reservations_v1', JSON.stringify(reservations));
  }, [reservations]);

  useEffect(() => {
    localStorage.setItem('library_wishlist_v1', JSON.stringify(wishlistBookIds));
  }, [wishlistBookIds]);

  // Show auto-dismissing toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Counts for header badges
  const activeLoansList = loans.filter((l) => l.status === 'active' || l.status === 'overdue');
  const activeLoansCount = activeLoansList.length;
  const overdueLoansCount = activeLoansList.filter((l) => getDaysDifference(l.dueDate) < 0).length;

  // HANDLER: Confirm Borrowing a Book
  const handleConfirmBorrow = (newLoanData: Omit<LoanRecord, 'id'>, bookId: string) => {
    const newId = `loan-${Date.now().toString().slice(-4)}`;
    const createdLoan: LoanRecord = {
      ...newLoanData,
      id: newId
    };

    // Update loans list
    setLoans((prev) => [createdLoan, ...prev]);

    // Decrement available copies in book catalog
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id === bookId) {
          return {
            ...b,
            availableCopies: Math.max(0, b.availableCopies - 1)
          };
        }
        return b;
      })
    );

    showToast(`ทำรายการยืม "${newLoanData.bookTitle}" สำเร็จ`);
  };

  // HANDLER: Confirm Returning a Book
  const handleConfirmReturn = (
    loanId: string,
    bookId: string,
    condition: 'ปกติ' | 'ชำรุดเล็กน้อย' | 'ชำรุดมาก',
    fine: number,
    notes?: string
  ) => {
    const today = getTodayString();

    // Mark loan as returned
    setLoans((prev) =>
      prev.map((l) => {
        if (l.id === loanId) {
          return {
            ...l,
            returnDate: today,
            status: 'returned',
            condition,
            fine,
            finePaid: fine > 0 ? true : undefined,
            notes: notes ? `${l.notes ? l.notes + ' | ' : ''}บันทึกการคืน: ${notes}` : l.notes
          };
        }
        return l;
      })
    );

    // Increment available copies in book catalog
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id === bookId) {
          return {
            ...b,
            availableCopies: Math.min(b.totalCopies, b.availableCopies + 1)
          };
        }
        return b;
      })
    );

    showToast('บันทึกการคืนหนังสือเรียบร้อยแล้ว เพิ่มสต็อกกลับเข้าคลังแล้ว');
  };

  // HANDLER: Extend Loan (+7 Days)
  const handleExtendLoan = (loanId: string) => {
    setLoans((prev) =>
      prev.map((l) => {
        if (l.id === loanId) {
          const newDueDate = addDaysToDate(l.dueDate, 7);
          return {
            ...l,
            dueDate: newDueDate,
            status: 'active',
            notes: `${l.notes ? l.notes + ' | ' : ''}ขยายเวลายืม +7 วัน (ถึง ${newDueDate})`
          };
        }
        return l;
      })
    );

    showToast('ขยายระยะเวลายืมเพิ่ม 7 วันเรียบร้อยแล้ว');
  };

  // HANDLER: Save Book (New or Edit)
  const handleSaveBook = (bookData: Omit<Book, 'id'>, existingId?: string) => {
    if (existingId) {
      setBooks((prev) =>
        prev.map((b) => (b.id === existingId ? { ...bookData, id: existingId } : b))
      );
      showToast(`บันทึกการแก้ไขหนังสือ "${bookData.title}" สำเร็จ`);
    } else {
      const newBook: Book = {
        ...bookData,
        id: `book-${Date.now().toString().slice(-4)}`
      };
      setBooks((prev) => [newBook, ...prev]);
      showToast(`เพิ่มหนังสือ "${bookData.title}" เข้าสู่ระบบเรียบร้อย`);
    }
  };

  // HANDLER: Delete Book
  const handleDeleteBook = (bookId: string) => {
    const hasActiveLoan = loans.some(
      (l) => l.bookId === bookId && (l.status === 'active' || l.status === 'overdue')
    );
    if (hasActiveLoan) {
      alert('ไม่สามารถลบหนังสือเล่มนี้ได้ เนื่องจากยังมีผู้ยืมค้างอยู่ กรุณารับคืนหนังสือก่อน');
      return;
    }

    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบหนังสือเล่มนี้ออกจากระบบ?')) {
      setBooks((prev) => prev.filter((b) => b.id !== bookId));
      showToast('ลบหนังสือออกจากระบบเรียบร้อยแล้ว');
    }
  };

  // HANDLER: Save Member (New or Edit)
  const handleSaveMember = (memberData: Omit<Member, 'id'>, existingId?: string) => {
    if (existingId) {
      setMembers((prev) =>
        prev.map((m) => (m.id === existingId ? { ...memberData, id: existingId } : m))
      );
      showToast(`แก้ไขข้อมูลสมาชิก "${memberData.name}" สำเร็จ`);
    } else {
      const newMember: Member = {
        ...memberData,
        id: `mem-${Date.now().toString().slice(-4)}`
      };
      setMembers((prev) => [newMember, ...prev]);
      showToast(`ลงทะเบียนสมาชิก "${memberData.name}" เรียบร้อยแล้ว`);
    }
  };

  // HANDLER: Delete Member
  const handleDeleteMember = (memberId: string) => {
    const hasActiveLoan = loans.some(
      (l) => l.memberId === memberId && (l.status === 'active' || l.status === 'overdue')
    );
    if (hasActiveLoan) {
      alert(
        'ไม่สามารถลบสมาชิกท่านนี้ได้ เนื่องจากยังมีหนังสือค้างยืมในระบบ กรุณาทำรายการรับคืนหนังสือก่อนดำเนินการ'
      );
      return;
    }

    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบสมาชิกท่านนี้ออกจากระบบ?')) {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      showToast('ลบสมาชิกออกจากระบบเรียบร้อยแล้ว');
    }
  };

  // Toggle favorite / wishlist
  const handleToggleWishlist = (bookId: string) => {
    setWishlistBookIds((prev) => {
      const exists = prev.includes(bookId);
      if (exists) {
        showToast('นำหนังสือออกจากรายการเล่มโปรดแล้ว');
        return prev.filter((id) => id !== bookId);
      } else {
        showToast('เพิ่มหนังสือลงในรายการเล่มโปรดแล้ว ❤️');
        return [...prev, bookId];
      }
    });
  };

  // Trigger book reservation modal
  const handleTriggerReserveBook = (book: Book) => {
    setBookToReserve(book);
    setIsReserveModalOpen(true);
  };

  // Confirm reservation
  const handleConfirmReservation = (book: Book, member: Member, notes?: string) => {
    const waitingForThisBook = reservations.filter(
      (r) => r.bookId === book.id && (r.status === 'waiting' || r.status === 'ready')
    );
    const queuePosition = waitingForThisBook.length + 1;
    const newReservation: BookReservation = {
      id: `resv-${Date.now().toString().slice(-4)}`,
      bookId: book.id,
      bookTitle: book.title,
      bookCover: book.coverImage,
      bookIsbn: book.isbn,
      bookShelf: book.shelf,
      memberId: member.id,
      memberName: member.name,
      memberCode: member.memberCode,
      memberPhone: member.phone,
      reservedAt: getTodayString(),
      queuePosition,
      status: 'waiting',
      notes: notes || undefined
    };

    setReservations((prev) => [newReservation, ...prev]);
    showToast(`จองคิวหนังสือ "${book.title}" สำเร็จ! (คุณเป็นคิวที่ ${queuePosition})`);
  };

  // Cancel reservation
  const handleCancelReservation = (reservationId: string) => {
    const target = reservations.find((r) => r.id === reservationId);
    if (!target) return;

    setReservations((prev) => {
      const filtered = prev.filter((r) => r.id !== reservationId);
      let counter = 1;
      return filtered.map((r) => {
        if (r.bookId === target.bookId && (r.status === 'waiting' || r.status === 'ready')) {
          const updated = { ...r, queuePosition: counter };
          counter++;
          return updated;
        }
        return r;
      });
    });

    showToast('ยกเลิกรายการจองคิวหนังสือเรียบร้อยแล้ว');
  };

  // Reset to initial demo data
  const handleResetData = () => {
    if (confirm('คุณต้องการรีเซ็ตข้อมูลตัวอย่างกลับเป็นค่าเริ่มต้นหรือไม่?')) {
      localStorage.removeItem('library_books_v1');
      localStorage.removeItem('library_members_v1');
      localStorage.removeItem('library_loans_v1');
      localStorage.removeItem('library_reservations_v1');
      localStorage.removeItem('library_wishlist_v1');
      setBooks(INITIAL_BOOKS);
      setMembers(INITIAL_MEMBERS);
      setLoans(INITIAL_LOANS);
      setReservations(INITIAL_RESERVATIONS);
      setWishlistBookIds(['book-001', 'book-003']);
      showToast('รีเซ็ตข้อมูลกลับสู่ค่าเริ่มต้นเรียบร้อยแล้ว');
    }
  };

  // Fast trigger to borrow from catalog or dashboard
  const handleTriggerBorrowFromCatalog = (book: Book) => {
    setPreSelectedBookForBorrow(book);
    setActiveTab('transaction');
  };

  // Fast trigger to borrow for member from member view
  const handleTriggerBorrowForMember = (member: Member) => {
    setPreSelectedMemberForBorrow(member);
    setActiveTab('transaction');
  };

  const handleAdminLoginSuccess = () => {
    setIsAdmin(true);
    setActiveTab('dashboard');
    showToast('เข้าสู่ระบบผู้ดูแลระบบ (Admin) สำเร็จ');
  };

  const handleLogoutAdmin = () => {
    setIsAdmin(false);
    setActiveTab('catalog');
    showToast('ออกจากระบบผู้ดูแลแล้ว (กลับสู่มุมมองผู้ใช้ทั่วไป)');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Bar Header with User/Admin switcher and login */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeLoansCount={activeLoansCount}
        overdueLoansCount={overdueLoansCount}
        isAdmin={isAdmin}
        onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
        onLogoutAdmin={handleLogoutAdmin}
        onOpenAddBook={() => {
          setBookToEdit(null);
          setIsAddBookModalOpen(true);
        }}
        onOpenBarcodeScanner={() => setIsBarcodeModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Tab: รายการหนังสือทั้งหมด (User View + Admin View) */}
        {activeTab === 'catalog' && (
          <BookCatalogView
            books={books}
            loans={loans}
            isAdmin={isAdmin}
            wishlistBookIds={wishlistBookIds}
            onToggleWishlist={handleToggleWishlist}
            onReserveBook={handleTriggerReserveBook}
            onSelectBookToBorrow={handleTriggerBorrowFromCatalog}
            onOpenEditBook={(book) => {
              setBookToEdit(book);
              setIsAddBookModalOpen(true);
            }}
            onDeleteBook={handleDeleteBook}
            onOpenBookDetails={(book) => setBookDetails(book)}
            onOpenAddBook={() => {
              setBookToEdit(null);
              setIsAddBookModalOpen(true);
            }}
          />
        )}

        {/* Tab: เช็คหนังสือที่ถูกยืม (Admin Only) */}
        {activeTab === 'borrowed-check' && (
          isAdmin ? (
            <BorrowedMonitorView
              loans={loans}
              books={books}
              isAdmin={isAdmin}
              onOpenReturnModal={(loan) => setQuickReturnLoan(loan)}
              onExtendLoan={handleExtendLoan}
              onNavigateToBorrow={() => setActiveTab('transaction')}
            />
          ) : (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-sm max-w-md mx-auto my-12">
              <p className="text-slate-800 font-semibold mb-2">ข้อมูลสำหรับเจ้าหน้าที่ห้องสมุดเท่านั้น</p>
              <p className="text-xs text-slate-500 mb-6">
                หน้านี้สงวนไว้สำหรับผู้ดูแลระบบ เพื่อคุ้มครองข้อมูลความเป็นส่วนตัวของสมาชิก
              </p>
              <button
                onClick={() => setActiveTab('catalog')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors"
              >
                กลับสู่หน้ารายการหนังสือ
              </button>
            </div>
          )
        )}

        {/* Tab สำหรับผู้ใช้ทั่วไป: ตรวจประวัติ & บัตรสมาชิกของตนเอง */}
        {activeTab === 'my-loans' && (
          <UserMemberLookupView
            members={members}
            loans={loans}
            books={books}
            reservations={reservations}
            wishlistBookIds={wishlistBookIds}
            onCancelReservation={handleCancelReservation}
            onToggleWishlist={handleToggleWishlist}
            onOpenBookDetails={(book) => setBookDetails(book)}
            onReserveBook={handleTriggerReserveBook}
          />
        )}

        {/* Tab: แดชบอร์ดสรุปสถิติ & ส่งออกข้อมูล (Admin Only) */}
        {activeTab === 'dashboard' && (
          isAdmin ? (
            <DashboardView
              books={books}
              members={members}
              loans={loans}
              onNavigateToTab={(tab) => setActiveTab(tab)}
              onOpenBarcodeScanner={() => setIsBarcodeModalOpen(true)}
              onSelectBook={(book) => setBookDetails(book)}
            />
          ) : (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-sm max-w-md mx-auto my-12">
              <p className="text-slate-800 font-semibold mb-2">ข้อมูลสำหรับเจ้าหน้าที่ห้องสมุดเท่านั้น</p>
              <p className="text-xs text-slate-500 mb-6">
                หน้ารายงานสถิติสงวนไว้สำหรับผู้ดูแลระบบ
              </p>
              <button
                onClick={() => setActiveTab('catalog')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors"
              >
                กลับสู่หน้ารายการหนังสือ
              </button>
            </div>
          )
        )}

        {/* Tab: หน้าบันทึกการยืม-คืน (Admin Only) */}
        {activeTab === 'transaction' && (
          isAdmin ? (
            <BorrowReturnDesk
              books={books}
              members={members}
              loans={loans}
              preSelectedBook={preSelectedBookForBorrow}
              preSelectedMember={preSelectedMemberForBorrow}
              onClearPreSelectedBook={() => setPreSelectedBookForBorrow(null)}
              onClearPreSelectedMember={() => setPreSelectedMemberForBorrow(null)}
              onOpenBarcodeModal={() => setIsBarcodeModalOpen(true)}
              onConfirmBorrow={handleConfirmBorrow}
              onConfirmReturn={handleConfirmReturn}
            />
          ) : (
            <div className="p-12 text-center bg-white rounded-lg border border-slate-200 shadow-sm max-w-md mx-auto my-12">
              <p className="text-slate-800 font-semibold mb-2">เคาน์เตอร์บันทึกการยืม-คืน สำหรับเจ้าหน้าที่</p>
              <p className="text-xs text-slate-500 mb-6">
                กรุณาเข้าสู่ระบบแอดมินด้วยรหัส PIN เพื่อเปิดใช้งานการยืม-คืนหนังสือ
              </p>
              <button
                onClick={() => setIsAdminLoginModalOpen(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-colors"
              >
                เข้าสู่ระบบแอดมิน
              </button>
            </div>
          )
        )}

        {/* Tab: ระบบจัดการสมาชิกผู้ยืม & ออกบัตร (Admin Only) */}
        {activeTab === 'members' && (
          isAdmin ? (
            <MemberManagementView
              members={members}
              loans={loans}
              books={books}
              onOpenAddMember={() => {
                setMemberToEdit(null);
                setIsAddMemberModalOpen(true);
              }}
              onOpenEditMember={(member) => {
                setMemberToEdit(member);
                setIsAddMemberModalOpen(true);
              }}
              onDeleteMember={handleDeleteMember}
              onBorrowForMember={handleTriggerBorrowForMember}
              onQuickReturn={(loan) => setQuickReturnLoan(loan)}
            />
          ) : (
            <div className="p-12 text-center bg-white rounded-lg border border-slate-200 shadow-sm max-w-md mx-auto my-12">
              <p className="text-slate-800 font-semibold mb-2">ระบบจัดการรายชื่อสมาชิก สำหรับเจ้าหน้าที่</p>
              <p className="text-xs text-slate-500 mb-6">
                กรุณาเข้าสู่ระบบแอดมินด้วยรหัส PIN เพื่อเพิ่ม ลบ หรือแก้ไขข้อมูลสมาชิก
              </p>
              <button
                onClick={() => setIsAdminLoginModalOpen(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-colors"
              >
                เข้าสู่ระบบแอดมิน
              </button>
            </div>
          )
        )}

        {/* Tab: ประวัติทำรายการทั้งหมด (Admin Only) */}
        {activeTab === 'history' && (
          isAdmin ? (
            <TransactionHistoryView loans={loans} />
          ) : (
            <div className="p-12 text-center bg-white rounded-lg border border-slate-200 shadow-sm max-w-md mx-auto my-12">
              <p className="text-slate-800 font-semibold mb-2">ประวัติการทำรายการห้องสมุด สำหรับเจ้าหน้าที่</p>
              <p className="text-xs text-slate-500 mb-6">
                กรุณาเข้าสู่ระบบแอดมินเพื่อตรวจสอบประวัติการทำธุรกรรมทั้งหมด
              </p>
              <button
                onClick={() => setIsAdminLoginModalOpen(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-colors"
              >
                เข้าสู่ระบบแอดมิน
              </button>
            </div>
          )
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Library className="w-4 h-4 text-slate-400" />
            <span>ระบบจัดการห้องสมุด ยืม-คืนหนังสือ (Library Management Hub)</span>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <span className="font-mono text-emerald-700 font-semibold">โหมดผู้ดูแลระบบ (Admin)</span>
                <span>·</span>
                <button
                  onClick={handleLogoutAdmin}
                  className="text-rose-600 hover:text-rose-800 transition-colors"
                >
                  ออกจากระบบ
                </button>
              </div>
            ) : (
              /* Discreet, unobtrusive admin entrance at footer bottom */
              <button
                onClick={() => setIsAdminLoginModalOpen(true)}
                className="text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center gap-1 opacity-60 hover:opacity-100 text-[11px]"
                title="สำหรับเจ้าหน้าที่"
                aria-label="Staff Access"
              >
                <Lock className="w-3 h-3 text-slate-400" />
                <span>จัดการระบบ</span>
              </button>
            )}
            <span>·</span>
            <button
              onClick={handleResetData}
              className="hover:text-slate-900 inline-flex items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors"
              title="รีเซ็ตข้อมูลตัวอย่างกลับเป็นค่าเริ่มต้น"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>รีเซ็ตข้อมูลตัวอย่าง</span>
            </button>
            <span>·</span>
            <span>สถานะ: พร้อมใช้งาน</span>
          </div>
        </div>
      </footer>

      {/* Add / Edit Book Modal (Admin Only) */}
      <AddBookModal
        isOpen={isAddBookModalOpen}
        onClose={() => {
          setIsAddBookModalOpen(false);
          setBookToEdit(null);
        }}
        onSaveBook={handleSaveBook}
        initialBook={bookToEdit}
      />

      {/* Add / Edit Member Modal (Admin Only) */}
      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => {
          setIsAddMemberModalOpen(false);
          setMemberToEdit(null);
        }}
        onSaveMember={handleSaveMember}
        initialMember={memberToEdit}
      />

      {/* Quick Barcode Scanner Modal with 25 FPS & Member Pass Detection */}
      <BarcodeScannerModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        books={books}
        loans={loans}
        members={members}
        onSelectForBorrow={handleTriggerBorrowFromCatalog}
        onSelectForReturn={(loan) => setQuickReturnLoan(loan)}
        onSelectMemberForBorrow={handleTriggerBorrowForMember}
      />

      {/* Book Details Modal */}
      <BookDetailsModal
        isOpen={!!bookDetails}
        book={bookDetails}
        loans={loans}
        isAdmin={isAdmin}
        wishlistBookIds={wishlistBookIds}
        onToggleWishlist={handleToggleWishlist}
        onReserveBook={handleTriggerReserveBook}
        onClose={() => setBookDetails(null)}
        onBorrowBook={handleTriggerBorrowFromCatalog}
        onEditBook={(book) => {
          setBookToEdit(book);
          setIsAddBookModalOpen(true);
        }}
      />

      {/* Online Book Reservation Modal */}
      <ReserveBookModal
        isOpen={isReserveModalOpen}
        book={bookToReserve}
        members={members}
        existingReservations={reservations}
        onClose={() => {
          setIsReserveModalOpen(false);
          setBookToReserve(null);
        }}
        onConfirmReservation={handleConfirmReservation}
      />

      {/* Quick Return Modal (Admin Only) */}
      <QuickReturnModal
        isOpen={!!quickReturnLoan}
        loan={quickReturnLoan}
        onClose={() => setQuickReturnLoan(null)}
        onConfirmReturn={handleConfirmReturn}
      />

      {/* Admin Login Modal (PIN: 944628 - Hidden discreet gateway) */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
        defaultPin="944628"
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2.5 text-xs sm:text-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
