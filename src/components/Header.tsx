import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Briefcase,
  Zap,
  TrendingUp,
  Coins,
  PlusCircle,
  Trash2,
  Download,
  UploadCloud,
  Layers,
  Calculator,
} from 'lucide-react';
import { TabKey } from '../types';
import { formatMoney } from '../utils/calculations';

interface HeaderProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  totalRealizedTProfit: number;
  totalMarketValue: number;
  totalFloatingProfit: number;
  onExportBackup: () => void;
  onImportBackup: (json: string) => void;
  onClearAllData: () => void;
  onOpenCalculator?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  totalRealizedTProfit,
  totalMarketValue,
  totalFloatingProfit,
  onExportBackup,
  onImportBackup,
  onClearAllData,
  onOpenCalculator,
}) => {
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupJsonInput, setBackupJsonInput] = useState('');

  const tabs: { id: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'calendar', label: '日历', icon: CalendarIcon },
    { id: 'holdings', label: '持仓', icon: Briefcase },
    { id: 'tstats', label: 'T统计', icon: Zap },
    { id: 'profit', label: '收益', icon: TrendingUp },
    { id: 'dividends', label: '分红', icon: Coins },
    { id: 'entry', label: '录入', icon: PlusCircle },
  ];

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!backupJsonInput.trim()) return;
    onImportBackup(backupJsonInput.trim());
    setBackupJsonInput('');
    setShowBackupModal(false);
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                  网格做T记录器
                </h1>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
                  ETF/基金版
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                精确记录做T买卖、佣金扣减、成本摊薄与分红
              </p>
            </div>
          </div>

          {/* Center / Right: Quick Key Tickers */}
          <div className="hidden md:flex items-center space-x-5 text-xs bg-slate-950/60 px-4 py-2 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-400 block text-[10px]">做T已实现收益</span>
              <span className="font-bold text-emerald-400 font-mono text-sm">
                {formatMoney(totalRealizedTProfit, true)}
              </span>
            </div>
            <div className="w-px h-6 bg-slate-800" />
            <div>
              <span className="text-slate-400 block text-[10px]">持仓总市值</span>
              <span className="font-bold text-white font-mono text-sm">
                {formatMoney(totalMarketValue)}
              </span>
            </div>
            <div className="w-px h-6 bg-slate-800" />
            <div>
              <span className="text-slate-400 block text-[10px]">持仓浮动盈亏</span>
              <span
                className={`font-bold font-mono text-sm ${
                  totalFloatingProfit >= 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {formatMoney(totalFloatingProfit, true)}
              </span>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center space-x-2">
            {onOpenCalculator && (
              <button
                id="header-grid-calc-btn"
                onClick={onOpenCalculator}
                title="打开网格阶梯计算器"
                className="p-2 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs"
              >
                <Calculator className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">网格计算器</span>
              </button>
            )}

            <button
              onClick={() => setShowBackupModal(true)}
              title="备份与恢复数据"
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onClearAllData}
              title="清空所有数据 (从零开始)"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span className="hidden sm:inline text-slate-400 hover:text-rose-300">清空重置</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none border-t border-slate-800/60">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Backup & Restore Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-400" />
              本地数据备份与导入恢复
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              做T记录全部保存在您本地浏览器中。您可以随时导出完整备份文件，换设备随时导入。
            </p>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">导出全量数据备份 (JSON)</span>
                  <span className="text-slate-400 text-[11px]">包含所有买卖流水、做T记录与分红</span>
                </div>
                <button
                  onClick={onExportBackup}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-md cursor-pointer"
                >
                  导出备份
                </button>
              </div>

              <form onSubmit={handleImportSubmit} className="space-y-2">
                <label className="block text-slate-300 font-bold">恢复备份 (粘贴 JSON 数据)：</label>
                <textarea
                  rows={4}
                  value={backupJsonInput}
                  onChange={(e) => setBackupJsonInput(e.target.value)}
                  placeholder="在此粘贴之前导出的 JSON 备份文本..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono focus:outline-none focus:border-emerald-500 text-[11px]"
                />
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBackupModal(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl cursor-pointer"
                  >
                    确认导入恢复
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
