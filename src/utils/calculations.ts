import { TradeRecord, TPairRecord, DividendRecord, FundMeta, PositionSummary, ComprehensiveFeeRule } from '../types';

/**
 * Format currency with 2 decimals and thousands separator
 */
export function formatMoney(val: number | undefined | null, showSign = false): string {
  if (val === undefined || val === null || isNaN(val)) return '0.00';
  const formatted = Math.abs(val).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (showSign && val > 0) return `+¥${formatted}`;
  if (val < 0) return `-¥${formatted}`;
  return `¥${formatted}`;
}

/**
 * Format percentage with 2 decimals
 */
export function formatPercent(val: number | undefined | null, showSign = false): string {
  if (val === undefined || val === null || isNaN(val)) return '0.00%';
  const formatted = Math.abs(val).toFixed(2);
  if (showSign && val > 0) return `+${formatted}%`;
  if (val < 0) return `-${formatted}%`;
  return `${formatted}%`;
}

/**
 * Calculate simple trade fee based on rate & minFee
 */
export function calculateFee(amount: number, rate: number = 0.0001, minFee: number = 0): number {
  const rawFee = amount * rate;
  const finalFee = Math.max(rawFee, minFee);
  return Math.round(finalFee * 100) / 100;
}

/**
 * Calculate comprehensive fee with commission, stamp duty, transfer fee
 */
export function calculateComprehensiveFee(
  amount: number,
  isSell: boolean,
  rule: ComprehensiveFeeRule
): {
  totalFee: number;
  commission: number;
  stampDuty: number;
  transferFee: number;
} {
  if (!amount || amount <= 0) {
    return { totalFee: 0, commission: 0, stampDuty: 0, transferFee: 0 };
  }

  const commRate = (isSell ? rule.sellCommissionTenThousandth : rule.buyCommissionTenThousandth) / 10000;
  const minFee = isSell ? rule.sellMinFee : rule.buyMinFee;
  const rawCommission = amount * commRate;
  const commission = Math.max(rawCommission, minFee || 0);

  const stampDutyRate = isSell ? (rule.stampDutyTenThousandth || 0) / 10000 : 0;
  const stampDuty = amount * stampDutyRate;

  const transferRate = (rule.transferFeeTenThousandth || 0) / 10000;
  const transferFee = amount * transferRate;

  const totalFee = Math.round((commission + stampDuty + transferFee) * 100) / 100;

  return {
    totalFee,
    commission: Math.round(commission * 100) / 100,
    stampDuty: Math.round(stampDuty * 100) / 100,
    transferFee: Math.round(transferFee * 100) / 100,
  };
}

/**
 * Compute portfolio position summaries aggregated by fund
 */
export function computePositionSummaries(
  trades: TradeRecord[],
  tPairs: TPairRecord[],
  dividends: DividendRecord[],
  fundMetas: FundMeta[]
): PositionSummary[] {
  // Collect all unique fund codes
  const fundCodeMap = new Map<string, { name: string }>();

  trades.forEach((t) => {
    if (!fundCodeMap.has(t.fundCode)) {
      fundCodeMap.set(t.fundCode, { name: t.fundName });
    }
  });

  tPairs.forEach((tp) => {
    if (!fundCodeMap.has(tp.fundCode)) {
      fundCodeMap.set(tp.fundCode, { name: tp.fundName });
    }
  });

  dividends.forEach((d) => {
    if (!fundCodeMap.has(d.fundCode)) {
      fundCodeMap.set(d.fundCode, { name: d.fundName });
    }
  });

  fundMetas.forEach((m) => {
    if (!fundCodeMap.has(m.code)) {
      fundCodeMap.set(m.code, { name: m.name });
    }
  });

  const summaries: PositionSummary[] = [];

  fundCodeMap.forEach(({ name }, code) => {
    const fundTrades = trades.filter((t) => t.fundCode === code);
    const fundTPairs = tPairs.filter((tp) => tp.fundCode === code);
    const fundDividends = dividends.filter((d) => d.fundCode === code);
    const meta = fundMetas.find((m) => m.code === code);

    let totalBuyQty = 0;
    let totalSellQty = 0;
    let totalBuyAmount = 0;
    let totalSellAmount = 0;
    let totalFees = 0;
    let lastTradeDate = '';

    fundTrades.forEach((t) => {
      totalFees += t.fee || 0;
      if (t.type === 'BUY') {
        totalBuyQty += t.quantity;
        totalBuyAmount += t.amount;
      } else if (t.type === 'SELL') {
        totalSellQty += t.quantity;
        totalSellAmount += t.amount;
      }
      if (!lastTradeDate || t.date > lastTradeDate) {
        lastTradeDate = t.date;
      }
    });

    // Add reinvested dividend shares
    fundDividends.forEach((d) => {
      if (d.type === 'REINVEST' && d.reinvestUnits) {
        totalBuyQty += d.reinvestUnits;
        totalBuyAmount += (d.reinvestPrice || 0) * d.reinvestUnits;
      }
    });

    const currentHoldings = Math.max(0, totalBuyQty - totalSellQty);

    // Original weighted average buy cost
    const originalCostPrice = totalBuyQty > 0 ? totalBuyAmount / totalBuyQty : 0;

    // Realized profit from T-pairs
    let realizedTProfit = 0;
    let winTRounds = 0;
    fundTPairs.forEach((tp) => {
      realizedTProfit += tp.netProfit;
      if (tp.netProfit > 0) winTRounds++;
      if (!lastTradeDate || tp.sellDate > lastTradeDate || tp.buyDate > lastTradeDate) {
        const d = tp.sellDate > tp.buyDate ? tp.sellDate : tp.buyDate;
        if (!lastTradeDate || d > lastTradeDate) lastTradeDate = d;
      }
    });

    // Total cash dividends
    let totalDividends = 0;
    fundDividends.forEach((d) => {
      totalDividends += d.totalAmount || 0;
    });

    // Diluted cost price calculation
    // Diluted cost = (Current Holding Net Capital Cost - Realized T Profits - Cash Dividends) / Current Holdings
    let dilutedCostPrice = originalCostPrice;
    if (currentHoldings > 0) {
      const remainingCapital = (originalCostPrice * currentHoldings) - realizedTProfit - totalDividends;
      dilutedCostPrice = remainingCapital / currentHoldings;
    }

    const currentPrice = meta?.currentPrice || (originalCostPrice > 0 ? originalCostPrice : 1.0);
    const marketValue = currentHoldings * currentPrice;

    // Floating profit based on diluted cost
    const floatingProfit = currentHoldings > 0 ? (currentPrice - dilutedCostPrice) * currentHoldings : 0;
    const floatingProfitRate = dilutedCostPrice > 0 ? ((currentPrice - dilutedCostPrice) / dilutedCostPrice) * 100 : 0;

    const totalProfit = realizedTProfit + totalDividends + floatingProfit;
    const totalTRounds = fundTPairs.length;
    const winRate = totalTRounds > 0 ? (winTRounds / totalTRounds) * 100 : 0;

    summaries.push({
      fundCode: code,
      fundName: meta?.name || name,
      currentHoldings,
      totalBuyQty,
      totalSellQty,
      totalBuyAmount,
      totalSellAmount,
      totalFees,
      originalCostPrice,
      dilutedCostPrice,
      currentPrice,
      marketValue,
      floatingProfit,
      floatingProfitRate,
      realizedTProfit,
      totalDividends,
      totalProfit,
      totalTRounds,
      winTRounds,
      winRate,
      lastTradeDate,
    });
  });

  // Sort by marketValue descending, then by realizedTProfit descending
  return summaries.sort((a, b) => b.marketValue - a.marketValue || b.realizedTProfit - a.realizedTProfit);
}

export const calculatePositionSummaries = computePositionSummaries;

/**
 * Compute portfolio aggregate totals
 */
export function computePortfolioOverview(summaries: PositionSummary[], tPairs: TPairRecord[], dividends: DividendRecord[]) {
  const totalMarketValue = summaries.reduce((acc, cur) => acc + cur.marketValue, 0);
  const totalFloatingProfit = summaries.reduce((acc, cur) => acc + cur.floatingProfit, 0);
  const totalRealizedTProfit = tPairs.reduce((acc, cur) => acc + cur.netProfit, 0);
  const totalDividends = dividends.reduce((acc, cur) => acc + cur.totalAmount, 0);
  const totalComprehensiveProfit = totalRealizedTProfit + totalDividends + totalFloatingProfit;
  const totalTradesCount = tPairs.length;
  const winTRounds = tPairs.filter((tp) => tp.netProfit > 0).length;
  const winRate = totalTradesCount > 0 ? (winTRounds / totalTradesCount) * 100 : 0;
  const totalFees = tPairs.reduce((acc, cur) => acc + cur.totalFees, 0);

  return {
    totalMarketValue,
    totalFloatingProfit,
    totalRealizedTProfit,
    totalDividends,
    totalComprehensiveProfit,
    totalTradesCount,
    winTRounds,
    winRate,
    totalFees,
  };
}

/**
 * Auto-Pair standalone buy and sell records to generate T-Pairs (FIFO Algorithm)
 */
export function autoPairTradesFIFO(trades: TradeRecord[], existingTPairIds?: Set<string>): {
  newTPairs: TPairRecord[];
  updatedTrades: TradeRecord[];
} {
  const newPairs: TPairRecord[] = [];
  const updatedTrades = trades.map((t) => ({ ...t }));
  const tradesByFund = new Map<string, TradeRecord[]>();

  // Filter out trades already paired with existing manual T-Pairs
  updatedTrades.forEach((t) => {
    if (t.matchedTPairId && existingTPairIds && existingTPairIds.has(t.matchedTPairId)) return;
    if (!tradesByFund.has(t.fundCode)) {
      tradesByFund.set(t.fundCode, []);
    }
    tradesByFund.get(t.fundCode)!.push(t);
  });

  tradesByFund.forEach((fundTrades) => {
    // Sort trades chronologically: date asc, then time asc (if time exists)
    fundTrades.sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      const timeA = a.time || '12:00:00';
      const timeB = b.time || '12:00:00';
      if (timeA !== timeB) return timeA.localeCompare(timeB);
      return (a.createdAt || '').localeCompare(b.createdAt || '');
    });

    const buys: { trade: TradeRecord; remainingQty: number }[] = [];
    const sells: { trade: TradeRecord; remainingQty: number }[] = [];

    fundTrades.forEach((t) => {
      if (t.type === 'BUY') {
        buys.push({ trade: t, remainingQty: t.quantity });
      } else {
        sells.push({ trade: t, remainingQty: t.quantity });
      }
    });

    let buyIdx = 0;
    let sellIdx = 0;

    while (buyIdx < buys.length && sellIdx < sells.length) {
      const b = buys[buyIdx];
      const s = sells[sellIdx];

      const matchQty = Math.min(b.remainingQty, s.remainingQty);
      if (matchQty <= 0) {
        if (b.remainingQty <= 0) buyIdx++;
        if (s.remainingQty <= 0) sellIdx++;
        continue;
      }

      const bTimeStr = `${b.trade.date} ${b.trade.time || '09:30:00'}`;
      const sTimeStr = `${s.trade.date} ${s.trade.time || '15:00:00'}`;
      const isPositiveT = bTimeStr <= sTimeStr;

      const buyFeePortion = b.trade.quantity > 0 ? (b.trade.fee / b.trade.quantity) * matchQty : 0;
      const sellFeePortion = s.trade.quantity > 0 ? (s.trade.fee / s.trade.quantity) * matchQty : 0;
      const totalFees = Math.round((buyFeePortion + sellFeePortion) * 100) / 100;
      const grossProfit = Math.round((s.trade.price - b.trade.price) * matchQty * 100) / 100;
      const netProfit = Math.round((grossProfit - totalFees) * 100) / 100;
      const profitRate =
        b.trade.price * matchQty > 0
          ? Math.round((netProfit / (b.trade.price * matchQty)) * 10000) / 100
          : 0;
      const pairId = `tp-auto-${b.trade.id}-${s.trade.id}-${matchQty}`;

      const newPair: TPairRecord = {
        id: pairId,
        fundCode: b.trade.fundCode,
        fundName: b.trade.fundName || s.trade.fundName,
        tType: isPositiveT ? 'POSITIVE_T' : 'REVERSE_T',
        buyDate: b.trade.date,
        buyTime: b.trade.time,
        buyPrice: b.trade.price,
        buyQty: matchQty,
        buyFee: Math.round(buyFeePortion * 100) / 100,
        sellDate: s.trade.date,
        sellTime: s.trade.time,
        sellPrice: s.trade.price,
        sellQty: matchQty,
        sellFee: Math.round(sellFeePortion * 100) / 100,
        matchedQty: matchQty,
        grossProfit,
        totalFees,
        netProfit,
        profitRate,
        notes: `智能FIFO匹配做T (${isPositiveT ? '正T(先买后卖)' : '倒T(先卖后买)'})`,
        createdAt: s.trade.createdAt || new Date().toISOString(),
      };

      newPairs.push(newPair);

      b.trade.matchedTPairId = pairId;
      s.trade.matchedTPairId = pairId;

      b.remainingQty -= matchQty;
      s.remainingQty -= matchQty;

      if (b.remainingQty <= 0) buyIdx++;
      if (s.remainingQty <= 0) sellIdx++;
    }
  });

  return { newTPairs: newPairs, updatedTrades };
}

/**
 * Synchronize standalone trades and T-Pairs automatically so all views (Calendar, Profit, Stats, Holdings)
 * reflect realized profit immediately without manual button clicks.
 */
export function synchronizeTradesAndTPairs(
  trades: TradeRecord[],
  tPairs: TPairRecord[]
): {
  syncedTPairs: TPairRecord[];
  syncedTrades: TradeRecord[];
} {
  // 1. Keep manual/explicit T-Pairs (not generated automatically)
  const manualTPairs = tPairs.filter((tp) => !tp.id.startsWith('tp-auto-'));
  const manualPairIds = new Set(manualTPairs.map((tp) => tp.id));

  // 2. Prepare trades to match, keeping manual pointers
  const updatedTrades = trades.map((t) => {
    if (t.matchedTPairId && manualPairIds.has(t.matchedTPairId)) {
      return { ...t };
    }
    const copy = { ...t };
    delete copy.matchedTPairId;
    return copy;
  });

  // 3. Match remaining trades via FIFO
  const { newTPairs, updatedTrades: matchedTrades } = autoPairTradesFIFO(
    updatedTrades,
    manualPairIds
  );

  const syncedTPairs = [...manualTPairs, ...newTPairs].sort((a, b) => {
    const dateA = a.sellDate || a.buyDate || '';
    const dateB = b.sellDate || b.buyDate || '';
    if (dateA !== dateB) return dateB.localeCompare(dateA);
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });

  return { syncedTPairs, syncedTrades: matchedTrades };
}
