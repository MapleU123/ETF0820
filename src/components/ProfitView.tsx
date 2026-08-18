import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  BarChart3,
  Calendar as CalendarIcon,
  Percent,
  Coins,
  Activity,
  Layers,
  Award,
  ChevronLeft,
  ChevronRight,
  Clock,
  Zap,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TPairRecord, DividendRecord, TradeRecord, PositionSummary } from '../types';
import { formatMoney, formatPercent } from '../utils/calculations';

interface ProfitViewProps {
  tPairs: TPairRecord[];
  trades: TradeRecord[];
  dividends: DividendRecord[];
  positions: PositionSummary[];
}

type ProfitTimeRange = 'THIS_MONTH' | '3_MONTHS' | '6_MONTHS' | 'THIS_YEAR' | 'ALL';

export const ProfitView: React.FC<ProfitViewProps> = ({
  tPairs,
  trades,
  dividends,
  positions,
}) => {
  const [timeRange, setTimeRange] = useState<ProfitTimeRange>('ALL');
  const [calendarYear, setCalendarYear] = useState<number>(() => new Date().getFullYear());
  const [curveMetric, setCurveMetric] = useState<'AMOUNT' | 'RATE'>('AMOUNT'); // 金额收益 / 金额收益率

  // 1. Date filter bounds
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
    return { start: '', end: '' }; // ALL
  }, [timeRange]);

  // Filtered dataset for selected time range
  const filteredTPairs = useMemo(() => {
    return tPairs.filter((tp) => {
      const d = tp.sellDate || tp.buyDate;
      if (dateBounds.start && d < dateBounds.start) return false;
      if (dateBounds.end && d > dateBounds.end) return false;
      return true;
    });
  }, [tPairs, dateBounds]);

  const filteredDividends = useMemo(() => {
    return dividends.filter((div) => {
      if (dateBounds.start && div.date < dateBounds.start) return false;
      if (dateBounds.end && div.date > dateBounds.end) return false;
      return true;
    });
  }, [dividends, dateBounds]);

  const filteredTrades = useMemo(() => {
    return trades.filter((tr) => {
      if (dateBounds.start && tr.date < dateBounds.start) return false;
      if (dateBounds.end && tr.date > dateBounds.end) return false;
      return true;
    });
  }, [trades, dateBounds]);

  // 2. Metrics: 总天数、收益金额、总买入金额、金额收益率
  // Calculate total trading/activity days
  const activeDaysSet = useMemo(() => {
    const set = new Set<string>();
    filteredTPairs.forEach((tp) => {
      set.add(tp.sellDate || tp.buyDate);
      if (tp.buyDate) set.add(tp.buyDate);
    });
    filteredDividends.forEach((d) => set.add(d.date));
    filteredTrades.forEach((t) => set.add(t.date));
    return set;
  }, [filteredTPairs, filteredDividends, filteredTrades]);

  const totalDaysCount = activeDaysSet.size;

  // 收益金额 = ∑做T净利润 + ∑分红
  const totalTProfit = filteredTPairs.reduce((a, b) => a + b.netProfit, 0);
  const totalDividendAmount = filteredDividends.reduce((a, b) => a + b.totalAmount, 0);
  const totalProfitAmount = totalTProfit + totalDividendAmount;

  // 总买入金额 = ∑对应买入金额 (所有买入委托金额)
  const totalBuyAmount = useMemo(() => {
    const buyTrades = filteredTrades.filter((t) => t.type === 'BUY');
    const buyFromTrades = buyTrades.reduce((sum, t) => sum + t.amount, 0);
    if (buyFromTrades > 0) return buyFromTrades;

    // Fallback from T-pairs buy amount
    return filteredTPairs.reduce((sum, tp) => sum + tp.buyPrice * tp.buyQty, 0) || 10000;
  }, [filteredTrades, filteredTPairs]);

  // 金额收益率 = (累积T收益 / 总买入金额) * 100
  const amountProfitRate = totalBuyAmount > 0 ? (totalProfitAmount / totalBuyAmount) * 100 : 0;

  // 3. Profit Curve Data (金额收益率、收益金额)
  const profitCurveData = useMemo(() => {
    const dateMap = new Map<string, { profit: number; buyAmount: number }>();

    filteredTPairs.forEach((tp) => {
      const d = tp.sellDate || tp.buyDate;
      if (!dateMap.has(d)) dateMap.set(d, { profit: 0, buyAmount: 0 });
      const item = dateMap.get(d)!;
      item.profit += tp.netProfit;
      item.buyAmount += tp.buyPrice * tp.buyQty;
    });

    filteredDividends.forEach((div) => {
      if (!dateMap.has(div.date)) dateMap.set(div.date, { profit: 0, buyAmount: 0 });
      dateMap.get(div.date)!.profit += div.totalAmount;
    });

    filteredTrades.forEach((tr) => {
      if (tr.type === 'BUY') {
        if (!dateMap.has(tr.date)) dateMap.set(tr.date, { profit: 0, buyAmount: 0 });
        dateMap.get(tr.date)!.buyAmount += tr.amount;
      }
    });

    const sortedDates = Array.from(dateMap.keys()).sort();
    let runningProfit = 0;
    let runningBuyAmount = 0;

    return sortedDates.map((date) => {
      const item = dateMap.get(date)!;
      runningProfit += item.profit;
      runningBuyAmount += item.buyAmount;
      const baseBuy = runningBuyAmount > 0 ? runningBuyAmount : (totalBuyAmount || 10000);
      const runningRate = (runningProfit / baseBuy) * 100;

      return {
        date,
        dayProfit: Math.round(item.profit * 100) / 100,
        收益金额: Math.round(runningProfit * 100) / 100,
        金额收益率: Math.round(runningRate * 100) / 100,
      };
    });
  }, [filteredTPairs, filteredDividends, filteredTrades, totalBuyAmount]);

  // 4. Monthly Calendar for the Selected Year (12 months, Red for Positive, Green for Negative)
  const yearly12MonthsData = useMemo(() => {
    const yearPrefix = `${calendarYear}-`;
    const months = Array.from({ length: 12 }, (_, i) => {
      const mNum = i + 1;
      const mStr = `${calendarYear}-${String(mNum).padStart(2, '0')}`;
      return {
        monthIndex: mNum,
        monthStr: `${mNum}月`,
        monthKey: mStr,
        tProfit: 0,
        dividends: 0,
        totalProfit: 0,
        count: 0,
        winCount: 0,
        buyAmount: 0,
      };
    });

    tPairs.forEach((tp) => {
      const d = tp.sellDate || tp.buyDate;
      if (d.startsWith(yearPrefix)) {
        const mIdx = parseInt(d.substring(5, 7), 10) - 1;
        if (months[mIdx]) {
          months[mIdx].tProfit += tp.netProfit;
          months[mIdx].totalProfit += tp.netProfit;
          months[mIdx].count++;
          if (tp.netProfit > 0) months[mIdx].winCount++;
          months[mIdx].buyAmount += tp.buyPrice * tp.buyQty;
        }
      }
    });

    dividends.forEach((div) => {
      if (div.date.startsWith(yearPrefix)) {
        const mIdx = parseInt(div.date.substring(5, 7), 10) - 1;
        if (months[mIdx]) {
          months[mIdx].dividends += div.totalAmount;
          months[mIdx].totalProfit += div.totalAmount;
        }
      }
    });

    return months;
  }, [tPairs, dividends, calendarYear]);

  // 5. 做T持仓分布 (T+0 核心指标统计：根据当前筛选周期内录入的全部做T数据进行统计叠加)
  const tPlusZeroStat = useMemo(() => {
    // 统计录入的全部做T数据叠加
    const count = filteredTPairs.length;
    const winCount = filteredTPairs.filter((tp) => tp.netProfit > 0).length;
    const winRate = count > 0 ? (winCount / count) * 100 : 0;
    const netProfit = filteredTPairs.reduce((sum, tp) => sum + tp.netProfit, 0);

    // 统计做T交易涉及的交易日数
    const tradingDaysSet = new Set(filteredTPairs.map((tp) => tp.sellDate || tp.buyDate));
    const daysCount = Math.max(1, tradingDaysSet.size);
    const dailyAvgProfit = count > 0 ? netProfit / daysCount : 0;

    return {
      count,
      winCount,
      winRate,
      netProfit,
      dailyAvgProfit,
      daysCount,
      days: daysCount,
    };
  }, [filteredTPairs]);

  const tPlusZeroStats = tPlusZeroStat;

  return (
    <div className="space-y-6">
      {/* 1. Time Filter Tabs Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-slate-400 mr-2 flex items-center gap-1 shrink-0">
            <CalendarIcon className="w-4 h-4 text-emerald-400" />
            收益分析周期:
          </span>
          {(
            [
              { id: 'THIS_MONTH', label: '本月' },
              { id: '3_MONTHS', label: '近3个月' },
              { id: '6_MONTHS', label: '近6个月' },
              { id: 'THIS_YEAR', label: '本年' },
              { id: 'ALL', label: '全部' },
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

        <div className="text-xs text-slate-400">
          已筛选 <strong className="text-emerald-400">{filteredTPairs.length}</strong> 笔做T套利
        </div>
      </div>

      {/* 2. Top Highlights: 总天数、金额收益率、收益金额、总买入金额 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* 总天数 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            总交易天数
          </span>
          <div className="text-2xl sm:text-3xl font-black text-white mt-1 font-mono">
            {totalDaysCount} <span className="text-xs font-normal text-slate-400">天</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">活跃做T与交易日</span>
        </div>

        {/* 收益金额 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-emerald-400" />
            收益金额 (净落袋)
          </span>
          <div
            className={`text-2xl sm:text-3xl font-black mt-1 ${
              totalProfitAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatMoney(totalProfitAmount, true)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            做T净利 {formatMoney(totalTProfit)} + 分红 {formatMoney(totalDividendAmount)}
          </span>
        </div>

        {/* 金额收益率 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
            <Percent className="w-3.5 h-3.5 text-amber-400" />
            金额收益率
          </span>
          <div
            className={`text-2xl sm:text-3xl font-black mt-1 ${
              amountProfitRate >= 0 ? 'text-amber-400' : 'text-rose-400'
            }`}
          >
            {formatPercent(amountProfitRate, true)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">累积T收益 / 总买入金额</span>
        </div>

        {/* 总买入金额基数 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-teal-400" />
            累计买入本金
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-slate-200 mt-1 font-mono">
            {formatMoney(totalBuyAmount)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">用于计算收益率的本金</span>
        </div>
      </div>

      {/* 3. T+0 横柱子统计: 成交笔数、胜率、日均收益 */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-md">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              T+0 核心指标横向总览
            </h3>
          </div>
          <span className="text-xs text-slate-400">当日买入当日卖出套利</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3">
            <span className="text-slate-400 block text-[11px]">T+0 成交笔数</span>
            <span className="text-xl font-bold text-white font-mono mt-0.5 block">
              {tPlusZeroStats.count} 笔
            </span>
            <span className="text-[10px] text-slate-500">
              占总做T笔数的{' '}
              {filteredTPairs.length > 0
                ? ((tPlusZeroStats.count / filteredTPairs.length) * 100).toFixed(1)
                : 0}
              %
            </span>
          </div>

          <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3">
            <span className="text-slate-400 block text-[11px]">T+0 胜率</span>
            <span className="text-xl font-bold text-amber-400 font-mono mt-0.5 block">
              {tPlusZeroStats.winRate.toFixed(1)}%
            </span>
            <span className="text-[10px] text-slate-500">
              {tPlusZeroStats.winCount} 盈利 / {tPlusZeroStats.count - tPlusZeroStats.winCount} 亏损
            </span>
          </div>

          <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3">
            <span className="text-slate-400 block text-[11px]">T+0 累计获利</span>
            <span
              className={`text-xl font-bold font-mono mt-0.5 block ${
                tPlusZeroStats.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatMoney(tPlusZeroStats.netProfit, true)}
            </span>
            <span className="text-[10px] text-slate-500">已扣除双边手续费</span>
          </div>

          <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3">
            <span className="text-slate-400 block text-[11px]">T+0 日均收益</span>
            <span
              className={`text-xl font-bold font-mono mt-0.5 block ${
                tPlusZeroStats.dailyAvgProfit >= 0 ? 'text-teal-300' : 'text-rose-400'
              }`}
            >
              {formatMoney(tPlusZeroStats.dailyAvgProfit, true)} / 天
            </span>
            <span className="text-[10px] text-slate-500">
              基于 {tPlusZeroStats.days} 个活跃做T日
            </span>
          </div>
        </div>
      </div>

      {/* 4. Profit Curve (收益曲线: 金额收益率 vs 收益金额) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              收益走势曲线 ({curveMetric === 'AMOUNT' ? '收益金额' : '金额收益率'})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              按时间轴追踪累积做T收益与金额收益率变化
            </p>
          </div>

          {/* Metric Switcher */}
          <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setCurveMetric('AMOUNT')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                curveMetric === 'AMOUNT'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              收益金额 (元)
            </button>
            <button
              onClick={() => setCurveMetric('RATE')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                curveMetric === 'RATE'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              金额收益率 (%)
            </button>
          </div>
        </div>

        <div className="h-72 w-full">
          {profitCurveData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
              暂无收益曲线数据
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={profitCurveData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="curveColor" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={curveMetric === 'AMOUNT' ? '#10b981' : '#f59e0b'}
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="95%"
                      stopColor={curveMetric === 'AMOUNT' ? '#10b981' : '#f59e0b'}
                      stopOpacity={0.0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  unit={curveMetric === 'AMOUNT' ? '¥' : '%'}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => [
                    curveMetric === 'AMOUNT'
                      ? `¥${Number(value).toFixed(2)}`
                      : `${Number(value).toFixed(2)}%`,
                    curveMetric === 'AMOUNT' ? '累积收益金额' : '金额收益率',
                  ]}
                  labelFormatter={(label) => `日期: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey={curveMetric === 'AMOUNT' ? '收益金额' : '金额收益率'}
                  stroke={curveMetric === 'AMOUNT' ? '#10b981' : '#f59e0b'}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#curveColor)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 5. 12-Month Calendar Grid for Current/Selected Year (Red positive, Green negative) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-md">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-emerald-400" />
              {calendarYear} 年12个月份收益日历
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              遵循国内A股惯例：<span className="text-rose-400 font-bold">正收益为红色</span>，
              <span className="text-emerald-400 font-bold">负收益为绿色</span>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCalendarYear((y) => y - 1)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-white px-2 font-mono">{calendarYear} 年</span>
            <button
              onClick={() => setCalendarYear((y) => y + 1)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 12 Month Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {yearly12MonthsData.map((m) => {
            const hasData = m.count > 0 || m.dividends > 0;
            const isPositive = m.totalProfit > 0;
            const isNegative = m.totalProfit < 0;

            // Domestic A-Share Color Code: Red for Positive (+), Green for Negative (-)
            const cardBg = !hasData
              ? 'bg-slate-950/40 border-slate-800/60'
              : isPositive
              ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500/70'
              : isNegative
              ? 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-500/70'
              : 'bg-slate-800/40 border-slate-700';

            const profitColor = isPositive
              ? 'text-rose-400'
              : isNegative
              ? 'text-emerald-400'
              : 'text-slate-400';

            return (
              <div
                key={m.monthKey}
                className={`p-4 rounded-2xl border transition-all ${cardBg} flex flex-col justify-between`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{m.monthStr}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                    {m.count} 笔做T
                  </span>
                </div>

                <div className="my-3">
                  <div className={`text-xl font-bold font-mono ${profitColor}`}>
                    {hasData ? formatMoney(m.totalProfit, true) : '¥0.00'}
                  </div>
                  {hasData && (
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      胜率: {m.count > 0 ? ((m.winCount / m.count) * 100).toFixed(0) : 0}%
                    </span>
                  )}
                </div>

                <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800/60 flex justify-between">
                  <span>分红: {formatMoney(m.dividends)}</span>
                  <span>做T: {formatMoney(m.tProfit)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. 做T持仓分布 (横向柱子展示: 左侧外T+0，柱内左端做T笔数，柱内右端胜率，右侧外日均收益) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              做T持仓分布
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              日内T+0交易频率、胜率表现及日均做T收益核算
            </p>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span>A股惯例：正收益为<span className="text-rose-400 font-bold">红字</span>，负收益为<span className="text-emerald-400 font-bold">绿字</span></span>
          </div>
        </div>

        {/* Horizontal Bar Layout: Only T+0 Single Bar */}
        <div className="py-2">
          {/* Main Featured T+0 Bar */}
          <div className="flex items-center gap-3 sm:gap-4 w-full">
            {/* 柱子外的左侧: T+0 */}
            <div className="w-10 sm:w-14 text-sm sm:text-base font-black text-slate-100 font-mono shrink-0">
              T+0
            </div>

            {/* 一根横向的柱子 */}
            <div className="flex-1 bg-slate-950/90 border border-slate-800/80 rounded-xl h-10 sm:h-11 relative overflow-hidden flex items-center shadow-inner">
              {/* 柱子内背景填充 (根据做T胜率填充比例) */}
              <div
                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-emerald-500/35 via-teal-500/45 to-cyan-500/45 border-r-2 border-cyan-400/90 transition-all duration-500 rounded-l-xl"
                style={{
                  width: `${tPlusZeroStat.count > 0 ? Math.max(tPlusZeroStat.winRate, 8) : 0}%`,
                }}
              />

              {/* 柱子内的文字层 */}
              <div className="relative z-10 w-full px-3.5 sm:px-4 flex items-center justify-between pointer-events-none">
                {/* 柱子左端上: 做了几笔T (如: 5笔) */}
                <span className="text-xs sm:text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{tPlusZeroStat.count}笔</span>
                </span>

                {/* 柱子右侧: 胜率 (如: 胜100%) */}
                <span className="text-xs sm:text-sm font-bold text-cyan-300 font-mono tracking-tight">
                  胜{tPlusZeroStat.winRate.toFixed(0)}%
                </span>
              </div>
            </div>

            {/* 柱子外的右侧: 日均收益 (正收益为红字，负收益绿字，例：均+7.9) */}
            <div
              className={`w-20 sm:w-24 text-right text-sm sm:text-base font-black font-mono shrink-0 ${
                tPlusZeroStat.dailyAvgProfit >= 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {`均${tPlusZeroStat.dailyAvgProfit >= 0 ? '+' : ''}${tPlusZeroStat.dailyAvgProfit.toFixed(1)}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
