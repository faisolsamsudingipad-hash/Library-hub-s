import React from 'react';
import { ActiveTab } from '../types/library';
import {
  Plus,
  ScanLine,
  LayoutDashboard,
  Lock,
  LogOut,
  ShieldCheck,
  UserCheck,
  BookOpen
} from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  activeLoansCount: number;
  overdueLoansCount: number;
  isAdmin: boolean;
  onOpenAdminLogin: () => void;
  onLogoutAdmin: () => void;
  onOpenAddBook: () => void;
  onOpenBarcodeScanner: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeLoansCount,
  overdueLoansCount,
  isAdmin,
  onOpenAdminLogin,
  onLogoutAdmin,
  onOpenAddBook,
  onOpenBarcodeScanner
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zone 1: Brand wordmark (single text element) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab(isAdmin ? 'dashboard' : 'catalog')}
              className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap hover:text-emerald-700 transition-colors text-left"
            >
              ระบบห้องสมุด · LibraryHub
            </button>
            {isAdmin && (
              <span className="text-[10px] px-2 py-0.5 rounded font-semibold border bg-emerald-50 text-emerald-800 border-emerald-300">
                โหมดแอดมิน (Admin)
              </span>
            )}
          </div>

          {/* Zone 2: Navigation tabs */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
            {/* TABS FOR GENERAL USERS: ONLY CATALOG AND MY-LOANS */}
            {!isAdmin ? (
              <>
                <button
                  onClick={() => setActiveTab('catalog')}
                  className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'catalog'
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  รายการหนังสือ
                </button>

                <button
                  onClick={() => setActiveTab('my-loans')}
                  className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    activeTab === 'my-loans'
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>ตรวจประวัติ & บัตรสมาชิกของฉัน</span>
                </button>
              </>
            ) : (
              /* TABS FOR ADMIN */
              <>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    activeTab === 'dashboard'
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>แดชบอร์ด</span>
                </button>

                <button
                  onClick={() => setActiveTab('catalog')}
                  className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'catalog'
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  รายการหนังสือ
                </button>

                <button
                  onClick={() => setActiveTab('borrowed-check')}
                  className={`relative px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    activeTab === 'borrowed-check'
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span>เช็คที่ถูกยืม</span>
                  {activeLoansCount > 0 && (
                    <span className="font-mono text-xs tabular-nums text-slate-500 font-medium">
                      ({activeLoansCount})
                    </span>
                  )}
                  {overdueLoansCount > 0 && (
                    <span
                      title={`${overdueLoansCount} เล่มเกินกำหนดส่ง`}
                      className="w-2 h-2 rounded-full bg-rose-500 inline-block"
                    />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('transaction')}
                  className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'transaction'
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  บันทึก ยืม-คืน
                </button>

                <button
                  onClick={() => setActiveTab('members')}
                  className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 ${
                    activeTab === 'members'
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span>จัดการสมาชิก</span>
                </button>

                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'history'
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  ประวัติทำรายการ
                </button>
              </>
            )}
          </nav>

          {/* Zone 3: Actions & Admin Authentication */}
          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && (
              /* Admin Mode: Admin Tools & Logout */
              <>
                <button
                  onClick={onOpenBarcodeScanner}
                  title="เปิดเครื่องสแกนบาร์โค้ดด่วน"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <ScanLine className="w-4 h-4 text-emerald-700" />
                  <span className="hidden sm:inline">สแกน</span>
                </button>

                <button
                  onClick={onOpenAddBook}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">เพิ่มหนังสือ</span>
                </button>

                <button
                  onClick={onLogoutAdmin}
                  title="ออกจากระบบแอดมิน เพื่อกลับสู่มุมมองผู้ใช้ทั่วไป"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>ออกจากระบบ</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile / Tablet Navigation bar */}
        <div className="lg:hidden flex items-center justify-between overflow-x-auto py-2.5 border-t border-slate-100 gap-1.5">
          {!isAdmin ? (
            <div className="flex items-center gap-1.5 w-full">
              <button
                onClick={() => setActiveTab('catalog')}
                className={`flex-1 py-1.5 text-xs text-center rounded whitespace-nowrap ${
                  activeTab === 'catalog'
                    ? 'bg-slate-900 text-white font-medium'
                    : 'text-slate-600 hover:bg-slate-100 bg-slate-50'
                }`}
              >
                รายการหนังสือ
              </button>
              <button
                onClick={() => setActiveTab('my-loans')}
                className={`flex-1 py-1.5 text-xs text-center rounded whitespace-nowrap ${
                  activeTab === 'my-loans'
                    ? 'bg-slate-900 text-white font-medium'
                    : 'text-slate-600 hover:bg-slate-100 bg-slate-50'
                }`}
              >
                ประวัติ & บัตรสมาชิก
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-2 py-1 text-xs rounded whitespace-nowrap shrink-0 ${
                  activeTab === 'dashboard'
                    ? 'bg-slate-900 text-white font-medium'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                แดชบอร์ด
              </button>
              <button
                onClick={() => setActiveTab('catalog')}
                className={`px-2 py-1 text-xs rounded whitespace-nowrap shrink-0 ${
                  activeTab === 'catalog'
                    ? 'bg-slate-900 text-white font-medium'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                หนังสือ
              </button>
              <button
                onClick={() => setActiveTab('borrowed-check')}
                className={`px-2 py-1 text-xs rounded whitespace-nowrap shrink-0 ${
                  activeTab === 'borrowed-check'
                    ? 'bg-slate-900 text-white font-medium'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                ที่ถูกยืม
              </button>
              <button
                onClick={() => setActiveTab('transaction')}
                className={`px-2 py-1 text-xs rounded whitespace-nowrap shrink-0 ${
                  activeTab === 'transaction'
                    ? 'bg-slate-900 text-white font-medium'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                ยืม-คืน
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`px-2 py-1 text-xs rounded whitespace-nowrap shrink-0 ${
                  activeTab === 'members'
                    ? 'bg-slate-900 text-white font-medium'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                สมาชิก
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-2 py-1 text-xs rounded whitespace-nowrap shrink-0 ${
                  activeTab === 'history'
                    ? 'bg-slate-900 text-white font-medium'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                ประวัติ
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
