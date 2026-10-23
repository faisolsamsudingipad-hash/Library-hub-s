import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Book, LoanRecord, Member } from '../types/library';
import { BookCoverImage } from './BookCoverImage';
import { playBarcodeBeep } from '../utils/audioBeep';
import { formatDateThai } from '../utils/libraryUtils';
import {
  X,
  ScanLine,
  Barcode,
  Camera,
  CameraOff,
  SwitchCamera,
  Search,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  ArrowRight,
  RotateCcw,
  Sparkles,
  UserCheck,
  Zap
} from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  loans: LoanRecord[];
  members?: Member[];
  onSelectForBorrow: (book: Book) => void;
  onSelectForReturn: (loan: LoanRecord) => void;
  onSelectMemberForBorrow?: (member: Member) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  books,
  loans,
  members = [],
  onSelectForBorrow,
  onSelectForReturn,
  onSelectMemberForBorrow
}) => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Camera scanner state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializingCamera, setIsInitializingCamera] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [hasScannedFlash, setHasScannedFlash] = useState(false);

  const [scanResult, setScanResult] = useState<{
    rawCode?: string;
    book?: Book;
    activeLoan?: LoanRecord;
    member?: Member;
    notFound?: boolean;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const lastScanTimestampRef = useRef<number>(0);
  const isComponentMounted = useRef<boolean>(true);

  const handleProcessBarcode = useCallback(
    (code: string) => {
      const cleanCode = code.trim();
      if (!cleanCode) return;

      // Trigger instant visual detection flash
      setHasScannedFlash(true);
      setTimeout(() => setHasScannedFlash(false), 400);

      setLastScannedCode(cleanCode);

      // 1. Check if scanned code is a Member Card QR or Member ID!
      let memberCodeQuery = cleanCode;
      if (cleanCode.startsWith('MEMBER:')) {
        const parts = cleanCode.split('|');
        memberCodeQuery = parts[0].replace('MEMBER:', '').trim();
      }

      const matchedMember = members.find(
        (m) =>
          m.memberCode.toLowerCase() === memberCodeQuery.toLowerCase() ||
          cleanCode.toLowerCase().includes(m.memberCode.toLowerCase())
      );

      if (matchedMember) {
        if (soundEnabled) playBarcodeBeep(true);
        setScanResult({
          rawCode: cleanCode,
          member: matchedMember,
          notFound: false
        });
        return;
      }

      // 2. Otherwise search book catalog by ISBN, ID, or Title match
      const normalizedDigits = cleanCode.replace(/[^0-9X]/gi, '').toLowerCase();

      const matchedBook = books.find((b) => {
        const bookIsbnDigits = b.isbn.replace(/[^0-9X]/gi, '').toLowerCase();
        return (
          bookIsbnDigits === normalizedDigits ||
          b.isbn.toLowerCase() === cleanCode.toLowerCase() ||
          b.id.toLowerCase() === cleanCode.toLowerCase() ||
          cleanCode.includes(bookIsbnDigits) ||
          bookIsbnDigits.includes(normalizedDigits)
        );
      });

      if (matchedBook) {
        if (soundEnabled) playBarcodeBeep(true);

        // Check if there is an active unreturned loan for this book
        const activeLoan = loans.find(
          (l) => l.bookId === matchedBook.id && (l.status === 'active' || l.status === 'overdue')
        );

        setScanResult({
          rawCode: cleanCode,
          book: matchedBook,
          activeLoan,
          notFound: false
        });
      } else {
        if (soundEnabled) playBarcodeBeep(false);
        setScanResult({
          rawCode: cleanCode,
          notFound: true
        });
      }
    },
    [books, loans, members, soundEnabled]
  );

  // Stop camera helper
  const stopCamera = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Error clearing camera scanner:', err);
      } finally {
        html5QrCodeRef.current = null;
      }
    }
    if (isComponentMounted.current) {
      setIsCameraActive(false);
      setIsInitializingCamera(false);
    }
  }, []);

  // Start camera helper with ultra-fast 25 FPS and optimized aspect ratio
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setIsInitializingCamera(true);

    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      }

      const qrCodeId = 'camera-viewfinder-canvas';
      const qrCode = new Html5Qrcode(qrCodeId);
      html5QrCodeRef.current = qrCode;

      // Ultra-responsive high FPS config (25 fps) with wide barcode bounding box
      const config = {
        fps: 25, // High frame-rate for near-instant recognition
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          // Dynamic rectangular box optimized for horizontal barcodes & QR
          const width = Math.min(Math.floor(viewfinderWidth * 0.88), 380);
          const height = Math.min(Math.floor(viewfinderHeight * 0.48), 180);
          return { width, height };
        },
        aspectRatio: 1.777778, // 16:9 widescreen format ideal for iPad and phones
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_39
        ]
      };

      await qrCode.start(
        { facingMode: cameraFacing },
        config,
        (decodedText) => {
          // Cooldown check (prevent rapid duplicate firing within 1.2 seconds)
          const now = Date.now();
          if (now - lastScanTimestampRef.current < 1200) {
            return;
          }
          lastScanTimestampRef.current = now;

          handleProcessBarcode(decodedText);
        },
        () => {
          // Suppress regular frame no-match iterations
        }
      );

      if (isComponentMounted.current) {
        setIsCameraActive(true);
        setIsInitializingCamera(false);
      }
    } catch (err: any) {
      console.error('Camera startup error:', err);
      if (isComponentMounted.current) {
        setCameraError(
          err?.message ||
            'ไม่สามารถเข้าถึงกล้องถ่ายรูปได้ กรุณาอนุญาตการเข้าถึงกล้อง (Camera Permission) ในเบราว์เซอร์'
        );
        setIsCameraActive(false);
        setIsInitializingCamera(false);
      }
    }
  }, [cameraFacing, handleProcessBarcode]);

  // Toggle Camera
  const handleToggleCamera = () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  // Flip Camera (Front / Back on iPad or Phone)
  const handleSwitchCameraFacing = async () => {
    const newFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(newFacing);
    if (isCameraActive) {
      await stopCamera();
      setTimeout(() => {
        startCamera();
      }, 100);
    }
  };

  // Cleanup on Modal Close or Unmount
  useEffect(() => {
    isComponentMounted.current = true;
    if (isOpen) {
      setBarcodeInput('');
      setScanResult(null);
      setCameraError(null);
      startCamera();
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    } else {
      stopCamera();
    }

    return () => {
      isComponentMounted.current = false;
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  if (!isOpen) return null;

  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();
    handleProcessBarcode(barcodeInput);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full p-5 sm:p-6 space-y-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-emerald-700 animate-pulse" />
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>สแกนบาร์โค้ด & QR Code (Ultra-Fast 25 FPS)</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-1.5 py-0.2 rounded font-semibold">
                  iPad Ready
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">
                สแกนได้ทั้งบาร์โค้ดหนังสือ (ISBN) และบัตรสมาชิกห้องสมุด (Member Pass)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded transition-colors"
              title={soundEnabled ? 'ปิดเสียงสแกน' : 'เปิดเสียงสแกน'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-700" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CAMERA VIEWFINDER CONTAINER */}
        <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex flex-col items-center justify-center min-h-[220px]">
          {/* HTML5 QRCODE CANVAS TARGET */}
          <div
            id="camera-viewfinder-canvas"
            className={`w-full overflow-hidden ${isCameraActive ? 'block' : 'hidden'}`}
          />

          {/* Flash Effect on Successful Scan */}
          {hasScannedFlash && (
            <div className="absolute inset-0 bg-emerald-400/30 z-20 pointer-events-none transition-opacity duration-300" />
          )}

          {/* When camera is NOT active or Initializing */}
          {!isCameraActive && (
            <div className="p-6 text-center space-y-3 text-slate-400 select-none">
              <Camera className="w-12 h-12 text-slate-600 mx-auto" />
              <div>
                <p className="text-sm font-semibold text-slate-200">
                  {isInitializingCamera ? 'กำลังเชื่อมต่อกล้องถ่ายรูปความเร็วสูง...' : 'กล้องถ่ายรูปยังไม่ได้เปิดใช้งาน'}
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  {isInitializingCamera
                    ? 'ปรับโฟกัส 25 fps พร้อมสแกนทันที...'
                    : 'กดปุ่มด้านล่างเพื่อเปิดกล้อง หรือพิมพ์รหัส ISBN สำรอง'}
                </p>
              </div>

              {!isInitializingCamera && (
                <button
                  type="button"
                  onClick={startCamera}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md shadow-sm transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <span>เปิดกล้องสแกนบาร์โค้ด</span>
                </button>
              )}
            </div>
          )}

          {/* Camera Permission / Access Error Alert */}
          {cameraError && (
            <div className="absolute inset-x-4 top-4 p-3 bg-rose-900/90 border border-rose-700 rounded text-rose-100 text-xs backdrop-blur-md flex items-start gap-2 shadow-lg z-10">
              <AlertCircle className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">เกิดข้อผิดพลาดในการเปิดกล้อง</p>
                <p className="text-rose-200/90 text-[11px] mt-0.5">{cameraError}</p>
                <p className="text-white text-[11px] mt-1 underline cursor-pointer" onClick={startCamera}>
                  คลิกเพื่อลองใหม่อีกครั้ง
                </p>
              </div>
            </div>
          )}

          {/* Active Laser Overlay Effect */}
          {isCameraActive && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center z-10">
              {/* Animated laser line */}
              <div className="w-64 sm:w-80 h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_14px_#f43f5e] animate-bounce opacity-95" />

              {/* Viewfinder Target Framing Box */}
              <div className="w-64 sm:w-80 h-32 border-2 border-emerald-400/90 rounded-lg relative shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                <div className="absolute top-1 left-2 text-[10px] text-emerald-300 font-mono tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  <span>FAST SCAN // 25 FPS</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Camera Control Toolbar */}
        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleCamera}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                isCameraActive
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              {isCameraActive ? (
                <>
                  <CameraOff className="w-3.5 h-3.5" />
                  <span>ปิดกล้อง</span>
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5" />
                  <span>เปิดกล้อง</span>
                </>
              )}
            </button>

            {isCameraActive && (
              <button
                type="button"
                onClick={handleSwitchCameraFacing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium transition-colors"
                title="สลับกล้องหน้า / กล้องหลัง (iPad, มือถือ)"
              >
                <SwitchCamera className="w-3.5 h-3.5" />
                <span>{cameraFacing === 'environment' ? 'กล้องหลัง' : 'กล้องหน้า'}</span>
              </button>
            )}
          </div>

          <span className="text-slate-400 text-[11px] hidden sm:inline">
            รองรับบาร์โค้ดหนังสือ ISBN และบัตรสมาชิก
          </span>
        </div>

        {/* MANUAL ISBN / BARCODE BACKUP INPUT (ช่องพิมพ์รหัสสำรอง) */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Barcode className="w-4 h-4 text-slate-500" />
              <span>หรือพิมพ์รหัส ISBN / รหัสสมาชิกด้วยตนเอง:</span>
            </label>
            {lastScannedCode && (
              <span className="text-[10px] font-mono text-slate-500">
                สแกนล่าสุด: {lastScannedCode}
              </span>
            )}
          </div>

          <form onSubmit={handleSubmitManual} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="พิมพ์เลข ISBN, บาร์โค้ด หรือรหัสสมาชิก (LIB-...) แล้วกด Enter..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800 font-mono tracking-wide"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-sm transition-colors whitespace-nowrap"
            >
              ค้นหา / ตรวจสอบ
            </button>
          </form>

          {/* Quick-Pick Test Barcodes */}
          <div className="space-y-1 pt-1">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>คลิกเพื่อทดสอบสแกนหนังสือหรือบัตรสมาชิกทันที:</span>
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
              {books.slice(0, 4).map((book) => (
                <button
                  type="button"
                  key={book.id}
                  onClick={() => {
                    setBarcodeInput(book.isbn);
                    handleProcessBarcode(book.isbn);
                  }}
                  className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 font-mono truncate max-w-[170px]"
                  title={book.title}
                >
                  {book.title.split(':')[0]} ({book.isbn.slice(-5)})
                </button>
              ))}

              {members.slice(0, 2).map((member) => (
                <button
                  type="button"
                  key={member.id}
                  onClick={() => {
                    setBarcodeInput(member.memberCode);
                    handleProcessBarcode(member.memberCode);
                  }}
                  className="text-[10px] px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded border border-emerald-200 font-mono truncate max-w-[170px]"
                  title={`บัตรสมาชิก: ${member.name}`}
                >
                  บัตร {member.name.split(' ')[0]} ({member.memberCode})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SCAN RESULT CARD */}
        {scanResult && (
          <div className="pt-2 border-t border-slate-100">
            {scanResult.notFound ? (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <p className="font-semibold">
                    ไม่พบข้อมูลตามรหัส "{scanResult.rawCode}"
                  </p>
                  <p className="text-slate-600 mt-0.5">
                    ตรวจสอบเลข ISBN หรือรหัสสมาชิกอีกครั้ง
                  </p>
                </div>
              </div>
            ) : scanResult.member ? (
              /* MEMBER CARD RESULT */
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-3">
                <div className="flex items-start justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200 text-[10px] font-bold">
                        {scanResult.member.memberCode}
                      </span>
                      <span className="text-slate-600">{scanResult.member.type}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mt-1">
                      {scanResult.member.name}
                    </h4>
                    <p className="text-slate-600">{scanResult.member.department}</p>
                    <p className="text-slate-500 font-mono mt-0.5">โทร: {scanResult.member.phone}</p>
                  </div>

                  <span className="p-2 bg-emerald-100 text-emerald-800 rounded-full shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </span>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => {
                      stopCamera();
                      if (onSelectMemberForBorrow) {
                        onSelectMemberForBorrow(scanResult.member!);
                      }
                      onClose();
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md shadow-sm transition-colors"
                  >
                    <span>เลือกสมาชิกนี้เพื่อทำรายการยืมหนังสือ</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : scanResult.book ? (
              /* BOOK RESULT */
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-14 h-20 shrink-0 rounded overflow-hidden bg-slate-200 border border-slate-300">
                    <BookCoverImage
                      src={scanResult.book.coverImage}
                      title={scanResult.book.title}
                      category={scanResult.book.category}
                    />
                  </div>

                  <div className="space-y-1 flex-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                        ISBN: {scanResult.book.isbn}
                      </span>
                      <span className="text-slate-500">ชั้น: {scanResult.book.shelf}</span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm leading-snug">
                      {scanResult.book.title}
                    </h4>
                    <p className="text-slate-600">{scanResult.book.author}</p>

                    <div className="pt-1 flex items-center gap-3 font-mono tabular-nums">
                      <span>
                        คงเหลือ: <strong>{scanResult.book.availableCopies}</strong>/
                        {scanResult.book.totalCopies} เล่ม
                      </span>
                      {scanResult.book.availableCopies > 0 ? (
                        <span className="text-emerald-700 font-sans font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> ว่างพร้อมให้ยืม
                        </span>
                      ) : (
                        <span className="text-rose-600 font-sans font-medium flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> ถูกยืมครบแล้ว
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* If book has an active loan */}
                {scanResult.activeLoan && (
                  <div className="p-2.5 bg-amber-50 rounded border border-amber-200 text-xs text-amber-900 space-y-1">
                    <p className="font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                      <span>มีรายการค้างยืม: {scanResult.activeLoan.memberName}</span>
                    </p>
                    <p className="text-slate-600 text-[11px]">
                      กำหนดคืน: {formatDateThai(scanResult.activeLoan.dueDate)} · โทร:{' '}
                      {scanResult.activeLoan.memberPhone}
                    </p>
                  </div>
                )}

                {/* Direct Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  {scanResult.activeLoan && (
                    <button
                      onClick={() => {
                        stopCamera();
                        onSelectForReturn(scanResult.activeLoan!);
                        onClose();
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-md shadow-sm transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>ทำรายการรับคืนเล่มนี้</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      stopCamera();
                      onSelectForBorrow(scanResult.book!);
                      onClose();
                    }}
                    disabled={scanResult.book.availableCopies <= 0}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-md shadow-sm transition-colors ${
                      scanResult.book.availableCopies > 0
                        ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <span>ทำรายการยืมเล่มนี้</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
