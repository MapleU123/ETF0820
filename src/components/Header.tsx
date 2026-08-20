import React, { useState } from 'react';
import avatarImg from '../assets/images/app_avatar_icon_1787244504437.jpg';
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
  Settings,
  X,
  Sparkles,
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
  onOpenFeeConfig?: () => void;
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
  onOpenFeeConfig,
}) => {
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
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
            <button
              id="app-avatar-btn"
              type="button"
              onClick={() => setShowAvatarModal(true)}
              title="点击查看/下载高清应用头像"
              className="h-10 w-10 rounded-xl overflow-hidden shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-500/40 hover:ring-2 hover:ring-cyan-400 transition-all cursor-pointer group relative shrink-0"
            >
              <img
                src={avatarImg}
                alt="ETF网格做T记录器头像"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                  网格做T记录器
                </h1>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30 font-mono tracking-wider">
                  ETF08212
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
            {onOpenFeeConfig && (
              <button
                id="header-fee-config-btn"
                onClick={onOpenFeeConfig}
                title="设置交易费率 (免五/万1/最低0.2元/印花税)"
                className="p-2 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs"
              >
                <Settings className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">费率设置</span>
              </button>
            )}

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
      {/* Avatar Preview Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-150 text-center relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

            <button
              onClick={() => setShowAvatarModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ETF 网格交易专属头像</span>
            </div>

            {/* High-res Avatar Image */}
            <div className="relative mx-auto w-48 h-48 sm:w-56 sm:h-56 rounded-3xl overflow-hidden p-1 bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 shadow-2xl shadow-emerald-500/30 mb-4">
              <img
                src={avatarImg}
                alt="ETF网格做T记录器高清头像"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-[22px]"
              />
            </div>

            <h4 className="text-base font-bold text-white mb-1">ETF08212 · 网格做T记录器</h4>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              3D 金融质感设计：融入量化网格、收益上升曲线与 K 线阶梯元素，契合专业做 T 与成本摊薄主题。
            </p>

            <div className="flex gap-2">
              <a
                href={avatarImg}
                download="etf-grid-t-avatar.jpg"
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>下载/保存头像</span>
              </a>
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
