import React, { useMemo } from 'react';
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  HardHat, 
  PieChart, 
  AlertCircle,
  ShieldAlert,
  MapPin,
  Calendar,
  Download
} from 'lucide-react';
import { Issue } from '../types.ts';

interface DashboardProps {
  issues: Issue[];
  onFilterByStatus?: (status: string) => void;
  onFilterBySev?: (sev: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ issues }) => {
  // Exact calculations mirroring Google Sheet formulas in buildDashboard_()
  const stats = useMemo(() => {
    const total = issues.length;
    const openCount = issues.filter(i => i.status === 'Open').length;
    const progressCount = issues.filter(i => i.status === 'Progress').length;
    const closedCount = issues.filter(i => i.status === 'Closed').length;

    // อัตราปิดงาน = Closed / Total
    const closeRate = total > 0 ? (closedCount / total) * 100 : 0;

    // เวลาปิดเฉลี่ย (ชม.) = SUM(closedAt - created) / closedCount (in hours)
    const closedIssuesWithTime = issues.filter(
      i => i.status === 'Closed' && i.closedAt && i.created && i.closedAt > i.created
    );
    let avgResolutionHours = 0;
    if (closedIssuesWithTime.length > 0) {
      const totalHours = closedIssuesWithTime.reduce(
        (sum, item) => sum + (item.closedAt - item.created) / (1000 * 3600),
        0
      );
      avgResolutionHours = totalHours / closedIssuesWithTime.length;
    }

    // Issues by Severity
    const sevNormal = issues.filter(i => i.sev === 'ปกติ').length;
    const sevUrgent = issues.filter(i => i.sev === 'ด่วน').length;
    const sevDanger = issues.filter(i => i.sev === 'อันตราย').length;

    // Issues by Area
    const areaMap: Record<string, number> = {};
    issues.forEach(i => {
      const a = i.area || 'ไม่ระบุ';
      areaMap[a] = (areaMap[a] || 0) + 1;
    });
    const sortedAreas = Object.entries(areaMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    // Issues by Category Type
    const typeMap: Record<string, number> = {};
    issues.forEach(i => {
      const mainType = (i.type || 'อื่น ๆ').split(':')[0].trim();
      typeMap[mainType] = (typeMap[mainType] || 0) + 1;
    });
    const sortedTypes = Object.entries(typeMap).sort((a, b) => b[1] - a[1]);

    // Overdue issues
    const now = new Date().setHours(0, 0, 0, 0);
    const overdueIssues = issues.filter(i => {
      if (i.status === 'Closed' || !i.due) return false;
      const dueTime = new Date(i.due).getTime();
      return dueTime < now;
    });

    return {
      total,
      openCount,
      progressCount,
      closedCount,
      closeRate,
      avgResolutionHours,
      sevNormal,
      sevUrgent,
      sevDanger,
      sortedAreas,
      sortedTypes,
      overdueIssues,
    };
  }, [issues]);

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

    const rows = issues.map(i => [
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
    link.download = `factory_issues_report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-500" />
            Factory Issue Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ภาพรวมสถิติประสิทธิภาพการจัดการความผิดปกติในโรงงาน (สูตรคำนวณเดียวกับ Google Sheet)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-400 font-mono">
            ข้อมูลล่าสุด {new Date().toLocaleDateString('th-TH')}
          </div>
          <button
            type="button"
            onClick={exportCSV}
            className="px-3.5 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-2xs"
            title="ส่งออกรายงานข้อมูลทั้งหมดเป็นไฟล์ CSV (เปิดใน Excel ได้)"
          >
            <Download className="w-3.5 h-3.5 text-amber-600" />
            <span>ส่งออก CSV (Excel)</span>
          </button>
        </div>
      </div>

      {/* Top 6 KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Total */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            ปัญหาทั้งหมด
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {stats.total}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">รายการสะสม</span>
        </div>

        {/* Open */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">
            Open (รอรับงาน)
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-600 mt-1">
            {stats.openCount}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">รอช่างเข้าตรวจสอบ</span>
        </div>

        {/* Progress */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block">
            In Progress
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-blue-600 mt-1">
            {stats.progressCount}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">กำลังดำเนินการแก้ไข</span>
        </div>

        {/* Closed */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
            Closed (เสร็จสิ้น)
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 mt-1">
            {stats.closedCount}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">ปิดงานสมบูรณ์</span>
        </div>

        {/* Close Rate */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            อัตราปิดงาน
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {stats.closeRate.toFixed(1)}%
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(stats.closeRate, 100)}%` }}
            />
          </div>
        </div>

        {/* Average Resolution Time */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            เวลาปิดเฉลี่ย
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {stats.avgResolutionHours < 24
              ? `${stats.avgResolutionHours.toFixed(1)} ชม.`
              : `${(stats.avgResolutionHours / 24).toFixed(1)} วัน`}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            ({stats.avgResolutionHours.toFixed(1)} ชม.)
          </span>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Severity Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              ความเร่งด่วนของปัญหา
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              รวม {stats.total} รายการ
            </span>
          </div>

          <div className="space-y-3">
            {/* Danger */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-red-700 flex items-center gap-1">
                  🔴 อันตราย (Hazardous)
                </span>
                <span className="font-mono tabular-nums font-bold text-slate-900">
                  {stats.sevDanger} ({stats.total > 0 ? ((stats.sevDanger / stats.total) * 100).toFixed(0) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-red-600 h-2 rounded-full"
                  style={{ width: `${stats.total > 0 ? (stats.sevDanger / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Urgent */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-amber-700 flex items-center gap-1">
                  🟡 ด่วน (Urgent)
                </span>
                <span className="font-mono tabular-nums font-bold text-slate-900">
                  {stats.sevUrgent} ({stats.total > 0 ? ((stats.sevUrgent / stats.total) * 100).toFixed(0) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-2 rounded-full"
                  style={{ width: `${stats.total > 0 ? (stats.sevUrgent / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Normal */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  🟢 ปกติ (Normal)
                </span>
                <span className="font-mono tabular-nums font-bold text-slate-900">
                  {stats.sevNormal} ({stats.total > 0 ? ((stats.sevNormal / stats.total) * 100).toFixed(0) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{ width: `${stats.total > 0 ? (stats.sevNormal / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {stats.sevDanger > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong>แจ้งเตือนความปลอดภัย:</strong> มีปัญหาในระดับ "อันตราย" ทั้งหมด {stats.sevDanger} รายการที่ต้องเร่งแก้ไข
              </div>
            </div>
          )}
        </div>

        {/* Issues by Area */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-500" />
              ปัญหาแยกตามพื้นที่ (Top Areas)
            </h3>
            <span className="text-xs text-slate-400 font-mono">ความถี่</span>
          </div>

          <div className="space-y-2.5">
            {stats.sortedAreas.length === 0 ? (
              <p className="text-xs text-slate-400">ยังไม่มีข้อมูลพื้นที่</p>
            ) : (
              stats.sortedAreas.map(([areaName, count]) => {
                const max = stats.sortedAreas[0][1] || 1;
                const pct = (count / max) * 100;
                return (
                  <div key={areaName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 truncate max-w-[200px]" title={areaName}>
                        {areaName}
                      </span>
                      <span className="font-mono tabular-nums font-semibold text-slate-900">
                        {count} รายการ
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-slate-800 h-1.5 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Issues by Category */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-amber-500" />
              ประเภทปัญหา (By Category)
            </h3>
            <span className="text-xs text-slate-400 font-mono">สัดส่วน</span>
          </div>

          <div className="space-y-2.5">
            {stats.sortedTypes.length === 0 ? (
              <p className="text-xs text-slate-400">ยังไม่มีข้อมูลประเภทปัญหา</p>
            ) : (
              stats.sortedTypes.map(([typeName, count]) => {
                const max = stats.sortedTypes[0][1] || 1;
                const pct = (count / max) * 100;
                return (
                  <div key={typeName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 truncate max-w-[200px]" title={typeName}>
                        {typeName}
                      </span>
                      <span className="font-mono tabular-nums font-semibold text-slate-900">
                        {count} รายการ
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-1.5 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Overdue Issues Section */}
      {stats.overdueIssues.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-700" />
              รายการปัญหาที่เกินกำหนดแก้ไข (Overdue Issues - {stats.overdueIssues.length} รายการ)
            </h3>
            <span className="text-xs text-amber-700 font-medium">ควรเร่งติดตามงาน</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.overdueIssues.map(issue => (
              <div
                key={issue.id}
                className="bg-white border border-amber-200 rounded-lg p-3 text-xs shadow-2xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-800">#{issue.id}</span>
                  <span className="text-amber-700 font-mono font-medium">
                    วันที่แจ้ง {issue.due}
                  </span>
                </div>
                <p className="font-medium text-slate-900 line-clamp-1">{issue.detail}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <span>📍 {issue.area}</span>
                  <span>👤 {issue.owner || issue.who}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
