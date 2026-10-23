import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Member } from '../types/library';
import {
  X,
  Printer,
  Download,
  Copy,
  Check,
  QrCode,
  Barcode,
  Library,
  ShieldCheck,
  User,
  Phone,
  Building
} from 'lucide-react';

interface MemberCardModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MemberCardModal: React.FC<MemberCardModalProps> = ({
  member,
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (member && isOpen) {
      // Generate crisp QR code for member ID / Code
      QRCode.toDataURL(
        `MEMBER:${member.memberCode}|NAME:${member.name}|PHONE:${member.phone}`,
        {
          width: 256,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          }
        }
      )
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate QR code:', err));
    }
  }, [member, isOpen]);

  if (!isOpen || !member) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(member.memberCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Pseudo-Barcode stripes generator for Code 128 / Code 39 look
  const renderBarcodeBars = (code: string) => {
    return (
      <div className="flex items-stretch justify-center h-10 w-full gap-[2px] bg-white p-1 rounded">
        {code.split('').map((char, index) => {
          const charCode = char.charCodeAt(0);
          const widthClass = charCode % 3 === 0 ? 'w-1 bg-slate-900' : charCode % 2 === 0 ? 'w-[2px] bg-slate-900' : 'w-0.5 bg-slate-900';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 sm:p-6 space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-bold text-slate-900">
              บัตรสมาชิกห้องสมุดดิจิทัล (Digital Member Pass)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PRINTABLE CARD CONTAINER */}
        <div
          ref={cardRef}
          id="printable-member-card"
          className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-xl p-5 shadow-lg border border-slate-700/80 overflow-hidden select-none"
        >
          {/* Background decorative watermark */}
          <div className="absolute right-[-20px] bottom-[-20px] w-48 h-48 opacity-5 pointer-events-none">
            <Library className="w-full h-full text-white" />
          </div>

          {/* Card Top: Header & Library Branding */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/20 rounded border border-emerald-400/30 text-emerald-300">
                <Library className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold tracking-wider uppercase text-slate-200">
                  ระบบห้องสมุดกลาง · LIBRARY HUB
                </h3>
                <p className="text-[10px] text-emerald-400 font-mono">
                  OFFICIAL MEMBER CARD
                </p>
              </div>
            </div>

            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10 font-medium">
              {member.type}
            </span>
          </div>

          {/* Card Body: Member Info + QR Code */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 py-4 items-center">
            {/* Info (8 cols) */}
            <div className="sm:col-span-8 space-y-2.5">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                  ชื่อสมาชิก / Full Name
                </p>
                <h4 className="text-base font-bold text-white tracking-wide">
                  {member.name}
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                    รหัสประจำตัว
                  </p>
                  <p className="font-mono text-emerald-400 font-bold text-sm tracking-wider">
                    {member.memberCode}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                    เบอร์โทรศัพท์
                  </p>
                  <p className="font-mono text-slate-200">{member.phone}</p>
                </div>
              </div>

              {member.department && (
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                    สังกัด / หน่วยงาน
                  </p>
                  <p className="text-xs text-slate-300 truncate">{member.department}</p>
                </div>
              )}
            </div>

            {/* QR Code (4 cols) */}
            <div className="sm:col-span-4 flex flex-col items-center justify-center p-2 bg-white rounded-lg shadow-inner">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code for ${member.memberCode}`}
                  className="w-24 h-24 object-contain"
                />
              ) : (
                <div className="w-24 h-24 bg-slate-100 flex items-center justify-center text-slate-400">
                  <QrCode className="w-8 h-8 animate-pulse" />
                </div>
              )}
              <span className="text-[9px] font-mono text-slate-600 font-semibold mt-1">
                SCAN TO BORROW
              </span>
            </div>
          </div>

          {/* Barcode Strip */}
          <div className="border-t border-white/10 pt-3 flex flex-col items-center space-y-1">
            {renderBarcodeBars(member.memberCode)}
            <p className="font-mono text-xs text-slate-300 tracking-[0.25em] font-semibold">
              *{member.memberCode}*
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopyCode}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">คัดลอกรหัสแล้ว</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>คัดลอกรหัสสมาชิก</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-sm transition-colors whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์บัตรสมาชิก (Print)</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 text-center"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
