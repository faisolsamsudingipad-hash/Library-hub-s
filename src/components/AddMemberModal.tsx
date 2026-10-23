import React, { useState, useEffect } from 'react';
import { Member } from '../types/library';
import { X, UserPlus, Save, Phone, Mail, Building, User } from 'lucide-react';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMember: (memberData: Omit<Member, 'id'>, existingId?: string) => void;
  initialMember?: Member | null;
}

const MEMBER_TYPES: Member['type'][] = ['นักศึกษา', 'อาจารย์/บุคลากร', 'บุคคลทั่วไป'];

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  onSaveMember,
  initialMember
}) => {
  const [memberCode, setMemberCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<Member['type']>('นักศึกษา');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');

  useEffect(() => {
    if (initialMember) {
      setMemberCode(initialMember.memberCode);
      setName(initialMember.name);
      setType(initialMember.type);
      setPhone(initialMember.phone);
      setEmail(initialMember.email);
      setDepartment(initialMember.department || '');
    } else {
      const randomCode = 'LIB-68-' + String(Math.floor(1000 + Math.random() * 9000));
      setMemberCode(randomCode);
      setName('');
      setType('นักศึกษา');
      setPhone('');
      setEmail('');
      setDepartment('');
    }
  }, [initialMember, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !memberCode.trim()) return;

    onSaveMember(
      {
        memberCode: memberCode.trim(),
        name: name.trim(),
        type,
        phone: phone.trim(),
        email: email.trim(),
        department: department.trim()
      },
      initialMember?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-700" />
            <h2 className="text-lg font-bold text-slate-900">
              {initialMember ? 'แก้ไขข้อมูลสมาชิก' : 'ลงทะเบียนสมาชิกใหม่'}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                รหัสสมาชิก <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={memberCode}
                onChange={(e) => setMemberCode(e.target.value)}
                placeholder="LIB-68-0000"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                ประเภทสมาชิก
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as Member['type'])}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800"
              >
                {MEMBER_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              ชื่อ - นามสกุล <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ระบุชื่อและนามสกุล"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                เบอร์โทรศัพท์ติดต่อ <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="เช่น 081-234-5678"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                อีเมล (Email)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              สังกัด / คณะ / ภาควิชา / หน่วยงาน
            </label>
            <div className="relative">
              <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="เช่น คณะวิศวกรรมศาสตร์ หรือ ประชาชนทั่วไป"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800"
              />
            </div>
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
              <span>{initialMember ? 'บันทึกการแก้ไข' : 'บันทึกสมาชิก'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
