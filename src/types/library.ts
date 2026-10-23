export interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  shelf: string;
  coverImage: string;
  totalCopies: number;
  availableCopies: number;
  publishedYear: number;
  publisher: string;
  description: string;
}

export interface Member {
  id: string;
  memberCode: string;
  name: string;
  type: 'นักศึกษา' | 'อาจารย์/บุคลากร' | 'บุคคลทั่วไป';
  phone: string;
  email: string;
  department?: string;
}

export type LoanStatus = 'active' | 'returned' | 'overdue';

export interface LoanRecord {
  id: string;
  bookId: string;
  bookTitle: string;
  bookIsbn: string;
  bookCover: string;
  bookShelf: string;
  memberId: string;
  memberName: string;
  memberCode: string;
  memberPhone: string;
  borrowDate: string; // YYYY-MM-DD
  dueDate: string;    // YYYY-MM-DD
  returnDate?: string | null; // YYYY-MM-DD
  status: LoanStatus;
  fine: number;
  finePaid?: boolean;
  condition?: 'ปกติ' | 'ชำรุดเล็กน้อย' | 'ชำรุดมาก';
  notes?: string;
}

export interface BookReservation {
  id: string;
  bookId: string;
  bookTitle: string;
  bookCover: string;
  bookIsbn: string;
  bookShelf: string;
  memberId: string;
  memberName: string;
  memberCode: string;
  memberPhone: string;
  reservedAt: string; // YYYY-MM-DD
  queuePosition: number;
  status: 'waiting' | 'ready' | 'cancelled' | 'fulfilled';
  notes?: string;
}

export type UserRole = 'user' | 'admin';

export type ActiveTab =
  | 'dashboard'
  | 'catalog'
  | 'borrowed-check'
  | 'transaction'
  | 'members'
  | 'history'
  | 'my-loans';
