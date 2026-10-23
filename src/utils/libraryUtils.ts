import { LoanRecord } from '../types/library';

// Current reference date (or actual current client date)
export const getTodayString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const addDaysToDate = (dateStr: string, days: number): string => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDaysDifference = (targetDateStr: string, fromDateStr = getTodayString()): number => {
  const target = new Date(targetDateStr).getTime();
  const from = new Date(fromDateStr).getTime();
  const diffTime = target - from;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const calculateOverdueDays = (dueDateStr: string, returnDateStr?: string | null): number => {
  const compareDate = returnDateStr || getTodayString();
  const diff = getDaysDifference(dueDateStr, compareDate);
  // If diff < 0, it means compareDate is past dueDate
  return diff < 0 ? Math.abs(diff) : 0;
};

export const calculateFine = (dueDateStr: string, returnDateStr?: string | null, ratePerDay = 5): number => {
  const overdueDays = calculateOverdueDays(dueDateStr, returnDateStr);
  return overdueDays * ratePerDay;
};

export const formatDateThai = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];

  const thaiYear = year + 543;
  return `${day} ${thaiMonths[month - 1]} ${thaiYear} (${year})`;
};

export const formatShortDateThai = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];

  return `${day} ${thaiMonths[month - 1]} ${year}`;
};

export const exportLoansToCsv = (loans: LoanRecord[], filename = 'library_loans_report.csv') => {
  const headers = [
    'รหัสการยืม (Loan ID)',
    'ชื่อหนังสือ (Book Title)',
    'เลข ISBN',
    'ตำแหน่งชั้นวาง (Shelf)',
    'ชื่อผู้ยืม (Borrower)',
    'รหัสสมาชิก (Member Code)',
    'เบอร์โทรศัพท์ (Phone)',
    'วันที่ยืม (Borrow Date)',
    'กำหนดส่ง (Due Date)',
    'วันที่คืน (Return Date)',
    'สถานะ (Status)',
    'ค่าปรับ (บาท)',
    'หมายเหตุ (Notes)'
  ];

  const rows = loans.map(loan => {
    const statusText = loan.status === 'active' 
      ? 'กำลังยืม (Active)' 
      : loan.status === 'overdue' 
      ? 'เกินกำหนด (Overdue)' 
      : 'คืนแล้ว (Returned)';

    return [
      loan.id,
      `"${loan.bookTitle.replace(/"/g, '""')}"`,
      `"${loan.bookIsbn}"`,
      `"${loan.bookShelf}"`,
      `"${loan.memberName}"`,
      `"${loan.memberCode}"`,
      `"${loan.memberPhone}"`,
      loan.borrowDate,
      loan.dueDate,
      loan.returnDate || '-',
      statusText,
      loan.fine || 0,
      `"${(loan.notes || '').replace(/"/g, '""')}"`
    ];
  });

  // UTF-8 BOM for Thai language Excel support
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportBooksToCsv = (books: any[], filename = 'library_books_catalog.csv') => {
  const headers = [
    'รหัสหนังสือ (Book ID)',
    'ชื่อหนังสือ (Book Title)',
    'ผู้แต่ง (Author)',
    'เลข ISBN',
    'หมวดหมู่ (Category)',
    'ตำแหน่งชั้นวาง (Shelf)',
    'จำนวนสำเนาทั้งหมด (Total Copies)',
    'จำนวนที่ว่างพร้อมให้ยืม (Available)',
    'จำนวนที่ถูกยืม (Borrowed)',
    'ปีที่พิมพ์ (Year)',
    'สำนักพิมพ์ (Publisher)',
    'เรื่องย่อ (Description)'
  ];

  const rows = books.map((book) => {
    const borrowed = Math.max(0, book.totalCopies - book.availableCopies);
    return [
      book.id,
      `"${book.title.replace(/"/g, '""')}"`,
      `"${book.author.replace(/"/g, '""')}"`,
      `"${book.isbn}"`,
      `"${book.category}"`,
      `"${book.shelf}"`,
      book.totalCopies,
      book.availableCopies,
      borrowed,
      book.publishedYear,
      `"${(book.publisher || '').replace(/"/g, '""')}"`,
      `"${(book.description || '').replace(/"/g, '""')}"`
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
