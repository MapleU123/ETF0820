export type TradeType = 'BUY' | 'SELL' | 'DIVIDEND';

export type TType = 'POSITIVE_T' | 'REVERSE_T'; // 正T (先买后卖) vs 倒T (先卖后买/高抛低吸)

export interface TradeRecord {
  id: string;
  fundCode: string;
  fundName: string;
  type: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  amount: number; // price * quantity
  fee: number; // 手续费
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm:ss
  notes?: string;
  tags?: string[];
  matchedTPairId?: string;
  createdAt: string;
}

export interface TPairRecord {
  id: string;
  fundCode: string;
  fundName: string;
  tType: TType;
  // 买入端
  buyDate: string;
  buyTime?: string;
  buyPrice: number;
  buyQty: number;
  buyFee: number;
  // 卖出端
  sellDate: string;
  sellTime?: string;
  sellPrice: number;
  sellQty: number;
  sellFee: number;
  // 成对配对份额
  matchedQty: number;
  // 收益统计
  grossProfit: number; // (sellPrice - buyPrice) * matchedQty
  totalFees: number; // buyFee + sellFee
  netProfit: number; // grossProfit - totalFees (净获利金额)
  profitRate: number; // netProfit / (buyPrice * matchedQty) * 100
  // 摊薄持仓每股成本
  costDilutionPerShare?: number; 
  notes?: string;
  createdAt: string;
}

export interface DividendRecord {
  id: string;
  fundCode: string;
  fundName: string;
  date: string; // 除息日/发放日
  type: 'CASH' | 'REINVEST'; // 现金分红 / 红利再投资
  amountPerUnit?: number; // 每份分红金额 (元)
  holdingUnits?: number; // 参与分红持仓基数
  totalAmount: number; // 分红总金额 (元)
  reinvestPrice?: number; // 若再投资：折算价格
  reinvestUnits?: number; // 若再投资：折算新增份额
  notes?: string;
  createdAt: string;
}

export interface FundMeta {
  code: string;
  name: string;
  currentPrice: number;
  gridStepPercent?: number; // 网格间距 %
  gridBasePrice?: number; // 网格基准中枢价
  targetHoldingQty?: number; // 目标/底仓份额
  notes?: string;
}

export interface PositionSummary {
  fundCode: string;
  fundName: string;
  currentHoldings: number; // 当前持仓份额
  totalBuyQty: number;
  totalSellQty: number;
  totalBuyAmount: number;
  totalSellAmount: number;
  totalFees: number;
  originalCostPrice: number; // 原始持仓成本均价 (未扣除做T收益)
  dilutedCostPrice: number; // 做T与分红摊薄后的真实成本均价
  currentPrice: number; // 最新市价 / 估值
  marketValue: number; // 当前持仓市值
  floatingProfit: number; // 浮动盈亏 (按摊薄成本计算)
  floatingProfitRate: number; // 浮动盈亏率 %
  realizedTProfit: number; // 累计已实现做T净收益
  totalDividends: number; // 累计分红金额
  totalProfit: number; // 综合总获利 = 做T利润 + 浮动盈亏 + 分红
  totalTRounds: number; // 做T总次数
  winTRounds: number; // 盈利T次数
  winRate: number; // 胜率 %
  lastTradeDate?: string;
}

export type TabKey = 'calendar' | 'holdings' | 'tstats' | 'profit' | 'dividends' | 'entry';
export type ActiveTab = TabKey;

export interface FeeRule {
  name: string;
  rate: number; // 如 0.0001 (万一), 0.00025 (万2.5), 0.00005 (万0.5)
  minFee: number; // 最低收费，如 0 或 5 (免五则为0)
}

export type AssetClassType = 'ETF' | 'STOCK' | 'BOND' | 'CUSTOM';

export interface ComprehensiveFeeRule {
  id: string;
  name: string;
  assetClass: AssetClassType; // 'ETF' | 'STOCK' | 'BOND' | 'CUSTOM'
  buyCommissionTenThousandth: number; // 买入佣金率 (万分之几), 如 0.5 即万0.5 (0.00005)
  buyMinFee: number; // 买入最低收费 (元), 0 代表免五
  sellCommissionTenThousandth: number; // 卖出佣金率 (万分之几), 如 0.5 即万0.5 (0.00005)
  sellMinFee: number; // 卖出最低收费 (元), 0 代表免五
  stampDutyTenThousandth: number; // 印花税 (仅卖出收取, 万分之几), 股票为 5 (万5即0.05%), ETF/债券为 0
  transferFeeTenThousandth: number; // 过户费 (买卖双向, 万分之几), 股票为 0.1 (万0.1即0.001%), ETF/债券为 0
  isDefault?: boolean;
  notes?: string;
}
