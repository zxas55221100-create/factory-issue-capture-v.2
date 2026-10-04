import React from 'react';
import { 
  ClipboardList, 
  PlusCircle, 
  BarChart3, 
  Settings, 
  CheckCircle2, 
  HardHat, 
  Wifi, 
  WifiOff,
  RefreshCw
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'list' | 'create' | 'dashboard' | 'settings';
  setActiveTab: (tab: 'list' | 'create' | 'dashboard' | 'settings') => void;
  openIssuesCount: number;
  isRemoteConnected: boolean;
  isSyncing: boolean;
  onRefresh: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openIssuesCount,
  isRemoteConnected,
  isSyncing,
  onRefresh,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Brand title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('list')}
              className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg p-1"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold shadow-sm">
                <HardHat className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-bold tracking-tight text-white block">
                  Factory Issue Capture
                </span>
                <span className="text-[11px] text-slate-400 block -mt-1 hidden sm:block">
                  ระบบแจ้งและติดตามปัญหาในโรงงาน
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'list'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span className="hidden md:inline">รายการปัญหา</span>
              {openIssuesCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-amber-500/20 text-amber-300 text-xs rounded font-mono tabular-nums">
                  {openIssuesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'create'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>แจ้งปัญหาใหม่</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden md:inline">แดชบอร์ดสรุปผล</span>
              <span className="md:hidden">แดชบอร์ด</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'settings'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title="ตั้งค่าระบบ & เชื่อมต่อ Google Sheets"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden lg:inline">ตั้งค่า & Google Sheet</span>
            </button>
          </nav>

          {/* Zone 3: Actions & Status */}
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={isSyncing}
              title="รีเฟรชข้อมูล"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-colors text-slate-300"
              title={isRemoteConnected ? 'เชื่อมต่อ Google Sheets Web App แล้ว' : 'ทำงานในโหมด Offline / Local Cache (คลิกเพื่อเชื่อมต่อ)'}
            >
              {isRemoteConnected ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline text-emerald-300">Google Sheet ซิงค์</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline text-slate-400">โหมดออฟไลน์</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
