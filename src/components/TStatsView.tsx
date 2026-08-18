import React, { useState, useMemo } from 'react';
import {
  Zap,
  Award,
  Search,
  RefreshCw,
  Trash2,
  Calendar as CalendarIcon,
  TrendingUp,
  Percent,
  Coins,
  Activity,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Edit2,
} from 'lucide-react';
import { TPairRecord, TradeRecord, PositionSummary } from '../types';
import { formatMoney, formatPercent } from '../utils/calculations';

interface TStatsViewProps {
  tPairs: TPairRecord[];
  trades: TradeRecord[];
  positions: PositionSummary[];
  onDeleteTPair: (id: string) => void;
  onEditTPair?: (tPair: TPairRecord) => void;
  onAutoPairFIFO: () => void;
  onNavigateToEntry: () => void;
}

type TimeRangeFilter = 'THIS_MONTH' | '3_MONTHS' | '6_MONTHS' | 'THIS_YEAR' | 'ALL' | 'CUSTOM';

export const TStatsView: React.FC<TStatsViewProps> = ({
  tPairs,
  trades,
  positions,
  onDeleteTPair,
  onEditTPair,
  onAutoPairFIFO,
  onNavigateToEntry,
}) => {
  // Time Range Filter: 'THIS_MONTH' | '3_MONTHS' | '6_MONTHS' | 'THIS_YEAR' | 'ALL' | 'CUSTOM'
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Dropdown filters
  const [selectedFund, setSelectedFund] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL'); // ALL, POSITIVE_T, REVERSE_T
  const [selectedOutcome, setSelectedOutcome] = useState<string>('ALL'); // ALL, WIN, LOSS
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // 1. Calculate Date Range Bounds
  const dateBounds = useMemo(() => {
    const now = new Date();
    const nowStr = now.toISOString().split('T')[0];

    if (timeRange === 'THIS_MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      return { start, end: nowStr };
    }
    if (timeRange === '3_MONTHS') {
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0];
      return { start, end: nowStr };
    }
    if (timeRange === '6_MONTHS') {
      const start = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0];
      return { start, end: nowStr };
    }
    if (timeRange === 'THIS_YEAR') {
      const start = `${now.getFullYear()}-01-01`;
      return { start, end: nowStr };
    }
    if (timeRange === 'CUSTOM') {
      return { start: customStartDate, end: customEndDate };
    }
    return { start: '', end: '' }; // ALL
  }, [timeRange, customStartDate, customEndDate]);

  // Collect unique funds
  const uniqueFunds = useMemo(() => {
    const map = new Map<string, string>();
    tPairs.forEach((tp) => map.set(tp.fundCode, tp.fundName));
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, [tPairs]);

  // Filtered T-Pairs
  const filteredTPairs = useMemo(() => {
    return tPairs.filter((tp) => {
      const tradeDate = tp.sellDate || tp.buyDate;

      // Time range filtering
      if (dateBounds.start && tradeDate < dateBounds.start) return false;
      if (dateBounds.end && tradeDate > dateBounds.end) return false;

      // Dropdown & Search filters
      if (selectedFund !== 'ALL' && tp.fundCode !== selectedFund) return false;
      if (selectedType !== 'ALL' && tp.tType !== selectedType) return false;
      if (selectedOutcome === 'WIN' && tp.netProfit <= 0) return false;
      if (selectedOutcome === 'LOSS' && tp.netProfit > 0) return false;
      if (
        searchKeyword &&
        !tp.fundCode.includes(searchKeyword) &&
        !tp.fundName.toLowerCase().includes(searchKeyword.toLowerCase()) &&
        !(tp.notes || '').toLowerCase().includes(searchKeyword.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [tPairs, dateBounds, selectedFund, selectedType, selectedOutcome, searchKeyword]);

  // 2. Metrics Calculation for the selected filtered dataset
  const totalRounds = filteredTPairs.length;
  const winRounds = filteredTPairs.filter((tp) => tp.netProfit > 0).length;
  const lossRounds = filteredTPairs.filter((tp) => tp.netProfit < 0).length;
  const tieRounds = filteredTPairs.filter((tp) => tp.netProfit === 0).length;
  const winRate = totalRounds > 0 ? (winRounds / totalRounds) * 100 : 0;

  const totalTProfit = filteredTPairs.reduce((a, b) => a + b.netProfit, 0);
  const totalGrossProfit = filteredTPairs.reduce((a, b) => a + b.grossProfit, 0);
  const totalFees = filteredTPairs.reduce((a, b) => a + b.totalFees, 0);

  // T均值 (单笔平均T收益)
  const tMeanProfit = totalRounds > 0 ? totalTProfit / totalRounds : 0;

  // Total Turnover & Turnover Rate Calculation
  // 周转金额 = ∑ (做T卖出金额 + 买入金额)
  const totalTurnoverVolume = filteredTPairs.reduce(
    (sum, tp) => sum + (tp.buyPrice * tp.matchedQty + tp.sellPrice * tp.matchedQty),
    0
  );
  // Total Portfolio base capital (总持仓市值或总买入基数)
  const totalHoldingBaseCapital = positions.reduce(
    (sum, pos) => sum + (pos.marketValue > 0 ? pos.marketValue : pos.totalBuyAmount),
    0
  ) || 10000;
  // 周转率 % = (做T周转总交易金额 / 平均持仓本金) * 100
  const turnoverRate = (totalTurnoverVolume / totalHoldingBaseCapital) * 100;

  // Fund Ranking
  const fundRanking = useMemo(() => {
    const map = new Map<
      string,
      { code: string; name: string; count: number; winCount: number; netProfit: number; fees: number }
    >();

    filteredTPairs.forEach((tp) => {
      if (!map.has(tp.fundCode)) {
        map.set(tp.fundCode, {
          code: tp.fundCode,
          name: tp.fundName,
          count: 0,
          winCount: 0,
          netProfit: 0,
          fees: 0,
        });
      }
      const item = map.get(tp.fundCode)!;
      item.count++;
      if (tp.netProfit > 0) item.winCount++;
      item.netProfit += tp.netProfit;
      item.fees += tp.totalFees;
    });

    return Array.from(map.values()).sort((a, b) => b.netProfit - a.netProfit);
  }, [filteredTPairs]);

  // Check unpaired standalone trades count
  const unpairedTradesCount = trades.filter((t) => !t.matchedTPairId).length;

  return (
    <div className="space-y-6">
      {/* 1. Time Range Selector Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-slate-400 mr-2 flex items-center gap-1 shrink-0">
            <CalendarIcon className="w-4 h-4 text-emerald-400" />
            统计周期:
          </span>
          {(
            [
              { id: 'THIS_MONTH', label: '本月' },
              { id: '3_MONTHS', label: '近3个月' },
              { id: '6_MONTHS', label: '近6个月' },
              { id: 'THIS_YEAR', label: '本年' },
              { id: 'ALL', label: '全部' },
              { id: 'CUSTOM', label: '自定义日期' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeRange(t.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                timeRange === t.id
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Custom Date Pickers */}
        {timeRange === 'CUSTOM' && (
          <div className="flex items-center space-x-2 text-xs w-full md:w-auto bg-slate-950/60 p-2 rounded-xl border border-slate-800">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs"
            />
            <span className="text-slate-500">至</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs"
            />
          </div>
        )}
      </div>

      {/* 2. Top Metric Matrix (T收益、胜率、笔数W/T、手续费、周转率、T均值) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* T收益 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            T收益 (净获利)
          </span>
          <div
            className={`text-xl sm:text-2xl font-black mt-1 ${
              totalTProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatMoney(totalTProfit, true)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            毛利: {formatMoney(totalGrossProfit)}
          </span>
        </div>

        {/* 胜率 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
            <Percent className="w-3.5 h-3.5 text-amber-400" />
            做T胜率
          </span>
          <div className="text-xl sm:text-2xl font-bold text-amber-400 mt-1">
            {winRate.toFixed(1)}%
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {winRounds}胜 / {lossRounds}负 / {tieRounds}平
          </span>
        </div>

        {/* 笔数 W/T */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            笔数 (W/T)
          </span>
          <div className="text-xl sm:text-2xl font-bold text-white mt-1">
            {winRounds} <span className="text-xs font-normal text-slate-400">/ {totalRounds} 笔</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">盈利笔数 / 总做T笔数</span>
        </div>

        {/* 手续费 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-slate-400" />
            交易手续费
          </span>
          <div className="text-xl sm:text-2xl font-bold text-slate-200 mt-1">
            {formatMoney(totalFees)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">买卖双边佣金</span>
        </div>

        {/* 周转率 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-teal-400" />
            资金周转率
          </span>
          <div className="text-xl sm:text-2xl font-bold text-teal-300 mt-1">
            {turnoverRate.toFixed(1)}%
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            周转额: {formatMoney(totalTurnoverVolume)}
          </span>
        </div>

        {/* T均值 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-indigo-400" />
            T均值 (单笔均利)
          </span>
          <div
            className={`text-xl sm:text-2xl font-bold mt-1 ${
              tMeanProfit >= 0 ? 'text-indigo-400' : 'text-rose-400'
            }`}
          >
            {formatMoney(tMeanProfit, true)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">单笔期望收益</span>
        </div>
      </div>

      {/* Auto Pairing Tool Callout */}
      {unpairedTradesCount > 1 && (
        <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                检测到 {unpairedTradesCount} 笔未匹配的买卖委托
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                可一键按先进先出 (FIFO) 算法自动匹配成对做T，并计算套利净获利。
              </p>
            </div>
          </div>
          <button
            id="tstats-auto-pair-btn"
            onClick={onAutoPairFIFO}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className="w-4 h-4" />
            <span>智能自动配对做T</span>
          </button>
        </div>
      )}

      {/* T-Pairs List & Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              做T成对套利明细 ({filteredTPairs.length} 笔)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              记录每笔做T的买入/卖出价格、手续费及净获利
            </p>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Fund Selector */}
            <select
              value={selectedFund}
              onChange={(e) => setSelectedFund(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">全部标的 ({uniqueFunds.length})</option>
              {uniqueFunds.map((f) => (
                <option key={f.code} value={f.code}>
                  {f.code} {f.name}
                </option>
              ))}
            </select>

            {/* Type Selector */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">全部T类型</option>
              <option value="POSITIVE_T">正T (先买后卖)</option>
              <option value="REVERSE_T">倒T (先卖后买)</option>
            </select>

            {/* Outcome Selector */}
            <select
              value={selectedOutcome}
              onChange={(e) => setSelectedOutcome(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">全部盈亏</option>
              <option value="WIN">盈利做T</option>
              <option value="LOSS">亏损做T</option>
            </select>

            {/* Search */}
            <div className="relative flex-1 sm:w-44">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索备注/代码..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* List of T-Pairs */}
        <div className="mt-5 space-y-3">
          {filteredTPairs.length === 0 ? (
            <div className="text-center py-16 text-slate-500 border border-dashed border-slate-800 rounded-xl">
              <p className="text-sm">当前筛选条件下暂无做T记录</p>
              <button
                onClick={onNavigateToEntry}
                className="mt-3 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl cursor-pointer"
              >
                立即录入做T
              </button>
            </div>
          ) : (
            filteredTPairs.map((tp) => {
              const isProfit = tp.netProfit >= 0;

              return (
                <div
                  key={tp.id}
                  id={`tpair-item-${tp.id}`}
                  className="bg-slate-800/60 hover:bg-slate-800/90 border border-slate-700/70 hover:border-slate-600 rounded-2xl p-4 transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left: Fund info & Trade side details */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs px-2 py-0.5 bg-slate-700 text-slate-200 rounded font-bold">
                        {tp.fundCode}
                      </span>
                      <h3 className="text-base font-bold text-white">{tp.fundName}</h3>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          tp.tType === 'POSITIVE_T'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}
                      >
                        {tp.tType === 'POSITIVE_T' ? '正T (先买后卖)' : '倒T (先卖后买)'}
                      </span>
                    </div>

                    {/* Trade Pair Details Box */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mt-3 text-xs bg-slate-900/60 rounded-xl p-3 border border-slate-800">
                      {/* Buy leg */}
                      <div className="flex items-start justify-between border-b sm:border-b-0 sm:border-r border-slate-800 pb-2 sm:pb-0 sm:pr-4">
                        <div>
                          <span className="text-[10px] text-rose-400 font-bold uppercase block">
                            买入端 ({tp.buyDate} {tp.buyTime || ''})
                          </span>
                          <div className="font-bold text-slate-200 mt-0.5">
                            ¥{tp.buyPrice.toFixed(3)} × {tp.buyQty}份
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          佣金: ¥{tp.buyFee.toFixed(2)}
                        </span>
                      </div>

                      {/* Sell leg */}
                      <div className="flex items-start justify-between pt-2 sm:pt-0 sm:pl-2">
                        <div>
                          <span className="text-[10px] text-emerald-400 font-bold uppercase block">
                            卖出端 ({tp.sellDate} {tp.sellTime || ''})
                          </span>
                          <div className="font-bold text-slate-200 mt-0.5">
                            ¥{tp.sellPrice.toFixed(3)} × {tp.sellQty}份
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          佣金: ¥{tp.sellFee.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Notes */}
                    {tp.notes && (
                      <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
                        <span className="text-slate-500">备注:</span>
                        <span>{tp.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Profit & Action */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-slate-700/60 pt-3 sm:pt-0 shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-400 block">做T净获利</span>
                      <div
                        className={`text-xl sm:text-2xl font-black ${
                          isProfit ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {formatMoney(tp.netProfit, true)}
                      </div>
                      <span
                        className={`text-xs font-bold ${
                          isProfit ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {formatPercent(tp.profitRate, true)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      {onEditTPair && (
                        <button
                          onClick={() => onEditTPair(tp)}
                          title="修改该做T记录"
                          className="text-slate-400 hover:text-cyan-400 p-2 rounded-lg hover:bg-cyan-500/10 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteTPair(tp.id)}
                        title="删除该做T记录"
                        className="text-slate-500 hover:text-rose-400 p-2 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Fund T-Profit Leaderboard */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-md">
        <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-amber-400" />
          各标的做T获利排行榜
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">标的代码/名称</th>
                <th className="px-4 py-3">做T次数</th>
                <th className="px-4 py-3">做T胜率</th>
                <th className="px-4 py-3">累计总佣金</th>
                <th className="px-4 py-3 text-right rounded-r-xl">做T累计净收益</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {fundRanking.map((f, idx) => (
                <tr key={f.code} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-white flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <span>{f.name}</span>
                    <span className="font-mono text-slate-400">({f.code})</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-semibold">{f.count} 次</td>
                  <td className="px-4 py-3 text-amber-400 font-bold">
                    {((f.winCount / f.count) * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono">
                    {formatMoney(f.fees)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-400 text-sm font-mono">
                    {formatMoney(f.netProfit, true)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
