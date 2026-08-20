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
  Sparkles,
  Zap,
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
    actualRules[0]?.id || 'fee-etf-w1-min02'
  );
  const [testAmount, setTestAmount] = useState('2000');

  const currentRule = rules.find((r) => r.id === selectedRuleId) || rules[0] || DEFAULT_COMPREHENSIVE_FEE_RULES[0];

  const handleUpdateCurrentRule = (field: keyof ComprehensiveFeeRule, value: any) => {
    setRules((prev) =>
      prev.map((r) => (r.id === selectedRuleId ? { ...r, [field]: value } : r))
    );
  };

  // Quick Preset Setter
  const applyQuickPreset = (preset: {
    name?: string;
    buyCommission: number;
    buyMin: number;
    sellCommission: number;
    sellMin: number;
    stampDuty: number;
    transferFee: number;
    notes?: string;
  }) => {
    setRules((prev) =>
      prev.map((r) =>
        r.id === selectedRuleId
          ? {
              ...r,
              buyCommissionTenThousandth: preset.buyCommission,
              buyMinFee: preset.buyMin,
              sellCommissionTenThousandth: preset.sellCommission,
              sellMinFee: preset.sellMin,
              stampDutyTenThousandth: preset.stampDuty,
              transferFeeTenThousandth: preset.transferFee,
              notes: preset.notes || r.notes,
            }
          : r
      )
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
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-6 animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                佣金与规费设置
                <span className="text-[11px] font-normal text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                  支持 ETF 免5 / 万1 / 最低0.2元
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                配置 ETF/LOF、A股股票、债券做T时的佣金率、最低起步门槛与免五规则
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
        <div className="p-5 space-y-5 text-xs overflow-y-auto flex-1">
          {/* Quick Guide Banner for ETF 免5 & 万1 最低0.2元 */}
          <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-cyan-950/70 p-3.5 rounded-xl border border-emerald-500/30 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>ETF/LOF「免5、万1、最低0.2元」设置方法与计费逻辑：</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-300">
              <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                <div className="text-slate-400">① 佣金率填写：</div>
                <div className="font-mono font-bold text-white mt-0.5">万 1.0 (万分之1)</div>
              </div>
              <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                <div className="text-slate-400">② 最低收费填写：</div>
                <div className="font-mono font-bold text-amber-300 mt-0.5">0.2 元 (不足0.2收0.2)</div>
              </div>
              <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                <div className="text-slate-400">③ 印花税/过户费：</div>
                <div className="font-mono font-bold text-emerald-300 mt-0.5">0 (ETF/LOF免征)</div>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/50 p-2 rounded-lg">
              💡 <strong className="text-slate-200">计费效果：</strong> 单笔交易金额低于 2,000 元时（如 500元、1000元），万1算出的佣金（0.05元、0.10元）均不足 0.2 元，系统将自动按 <strong className="text-amber-300">最低 0.20 元</strong> 收取；超过 2,000 元时（如 5,000元、10,000元）则按万1实际发生金额收取（0.50元、1.00元）。
            </div>
          </div>

          {/* Asset Category Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-slate-400 font-semibold">选择要配置的费率模板：</label>
              <span className="text-[11px] text-slate-500">点击下方模板即可快速载入与微调</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {rules.map((rule) => {
                const isSelected = rule.id === selectedRuleId;
                return (
                  <button
                    key={rule.id}
                    type="button"
                    onClick={() => setSelectedRuleId(rule.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200 shadow-sm ring-1 ring-cyan-500/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs truncate flex items-center justify-between">
                      <span>{rule.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between font-mono">
                      <span>万{rule.buyCommissionTenThousandth}</span>
                      <span>{rule.buyMinFee > 0 ? `最低¥${rule.buyMinFee}` : '免五'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Apply Preset Buttons */}
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              一键快速套用常用行情费率到当前模板：
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  applyQuickPreset({
                    buyCommission: 1.0,
                    buyMin: 0.2,
                    sellCommission: 1.0,
                    sellMin: 0.2,
                    stampDuty: 0,
                    transferFee: 0,
                    notes: 'ETF/LOF免5万1，最低单笔0.2元起步',
                  })
                }
                className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg border border-emerald-500/40 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1"
              >
                🌟 ETF 万1 (最低0.2元)
              </button>
              <button
                type="button"
                onClick={() =>
                  applyQuickPreset({
                    buyCommission: 0.5,
                    buyMin: 0,
                    sellCommission: 0.5,
                    sellMin: 0,
                    stampDuty: 0,
                    transferFee: 0,
                    notes: 'ETF/LOF万0.5免五(无门槛)',
                  })
                }
                className="px-2.5 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg border border-cyan-500/40 text-xs font-semibold cursor-pointer transition-colors"
              >
                ⚡ ETF 万0.5 (免五/0门槛)
              </button>
              <button
                type="button"
                onClick={() =>
                  applyQuickPreset({
                    buyCommission: 1.0,
                    buyMin: 0,
                    sellCommission: 1.0,
                    sellMin: 0,
                    stampDuty: 5.0,
                    transferFee: 0.1,
                    notes: '股票低佣：万1免五+印花税万5+过户费万0.1',
                  })
                }
                className="px-2.5 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg border border-purple-500/40 text-xs font-semibold cursor-pointer transition-colors"
              >
                💼 股票 万1 (免五)
              </button>
              <button
                type="button"
                onClick={() =>
                  applyQuickPreset({
                    buyCommission: 2.5,
                    buyMin: 5,
                    sellCommission: 2.5,
                    sellMin: 5,
                    stampDuty: 5.0,
                    transferFee: 0.1,
                    notes: '传统券商股票标准：万2.5最低5元+印花税万5+过户费',
                  })
                }
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 text-xs font-semibold cursor-pointer transition-colors"
              >
                🏛️ 股票 万2.5 (最低5元)
              </button>
            </div>
          </div>

          {/* Rule Details Configuration */}
          {currentRule && (
            <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex-1 mr-4">
                  <input
                    type="text"
                    value={currentRule.name}
                    onChange={(e) => handleUpdateCurrentRule('name', e.target.value)}
                    className="font-bold text-white text-sm bg-slate-900 border border-slate-700 rounded px-2 py-1 w-full"
                    placeholder="费率规则名称"
                  />
                  <input
                    type="text"
                    value={currentRule.notes || ''}
                    onChange={(e) => handleUpdateCurrentRule('notes', e.target.value)}
                    className="text-[11px] text-slate-400 bg-transparent border-0 px-1 py-0.5 w-full mt-1 focus:ring-0"
                    placeholder="添加备注说明..."
                  />
                </div>
                <span className="text-[10px] bg-slate-800 text-cyan-300 px-2 py-1 rounded border border-slate-700 font-mono">
                  {currentRule.assetClass}
                </span>
              </div>

              {/* Commission Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Buy Parameters */}
                <div className="bg-slate-900/90 p-3 rounded-xl border border-rose-500/30 space-y-2.5">
                  <span className="font-bold text-rose-300 block text-xs flex items-center justify-between">
                    <span>买入费率设置</span>
                    <span className="text-[10px] font-normal text-slate-400">买入建仓/加仓</span>
                  </span>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">
                      买入佣金率 (万分之几，例如万1填 1.0，万0.5填 0.5)
                    </label>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-slate-500 font-mono">万</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
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
                      买入最低收费 (元，例如 0.2 或 0 代表免五)
                    </label>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-slate-500 font-mono">¥</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.2"
                        value={currentRule.buyMinFee}
                        onChange={(e) =>
                          handleUpdateCurrentRule('buyMinFee', parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-300 font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Sell Parameters */}
                <div className="bg-slate-900/90 p-3 rounded-xl border border-emerald-500/30 space-y-2.5">
                  <span className="font-bold text-emerald-300 block text-xs flex items-center justify-between">
                    <span>卖出费率设置</span>
                    <span className="text-[10px] font-normal text-slate-400">卖出平仓/减仓</span>
                  </span>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">
                      卖出佣金率 (万分之几，例如万1填 1.0，万0.5填 0.5)
                    </label>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-slate-500 font-mono">万</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
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
                      卖出最低收费 (元，例如 0.2 或 0 代表免五)
                    </label>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-slate-500 font-mono">¥</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.2"
                        value={currentRule.sellMinFee}
                        onChange={(e) =>
                          handleUpdateCurrentRule('sellMinFee', parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-300 font-mono font-bold"
                      />
                    </div>
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
                      min="0"
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
                    普通股票双向为万0.1 (0.001%)；ETF/LOF/债券免征 (填0)
                  </p>
                  <div className="flex items-center space-x-1.5 pt-1">
                    <span className="text-slate-500 font-mono">万</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
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
                      <span>买入实际扣费:</span>
                      <span className="font-mono">¥{buySim.totalFee.toFixed(2)}</span>
                    </div>
                    <div className="text-slate-400 text-[10px] space-y-0.5">
                      <div>
                        佣金: ¥{buySim.commission.toFixed(2)}{' '}
                        {currentRule.buyMinFee > 0 &&
                          numAmount * (currentRule.buyCommissionTenThousandth / 10000) <
                            currentRule.buyMinFee && (
                            <span className="text-amber-400 font-mono">(触发最低¥{currentRule.buyMinFee})</span>
                          )}
                      </div>
                      <div>过户费: ¥{buySim.transferFee.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex justify-between text-emerald-300 font-bold mb-1">
                      <span>卖出实际扣费:</span>
                      <span className="font-mono">¥{sellSim.totalFee.toFixed(2)}</span>
                    </div>
                    <div className="text-slate-400 text-[10px] space-y-0.5">
                      <div>
                        佣金: ¥{sellSim.commission.toFixed(2)}{' '}
                        {currentRule.sellMinFee > 0 &&
                          numAmount * (currentRule.sellCommissionTenThousandth / 10000) <
                            currentRule.sellMinFee && (
                            <span className="text-amber-400 font-mono">(触发最低¥{currentRule.sellMinFee})</span>
                          )}
                      </div>
                      <div>印花税: ¥{sellSim.stampDuty.toFixed(2)}</div>
                      <div>过户费: ¥{sellSim.transferFee.toFixed(2)}</div>
                    </div>
                  </div>
                </div>

                {/* Quick table for common tier examples */}
                <div className="pt-2 border-t border-slate-800">
                  <div className="text-[10px] text-slate-400 mb-1 font-semibold">常见金额扣费梯级对照：</div>
                  <div className="grid grid-cols-4 gap-1.5 text-[10px] font-mono text-center">
                    <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                      <div className="text-slate-500">¥1,000</div>
                      <div className="text-amber-300 font-bold">
                        ¥{calculateComprehensiveFee(1000, false, currentRule).totalFee.toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                      <div className="text-slate-500">¥2,000</div>
                      <div className="text-white font-bold">
                        ¥{calculateComprehensiveFee(2000, false, currentRule).totalFee.toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                      <div className="text-slate-500">¥5,000</div>
                      <div className="text-white font-bold">
                        ¥{calculateComprehensiveFee(5000, false, currentRule).totalFee.toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                      <div className="text-slate-500">¥10,000</div>
                      <div className="text-white font-bold">
                        ¥{calculateComprehensiveFee(10000, false, currentRule).totalFee.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 bg-slate-850 border-t border-slate-800 flex items-center justify-between shrink-0">
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
