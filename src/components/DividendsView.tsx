import React, { useState, useMemo } from 'react';
import {
  Coins,
  Plus,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
  ArrowDownToLine,
  Search,
  Edit2,
} from 'lucide-react';
import { DividendRecord, FundMeta } from '../types';
import { formatMoney } from '../utils/calculations';
import { POPULAR_FUNDS } from '../data/initialData';

interface DividendsViewProps {
  dividends: DividendRecord[];
  fundMetas: FundMeta[];
  onAddDividend: (dividend: DividendRecord) => void;
  onDeleteDividend: (id: string) => void;
  onEditDividend?: (dividend: DividendRecord) => void;
}

export const DividendsView: React.FC<DividendsViewProps> = ({
  dividends,
  fundMetas,
  onAddDividend,
  onDeleteDividend,
  onEditDividend,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterFund, setFilterFund] = useState<string>('ALL');

  // Form State
  const [fundCode, setFundCode] = useState('510300');
  const [fundName, setFundName] = useState('沪深300ETF');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<'CASH' | 'REINVEST'>('CASH');
  const [totalAmount, setTotalAmount] = useState('500');
  const [amountPerUnit, setAmountPerUnit] = useState('0.05');
  const [holdingUnits, setHoldingUnits] = useState('10000');
  const [reinvestPrice, setReinvestPrice] = useState('3.800');
  const [reinvestUnits, setReinvestUnits] = useState('131');
  const [notes, setNotes] = useState('年度现金分红');

  const handleFundChange = (code: string) => {
    setFundCode(code);
    const found = POPULAR_FUNDS.find((f) => f.code === code) || fundMetas.find((f) => f.code === code);
    if (found) {
      setFundName(found.name);
    }
  };

  const handleHoldingOrPerUnitChange = (units: string, perUnit: string) => {
    setHoldingUnits(units);
    setAmountPerUnit(perUnit);
    const u = parseFloat(units);
    const p = parseFloat(perUnit);
    if (!isNaN(u) && !isNaN(p) && u > 0 && p > 0) {
      const tot = (u * p).toFixed(2);
      setTotalAmount(tot);
      if (type === 'REINVEST') {
        const rp = parseFloat(reinvestPrice);
        if (!isNaN(rp) && rp > 0) {
          setReinvestUnits(Math.floor(parseFloat(tot) / rp).toString());
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tot = parseFloat(totalAmount);
    if (isNaN(tot) || tot <= 0) return;

    const newDividend: DividendRecord = {
      id: `div-${Date.now()}`,
      fundCode,
      fundName,
      date,
      type,
      totalAmount: tot,
      amountPerUnit: parseFloat(amountPerUnit) || undefined,
      holdingUnits: parseFloat(holdingUnits) || undefined,
      reinvestPrice: type === 'REINVEST' ? parseFloat(reinvestPrice) || undefined : undefined,
      reinvestUnits: type === 'REINVEST' ? parseFloat(reinvestUnits) || undefined : undefined,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    onAddDividend(newDividend);
    setShowAddModal(false);
  };

  // Metrics
  const totalDividends = dividends.reduce((a, b) => a + b.totalAmount, 0);
  const cashDividends = dividends
    .filter((d) => d.type === 'CASH')
    .reduce((a, b) => a + b.totalAmount, 0);
  const reinvestDividends = dividends
    .filter((d) => d.type === 'REINVEST')
    .reduce((a, b) => a + b.totalAmount, 0);
  const reinvestUnitsTotal = dividends
    .filter((d) => d.type === 'REINVEST')
    .reduce((a, b) => a + (b.reinvestUnits || 0), 0);

  // Filtered List
  const filteredDividends = useMemo(() => {
    if (filterFund === 'ALL') return dividends;
    return dividends.filter((d) => d.fundCode === filterFund);
  }, [dividends, filterFund]);

  const uniqueFundCodes = Array.from(new Set(dividends.map((d) => d.fundCode)));

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-400">累计分红总额</span>
          <div className="text-2xl font-bold text-cyan-400 mt-1">
            {formatMoney(totalDividends)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            共 {dividends.length} 次分红到账
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-400">现金分红</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {formatMoney(cashDividends)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">直接落袋流动资金</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-400">红利再投资总额</span>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            {formatMoney(reinvestDividends)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            增厚持仓 {reinvestUnitsTotal} 份
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">成本摊薄效益</span>
            <div className="text-sm font-bold text-slate-200 mt-1">
              分红直接冲减持仓真实成本
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full mt-2 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-cyan-500/20 flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>登记新分红</span>
          </button>
        </div>
      </div>

      {/* Dividends Records List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Coins className="w-5 h-5 text-cyan-400" />
              分红历史记录流水
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              记录各基金/ETF的现金分红和红利再投资记录
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={filterFund}
              onChange={(e) => setFilterFund(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">全部标的分红 ({uniqueFundCodes.length})</option>
              {uniqueFundCodes.map((code) => {
                const item = dividends.find((d) => d.fundCode === code);
                return (
                  <option key={code} value={code}>
                    {code} {item?.fundName}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* List */}
        <div className="mt-5 space-y-3">
          {filteredDividends.length === 0 ? (
            <div className="text-center py-16 text-slate-500 border border-dashed border-slate-800 rounded-xl">
              <p className="text-sm">暂无分红记录</p>
            </div>
          ) : (
            filteredDividends.map((div) => (
              <div
                key={div.id}
                className="bg-slate-800/60 hover:bg-slate-800/90 border border-slate-700/70 hover:border-slate-600 rounded-2xl p-4 transition-all shadow-sm flex items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs px-2 py-0.5 bg-slate-700 text-slate-200 rounded font-bold">
                      {div.fundCode}
                    </span>
                    <h3 className="text-base font-bold text-white">{div.fundName}</h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        div.type === 'CASH'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {div.type === 'CASH' ? '现金分红' : '红利再投资'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>除息/发放日期: {div.date}</span>
                    {div.holdingUnits && (
                      <span>持仓基数: {div.holdingUnits.toLocaleString()}份</span>
                    )}
                    {div.amountPerUnit && (
                      <span>每份分红: ¥{div.amountPerUnit.toFixed(4)}</span>
                    )}
                    {div.type === 'REINVEST' && div.reinvestUnits && (
                      <span className="text-cyan-300 font-semibold">
                        折合新增: +{div.reinvestUnits}份 (折算价 ¥{div.reinvestPrice?.toFixed(3)})
                      </span>
                    )}
                  </div>

                  {div.notes && (
                    <div className="text-[11px] text-slate-400 mt-1.5 bg-slate-900/60 px-2.5 py-1 rounded inline-block">
                      {div.notes}
                    </div>
                  )}
                </div>

                <div className="text-right flex items-center space-x-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block">分红金额</span>
                    <span className="text-lg font-black text-cyan-400 font-mono">
                      +{formatMoney(div.totalAmount)}
                    </span>
                  </div>
                  {onEditDividend && (
                    <button
                      onClick={() => onEditDividend(div)}
                      title="修改分红记录"
                      className="text-slate-400 hover:text-cyan-400 p-2 rounded-lg hover:bg-cyan-500/10 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteDividend(div.id)}
                    title="删除记录"
                    className="text-slate-500 hover:text-rose-400 p-2 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Dividend Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Coins className="w-5 h-5 text-cyan-400" />
              登记基金/ETF分红记录
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">基金代码</label>
                  <input
                    type="text"
                    value={fundCode}
                    onChange={(e) => handleFundChange(e.target.value)}
                    placeholder="如 510300"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">基金名称</label>
                  <input
                    type="text"
                    value={fundName}
                    onChange={(e) => setFundName(e.target.value)}
                    placeholder="如 沪深300ETF"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">分红日期</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">分红方式</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'CASH' | 'REINVEST')}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="CASH">现金分红 (直接入账资金)</option>
                    <option value="REINVEST">红利再投资 (折算增加份额)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">持仓份额基数</label>
                  <input
                    type="number"
                    value={holdingUnits}
                    onChange={(e) => handleHoldingOrPerUnitChange(e.target.value, amountPerUnit)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">每份分红 (元)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={amountPerUnit}
                    onChange={(e) => handleHoldingOrPerUnitChange(holdingUnits, e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">分红总额 (元)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 font-bold"
                    required
                  />
                </div>
              </div>

              {type === 'REINVEST' && (
                <div className="grid grid-cols-2 gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                  <div>
                    <label className="block text-slate-400 mb-1">再投资折算单价</label>
                    <input
                      type="number"
                      step="0.001"
                      value={reinvestPrice}
                      onChange={(e) => setReinvestPrice(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">新增折算份额</label>
                    <input
                      type="number"
                      value={reinvestUnits}
                      onChange={(e) => setReinvestUnits(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold text-cyan-400"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1">备注</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="如 年度分红、特别派息"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
                >
                  保存分红记录
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
