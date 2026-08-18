import React, { useState } from 'react';
import {
  X,
  Check,
  Calculator,
  Settings,
  RotateCcw,
  Info,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { ComprehensiveFeeRule, AssetClassType } from '../types';
import { DEFAULT_COMPREHENSIVE_FEE_RULES } from '../data/initialData';
import { calculateComprehensiveFee, formatMoney } from '../utils/calculations';

interface FeeRuleConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  feeRules?: ComprehensiveFeeRule[];
  rules?: ComprehensiveFeeRule[];
  onSaveFeeRules?: (rules: ComprehensiveFeeRule[]) => void;
  onSaveRules?: (rules: ComprehensiveFeeRule[]) => void;
}

export const FeeRuleConfigModal: React.FC<FeeRuleConfigModalProps> = ({
  isOpen,
  onClose,
  feeRules,
  rules: propRules,
  onSaveFeeRules,
  onSaveRules,
}) => {
  if (!isOpen) return null;

  const actualRules = propRules || feeRules || DEFAULT_COMPREHENSIVE_FEE_RULES;
  const [rules, setRules] = useState<ComprehensiveFeeRule[]>(actualRules);
  const [selectedRuleId, setSelectedRuleId] = useState<string>(
    actualRules[0]?.id || 'fee-etf-default'
  );
  const [testAmount, setTestAmount] = useState('20000');

  const currentRule = rules.find((r) => r.id === selectedRuleId) || rules[0] || DEFAULT_COMPREHENSIVE_FEE_RULES[0];

  const handleUpdateCurrentRule = (field: keyof ComprehensiveFeeRule, value: any) => {
    setRules((prev) =>
      prev.map((r) => (r.id === selectedRuleId ? { ...r, [field]: value } : r))
    );
  };

  const handleResetDefaults = () => {
    if (window.confirm('确定恢复系统默认佣金费率规则吗？')) {
      setRules(DEFAULT_COMPREHENSIVE_FEE_RULES);
      setSelectedRuleId(DEFAULT_COMPREHENSIVE_FEE_RULES[0].id);
    }
  };

  const handleSaveAll = () => {
    if (onSaveRules) {
      onSaveRules(rules);
    } else if (onSaveFeeRules) {
      onSaveFeeRules(rules);
    }
    alert('佣金与税费规则已成功保存！后续做T与录入时将按此自动计算。');
    onClose();
  };

  // Test Fee Calculation breakdown
  const numAmount = parseFloat(testAmount) || 0;
  const buySim = calculateComprehensiveFee(numAmount, false, currentRule);
  const sellSim = calculateComprehensiveFee(numAmount, true, currentRule);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-6 animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                佣金与规费自定义设置
              </h3>
              <p className="text-xs text-slate-400">
                支持分别配置股票、ETF/LOF、货币/债券ETF的佣金率、最低五元/免五、印花税与过户费
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 text-xs">
          {/* Asset Category Tabs */}
          <div>
            <label className="block text-slate-400 font-semibold mb-2">选择标的资产类型规则：</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {rules.map((rule) => {
                const isSelected = rule.id === selectedRuleId;
                return (
                  <button
                    key={rule.id}
                    type="button"
                    onClick={() => setSelectedRuleId(rule.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs truncate">{rule.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {rule.assetClass === 'ETF' && 'ETF / LOF'}
                      {rule.assetClass === 'STOCK' && '普通A股'}
                      {rule.assetClass === 'BOND' && '债券 / 货基'}
                      {rule.assetClass === 'CUSTOM' && '全自定义'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rule Details Configuration */}
          {currentRule && (
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="font-bold text-white text-sm">{currentRule.name}</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {currentRule.notes || '可随时调整各项费率比例'}
                  </span>
                </div>
                <span className="text-[10px] bg-slate-800 text-cyan-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
                  {currentRule.assetClass}
                </span>
              </div>

              {/* Commission Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Buy Parameters */}
                <div className="bg-slate-900/90 p-3 rounded-xl border border-rose-500/20 space-y-2.5">
                  <span className="font-bold text-rose-300 block text-xs">买入费率设置</span>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">
                      买入佣金率 (万分之几)
                    </label>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-slate-500 font-mono">万</span>
                      <input
                        type="number"
                        step="0.01"
                        value={currentRule.buyCommissionTenThousandth}
                        onChange={(e) =>
                          handleUpdateCurrentRule(
                            'buyCommissionTenThousandth',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">
                      买入最低收费 (元，0 代表免五)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={currentRule.buyMinFee}
                      onChange={(e) =>
                        handleUpdateCurrentRule('buyMinFee', parseFloat(e.target.value) || 0)
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>

                {/* Sell Parameters */}
                <div className="bg-slate-900/90 p-3 rounded-xl border border-emerald-500/20 space-y-2.5">
                  <span className="font-bold text-emerald-300 block text-xs">卖出费率设置</span>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">
                      卖出佣金率 (万分之几)
                    </label>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-slate-500 font-mono">万</span>
                      <input
                        type="number"
                        step="0.01"
                        value={currentRule.sellCommissionTenThousandth}
                        onChange={(e) =>
                          handleUpdateCurrentRule(
                            'sellCommissionTenThousandth',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">
                      卖出最低收费 (元，0 代表免五)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={currentRule.sellMinFee}
                      onChange={(e) =>
                        handleUpdateCurrentRule('sellMinFee', parseFloat(e.target.value) || 0)
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Taxes & Transfer Fees */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                  <label className="block text-slate-300 font-semibold">
                    印花税率 (仅卖出收取, 万分之几)
                  </label>
                  <p className="text-[10px] text-slate-500">
                    A股股票卖出通常为万5 (0.05%)；ETF/LOF/债券免征 (填0)
                  </p>
                  <div className="flex items-center space-x-1.5 pt-1">
                    <span className="text-slate-500 font-mono">万</span>
                    <input
                      type="number"
                      step="0.1"
                      value={currentRule.stampDutyTenThousandth}
                      onChange={(e) =>
                        handleUpdateCurrentRule(
                          'stampDutyTenThousandth',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                  <label className="block text-slate-300 font-semibold">
                    过户费率 (买卖双向收取, 万分之几)
                  </label>
                  <p className="text-[10px] text-slate-500">
                    普通股票双向为万0.1 (0.001%)；ETF/LOF/债券通常免征 (填0)
                  </p>
                  <div className="flex items-center space-x-1.5 pt-1">
                    <span className="text-slate-500 font-mono">万</span>
                    <input
                      type="number"
                      step="0.01"
                      value={currentRule.transferFeeTenThousandth}
                      onChange={(e) =>
                        handleUpdateCurrentRule(
                          'transferFeeTenThousandth',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Simulation Sandbox Breakdown */}
              <div className="bg-slate-900 p-3.5 rounded-xl border border-cyan-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5" />
                    实时代扣测算预览
                  </span>
                  <div className="flex items-center space-x-1.5 text-[11px]">
                    <span className="text-slate-400">测试成交金额: ¥</span>
                    <input
                      type="number"
                      value={testAmount}
                      onChange={(e) => setTestAmount(e.target.value)}
                      className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-white font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] pt-1">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex justify-between text-rose-300 font-bold mb-1">
                      <span>买入总规费:</span>
                      <span className="font-mono">¥{buySim.totalFee.toFixed(2)}</span>
                    </div>
                    <div className="text-slate-400 text-[10px] space-y-0.5">
                      <div>佣金: ¥{buySim.commission.toFixed(2)}</div>
                      <div>过户费: ¥{buySim.transferFee.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex justify-between text-emerald-300 font-bold mb-1">
                      <span>卖出总规费:</span>
                      <span className="font-mono">¥{sellSim.totalFee.toFixed(2)}</span>
                    </div>
                    <div className="text-slate-400 text-[10px] space-y-0.5">
                      <div>佣金: ¥{sellSim.commission.toFixed(2)}</div>
                      <div>印花税: ¥{sellSim.stampDuty.toFixed(2)}</div>
                      <div>过户费: ¥{sellSim.transferFee.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 bg-slate-850 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-xs text-slate-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>恢复默认预设</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs shadow-md cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>保存费率设置</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
