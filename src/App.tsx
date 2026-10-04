import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { IssueList } from './components/IssueList.tsx';
import { IssueForm } from './components/IssueForm.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { IssueDetailModal } from './components/IssueDetailModal.tsx';
import { Issue, DEFAULT_CATS } from './types.ts';
import { ApiService } from './services/api.ts';
import { LocalStorageService } from './services/storage.ts';
import { AlertTriangle, HardHat, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'dashboard' | 'settings'>('list');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [categoriesText, setCategoriesText] = useState<string>(DEFAULT_CATS);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  
  const [isRemoteConnected, setIsRemoteConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  // Load issues and categories
  const loadData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await ApiService.fetchAll();
      setIssues(res.issues);
      if (res.cats) {
        setCategoriesText(res.cats);
      }
      setIsRemoteConnected(res.isRemote);

      // If an issue is currently open in modal, refresh its state
      if (selectedIssue) {
        const refreshed = res.issues.find(i => i.id === selectedIssue.id);
        if (refreshed) {
          setSelectedIssue(refreshed);
        }
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setIsSyncing(false);
      setInitialLoading(false);
    }
  }, [selectedIssue]);

  useEffect(() => {
    loadData();
  }, []);

  const handleIssueCreated = (newId: string) => {
    loadData();
    // Locate the newly created issue and open details if desired
    const found = LocalStorageService.getIssues().find(i => i.id === newId);
    if (found) {
      setSelectedIssue(found);
    }
  };

  const handleResetDemoData = () => {
    const defaultIssues = LocalStorageService.resetDemoData();
    setIssues(defaultIssues);
    setCategoriesText(DEFAULT_CATS);
    setIsRemoteConnected(false);
    setSelectedIssue(null);
  };

  const openIssuesCount = issues.filter(i => i.status === 'Open').length;
  const dangerIssuesCount = issues.filter(i => i.sev === 'อันตราย' && i.status !== 'Closed').length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      {/* Top Bar Contract compliant Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openIssuesCount={openIssuesCount}
        isRemoteConnected={isRemoteConnected}
        isSyncing={isSyncing}
        onRefresh={loadData}
      />

      {/* Safety / Hazard Banner if there are active critical issues */}
      {dangerIssuesCount > 0 && activeTab !== 'create' && (
        <div className="bg-red-600 text-white px-4 py-2 text-xs flex items-center justify-between no-print shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center gap-2 w-full justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-300 animate-pulse" />
              <span>
                <strong>แจ้งเตือนความปลอดภัยเร่งด่วน:</strong> มีปัญหาในระดับ <strong>"อันตราย"</strong> ที่ยังไม่ปิดงานจำนวน {dangerIssuesCount} รายการ
              </span>
            </div>
            <button
              onClick={() => setActiveTab('list')}
              className="text-white underline font-semibold hover:text-amber-200 text-xs shrink-0"
            >
              ดูรายการอันตราย &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        {initialLoading ? (
          <div className="max-w-md mx-auto py-24 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">กำลังโหลดข้อมูลระบบโรงงาน...</p>
          </div>
        ) : (
          <>
            {activeTab === 'list' && (
              <IssueList
                issues={issues}
                onSelectIssue={setSelectedIssue}
                onOpenCreate={() => setActiveTab('create')}
                onRefresh={loadData}
              />
            )}

            {activeTab === 'create' && (
              <IssueForm
                categoriesText={categoriesText}
                onSuccess={handleIssueCreated}
                onCancel={() => setActiveTab('list')}
              />
            )}

            {activeTab === 'dashboard' && (
              <Dashboard issues={issues} />
            )}

            {activeTab === 'settings' && (
              <SettingsModal
                categoriesText={categoriesText}
                onCategoriesUpdated={newCats => {
                  setCategoriesText(newCats);
                  loadData();
                }}
                onRefreshData={loadData}
                onResetDemo={handleResetDemoData}
              />
            )}
          </>
        )}
      </main>

      {/* Issue Detail & Quick Close Modal */}
      <IssueDetailModal
        issue={selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onUpdated={() => {
          loadData();
        }}
      />
    </div>
  );
}
