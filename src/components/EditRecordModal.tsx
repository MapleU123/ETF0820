import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Zap,
  TrendingUp,
  Coins,
  Layers,
  Calculator,
  RefreshCw,
  AlertCircle,
  Clock,
  Calendar as CalendarIcon,
} from 'lucide-react';
import {
  TradeRecord,
  TPairRecord,
  DividendRecord,
  ComprehensiveFeeRule,
  FundMeta,
} from '../types';
import {
  formatMoney,
  formatPercent,
  calculateComprehensiveFee,
} from '../utils/calculations';
import { POPULAR_FUNDS } from '../data/initialData';

export type EditableRecordType = 'trade' | 'tpair' | 'dividend';

interface EditRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordType: EditableRecordType;
  recordData: TradeRecord | TPairRecord | DividendRecord | null;
  feeRules: ComprehensiveFeeRule[];
  fundMetas: FundMeta[];
  onSaveTrade?: (updatedTrade: TradeRecord) => void;
  onSaveTPair?: (updatedTPair: TPairRecord) => void;
  onSaveDividend?: (updatedDividend: DividendRecord) => void;
}

export const EditRecordModal: React.FC<EditRecordModalProps> = ({
  isOpen,
  onClose,
  recordType,
  recordData,
  feeRules,
  fundMetas,
  onSaveTrade,
  onSaveTPair,
  onSaveDividend,
}) => {
  if (!isOpen || !recordData) return null;

  // Selected Fee Rule
  const [selectedFeeRuleId, setSelectedFeeRuleId] = useState<string>(
    feeRules[0]?.id || 'fee-etf-default'
  );
  const activeFeeRule = feeRules.find((r) => r.id === selectedFeeRuleId) || feeRules[0];

  // --- Trade Form State ---
  const [tradeFundCode, setTradeFundCode] = useState('');
  const [tradeFundName, setTradeFundName] = useState('');
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [tradePrice, setTradePrice] = useState('0');
  const [tradeQty, setTradeQty] = useState('0');
  const [tradeFee, setTradeFee] = useState('0');
  const [tradeDate, setTradeDate] = useState('');
  const [tradeTime, setTradeTime] = useState('10:00:00');
  const [tradeNotes, setTradeNotes] = useState('');

  // --- TPair Form State ---
  const [tFundCode, setTFundCode] = useState('');
  const [tFundName, setTFundName] = useState('');
  const [tType, setTType] = useState<'POSITIVE_T' | 'REVERSE_T'>('POSITIVE_T');
  const [tBuyPrice, setTBuyPrice] = useState('0');
  const [tBuyQty, setTBuyQty] = useState('0');
  const [tBuyFee, setTBuyFee] = useState('0');
  const [tBuyDate, setTBuyDate] = useState('');
  const [tBuyTime, setTBuyTime] = useState('09:45:00');

  const [tSellPrice, setTSellPrice] = useState('0');
  const [tSellQty, setTSellQty] = useState('0');
  const [tSellFee, setTSellFee] = useState('0');
  const [tSellDate, setTSellDate] = useState('');
  const [tSellTime, setTSellTime] = useState('14:45:00');
  const [tNotes, setTNotes] = useState('');

  // --- Dividend Form State ---
  const [divFundCode, setDivFundCode] = useState('');
  const [divFundName, setDivFundName] = useState('');
  const [divDate, setDivDate] = useState('');
  const [divType, setDivType] = useState<'CASH' | 'REINVEST'>('CASH');
  const [divAmountPerUnit, setDivAmountPerUnit] = useState('0');
  const [divHoldingUnits, setDivHoldingUnits] = useState('0');
  const [divTotalAmount, setDivTotalAmount] = useState('0');
  const [divReinvestPrice, setDivReinvestPrice] = useState('0');
  const [divReinvestUnits, setDivReinvestUnits] = useState('0');
  const [divNotes, setDivNotes] = useState('');

  // Sync state on recordData change
  useEffect(() => {
    if (!recordData) return;

    if (recordType === 'trade') {
      const tr = recordData as TradeRecord;
      setTradeFundCode(tr.fundCode);
      setTradeFundName(tr.fundName);
      setTradeType(tr.type);
      setTradePrice(tr.price.toString());
      setTradeQty(tr.quantity.toString());
      setTradeFee(tr.fee.toString());
      setTradeDate(tr.date);
      setTradeTime(tr.time || '10:00:00');
      setTradeNotes(tr.notes || '');
    } else if (recordType === 'tpair') {
      const tp = recordData as TPairRecord;
      setTFundCode(tp.fundCode);
      setTFundName(tp.fundName);
      setTType(tp.tType);
      setTBuyPrice(tp.buyPrice.toString());
      setTBuyQty(tp.buyQty.toString());
      setTBuyFee(tp.buyFee.toString());
      setTBuyDate(tp.buyDate);
      setTBuyTime(tp.buyTime || '09:45:00');

      setTSellPrice(tp.sellPrice.toString());
      setTSellQty(tp.sellQty.toString());
      setTSellFee(tp.sellFee.toString());
      setTSellDate(tp.sellDate);
      setTSellTime(tp.sellTime || '14:45:00');
      setTNotes(tp.notes || '');
    } else if (recordType === 'dividend') {
      const div = recordData as DividendRecord;
      setDivFundCode(div.fundCode);
      setDivFundName(div.fundName);
      setDivDate(div.date);
      setDivType(div.type);
      setDivAmountPerUnit((div.amountPerUnit || 0).toString());
      setDivHoldingUnits((div.holdingUnits || 0).toString());
      setDivTotalAmount(div.totalAmount.toString());
      setDivReinvestPrice((div.reinvestPrice || 0).toString());
      setDivReinvestUnits((div.reinvestUnits || 0).toString());
      setDivNotes(div.notes || '');
    }
  }, [recordData, recordType]);

  // Recalculate Trade Fee Helper
  const handleRecalcTradeFee = () => {
    const p = parseFloat(tradePrice) || 0;
    const q = parseFloat(tradeQty) || 0;
    const amount = p * q;
    if (activeFeeRule && amount > 0) {
      const res = calculateComprehensiveFee(amount, tradeType === 'SELL', activeFeeRule);
      setTradeFee(res.totalFee.toFixed(2));
    }
  };

  // Recalculate TPair Fees Helper
  const handleRecalcTPairFees = () => {
    const bp = parseFloat(tBuyPrice) || 0;
    const bq = parseFloat(tBuyQty) || 0;
    const sp = parseFloat(tSellPrice) || 0;
    const sq = parseFloat(tSellQty) || 0;

    if (activeFeeRule) {
      if (bp * bq > 0) {
        const bRes = calculateComprehensiveFee(bp * bq, false, activeFeeRule);
        setTBuyFee(bRes.totalFee.toFixed(2));
      }
      if (sp * sq > 0) {
        const sRes = calculateComprehensiveFee(sp * sq, true, activeFeeRule);
        setTSellFee(sRes.totalFee.toFixed(2));
      }
    }
  };

  // TPair Live Calculation
  const tCalculation = React.useMemo(() => {
    const bp = parseFloat(tBuyPrice) || 0;
    const bq = parseFloat(tBuyQty) || 0;
    const bf = parseFloat(tBuyFee) || 0;
    const sp = parseFloat(tSellPrice) || 0;
    const sq = parseFloat(tSellQty) || 0;
    const sf = parseFloat(tSellFee) || 0;

    const matchedQty = Math.min(bq, sq);
    const grossProfit = (sp - bp) * matchedQty;
    const totalFees = bf + sf;
    const netProfit = grossProfit - totalFees;
    const capital = bp * matchedQty;
    const profitRate = capital > 0 ? (netProfit / capital) * 100 : 0;
    const costDilution = bq > 0 ? netProfit / bq : 0;

    return {
      matchedQty,
      grossProfit,
      totalFees,
      netProfit,
      profitRate,
      costDilution,
    };
  }, [tBuyPrice, tBuyQty, tBuyFee, tSellPrice, tSellQty, tSellFee]);

  // Submit Handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (recordType === 'trade' && onSaveTrade) {
      const p = parseFloat(tradePrice);
      const q = parseFloat(tradeQty);
      const f = parseFloat(tradeFee);

      if (isNaN(p) || isNaN(q) || p <= 0 || q <= 0) {
        alert('请输入有效的交易价格与数量');
        return;
      }

      const orig = recordData as TradeRecord;
      const updated: TradeRecord = {
        ...orig,
        fundCode: tradeFundCode.trim(),
        fundName: tradeFundName.trim(),
        type: tradeType,
        price: p,
        quantity: q,
        amount: p * q,
        fee: isNaN(f) ? 0 : f,
        date: tradeDate,
        time: tradeTime,
        notes: tradeNotes.trim(),
      };
      onSaveTrade(updated);
      onClose();
    } else if (recordType === 'tpair' && onSaveTPair) {
      const bp = parseFloat(tBuyPrice);
      const bq = parseFloat(tBuyQty);
      const bf = parseFloat(tBuyFee);
      const sp = parseFloat(tSellPrice);
      const sq = parseFloat(tSellQty);
      const sf = parseFloat(tSellFee);

      if (isNaN(bp) || isNaN(sp) || isNaN(bq) || isNaN(sq) || bp <= 0 || sp <= 0 || bq <= 0 || sq <= 0) {
        alert('请输入有效的做T买入/卖出价格与数量');
        return;
      }

      const orig = recordData as TPairRecord;
      const updated: TPairRecord = {
        ...orig,
        fundCode: tFundCode.trim(),
        fundName: tFundName.trim(),
        tType,
        buyDate: tBuyDate,
        buyTime: tBuyTime,
        buyPrice: bp,
        buyQty: bq,
        buyFee: isNaN(bf) ? 0 : bf,
        sellDate: tSellDate,
        sellTime: tSellTime,
        sellPrice: sp,
        sellQty: sq,
        sellFee: isNaN(sf) ? 0 : sf,
        matchedQty: tCalculation.matchedQty,
        grossProfit: tCalculation.grossProfit,
        totalFees: tCalculation.totalFees,
        netProfit: tCalculation.netProfit,
        profitRate: tCalculation.profitRate,
        costDilutionPerShare: tCalculation.costDilution,
        notes: tNotes.trim(),
      };
      onSaveTPair(updated);
      onClose();
    } else if (recordType === 'dividend' && onSaveDividend) {
      const totalAmt = parseFloat(divTotalAmount);
      const perUnit = parseFloat(divAmountPerUnit) || 0;
      const hUnits = parseFloat(divHoldingUnits) || 0;
      const rPrice = parseFloat(divReinvestPrice) || 0;
      const rUnits = parseFloat(divReinvestUnits) || 0;

      if (isNaN(totalAmt) || totalAmt <= 0) {
        alert('请输入有效的分红金额');
        return;
      }

      const orig = recordData as DividendRecord;
      const updated: DividendRecord = {
        ...orig,
        fundCode: divFundCode.trim(),
        fundName: divFundName.trim(),
        date: divDate,
        type: divType,
        amountPerUnit: perUnit,
        holdingUnits: hUnits,
        totalAmount: totalAmt,
        reinvestPrice: rPrice,
        reinvestUnits: rUnits,
        notes: divNotes.trim(),
      };
      onSaveDividend(updated);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-6 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              {recordType === 'trade' && <Layers className="w-4 h-4" />}
              {recordType === 'tpair' && <Zap className="w-4 h-4" />}
              {recordType === 'dividend' && <Coins className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                修改数据记录
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-normal">
                  {recordType === 'trade' && '单笔交易流水'}
                  {recordType === 'tpair' && '做T套利对冲'}
                  {recordType === 'dividend' && '基金分红'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">修改后将自动更新关联统计、摊薄成本与收益分析</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="p-5 space-y-4 text-xs">
          {/* Quick Fee Rule Selector for Trade / TPair */}
          {recordType !== 'dividend' && (
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-cyan-400" />
                佣金费率重算规则:
              </span>
              <div className="flex items-center space-x-2">
                <select
                  value={selectedFeeRuleId}
                  onChange={(e) => setSelectedFeeRuleId(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                >
                  {feeRules.map((rule) => (
                    <option key={rule.id} value={rule.id}>
                      {rule.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={recordType === 'trade' ? handleRecalcTradeFee : handleRecalcTPairFees}
                  className="px-2.5 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>一键重算费用</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= TRADE FORM ================= */}
          {recordType === 'trade' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">标的代码</label>
                  <input
                    type="text"
                    value={tradeFundCode}
                    onChange={(e) => setTradeFundCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">标的名称</label>
                  <input
                    type="text"
                    value={tradeFundName}
                    onChange={(e) => setTradeFundName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">交易类型</label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setTradeType('BUY')}
                      className={`py-1 rounded-lg font-bold text-center transition-colors cursor-pointer ${
                        tradeType === 'BUY'
                          ? 'bg-rose-500 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      买入 (BUY)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTradeType('SELL')}
                      className={`py-1 rounded-lg font-bold text-center transition-colors cursor-pointer ${
                        tradeType === 'SELL'
                          ? 'bg-emerald-500 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      卖出 (SELL)
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">成交单价 (元)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={tradePrice}
                    onChange={(e) => setTradePrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">成交数量 (份/股)</label>
                  <input
                    type="number"
                    step="100"
                    value={tradeQty}
                    onChange={(e) => setTradeQty(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">手续费/佣金 (元)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={tradeFee}
                    onChange={(e) => setTradeFee(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">交易日期</label>
                  <input
                    type="date"
                    value={tradeDate}
                    onChange={(e) => setTradeDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">成交时间</label>
                  <input
                    type="time"
                    step="1"
                    value={tradeTime}
                    onChange={(e) => setTradeTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">备注说明</label>
                <input
                  type="text"
                  value={tradeNotes}
                  onChange={(e) => setTradeNotes(e.target.value)}
                  placeholder="如：触碰网格下轨买入..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-slate-300">
                <span>成交金额总计:</span>
                <span className="text-base font-bold font-mono text-white">
                  {formatMoney((parseFloat(tradePrice) || 0) * (parseFloat(tradeQty) || 0))}
                </span>
              </div>
            </div>
          )}

          {/* ================= TPAIR FORM ================= */}
          {recordType === 'tpair' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">标的代码</label>
                  <input
                    type="text"
                    value={tFundCode}
                    onChange={(e) => setTFundCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">标的名称</label>
                  <input
                    type="text"
                    value={tFundName}
                    onChange={(e) => setTFundName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">做T方向</label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setTType('POSITIVE_T')}
                      className={`py-1 rounded-lg font-bold text-center transition-colors cursor-pointer ${
                        tType === 'POSITIVE_T'
                          ? 'bg-emerald-500 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      正T (先买后卖)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTType('REVERSE_T')}
                      className={`py-1 rounded-lg font-bold text-center transition-colors cursor-pointer ${
                        tType === 'REVERSE_T'
                          ? 'bg-indigo-500 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      倒T (先卖后买)
                    </button>
                  </div>
                </div>
              </div>

              {/* Buy Leg */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-rose-500/20 space-y-2.5">
                <span className="font-bold text-rose-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  买入端数据
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">买入价格 (元)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={tBuyPrice}
                      onChange={(e) => setTBuyPrice(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">买入数量 (份)</label>
                    <input
                      type="number"
                      step="100"
                      value={tBuyQty}
                      onChange={(e) => setTBuyQty(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">买入手续费 (元)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={tBuyFee}
                      onChange={(e) => setTBuyFee(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">买入日期</label>
                    <input
                      type="date"
                      value={tBuyDate}
                      onChange={(e) => setTBuyDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Sell Leg */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-emerald-500/20 space-y-2.5">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  卖出端数据
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">卖出价格 (元)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={tSellPrice}
                      onChange={(e) => setTSellPrice(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">卖出数量 (份)</label>
                    <input
                      type="number"
                      step="100"
                      value={tSellQty}
                      onChange={(e) => setTSellQty(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">卖出手续费 (元)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={tSellFee}
                      onChange={(e) => setTSellFee(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">卖出日期</label>
                    <input
                      type="date"
                      value={tSellDate}
                      onChange={(e) => setTSellDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">做T交易备注</label>
                <input
                  type="text"
                  value={tNotes}
                  onChange={(e) => setTNotes(e.target.value)}
                  placeholder="如：冲高止盈倒T..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              {/* Live Calculations Preview */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block">撮合配对份额</span>
                  <span className="font-bold text-white font-mono text-sm">{tCalculation.matchedQty} 份</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">双边总手续费</span>
                  <span className="font-bold text-slate-300 font-mono text-sm">{formatMoney(tCalculation.totalFees)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">做T净收益</span>
                  <span
                    className={`font-bold font-mono text-sm ${
                      tCalculation.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {formatMoney(tCalculation.netProfit, true)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">做T收益率</span>
                  <span
                    className={`font-bold font-mono text-sm ${
                      tCalculation.profitRate >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {formatPercent(tCalculation.profitRate, true)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ================= DIVIDEND FORM ================= */}
          {recordType === 'dividend' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">基金代码</label>
                  <input
                    type="text"
                    value={divFundCode}
                    onChange={(e) => setDivFundCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">基金名称</label>
                  <input
                    type="text"
                    value={divFundName}
                    onChange={(e) => setDivFundName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">分红方式</label>
                  <select
                    value={divType}
                    onChange={(e) => setDivType(e.target.value as 'CASH' | 'REINVEST')}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="CASH">现金分红</option>
                    <option value="REINVEST">红利再投资</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">分红到账日期</label>
                  <input
                    type="date"
                    value={divDate}
                    onChange={(e) => setDivDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">分红总金额 (元)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={divTotalAmount}
                    onChange={(e) => setDivTotalAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-bold font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">每份分红额 (选填)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={divAmountPerUnit}
                    onChange={(e) => setDivAmountPerUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              {divType === 'REINVEST' && (
                <div className="bg-cyan-950/30 p-3 rounded-xl border border-cyan-500/30 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-cyan-300 mb-1">再投资折算单价 (元)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={divReinvestPrice}
                      onChange={(e) => setDivReinvestPrice(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-cyan-300 mb-1">新增折算份额 (份)</label>
                    <input
                      type="number"
                      step="1"
                      value={divReinvestUnits}
                      onChange={(e) => setDivReinvestUnits(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1">备注说明</label>
                <input
                  type="text"
                  value={divNotes}
                  onChange={(e) => setDivNotes(e.target.value)}
                  placeholder="如：2025年度分红..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>确认保存修改</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
