import React, { useState } from 'react';
import { Calculator, X, Sparkles, Layers, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';
import { PositionSummary } from '../types';
import { formatMoney } from '../utils/calculations';

interface GridCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPosition?: PositionSummary | null;
  onApplyGridTrade?: (fundCode: string, fundName: string, buyPrice: number, sellPrice: number, qty: number) => void;
}

export const GridCalculatorModal: React.FC<GridCalculatorModalProps> = ({
  isOpen,
  onClose,
  initialPosition,
  onApplyGridTrade,
}) => {
  const [fundCode, setFundCode] = useState(initialPosition?.fundCode || '510300');
  const [fundName, setFundName] = useState(initialPosition?.fundName || '沪深300ETF');
  const [basePrice, setBasePrice] = useState(initialPosition?.currentPrice?.toString() || '3.800');
  const [stepPercent, setStepPercent] = useState('1.5'); // 1.5%
  const [unitsPerGrid, setUnitsPerGrid] = useState('5000');
  const [gridLevels, setGridLevels] = useState('4');

  if (!isOpen) return null;

  const base = parseFloat(basePrice) || 3.8;
  const step = (parseFloat(stepPercent) || 1.5) / 100;
  const units = parseFloat(unitsPerGrid) || 5000;
  const levels = parseInt(gridLevels) || 4;

  // Generate grid ladders
  const sellGrids: { level: number; price: number; profit: number; percent: number }[] = [];
  const buyGrids: { level: number; price: number; cost: number; percent: number }[] = [];

  for (let i = 1; i <= levels; i++) {
    const sPrice = base * (1 + step * i);
    const profit = (sPrice - base) * units;
    sellGrids.push({
      level: i,
      price: sPrice,
      profit,
      percent: step * i * 100,
    });

    const bPrice = base * (1 - step * i);
    const cost = bPrice * units;
    buyGrids.push({
      level: i,
      price: bPrice,
      cost,
      percent: -step * i * 100,
    });
  }

  const singleRoundTProfit = (base * (1 + step) - base) * units;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">网格交易阶梯测算器</h3>
              <p className="text-xs text-slate-400">
                {fundName} ({fundCode}) 网格点位与做T单格预期获利
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Controls */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
            <div>
              <label className="block text-slate-400 mb-1">基准中枢价 (元)</label>
              <input
                type="number"
                step="0.001"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">网格步长间距 (%)</label>
              <input
                type="number"
                step="0.1"
                value={stepPercent}
                onChange={(e) => setStepPercent(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono font-bold text-amber-300"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">单格交易份额 (份)</label>
              <input
                type="number"
                step="500"
                value={unitsPerGrid}
                onChange={(e) => setUnitsPerGrid(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">测算阶梯层数</label>
              <select
                value={gridLevels}
                onChange={(e) => setGridLevels(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
              >
                <option value="3">3 档 (±3格)</option>
                <option value="4">4 档 (±4格)</option>
                <option value="5">5 档 (±5格)</option>
                <option value="6">6 档 (±6格)</option>
              </select>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3.5 flex items-center justify-between text-xs">
            <span className="text-emerald-300 flex items-center gap-1.5 font-medium">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              每触发 1 个完整网格做T波段预计获利：
            </span>
            <span className="font-bold text-sm text-emerald-400 font-mono">
              ~ {formatMoney(singleRoundTProfit)} (收益率 ~{stepPercent}%)
            </span>
          </div>

          {/* Ladders Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Sell Ladders */}
            <div className="bg-slate-800/40 border border-emerald-500/20 rounded-2xl p-4">
              <h4 className="font-bold text-emerald-400 mb-2 flex items-center gap-1">
                <ArrowUpRight className="w-4 h-4" />
                向上网格 · 止盈高抛
              </h4>
              <div className="space-y-2">
                {sellGrids.map((g) => (
                  <div
                    key={g.level}
                    className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-xl border border-slate-800"
                  >
                    <div>
                      <span className="font-bold text-emerald-300">
                        卖{g.level}档 (+{g.percent.toFixed(1)}%)
                      </span>
                      <span className="font-mono text-white block text-sm font-bold mt-0.5">
                        ¥{g.price.toFixed(3)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">做T收益</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        +{formatMoney(g.profit)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Buy Ladders */}
            <div className="bg-slate-800/40 border border-rose-500/20 rounded-2xl p-4">
              <h4 className="font-bold text-rose-400 mb-2 flex items-center gap-1">
                <ArrowDownRight className="w-4 h-4" />
                向下网格 · 逢低吸纳
              </h4>
              <div className="space-y-2">
                {buyGrids.map((g) => (
                  <div
                    key={g.level}
                    className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-xl border border-slate-800"
                  >
                    <div>
                      <span className="font-bold text-rose-300">
                        买{g.level}档 ({g.percent.toFixed(1)}%)
                      </span>
                      <span className="font-mono text-white block text-sm font-bold mt-0.5">
                        ¥{g.price.toFixed(3)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">买入占用资金</span>
                      <span className="font-bold text-slate-300 font-mono">
                        {formatMoney(g.cost)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            网格策略适合震荡行情，严格按纪律做T摊薄底仓成本
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
