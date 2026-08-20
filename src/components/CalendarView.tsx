import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Zap,
  TrendingUp,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  CheckCircle2,
  Info,
  Layers,
  Edit2,
  Trash2,
} from 'lucide-react';
import { TradeRecord, TPairRecord, DividendRecord } from '../types';
import { formatMoney } from '../utils/calculations';

interface CalendarViewProps {
  trades: TradeRecord[];
  tPairs: TPairRecord[];
  dividends: DividendRecord[];
  onNavigateToEntryWithDate: (date: string) => void;
  onDeleteTPair: (id: string) => void;
  onDeleteTrade: (id: string) => void;
  onDeleteDividend?: (id: string) => void;
  onEditTPair?: (tPair: TPairRecord) => void;
  onEditTrade?: (trade: TradeRecord) => void;
  onEditDividend?: (dividend: DividendRecord) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  trades,
  tPairs,
  dividends,
  onNavigateToEntryWithDate,
  onDeleteTPair,
  onDeleteTrade,
  onDeleteDividend,
  onEditTPair,
  onEditTrade,
  onEditDividend,
}) => {
  // Current calendar viewing month
  const [currentDate, setCurrentDate] = useState(() => {
    // Default to current date or latest trade month
    if (tPairs.length > 0) {
      const latestDate = [...tPairs].sort((a, b) => b.sellDate.localeCompare(a.sellDate))[0]?.sellDate;
      if (latestDate) return new Date(latestDate);
    }
    return new Date();
  });

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  // Keep calendar month aligned with latest input if records are dynamically updated
  useEffect(() => {
    // Check latest record date across tPairs, trades, dividends
    const dates: string[] = [];
    tPairs.forEach((tp) => {
      if (tp.sellDate) dates.push(tp.sellDate);
      if (tp.buyDate) dates.push(tp.buyDate);
    });
    trades.forEach((tr) => {
      if (tr.date) dates.push(tr.date);
    });
    dividends.forEach((d) => {
      if (d.date) dates.push(d.date);
    });

    if (dates.length > 0) {
      const sortedDates = dates.sort((a, b) => b.localeCompare(a));
      const latestDate = sortedDates[0];
      if (latestDate) {
        const parts = latestDate.split('-');
        if (parts.length >= 2) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          if (!isNaN(y) && !isNaN(m)) {
            setCurrentDate(new Date(y, m, 1));
          }
        }
        setSelectedDate(latestDate);
      }
    }
  }, [tPairs.length, trades.length, dividends.length]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today.toISOString().split('T')[0]);
  };

  // Map data by date (YYYY-MM-DD)
  const dailyDataMap = useMemo(() => {
    const map = new Map<
      string,
      {
        tPairs: TPairRecord[];
        trades: TradeRecord[];
        dividends: DividendRecord[];
        netProfit: number;
        grossProfit: number;
        totalFees: number;
      }
    >();

    tPairs.forEach((tp) => {
      // Attribute profit to sellDate (when the T is realized)
      const dateKey = tp.sellDate || tp.buyDate;
      if (!map.has(dateKey)) {
        map.set(dateKey, {
          tPairs: [],
          trades: [],
          dividends: [],
          netProfit: 0,
          grossProfit: 0,
          totalFees: 0,
        });
      }
      const item = map.get(dateKey)!;
      item.tPairs.push(tp);
      item.netProfit += tp.netProfit;
      item.grossProfit += tp.grossProfit;
      item.totalFees += tp.totalFees;
    });

    trades.forEach((tr) => {
      const dateKey = tr.date;
      if (!map.has(dateKey)) {
        map.set(dateKey, {
          tPairs: [],
          trades: [],
          dividends: [],
          netProfit: 0,
          grossProfit: 0,
          totalFees: 0,
        });
      }
      map.get(dateKey)!.trades.push(tr);
    });

    dividends.forEach((div) => {
      const dateKey = div.date;
      if (!map.has(dateKey)) {
        map.set(dateKey, {
          tPairs: [],
          trades: [],
          dividends: [],
          netProfit: 0,
          grossProfit: 0,
          totalFees: 0,
        });
      }
      map.get(dateKey)!.dividends.push(div);
    });

    return map;
  }, [trades, tPairs, dividends]);

  // Days in current month calculations
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday, 1 is Monday...
  // Convert so Monday is 0, Sunday is 6
  const adjustedFirstDay = (firstDayIndex + 6) % 7;

  // Monthly summary metrics
  const monthlySummary = useMemo(() => {
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    let mTPairsCount = 0;
    let mNetProfit = 0;
    let mWinningCount = 0;
    let mDividends = 0;
    let maxProfitDay = { date: '', profit: 0 };

    dailyDataMap.forEach((val, dateKey) => {
      if (dateKey.startsWith(monthPrefix)) {
        mTPairsCount += val.tPairs.length;
        mNetProfit += val.netProfit;
        val.tPairs.forEach((tp) => {
          if (tp.netProfit > 0) mWinningCount++;
        });
        val.dividends.forEach((d) => {
          mDividends += d.totalAmount;
        });

        if (val.netProfit > maxProfitDay.profit) {
          maxProfitDay = { date: dateKey, profit: val.netProfit };
        }
      }
    });

    const winRate = mTPairsCount > 0 ? (mWinningCount / mTPairsCount) * 100 : 0;

    return {
      monthPrefix,
      tPairsCount: mTPairsCount,
      netProfit: mNetProfit,
      winRate,
      dividends: mDividends,
      maxProfitDay,
    };
  }, [dailyDataMap, year, month]);

  // Selected date details
  const selectedDayDetails = useMemo(() => {
    return dailyDataMap.get(selectedDate) || {
      tPairs: [],
      trades: [],
      dividends: [],
      netProfit: 0,
      grossProfit: 0,
      totalFees: 0,
    };
  }, [dailyDataMap, selectedDate]);

  const weekDayLabels = ['一', '二', '三', '四', '五', '六', '日'];

  return (
    <div className="space-y-6">
      {/* Month Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-400">
            {year}年{month + 1}月做T获利
          </span>
          <div className="text-xl sm:text-2xl font-bold mt-1 flex items-baseline gap-1">
            <span
              className={
                monthlySummary.netProfit > 0
                  ? 'text-emerald-400'
                  : monthlySummary.netProfit < 0
                  ? 'text-rose-400'
                  : 'text-slate-200'
              }
            >
              {formatMoney(monthlySummary.netProfit, true)}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {monthlySummary.tPairsCount} 笔已实现套利
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-400">当月做T胜率</span>
          <div className="text-xl sm:text-2xl font-bold text-amber-400 mt-1">
            {monthlySummary.winRate.toFixed(1)}%
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            胜率 = 获利做T次数 / 总T次数
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-400">当月分红收益</span>
          <div className="text-xl sm:text-2xl font-bold text-cyan-400 mt-1">
            {formatMoney(monthlySummary.dividends)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            现金及红利再投资
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-400">单日最高做T盈利</span>
          <div className="text-xl sm:text-2xl font-bold text-teal-300 mt-1">
            {monthlySummary.maxProfitDay.profit > 0
              ? formatMoney(monthlySummary.maxProfitDay.profit, true)
              : '¥0.00'}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {monthlySummary.maxProfitDay.date || '暂无高收益日'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Calendar Grid */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-md">
          {/* Calendar Header Controls */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2">
                {/* Quick Year Selector */}
                <select
                  value={year}
                  onChange={(e) => setCurrentDate(new Date(Number(e.target.value), month, 1))}
                  className="bg-slate-800 border border-slate-700 text-white font-bold text-base sm:text-lg rounded-lg px-2 py-1 outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 3 + i).map((y) => (
                    <option key={y} value={y} className="bg-slate-900 text-white">
                      {y}年
                    </option>
                  ))}
                </select>

                {/* Quick Month Selector */}
                <select
                  value={month}
                  onChange={(e) => setCurrentDate(new Date(year, Number(e.target.value), 1))}
                  className="bg-slate-800 border border-slate-700 text-white font-bold text-base sm:text-lg rounded-lg px-2 py-1 outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {monthNames.map((name, idx) => (
                    <option key={name} value={idx} className="bg-slate-900 text-white">
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                id="cal-today-btn"
                onClick={handleToday}
                className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                今天
              </button>
              <div className="flex items-center bg-slate-800/80 rounded-lg border border-slate-700 p-0.5">
                <button
                  id="cal-prev-btn"
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition-colors cursor-pointer"
                  title="上一月"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  id="cal-next-btn"
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition-colors cursor-pointer"
                  title="下一月"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Weekday Header */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 my-3 text-center">
            {weekDayLabels.map((w, idx) => (
              <div
                key={w}
                className={`text-xs font-semibold py-1.5 rounded ${
                  idx >= 5 ? 'text-slate-500 bg-slate-800/30' : 'text-slate-400'
                }`}
              >
                周{w}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Empty offset blocks for first day */}
            {Array.from({ length: adjustedFirstDay }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="h-20 sm:h-24 bg-slate-950/40 rounded-xl border border-slate-800/30 opacity-40"
              />
            ))}

            {/* Days of Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayData = dailyDataMap.get(dateStr);
              const isSelected = selectedDate === dateStr;
              const isToday = new Date().toISOString().split('T')[0] === dateStr;
              const dayOfWeek = (adjustedFirstDay + i) % 7;
              const isWeekend = dayOfWeek >= 5;

              const hasTPairs = dayData && dayData.tPairs.length > 0;
              const hasTrades = dayData && dayData.trades.length > 0;
              const hasDividends = dayData && dayData.dividends.length > 0;

              return (
                <div
                  key={dateStr}
                  id={`cal-day-${dateStr}`}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`h-20 sm:h-24 p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between relative group ${
                    isSelected
                      ? 'bg-slate-800/90 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg'
                      : isToday
                      ? 'bg-slate-800/50 border-cyan-500/60'
                      : isWeekend
                      ? 'bg-slate-950/60 border-slate-800/60 hover:border-slate-700'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  {/* Top Bar: Date Number & Badges */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                        isToday
                          ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-sm'
                          : isSelected
                          ? 'bg-emerald-500 text-slate-950'
                          : isWeekend
                          ? 'text-slate-500'
                          : 'text-slate-300'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {/* Indicators */}
                    <div className="flex items-center space-x-1">
                      {hasDividends && (
                        <span
                          title="有分红记录"
                          className="w-2 h-2 rounded-full bg-cyan-400 inline-block shadow-sm shadow-cyan-400/50"
                        />
                      )}
                      {hasTrades && (
                        <span
                          title={`${dayData.trades.length} 笔委托成交`}
                          className="text-[10px] text-slate-400 font-medium"
                        >
                          {dayData.trades.length}单
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle / Bottom: Realized Net T-Profit */}
                  <div className="mt-auto text-right">
                    {hasTPairs ? (
                      <div className="animate-in fade-in duration-200">
                        <span
                          className={`text-[11px] sm:text-xs font-bold block truncate ${
                            dayData.netProfit > 0
                              ? 'text-emerald-400'
                              : dayData.netProfit < 0
                              ? 'text-rose-400'
                              : 'text-slate-300'
                          }`}
                        >
                          {dayData.netProfit > 0
                            ? `+¥${Math.round(dayData.netProfit)}`
                            : `¥${Math.round(dayData.netProfit)}`}
                        </span>
                        <span className="text-[9px] text-slate-400 block font-normal">
                          {dayData.tPairs.length} 笔做T
                        </span>
                      </div>
                    ) : hasDividends ? (
                      <div className="text-cyan-300 text-[10px] font-semibold">
                        +¥{Math.round(dayData.dividends.reduce((a, b) => a + b.totalAmount, 0))}分红
                      </div>
                    ) : hasTrades ? (
                      <span className="text-[10px] text-slate-500">有委托</span>
                    ) : (
                      <span className="text-[10px] text-slate-700/60 group-hover:text-slate-600">
                        无交易
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Detail Drawer */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  日期详情
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {selectedDate}
                </h3>
              </div>
              <button
                id="cal-add-trade-for-date-btn"
                onClick={() => onNavigateToEntryWithDate(selectedDate)}
                className="px-2.5 py-1.5 text-xs font-semibold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-sm shadow-emerald-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>补录做T</span>
              </button>
            </div>

            {/* Daily Stat Summary */}
            <div className="grid grid-cols-2 gap-2 my-4">
              <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3">
                <span className="text-[11px] text-slate-400">当日做T净收益</span>
                <div
                  className={`text-lg font-bold mt-0.5 ${
                    selectedDayDetails.netProfit > 0
                      ? 'text-emerald-400'
                      : selectedDayDetails.netProfit < 0
                      ? 'text-rose-400'
                      : 'text-slate-300'
                  }`}
                >
                  {formatMoney(selectedDayDetails.netProfit, true)}
                </div>
              </div>
              <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3">
                <span className="text-[11px] text-slate-400">当日总手续费</span>
                <div className="text-lg font-bold text-slate-300 mt-0.5">
                  {formatMoney(selectedDayDetails.totalFees)}
                </div>
              </div>
            </div>

            {/* Records List for Selected Day */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {/* T-Pairs */}
              {selectedDayDetails.tPairs.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>已完成做T套利 ({selectedDayDetails.tPairs.length} 笔)</span>
                  </h4>
                  <div className="space-y-2">
                    {selectedDayDetails.tPairs.map((tp) => (
                      <div
                        key={tp.id}
                        className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3 hover:border-slate-600 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-white text-sm">
                                {tp.fundName}
                              </span>
                              <span className="text-xs font-mono text-slate-400">
                                {tp.fundCode}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                                  tp.tType === 'POSITIVE_T'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                }`}
                              >
                                {tp.tType === 'POSITIVE_T' ? '正T(先买后卖)' : '倒T(先卖后买)'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 mt-1 flex items-center space-x-3">
                              <span>买入: ¥{tp.buyPrice.toFixed(3)} ({tp.buyQty}份)</span>
                              <span>卖出: ¥{tp.sellPrice.toFixed(3)}</span>
                            </div>
                          </div>

                          <div className="text-right flex items-center space-x-2">
                            <div>
                              <span
                                className={`text-sm font-bold block ${
                                  tp.netProfit > 0 ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {formatMoney(tp.netProfit, true)}
                              </span>
                              <span className="text-[10px] text-emerald-500/90 block font-medium">
                                +{tp.profitRate.toFixed(2)}%
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 pl-1">
                              {onEditTPair && (
                                <button
                                  type="button"
                                  onClick={() => onEditTPair(tp)}
                                  className="p-1 text-slate-400 hover:text-cyan-400 rounded hover:bg-slate-700/50 transition-colors cursor-pointer"
                                  title="修改此条做T记录"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => onDeleteTPair(tp.id)}
                                className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-700/50 transition-colors cursor-pointer"
                                title="删除记录"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {tp.notes && (
                          <div className="mt-2 text-[11px] text-slate-400 bg-slate-900/60 px-2 py-1 rounded">
                            {tp.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dividends */}
              {selectedDayDetails.dividends.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-cyan-400" />
                    <span>分红发放 ({selectedDayDetails.dividends.length} 笔)</span>
                  </h4>
                  <div className="space-y-2">
                    {selectedDayDetails.dividends.map((div) => (
                      <div
                        key={div.id}
                        className="bg-cyan-950/30 border border-cyan-500/30 rounded-xl p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-cyan-200 text-sm">
                              {div.fundName}
                            </span>
                            <span className="text-xs text-slate-400 ml-1.5 font-mono">
                              {div.fundCode}
                            </span>
                            <span className="text-xs text-slate-400 block mt-0.5">
                              {div.type === 'CASH' ? '现金分红' : '红利再投资'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-cyan-300 text-sm">
                              +{formatMoney(div.totalAmount)}
                            </span>
                            {onEditDividend && (
                              <button
                                type="button"
                                onClick={() => onEditDividend(div)}
                                className="p-1 text-slate-400 hover:text-cyan-400 rounded hover:bg-slate-700/50 transition-colors cursor-pointer"
                                title="修改分红记录"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onDeleteDividend && (
                              <button
                                type="button"
                                onClick={() => onDeleteDividend(div.id)}
                                className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-700/50 transition-colors cursor-pointer"
                                title="删除分红记录"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trades */}
              {selectedDayDetails.trades.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>委托明细流水 ({selectedDayDetails.trades.length} 笔)</span>
                  </h4>
                  <div className="space-y-1.5">
                    {selectedDayDetails.trades.map((tr) => (
                      <div
                        key={tr.id}
                        className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-2 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                              tr.type === 'BUY'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {tr.type === 'BUY' ? '买入' : '卖出'}
                          </span>
                          <span className="font-medium text-slate-200">{tr.fundName}</span>
                          <span className="text-slate-400 font-mono">¥{tr.price.toFixed(3)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-300">
                          <span>{tr.quantity}份</span>
                          <span className="text-slate-500 text-[10px]">
                            佣¥{tr.fee.toFixed(2)}
                          </span>
                          {onEditTrade && (
                            <button
                              type="button"
                              onClick={() => onEditTrade(tr)}
                              className="p-1 text-slate-400 hover:text-cyan-400 rounded hover:bg-slate-700/50 transition-colors cursor-pointer"
                              title="修改单笔记录"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onDeleteTrade(tr.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-700/50 transition-colors cursor-pointer"
                            title="删除单笔记录"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {selectedDayDetails.tPairs.length === 0 &&
                selectedDayDetails.trades.length === 0 &&
                selectedDayDetails.dividends.length === 0 && (
                  <div className="text-center py-10 text-slate-500 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                    <Info className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs">该日期暂无交易或做T记录</p>
                    <button
                      onClick={() => onNavigateToEntryWithDate(selectedDate)}
                      className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> 立即为该日记一笔
                    </button>
                  </div>
                )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500">
            提示：做T记录会自动将当日套利净利润累计到日历并统计到做T胜率。
          </div>
        </div>
      </div>
    </div>
  );
};
