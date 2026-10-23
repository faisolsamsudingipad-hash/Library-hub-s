import React, { useState, useEffect, useRef } from 'react';
import { Book } from '../types/library';
import { BookCoverImage } from './BookCoverImage';
import { processAndCompressImage } from '../utils/imageUtils';
import {
  X,
  BookPlus,
  Save,
  Upload,
  Image as ImageIcon,
  FolderOpen,
  Camera,
  Trash2,
  Link,
  Sparkles,
  Loader2
} from 'lucide-react';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBook: (bookData: Omit<Book, 'id'>, existingId?: string) => void;
  initialBook?: Book | null;
}

const CATEGORY_OPTIONS = [
  'เทคโนโลยี & คอมพิวเตอร์',
  'วรรณกรรม & นวนิยาย',
  'วิทยาศาสตร์ & ฟิสิกส์',
  'บริหารธุรกิจ & การจัดการ',
  'การออกแบบ & สื่อดิจิทัล',
  'จิตวิทยา & พัฒนาตนเอง',
  'ประวัติศาสตร์ & สังคม',
  'สถาปัตยกรรม & สิ่งแวดล้อม',
  'การศึกษา & การเรียนรู้',
  'ทั่วไป'
];

// Curated high quality presets for quick testing
const COVER_PRESETS = [
  {
    name: 'Tech & AI',
    url: '/src/assets/images/book_cover_ai_tech_1792736092775.jpg'
  },
  {
    name: 'Literature',
    url: '/src/assets/images/book_cover_literature_1792736094219.jpg'
  },
  {
    name: 'Cosmos Science',
    url: '/src/assets/images/book_cover_science_1792736094146.jpg'
  },
  {
    name: 'Leadership & Business',
    url: '/src/assets/images/book_cover_business_1792736094622.jpg'
  }
];

export const AddBookModal: React.FC<AddBookModalProps> = ({
  isOpen,
  onClose,
  onSaveBook,
  initialBook
}) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [shelf, setShelf] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [totalCopies, setTotalCopies] = useState<number>(3);
  const [publishedYear, setPublishedYear] = useState<number>(2025);
  const [publisher, setPublisher] = useState('');
  const [description, setDescription] = useState('');

  // Image Upload State
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [coverInputMode, setCoverInputMode] = useState<'upload' | 'url'>('upload');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialBook) {
      setTitle(initialBook.title);
      setAuthor(initialBook.author);
      setIsbn(initialBook.isbn);
      setCategory(initialBook.category);
      setShelf(initialBook.shelf);
      setCoverImage(initialBook.coverImage || '');
      setTotalCopies(initialBook.totalCopies);
      setPublishedYear(initialBook.publishedYear);
      setPublisher(initialBook.publisher);
      setDescription(initialBook.description);
      setUploadedFileName(initialBook.coverImage ? 'ภาพหน้าปกปัจจุบัน' : null);
    } else {
      setTitle('');
      setAuthor('');
      setIsbn('978-616-' + Math.floor(100 + Math.random() * 900) + '-' + Math.floor(1000 + Math.random() * 9000) + '-0');
      setCategory(CATEGORY_OPTIONS[0]);
      setShelf('000.0 ท-พ (ชั้น 1)');
      setCoverImage('');
      setTotalCopies(3);
      setPublishedYear(2025);
      setPublisher('สำนักพิมพ์ทั่วไป');
      setDescription('');
      setUploadedFileName(null);
    }
    setCoverInputMode('upload');
  }, [initialBook, isOpen]);

  if (!isOpen) return null;

  // Handle file selection from local device / gallery
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    await processSelectedFile(file);
  };

  const processSelectedFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WebP ฯลฯ)');
      return;
    }

    try {
      setIsProcessingImage(true);
      const optimizedDataUrl = await processAndCompressImage(file);
      setCoverImage(optimizedDataUrl);
      setUploadedFileName(file.name);
    } catch (err) {
      console.error('Error processing image:', err);
      alert('ไม่สามารถประมวลผลรูปภาพได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsProcessingImage(false);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processSelectedFile(files[0]);
    }
  };

  const handleRemoveImage = () => {
    setCoverImage('');
    setUploadedFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim() || !isbn.trim()) return;

    // Available copies calculation:
    // If editing, preserve the difference between totalCopies and currently borrowed copies
    const currentlyBorrowed = initialBook
      ? initialBook.totalCopies - initialBook.availableCopies
      : 0;
    const newAvailable = Math.max(0, totalCopies - currentlyBorrowed);

    onSaveBook(
      {
        title: title.trim(),
        author: author.trim(),
        isbn: isbn.trim(),
        category,
        shelf: shelf.trim() || 'ชั้นทั่วไป',
        coverImage: coverImage.trim(),
        totalCopies,
        availableCopies: newAvailable,
        publishedYear: Number(publishedYear) || 2025,
        publisher: publisher.trim() || 'สำนักพิมพ์ทั่วไป',
        description: description.trim()
      },
      initialBook?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-2xl w-full p-5 sm:p-6 space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <BookPlus className="w-5 h-5 text-emerald-700" />
            <h2 className="text-lg font-bold text-slate-900">
              {initialBook ? 'แก้ไขข้อมูลหนังสือ' : 'เพิ่มหนังสือใหม่เข้าคลัง'}
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
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              ชื่อหนังสือ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ระบุชื่อหนังสือภาษาไทย หรืออังกฤษ..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                ผู้แต่ง / ผู้เขียน <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="ชื่อผู้แต่ง"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                เลข ISBN / บาร์โค้ด <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="978-616-..."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800 font-mono"
              />
            </div>
          </div>

          {/* IMAGE UPLOAD SECTION (อัปโหลดรูปภาพปกหนังสือจากเครื่อง / แกลเลอรี) */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-700" />
                <span>รูปภาพปกหนังสือ (Book Cover Image)</span>
              </label>

              {/* Toggle upload vs URL mode */}
              <div className="flex items-center gap-1 p-0.5 bg-slate-200/80 rounded text-[11px]">
                <button
                  type="button"
                  onClick={() => setCoverInputMode('upload')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    coverInputMode === 'upload'
                      ? 'bg-white text-slate-900 font-medium shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  เลือกไฟล์จากเครื่อง
                </button>
                <button
                  type="button"
                  onClick={() => setCoverInputMode('url')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    coverInputMode === 'url'
                      ? 'bg-white text-slate-900 font-medium shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  หรือใส่ URL / ภาพระบบ
                </button>
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {/* Left: Upload Dropzone or URL Input */}
              <div className="flex-1 w-full space-y-2">
                {coverInputMode === 'upload' ? (
                  /* Interactive Upload Dropzone */
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all ${
                      isDragOver
                        ? 'border-emerald-500 bg-emerald-50/60'
                        : 'border-slate-300 hover:border-emerald-600 hover:bg-slate-100/60'
                    }`}
                  >
                    {isProcessingImage ? (
                      <div className="py-2 flex flex-col items-center justify-center text-slate-600 space-y-2">
                        <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                        <span className="text-xs">กำลังประมวลผลและปรับขนาดรูปภาพ...</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2 text-slate-500">
                          <FolderOpen className="w-6 h-6 text-emerald-700" />
                          <Camera className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">
                            คลิกเพื่อเลือกรูปภาพจากเครื่อง / แกลเลอรี หรือถ่ายภาพ
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            รองรับไฟล์ JPG, PNG, WebP (หรือลากไฟล์มาวางในช่องนี้)
                          </p>
                        </div>

                        {uploadedFileName && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-medium">
                            <span className="truncate max-w-[200px]">{uploadedFileName}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* URL Input Alternative */
                  <div className="space-y-2">
                    <div className="relative">
                      <Link className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="url"
                        value={coverImage}
                        onChange={(e) => {
                          setCoverImage(e.target.value);
                          setUploadedFileName('ลิงก์ URL');
                        }}
                        placeholder="https://... หรือเลือกภาพตัวอย่างด้านล่าง"
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800"
                      />
                    </div>

                    {/* Presets */}
                    <div className="space-y-1">
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>ภาพปกสำเร็จรูปจากระบบ:</span>
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {COVER_PRESETS.map((preset) => (
                          <button
                            type="button"
                            key={preset.name}
                            onClick={() => {
                              setCoverImage(preset.url);
                              setUploadedFileName(preset.name);
                            }}
                            className={`text-[11px] px-2.5 py-1 rounded transition-colors border ${
                              coverImage === preset.url
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-medium'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload action buttons */}
                {coverImage && (
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-emerald-700 hover:text-emerald-800 font-medium inline-flex items-center gap-1"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>เลือกเปลี่ยนรูปใหม่</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-rose-600 hover:text-rose-700 inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ลบรูปภาพ</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Right: Real-time Live Preview Thumbnail */}
              <div className="flex flex-col items-center shrink-0">
                <div className="w-24 h-32 sm:w-28 sm:h-38 rounded-md overflow-hidden bg-slate-200 border border-slate-300 shadow-sm relative">
                  <BookCoverImage
                    src={coverImage}
                    title={title || 'ตัวอย่างชื่อหนังสือ'}
                    author={author || 'ผู้แต่ง'}
                    category={category}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 py-0.5 bg-black/70 text-[9px] text-center text-white backdrop-blur-xs">
                    ตัวอย่างรูปปก
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                หมวดหมู่
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                ตำแหน่งชั้นวาง / Call Number
              </label>
              <input
                type="text"
                value={shelf}
                onChange={(e) => setShelf(e.target.value)}
                placeholder="เช่น 004.2 เจ-ด (ชั้น 2)"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                จำนวนสำเนาทั้งหมด
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={totalCopies}
                onChange={(e) => setTotalCopies(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800 font-mono tabular-nums"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                ปีที่พิมพ์ (ค.ศ.)
              </label>
              <input
                type="number"
                min="1900"
                max="2030"
                value={publishedYear}
                onChange={(e) => setPublishedYear(parseInt(e.target.value, 10) || 2025)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800 font-mono tabular-nums"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                สำนักพิมพ์
              </label>
              <input
                type="text"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                placeholder="ชื่อสำนักพิมพ์"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              เรื่องย่อ / คำอธิบายหนังสือ
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุคำอธิบายสังเขปของหนังสือ..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-md shadow-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{initialBook ? 'บันทึกการแก้ไข' : 'บันทึกหนังสือใหม่'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
