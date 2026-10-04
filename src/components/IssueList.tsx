import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  Kanban, 
  Download, 
  Trash2, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Calendar,
  ChevronRight,
  ShieldAlert,
  HardHat,
  Eye,
  Plus
} from 'lucide-react';
import { Issue, DEFAULT_AREAS } from '../types.ts';
import { PinModal } from './PinModal.tsx';
import { ApiService } from '../services/api.ts';

interface IssueListProps {
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
  onOpenCreate: () => void;
  onRefresh: () => void;
}

type ViewMode = 'table' | 'kanban' | 'cards';

export const IssueList: React.FC<IssueListProps> = ({
  issues,
  onSelectIssue,
  onOpenCreate,
  onRefresh,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sevFilter, setSevFilter] = useState<string>('ALL');
  const [areaFilter, setAreaFilter] = useState<string>('ALL');

  // Multi-selection for batch delete
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter issues
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          (issue.id || '').toLowerCase().includes(q) ||
          (issue.detail || '').toLowerCase().includes(q) ||
          (issue.who || '').toLowerCase().includes(q) ||
          (issue.spot || '').toLowerCase().includes(q) ||
          (issue.area || '').toLowerCase().includes(q) ||
          (issue.type || '').toLowerCase().includes(q) ||
          (issue.fixBy || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      // Status
      if (statusFilter !== 'ALL' && issue.status !== statusFilter) {
        return false;
      }

      // Severity
      if (sevFilter !== 'ALL' && issue.sev !== sevFilter) {
        return false;
      }

      // Area
      if (areaFilter !== 'ALL' && issue.area !== areaFilter) {
        return false;
      }

      return true;
    });
  }, [issues, searchQuery, statusFilter, sevFilter, areaFilter]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredIssues.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredIssues.map(i => i.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBatchDeleteSuccess = async (pin: string) => {
    if (selectedIds.length === 0) return;
    setIsDeleting(true);
    try {
      const res = await ApiService.deleteIssues(selectedIds, pin);
      if (res.ok) {
        setSelectedIds([]);
        onRefresh();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Export CSV format
  const exportCSV = () => {
    const headers = [
      'ID',
      'Created',
      'Area',
      'Type',
      'Severity',
      'Spot',
      'Detail',
      'Who',
      'Status',
      'ClosedAt',
      'FixMethod',
      'FixBy',
      'Owner',
      'ReportDate_วันที่แจ้ง',
    ];

    const rows = filteredIssues.map(i => [
      `"${i.id}"`,
      `"${i.created ? new Date(i.created).toLocaleString('th-TH') : ''}"`,
      `"${(i.area || '').replace(/"/g, '""')}"`,
      `"${(i.type || '').replace(/"/g, '""')}"`,
      `"${i.sev || ''}"`,
      `"${(i.spot || '').replace(/"/g, '""')}"`,
      `"${(i.detail || '').replace(/"/g, '""')}"`,
      `"${(i.who || '').replace(/"/g, '""')}"`,
      `"${i.status || ''}"`,
      `"${i.closedAt ? new Date(i.closedAt).toLocaleString('th-TH') : ''}"`,
      `"${(i.fixMethod || '').replace(/"/g, '""')}"`,
      `"${(i.fixBy || '').replace(/"/g, '""')}"`,
      `"${(i.owner || '').replace(/"/g, '""')}"`,
      `"${i.due || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `factory_issues_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Quick inline status change handler
  const handleQuickStatusChange = async (e: React.MouseEvent, id: string, newStatus: string) => {
    e.stopPropagation();
    await ApiService.updateIssue(id, {
      status: newStatus,
      closedAt: newStatus === 'Closed' ? Date.now() : 0,
    });
    onRefresh();
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-4">
      {/* Top Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ค้นหาตามรหัส, อาการปัญหา, ผู้แจ้ง, จุดติดตั้ง..."
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-slate-900 bg-slate-50/50"
            />
          </div>

          {/* View Mode & Actions */}
          <div className="flex items-center gap-2">
            {/* View Mode Toggle Buttons */}
            <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="ตารางข้อมูล (Table)"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="คัมบังบอร์ด (Kanban)"
              >
                <Kanban className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="การ์ดภาพรวม (Cards)"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Export CSV */}
            <button
              type="button"
              onClick={exportCSV}
              title="ส่งออกข้อมูลปัญหาเป็นไฟล์ CSV (เปิดใน Excel ได้ภาษาไทยไม่เพี้ยน)"
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-amber-600" />
              <span>ส่งออก CSV (Excel)</span>
            </button>

            {/* Batch Delete (if selected) */}
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ลบ ({selectedIds.length})</span>
              </button>
            )}

            {/* Primary Action */}
            <button
              type="button"
              onClick={onOpenCreate}
              className="px-3.5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>แจ้งปัญหาใหม่</span>
            </button>
          </div>
        </div>

        {/* Filter Segmented Controls */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          {/* Status Tabs */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-[11px] mr-1">สถานะ:</span>
            {['ALL', 'Open', 'Progress', 'Closed'].map(st => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL' ? 'ทั้งหมด' : st}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Severity Tabs */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-[11px] mr-1">ความเร่งด่วน:</span>
            {['ALL', 'ปกติ', 'ด่วน', 'อันตราย'].map(sv => (
              <button
                key={sv}
                type="button"
                onClick={() => setSevFilter(sv)}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  sevFilter === sv
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sv === 'ALL' ? 'ทุกระดับ' : sv}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Area Filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-[11px] mr-1">พื้นที่:</span>
            <select
              value={areaFilter}
              onChange={e => setAreaFilter(e.target.value)}
              className="text-xs py-1 px-2 border border-slate-200 rounded-md bg-white text-slate-700 outline-none"
            >
              <option value="ALL">ทุกพื้นที่</option>
              {DEFAULT_AREAS.map(a => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Count Pill */}
          <div className="ml-auto text-slate-400 text-xs font-mono tabular-nums">
            แสดง {filteredIssues.length} จาก {issues.length} รายการ
          </div>
        </div>
      </div>

      {/* Main Content Area: Views */}
      {filteredIssues.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
          <HardHat className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800 mb-1">ไม่พบรายการปัญหาตามเงื่อนไขที่เลือก</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            ลองปรับเปลี่ยนคำค้นหา หรือระดับตัวกรอง หรือคลิกแจ้งปัญหาใหม่
          </p>
          <button
            type="button"
            onClick={onOpenCreate}
            className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            แจ้งปัญหาใหม่ตอนนี้
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-900 text-white uppercase text-[11px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length > 0 && selectedIds.length === filteredIssues.length}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-400 text-amber-500 focus:ring-0"
                    />
                  </th>
                  <th className="py-3 px-3 w-24">รหัส</th>
                  <th className="py-3 px-3 w-28">ความเร่งด่วน</th>
                  <th className="py-3 px-4">พื้นที่ / จุดที่พบ</th>
                  <th className="py-3 px-4">ประเภท & รายละเอียดปัญหา</th>
                  <th className="py-3 px-3 w-28">ผู้แจ้ง</th>
                  <th className="py-3 px-3 w-28">สถานะ</th>
                  <th className="py-3 px-3 w-28">วันที่แจ้ง</th>
                  <th className="py-3 px-3 w-20 text-center">ดูงาน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIssues.map(issue => {
                  const isSelected = selectedIds.includes(issue.id);
                  const isOverdue =
                    issue.due &&
                    issue.status !== 'Closed' &&
                    new Date(issue.due).getTime() < new Date().setHours(0, 0, 0, 0);

                  return (
                    <tr
                      key={issue.id}
                      onClick={() => onSelectIssue(issue)}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                        isSelected ? 'bg-amber-50/50' : ''
                      }`}
                    >
                      <td
                        className="py-3 px-3 text-center"
                        onClick={e => {
                          e.stopPropagation();
                          toggleSelectOne(issue.id);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded border-slate-300 text-amber-500 focus:ring-0"
                        />
                      </td>

                      <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                        #{issue.id}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                            issue.sev === 'อันตราย'
                              ? 'bg-red-100 text-red-800'
                              : issue.sev === 'ด่วน'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {issue.sev === 'อันตราย' ? '🔴 อันตราย' : issue.sev === 'ด่วน' ? '🟡 ด่วน' : '🟢 ปกติ'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 truncate max-w-[180px]">
                          {issue.area}
                        </div>
                        {issue.spot && (
                          <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                            {issue.spot}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-[11px] text-slate-400 font-medium truncate">
                          {issue.type.split(':')[0]}
                        </div>
                        <div className="text-slate-800 line-clamp-1">
                          {issue.detail}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-600 truncate max-w-[120px]">
                        {issue.who}
                      </td>

                      <td className="py-3 px-3" onClick={e => e.stopPropagation()}>
                        <select
                          value={issue.status}
                          onChange={e => handleQuickStatusChange(e as any, issue.id, e.target.value)}
                          className={`text-[11px] font-medium py-1 px-2 rounded-md border outline-none ${
                            issue.status === 'Closed'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : issue.status === 'Progress'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          <option value="Open">Open</option>
                          <option value="Progress">Progress</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </td>

                      <td className="py-3 px-3 font-mono tabular-nums text-[11px] text-slate-600">
                        {issue.due || '-'}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onSelectIssue(issue)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === 'kanban' ? (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['Open', 'Progress', 'Closed'] as const).map(columnStatus => {
            const colIssues = filteredIssues.filter(i => i.status === columnStatus);
            return (
              <div
                key={columnStatus}
                className="bg-slate-100/70 border border-slate-200 rounded-xl p-3 flex flex-col min-h-[500px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        columnStatus === 'Open'
                          ? 'bg-amber-500'
                          : columnStatus === 'Progress'
                          ? 'bg-blue-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                    <h3 className="font-semibold text-xs text-slate-800">
                      {columnStatus === 'Open' ? 'รอรับงาน (Open)' : columnStatus === 'Progress' ? 'กำลังแก้ไข (Progress)' : 'ปิดงานแล้ว (Closed)'}
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-white text-slate-700 rounded border border-slate-200 tabular-nums">
                    {colIssues.length}
                  </span>
                </div>

                {/* Cards in column */}
                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {colIssues.length === 0 ? (
                    <div className="h-28 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-xs text-slate-400">
                      ไม่มีรายการ
                    </div>
                  ) : (
                    colIssues.map(issue => (
                      <div
                        key={issue.id}
                        onClick={() => onSelectIssue(issue)}
                        className="bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-3 shadow-2xs hover:shadow-xs cursor-pointer transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-bold text-slate-800">
                            #{issue.id}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              issue.sev === 'อันตราย'
                                ? 'bg-red-100 text-red-800'
                                : issue.sev === 'ด่วน'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {issue.sev}
                          </span>
                        </div>

                        <p className="text-xs font-medium text-slate-900 line-clamp-2">
                          {issue.detail}
                        </p>

                        <div className="text-[11px] text-slate-500 space-y-0.5">
                          <div className="truncate">📍 {issue.area}</div>
                          {issue.spot && <div className="truncate text-slate-400">🔧 {issue.spot}</div>}
                        </div>

                        {issue.photo && (
                          <div className="h-24 bg-slate-900 rounded overflow-hidden">
                            <img
                              src={issue.photo}
                              alt="ภาพปัญหา"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                          <span>👤 {issue.who}</span>
                          {issue.due && (
                            <span className="font-mono text-[10px] text-slate-400">
                              📅 {issue.due}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* CARDS VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIssues.map(issue => (
            <div
              key={issue.id}
              onClick={() => onSelectIssue(issue)}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl overflow-hidden shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col"
            >
              {issue.photo ? (
                <div className="h-36 bg-slate-900 relative">
                  <img
                    src={issue.photo}
                    alt="รูปปัญหา"
                    className="w-full h-full object-cover"
                  />
                  <span
                    className={`absolute top-2.5 right-2.5 text-[10px] font-semibold px-2 py-0.5 rounded shadow-sm ${
                      issue.sev === 'อันตราย'
                        ? 'bg-red-600 text-white'
                        : issue.sev === 'ด่วน'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {issue.sev}
                  </span>
                </div>
              ) : (
                <div className="p-4 pb-0 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-700">
                    #{issue.id}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      issue.sev === 'อันตราย'
                        ? 'bg-red-100 text-red-800'
                        : issue.sev === 'ด่วน'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {issue.sev}
                  </span>
                </div>
              )}

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="text-[11px] text-slate-500 font-medium truncate">
                    {issue.area} {issue.spot ? `· ${issue.spot}` : ''}
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug">
                    {issue.detail}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {issue.type}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">
                    {issue.who}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                      issue.status === 'Closed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : issue.status === 'Progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {issue.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Batch Delete Confirmation PIN Modal */}
      <PinModal
        isOpen={isDeleteModalOpen}
        title="ยืนยันการลบรายการปัญหาที่เลือก"
        description={`คุณกำลังจะลบ ${selectedIds.length} รายการออกจากระบบอย่างถาวร กรุณากรอก Admin PIN เพื่อยืนยัน`}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={pin => {
          handleBatchDeleteSuccess(pin);
        }}
      />
    </div>
  );
};
