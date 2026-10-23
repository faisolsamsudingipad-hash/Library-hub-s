import React, { useState, useMemo } from 'react';
import { Member, LoanRecord, Book } from '../types/library';
import { MemberCardModal } from './MemberCardModal';
import { MemberHistoryModal } from './MemberHistoryModal';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  Building,
  Edit2,
  Trash2,
  BookOpen,
  Copy,
  Check,
  QrCode,
  History,
  ArrowRight
} from 'lucide-react';

interface MemberManagementViewProps {
  members: Member[];
  loans: LoanRecord[];
  books: Book[];
  onOpenAddMember: () => void;
  onOpenEditMember: (member: Member) => void;
  onDeleteMember: (memberId: string) => void;
  onBorrowForMember: (member: Member) => void;
  onQuickReturn: (loan: LoanRecord) => void;
}

export const MemberManagementView: React.FC<MemberManagementViewProps> = ({
  members,
  loans,
  books,
  onOpenAddMember,
  onOpenEditMember,
  onDeleteMember,
  onBorrowForMember,
  onQuickReturn
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals for Member Card and Borrowing History
  const [selectedMemberForCard, setSelectedMemberForCard] = useState<Member | null>(null);
  const [selectedMemberForHistory, setSelectedMemberForHistory] = useState<Member | null>(null);

  // Active unreturned loans
  const activeLoans = useMemo(() => {
    return loans.filter((l) => l.status === 'active' || l.status === 'overdue');
  }, [loans]);

  // Member statistics
  const stats = useMemo(() => {
    const total = members.length;
    const students = members.filter((m) => m.type === 'นักศึกษา').length;
    const staff = members.filter((m) => m.type === 'อาจารย์/บุคลากร').length;
    const publicMembers = members.filter((m) => m.type === 'บุคคลทั่วไป').length;

    // Count members with active loans
    const borrowingMemberIds = new Set(activeLoans.map((l) => l.memberId));
    const activeBorrowersCount = borrowingMemberIds.size;

    return { total, students, staff, publicMembers, activeBorrowersCount };
  }, [members, activeLoans]);

  // Filtered members
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.memberCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.phone.includes(searchQuery) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (member.department && member.department.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (selectedType !== 'all' && member.type !== selectedType) {
        return false;
      }

      return true;
    });
  }, [members, searchQuery, selectedType]);

  const handleCopyPhone = (phone: string, id: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            ระบบจัดการสมาชิกและออกบัตร (Member & Card Hub)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ลงทะเบียน ออกบัตรสมาชิกพร้อม QR/Barcode ตรวจสอบประวัติการยืมรายบุคคล และแก้ไขข้อมูล
          </p>
        </div>

        <button
          onClick={onOpenAddMember}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ เพิ่มสมาชิกใหม่</span>
        </button>
      </div>

      {/* Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            สมาชิกทั้งหมด
          </p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {stats.total}{' '}
            <span className="text-xs font-normal text-slate-500 font-sans">คน</span>
          </p>
        </div>

        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            นักศึกษา
          </p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-700 mt-1">
            {stats.students}{' '}
            <span className="text-xs font-normal text-slate-500 font-sans">คน</span>
          </p>
        </div>

        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            อาจารย์ / บุคลากร
          </p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-700 mt-1">
            {stats.staff}{' '}
            <span className="text-xs font-normal text-slate-500 font-sans">คน</span>
          </p>
        </div>

        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-amber-700 uppercase tracking-wider">
            กำลังยืมหนังสืออยู่
          </p>
          <p className="text-2xl font-bold font-mono tabular-nums text-amber-700 mt-1">
            {stats.activeBorrowersCount}{' '}
            <span className="text-xs font-normal text-slate-500 font-sans">คน</span>
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อสมาชิก, รหัสสมาชิก, เบอร์โทรศัพท์ หรือสังกัด..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Member Type Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md self-start md:self-auto shrink-0">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              selectedType === 'all'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ทั้งหมด ({members.length})
          </button>
          <button
            onClick={() => setSelectedType('นักศึกษา')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              selectedType === 'นักศึกษา'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            นักศึกษา ({stats.students})
          </button>
          <button
            onClick={() => setSelectedType('อาจารย์/บุคลากร')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              selectedType === 'อาจารย์/บุคลากร'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            อาจารย์ ({stats.staff})
          </button>
          <button
            onClick={() => setSelectedType('บุคคลทั่วไป')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              selectedType === 'บุคคลทั่วไป'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ทั่วไป ({stats.publicMembers})
          </button>
        </div>
      </div>

      {/* Member Cards Grid */}
      {filteredMembers.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-lg border border-slate-200 shadow-sm">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">ไม่พบข้อมูลสมาชิก</h3>
          <p className="text-xs text-slate-500 mt-1">
            ลองปรับเปลี่ยนคำค้นหา หรือกดปุ่มเพิ่มสมาชิกใหม่
          </p>
          <button
            onClick={onOpenAddMember}
            className="mt-4 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800"
          >
            + ลงทะเบียนสมาชิกใหม่
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => {
            const memberActiveLoans = activeLoans.filter((l) => l.memberId === member.id);
            const hasActiveLoans = memberActiveLoans.length > 0;

            return (
              <div
                key={member.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Bar of Card */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800">
                          {member.memberCode}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {member.type}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        {member.name}
                      </h3>
                    </div>

                    {/* Active Loans Indicator Badge */}
                    {hasActiveLoans ? (
                      <button
                        onClick={() => setSelectedMemberForHistory(member)}
                        className="px-2 py-1 text-[11px] font-medium rounded bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 hover:bg-amber-100 transition-colors"
                        title="ดูหนังสือที่กำลังยืมอยู่และยอดค้าง"
                      >
                        <BookOpen className="w-3 h-3 text-amber-600" />
                        <span>ยืมอยู่ {memberActiveLoans.length} เล่ม</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400">ไม่มียืมค้าง</span>
                    )}
                  </div>

                  {/* Contact Details */}
                  <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono tabular-nums">{member.phone}</span>
                      </div>
                      <button
                        onClick={() => handleCopyPhone(member.phone, member.id)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"
                        title="คัดลอกเบอร์โทร"
                      >
                        {copiedId === member.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {member.email && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </div>
                    )}

                    {member.department && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate text-slate-500">{member.department}</span>
                      </div>
                    )}
                  </div>

                  {/* SPECIAL ACTIONS: CARD & HISTORY BUTTONS */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setSelectedMemberForCard(member)}
                      className="inline-flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition-colors"
                      title="ออกบัตรสมาชิกพร้อม QR Code / Barcode"
                    >
                      <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                      <span>บัตรสมาชิก</span>
                    </button>

                    <button
                      onClick={() => setSelectedMemberForHistory(member)}
                      className="inline-flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition-colors"
                      title="ดูประวัติการยืม-คืน และยอดค่าปรับค้างชำระ"
                    >
                      <History className="w-3.5 h-3.5 text-indigo-600" />
                      <span>ประวัติ & ยอดค้าง</span>
                    </button>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onBorrowForMember(member)}
                    className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors whitespace-nowrap shadow-xs"
                  >
                    <span>ทำรายการยืม</span>
                    <ArrowRight className="w-3 h-3 text-slate-300" />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenEditMember(member)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                      title="แก้ไขข้อมูลสมาชิก"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteMember(member.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                      title="ลบสมาชิก"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Member Card Modal (QR & Barcode) */}
      <MemberCardModal
        member={selectedMemberForCard}
        isOpen={!!selectedMemberForCard}
        onClose={() => setSelectedMemberForCard(null)}
      />

      {/* Member Borrowing History & Statement Modal */}
      <MemberHistoryModal
        member={selectedMemberForHistory}
        loans={loans}
        books={books}
        isOpen={!!selectedMemberForHistory}
        onClose={() => setSelectedMemberForHistory(null)}
        onBorrowForMember={onBorrowForMember}
        onQuickReturn={onQuickReturn}
      />
    </div>
  );
};
