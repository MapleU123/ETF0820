import React, { useState } from 'react';
import {
  Briefcase,
  Search,
  Edit2,
  Check,
  X,
  Plus,
  Calculator,
  Sparkles,
  Zap,
  Trash2,
  Layers,
} from 'lucide-react';
import { PositionSummary, FundMeta, TradeRecord } from '../types';
import { formatMoney, formatPercent } from '../utils/calculations';

interface HoldingsViewProps {
  positions: PositionSummary[];
  fundMetas: FundMeta[];
  trades: TradeRecord[];
  onUpdateFundPrice: (code: string, newPrice: number) => void;
  onUpdateFundMeta: (meta: FundMeta) => void;
  onSaveManualPosition: (pos: {
    fundCode: string;
    fundName: string;
    holdings: number;
    costPrice: number;
    currentPrice: number;
  }) => void;
  onDeleteFundPosition: (fundCode: string) => void;
  onNavigateToEntryWithFund: (fundCode: string, fundName: string, defaultPrice: number) => void;
  onOpenGridCalculator: (position: PositionSummary) => void;
}

export const HoldingsView: React.FC<HoldingsViewProps> = ({
  positions,
  fundMetas,
  trades,
  onUpdateFundPrice,
  onUpdateFundMeta,
  onSaveManualPosition,
  onDeleteFundPosition,
  onNavigateToEntryWithFund,
  onOpenGridCalculator,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPriceCode, setEditingPriceCode] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');

  // Modal State for Adding/Editing Position Manually
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [modalFundCode, setModalFundCode] = useState('');
  const [modalFundName, setModalFundName] = useState('');
  const [modalHoldings, setModalHoldings] = useState('10000');
  const [modalCostPrice, setModalCostPrice] = useState('3.800');
  const [modalCurrentPrice, setModalCurrentPrice] = useState('3.800');
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  // Filter positions by search keyword
  const filteredPositions = positions.filter(
    (p) =>
      p.fundCode.includes(searchTerm) ||
      p.fundName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalMarketValue = positions.reduce((a, b) => a + b.marketValue, 0);
  const totalFloatingProfit = positions.reduce((a, b) => a + b.floatingProfit, 0);
  const totalRealizedTProfit = positions.reduce((a, b) => a + b.realizedTProfit, 0);
  const totalDividends = positions.reduce((a, b) => a + b.totalDividends, 0);
  const totalComprehensiveProfit = totalRealizedTProfit + totalDividends + totalFloatingProfit;

  const handleStartEditPrice = (code: string, currentPrice: number) => {
    setEditingPriceCode(code);
    setTempPrice(currentPrice.toString());
  };

  const handleSavePrice = (code: string) => {
    const p = parseFloat(tempPrice);
    if (!isNaN(p) && p >= 0) {
      onUpdateFundPrice(code, p);
    }
    setEditingPriceCode(null);
  };

  const handleOpenAddModal = () => {
    setIsEditingExisting(false);
    setModalFundCode('');
    setModalFundName('');
    setModalHoldings('10000');
    setModalCostPrice('1.000');
    setModalCurrentPrice('1.000');
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditModal = (pos: PositionSummary) => {
    setIsEditingExisting(true);
    setModalFundCode(pos.fundCode);
    setModalFundName(pos.fundName);
    setModalHoldings(pos.currentHoldings.toString());
    setModalCostPrice(pos.originalCostPrice.toFixed(3));
    setModalCurrentPrice(pos.currentPrice.toFixed(3));
    setIsAddEditModalOpen(true);
  };

  const handleSaveModalPosition = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseFloat(modalHoldings);
    const c = parseFloat(modalCostPrice);
    const p = parseFloat(modalCurrentPrice);

    if (!modalFundCode.trim() || !modalFundName.trim() || isNaN(h) || isNaN(c) || isNaN(p)) {
      alert('请检查输入的持仓信息');
      return;
    }

    onSaveManualPosition({
      fundCode: modalFundCode.trim(),
      fundName: modalFundName.trim(),
      holdings: h,
      costPrice: c,
      currentPrice: p,
    });

    setIsAddEditModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Top Analytics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm col-span-2 sm:col-span-1">
          <span className="text-xs font-medium text-slate-400">总持仓市值</span>
          <div className="text-xl sm:text-2xl font-bold text-white mt-1">
            {formatMoney(totalMarketValue)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {positions.length} 只在持标的
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-400">做T累计净收益</span>
          <div className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">
            {formatMoney(totalRealizedTProfit, true)}
          </div>
          <span className="text-[11px] text-emerald-500/80 mt-1 block">
            已落袋摊薄资金
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-400">持仓浮动盈亏</span>
          <div
            className={`text-xl sm:text-2xl font-bold mt-1 ${
              totalFloatingProfit >= 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {formatMoney(totalFloatingProfit, true)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            按摊薄后成本估值
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-400">累计分红收入</span>
          <div className="text-xl sm:text-2xl font-bold text-cyan-400 mt-1">
            {formatMoney(totalDividends)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            现金及再投资
          </span>
        </div>

        <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 shadow-sm col-span-2 lg:col-span-1">
          <span className="text-xs font-semibold text-emerald-300">综合总获利</span>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
            {formatMoney(totalComprehensiveProfit, true)}
          </div>
          <span className="text-[11px] text-emerald-400/70 mt-1 block">
            做T + 分红 + 浮盈
          </span>
        </div>
      </div>

      {/* Holdings List Header & Search Filter & Manual Add Button */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-emerald-400" />
              持仓标的与成本摊薄跟踪
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              支持手动添加或修改底仓成本与份额，做T净利实时摊薄真实持仓均价
            </p>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索代码或名称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Manual Add / Edit Position Button */}
            <button
              id="holdings-add-manual-btn"
              onClick={handleOpenAddModal}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>手动添加持仓</span>
            </button>
          </div>
        </div>

        {/* Positions Cards / Table */}
        <div className="mt-6 space-y-4">
          {filteredPositions.length === 0 ? (
            <div className="text-center py-16 text-slate-500 border border-dashed border-slate-800 rounded-xl">
              <p className="text-sm">暂无匹配的持仓标的</p>
              <button
                onClick={handleOpenAddModal}
                className="mt-3 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl cursor-pointer"
              >
                立即手动录入初始持仓
              </button>
            </div>
          ) : (
            filteredPositions.map((pos) => {
              const costSavedPerShare = pos.originalCostPrice - pos.dilutedCostPrice;
              const hasHoldings = pos.currentHoldings > 0;

              return (
                <div
                  key={pos.fundCode}
                  id={`holding-card-${pos.fundCode}`}
                  className="bg-slate-800/60 hover:bg-slate-800/90 border border-slate-700/70 hover:border-slate-600 rounded-2xl p-4 sm:p-5 transition-all shadow-sm"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Fund Info & Holding Size */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs px-2 py-0.5 bg-slate-700/70 border border-slate-600 text-slate-200 rounded-md font-bold">
                          {pos.fundCode}
                        </span>
                        <h3 className="text-base font-bold text-white">{pos.fundName}</h3>
                        {!hasHoldings ? (
                          <span className="text-[10px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">
                            已清仓 (仅留做T记录)
                          </span>
                        ) : (
                          <button
                            onClick={() => handleOpenEditModal(pos)}
                            title="修改持仓份额与成本"
                            className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 bg-slate-700/50 hover:bg-slate-700 px-2 py-0.5 rounded-md transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>修改底仓</span>
                          </button>
                        )}
                      </div>

                      {/* Main Metrics Matrix */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[11px]">当前持仓份额</span>
                          <span className="font-bold text-white text-sm">
                            {pos.currentHoldings.toLocaleString()} 份
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            市值: {formatMoney(pos.marketValue)}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[11px]">最新市价 / 估值</span>
                          {editingPriceCode === pos.fundCode ? (
                            <div className="flex items-center space-x-1 mt-0.5">
                              <input
                                type="number"
                                step="0.001"
                                value={tempPrice}
                                onChange={(e) => setTempPrice(e.target.value)}
                                className="w-20 bg-slate-900 border border-emerald-500 rounded px-1.5 py-0.5 text-xs text-white"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSavePrice(pos.fundCode)}
                                className="p-1 text-emerald-400 hover:text-emerald-300"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingPriceCode(null)}
                                className="p-1 text-slate-400 hover:text-slate-300"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1.5 mt-0.5">
                              <span className="font-bold font-mono text-sm text-cyan-300">
                                ¥{pos.currentPrice.toFixed(3)}
                              </span>
                              <button
                                onClick={() => handleStartEditPrice(pos.fundCode, pos.currentPrice)}
                                title="更新最新市价"
                                className="text-slate-500 hover:text-slate-300 p-0.5"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          <span className="text-[10px] text-slate-500 block">
                            浮盈: {formatPercent(pos.floatingProfitRate, true)}
                          </span>
                        </div>

                        {/* Cost Dilution Box */}
                        <div className="bg-slate-900/70 border border-slate-700/60 rounded-xl p-2">
                          <span className="text-slate-400 block text-[10px]">
                            摊薄后真实成本 (做T后)
                          </span>
                          <span
                            className={`font-bold font-mono text-sm ${
                              pos.dilutedCostPrice < pos.originalCostPrice
                                ? 'text-emerald-400'
                                : 'text-slate-200'
                            }`}
                          >
                            ¥{pos.dilutedCostPrice.toFixed(3)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            初始成本: ¥{pos.originalCostPrice.toFixed(3)}
                          </span>
                        </div>

                        {/* Total T Profits */}
                        <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-2">
                          <span className="text-emerald-400 block text-[10px]">
                            做T累计获利 ({pos.totalTRounds}次)
                          </span>
                          <span className="font-bold text-emerald-300 text-sm">
                            {formatMoney(pos.realizedTProfit, true)}
                          </span>
                          <span className="text-[10px] text-amber-400 block font-medium">
                            胜率: {pos.winRate.toFixed(1)}% ({pos.winTRounds}/{pos.totalTRounds})
                          </span>
                        </div>
                      </div>

                      {/* Cost Reduction Progress Bar */}
                      {costSavedPerShare > 0 && hasHoldings && (
                        <div className="mt-3 bg-slate-900/60 border border-slate-800 rounded-lg p-2 flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2 text-emerald-300 text-[11px]">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>
                              做T已为每份持仓降低成本{' '}
                              <strong>¥{costSavedPerShare.toFixed(3)}</strong> 元 (摊薄率{' '}
                              {pos.originalCostPrice > 0 ? ((costSavedPerShare / pos.originalCostPrice) * 100).toFixed(1) : 0}%)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex lg:flex-col items-center justify-end space-x-2 lg:space-x-0 lg:space-y-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-700/60">
                      <button
                        onClick={() =>
                          onNavigateToEntryWithFund(pos.fundCode, pos.fundName, pos.currentPrice)
                        }
                        className="w-full sm:w-auto px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 fill-slate-950" />
                        <span>做T / 记账</span>
                      </button>

                      <button
                        onClick={() => onOpenGridCalculator(pos)}
                        className="w-full sm:w-auto px-3 py-2 bg-slate-700/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-600 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Calculator className="w-3.5 h-3.5 text-cyan-400" />
                        <span>网格阶梯算利</span>
                      </button>

                      <button
                        onClick={() => onDeleteFundPosition(pos.fundCode)}
                        title="删除该标的及清空持仓"
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Manual Add / Edit Position Modal */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-emerald-400" />
              {isEditingExisting ? '修改持仓底仓' : '手动添加持仓标的'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              设置该标的的初始持仓份额、买入成本均价与当前最新市价
            </p>

            <form onSubmit={handleSaveModalPosition} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">基金/ETF代码</label>
                  <input
                    type="text"
                    value={modalFundCode}
                    onChange={(e) => setModalFundCode(e.target.value)}
                    disabled={isEditingExisting}
                    placeholder="如 510300"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono disabled:opacity-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">标的名称</label>
                  <input
                    type="text"
                    value={modalFundName}
                    onChange={(e) => setModalFundName(e.target.value)}
                    placeholder="如 沪深300ETF"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">当前持仓份额 (份)</label>
                <input
                  type="number"
                  step="100"
                  value={modalHoldings}
                  onChange={(e) => setModalHoldings(e.target.value)}
                  placeholder="如 10000"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">初始持仓成本单价 (元)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={modalCostPrice}
                    onChange={(e) => setModalCostPrice(e.target.value)}
                    placeholder="如 3.800"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">当前最新市价 (元)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={modalCurrentPrice}
                    onChange={(e) => setModalCurrentPrice(e.target.value)}
                    placeholder="如 3.850"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-md cursor-pointer"
                >
                  保存持仓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
