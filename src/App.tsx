import React, { useState, useEffect, useMemo } from 'react';
import {
  TradeRecord,
  TPairRecord,
  DividendRecord,
  FundMeta,
  TabKey,
  ComprehensiveFeeRule,
} from './types';
import {
  loadTrades,
  saveTrades,
  loadTPairs,
  saveTPairs,
  loadDividends,
  saveDividends,
  loadFundMetas,
  saveFundMetas,
  loadFeeRules,
  saveFeeRules,
  clearAllData,
  exportAllDataJson,
  importAllDataJson,
} from './utils/storage';
import {
  calculatePositionSummaries,
  autoPairTradesFIFO,
} from './utils/calculations';

// Components
import { Header } from './components/Header';
import { CalendarView } from './components/CalendarView';
import { HoldingsView } from './components/HoldingsView';
import { TStatsView } from './components/TStatsView';
import { ProfitView } from './components/ProfitView';
import { DividendsView } from './components/DividendsView';
import { EntryView } from './components/EntryView';
import { GridCalculatorModal } from './components/GridCalculatorModal';
import { EditRecordModal, EditableRecordType } from './components/EditRecordModal';
import { FeeRuleConfigModal } from './components/FeeRuleConfigModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('calendar');

  // Core Data States with Lazy Initialization directly from LocalStorage
  const [trades, setTrades] = useState<TradeRecord[]>(() => loadTrades());
  const [tPairs, setTPairs] = useState<TPairRecord[]>(() => loadTPairs());
  const [dividends, setDividends] = useState<DividendRecord[]>(() => loadDividends());
  const [fundMetas, setFundMetas] = useState<FundMeta[]>(() => loadFundMetas());
  const [feeRules, setFeeRules] = useState<ComprehensiveFeeRule[]>(() => loadFeeRules());

  // Edit Record Modal State
  const [editingRecord, setEditingRecord] = useState<{
    record: TradeRecord | TPairRecord | DividendRecord;
    recordType: EditableRecordType;
  } | null>(null);

  // Fee Rules Config Modal State
  const [isFeeConfigOpen, setIsFeeConfigOpen] = useState(false);

  // Pre-fill state for Entry View when navigated from another page
  const [entryPrefill, setEntryPrefill] = useState<{
    fundCode?: string;
    fundName?: string;
    date?: string;
    price?: number;
  }>({});

  // Grid Calculator State
  const [calculatorFund, setCalculatorFund] = useState<any | null>(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  // Persist to LocalStorage on State Change
  useEffect(() => {
    saveTrades(trades);
  }, [trades]);

  useEffect(() => {
    saveTPairs(tPairs);
  }, [tPairs]);

  useEffect(() => {
    saveDividends(dividends);
  }, [dividends]);

  useEffect(() => {
    saveFundMetas(fundMetas);
  }, [fundMetas]);

  useEffect(() => {
    saveFeeRules(feeRules);
  }, [feeRules]);

  // Dynamic Portfolio Summaries
  const positions = useMemo(() => {
    return calculatePositionSummaries(trades, tPairs, dividends, fundMetas);
  }, [trades, tPairs, dividends, fundMetas]);

  // Aggregate Metrics for Header
  const totalRealizedTProfit = useMemo(() => {
    return tPairs.reduce((sum, p) => sum + p.netProfit, 0);
  }, [tPairs]);

  const totalMarketValue = useMemo(() => {
    return positions.reduce((sum, p) => sum + p.marketValue, 0);
  }, [positions]);

  const totalFloatingProfit = useMemo(() => {
    return positions.reduce((sum, p) => sum + p.floatingProfit, 0);
  }, [positions]);

  // --- Handlers ---

  // Add Single Trade
  const handleAddTrade = (newTrade: TradeRecord) => {
    setTrades((prev) => {
      const updated = [newTrade, ...prev];
      saveTrades(updated);
      return updated;
    });

    // ensure fund meta exists
    if (!fundMetas.some((m) => m.code === newTrade.fundCode)) {
      setFundMetas((prev) => {
        const updated = [
          ...prev,
          {
            code: newTrade.fundCode,
            name: newTrade.fundName,
            currentPrice: newTrade.price,
            updatedAt: new Date().toISOString(),
          },
        ];
        saveFundMetas(updated);
        return updated;
      });
    }
  };

  // Add T-Pair (and create the 2 underlying trade legs)
  const handleAddTPair = (newTPair: TPairRecord, createIndependentTrades: boolean = true) => {
    setTPairs((prev) => {
      const updated = [newTPair, ...prev];
      saveTPairs(updated);
      return updated;
    });

    if (createIndependentTrades) {
      const buyLeg: TradeRecord = {
        id: `tr-${Date.now()}-b`,
        fundCode: newTPair.fundCode,
        fundName: newTPair.fundName,
        type: 'BUY',
        price: newTPair.buyPrice,
        quantity: newTPair.buyQty,
        amount: newTPair.buyPrice * newTPair.buyQty,
        fee: newTPair.buyFee,
        date: newTPair.buyDate,
        time: newTPair.buyTime,
        matchedTPairId: newTPair.id,
        notes: `[做T买入端] ${newTPair.notes || ''}`,
        createdAt: new Date().toISOString(),
      };

      const sellLeg: TradeRecord = {
        id: `tr-${Date.now()}-s`,
        fundCode: newTPair.fundCode,
        fundName: newTPair.fundName,
        type: 'SELL',
        price: newTPair.sellPrice,
        quantity: newTPair.sellQty,
        amount: newTPair.sellPrice * newTPair.sellQty,
        fee: newTPair.sellFee,
        date: newTPair.sellDate,
        time: newTPair.sellTime,
        matchedTPairId: newTPair.id,
        notes: `[做T卖出端] ${newTPair.notes || ''}`,
        createdAt: new Date().toISOString(),
      };

      setTrades((prev) => {
        const updated = [buyLeg, sellLeg, ...prev];
        saveTrades(updated);
        return updated;
      });
    }

    // update fund meta
    setFundMetas((prev) => {
      const exists = prev.find((m) => m.code === newTPair.fundCode);
      let updated: FundMeta[];
      if (exists) {
        updated = prev.map((m) =>
          m.code === newTPair.fundCode
            ? { ...m, currentPrice: newTPair.sellPrice, updatedAt: new Date().toISOString() }
            : m
        );
      } else {
        updated = [
          ...prev,
          {
            code: newTPair.fundCode,
            name: newTPair.fundName,
            currentPrice: newTPair.sellPrice,
            updatedAt: new Date().toISOString(),
          },
        ];
      }
      saveFundMetas(updated);
      return updated;
    });
  };

  // Update Trade
  const handleUpdateTrade = (updatedTrade: TradeRecord) => {
    setTrades((prev) => {
      const updated = prev.map((t) => (t.id === updatedTrade.id ? updatedTrade : t));
      saveTrades(updated);
      return updated;
    });
  };

  // Update T-Pair
  const handleUpdateTPair = (updatedTPair: TPairRecord) => {
    setTPairs((prev) => {
      const updated = prev.map((tp) => (tp.id === updatedTPair.id ? updatedTPair : tp));
      saveTPairs(updated);
      return updated;
    });
  };

  // Update Dividend
  const handleUpdateDividend = (updatedDiv: DividendRecord) => {
    setDividends((prev) => {
      const updated = prev.map((d) => (d.id === updatedDiv.id ? updatedDiv : d));
      saveDividends(updated);
      return updated;
    });
  };

  // Save Comprehensive Fee Rules
  const handleSaveFeeRules = (rules: ComprehensiveFeeRule[]) => {
    setFeeRules(rules);
    saveFeeRules(rules);
  };

  // Batch Import Trades (from CSV or OCR)
  const handleBatchImportTrades = (newTrades: TradeRecord[]) => {
    setTrades((prev) => {
      const updated = [...newTrades, ...prev];
      saveTrades(updated);
      return updated;
    });

    // Update fund metas
    newTrades.forEach((t) => {
      setFundMetas((prev) => {
        if (!prev.some((m) => m.code === t.fundCode)) {
          const updated = [
            ...prev,
            {
              code: t.fundCode,
              name: t.fundName,
              currentPrice: t.price,
              updatedAt: new Date().toISOString(),
            },
          ];
          saveFundMetas(updated);
          return updated;
        }
        return prev;
      });
    });
  };

  // Auto-Pair FIFO Matching from unpaired trades
  const handleAutoPairFIFO = () => {
    const { newTPairs, updatedTrades } = autoPairTradesFIFO(trades);
    if (newTPairs.length === 0) {
      alert('当前没有可配对的买卖记录。请先添加同标的的买入与卖出流水。');
      return;
    }

    setTPairs((prev) => {
      const updated = [...newTPairs, ...prev];
      saveTPairs(updated);
      return updated;
    });
    setTrades(updatedTrades);
    saveTrades(updatedTrades);
    alert(`智能算法已成功自动配对 ${newTPairs.length} 笔做T记录！已加入T统计分析。`);
  };

  // Manual Add or Edit Position (Directly manage base holding quantity and cost)
  const handleSaveManualPosition = ({
    fundCode,
    fundName,
    holdings,
    costPrice,
    currentPrice,
  }: {
    fundCode: string;
    fundName: string;
    holdings: number;
    costPrice: number;
    currentPrice: number;
  }) => {
    // 1. Update/Add FundMeta
    setFundMetas((prev) => {
      const filtered = prev.filter((m) => m.code !== fundCode);
      const updated = [
        ...filtered,
        {
          code: fundCode,
          name: fundName,
          currentPrice,
          updatedAt: new Date().toISOString(),
        },
      ];
      saveFundMetas(updated);
      return updated;
    });

    // 2. Adjust base buy trades for this fund to match target holdings and costPrice
    setTrades((prev) => {
      const otherTrades = prev.filter((t) => t.fundCode !== fundCode || t.matchedTPairId);
      const today = new Date().toISOString().split('T')[0];

      let updated: TradeRecord[];
      if (holdings > 0) {
        const baseHoldingTrade: TradeRecord = {
          id: `tr-base-${fundCode}-${Date.now()}`,
          fundCode,
          fundName,
          type: 'BUY',
          price: costPrice,
          quantity: holdings,
          amount: costPrice * holdings,
          fee: 0,
          date: today,
          time: '09:30:00',
          notes: '手动维护/调整的底仓份额',
          createdAt: new Date().toISOString(),
        };
        updated = [baseHoldingTrade, ...otherTrades];
      } else {
        updated = otherTrades;
      }
      saveTrades(updated);
      return updated;
    });
  };

  const handleDeleteFundPosition = (fundCode: string) => {
    if (window.confirm(`确定删除标的 ${fundCode} 及其所有交易记录吗？`)) {
      setTrades((prev) => {
        const updated = prev.filter((t) => t.fundCode !== fundCode);
        saveTrades(updated);
        return updated;
      });
      setTPairs((prev) => {
        const updated = prev.filter((tp) => tp.fundCode !== fundCode);
        saveTPairs(updated);
        return updated;
      });
      setDividends((prev) => {
        const updated = prev.filter((d) => d.fundCode !== fundCode);
        saveDividends(updated);
        return updated;
      });
      setFundMetas((prev) => {
        const updated = prev.filter((m) => m.code !== fundCode);
        saveFundMetas(updated);
        return updated;
      });
    }
  };

  // Add Dividend
  const handleAddDividend = (newDividend: DividendRecord) => {
    setDividends((prev) => {
      const updated = [newDividend, ...prev];
      saveDividends(updated);
      return updated;
    });
  };

  // Delete Handlers
  const handleDeleteTrade = (id: string) => {
    if (window.confirm('确定删除该笔交易记录吗？')) {
      setTrades((prev) => {
        const updated = prev.filter((t) => t.id !== id);
        saveTrades(updated);
        return updated;
      });
    }
  };

  const handleDeleteTPair = (id: string) => {
    if (window.confirm('确定删除该做T记录吗？')) {
      setTPairs((prev) => {
        const updated = prev.filter((p) => p.id !== id);
        saveTPairs(updated);
        return updated;
      });
    }
  };

  const handleDeleteDividend = (id: string) => {
    if (window.confirm('确定删除该分红记录吗？')) {
      setDividends((prev) => {
        const updated = prev.filter((d) => d.id !== id);
        saveDividends(updated);
        return updated;
      });
    }
  };

  // Update Fund Price
  const handleUpdateFundPrice = (code: string, newPrice: number) => {
    setFundMetas((prev) => {
      const exists = prev.find((m) => m.code === code);
      let updated: FundMeta[];
      if (exists) {
        updated = prev.map((m) =>
          m.code === code ? { ...m, currentPrice: newPrice, updatedAt: new Date().toISOString() } : m
        );
      } else {
        updated = [
          ...prev,
          {
            code,
            name: code,
            currentPrice: newPrice,
            updatedAt: new Date().toISOString(),
          },
        ];
      }
      saveFundMetas(updated);
      return updated;
    });
  };

  const handleUpdateFundMeta = (meta: FundMeta) => {
    setFundMetas((prev) => {
      const filtered = prev.filter((m) => m.code !== meta.code);
      const updated = [...filtered, meta];
      saveFundMetas(updated);
      return updated;
    });
  };

  // Navigation Helpers
  const handleNavigateToEntryWithDate = (date: string) => {
    setEntryPrefill({ date });
    setActiveTab('entry');
  };

  const handleNavigateToEntryWithFund = (fundCode: string, fundName: string, defaultPrice: number) => {
    setEntryPrefill({ fundCode, fundName, price: defaultPrice });
    setActiveTab('entry');
  };

  const handleOpenGridCalculator = (position: any) => {
    setCalculatorFund(position);
    setIsCalculatorOpen(true);
  };

  // Backup & Restore
  const handleExportBackup = () => {
    exportAllDataJson();
  };

  const handleImportBackup = (jsonString: string) => {
    const success = importAllDataJson(jsonString);
    if (success) {
      setTrades(loadTrades());
      setTPairs(loadTPairs());
      setDividends(loadDividends());
      setFundMetas(loadFundMetas());
      setFeeRules(loadFeeRules());
      alert('数据恢复成功！');
    } else {
      alert('数据解析错误，请确保导入合法备份文件。');
    }
  };

  const handleClearAllData = () => {
    if (window.confirm('确定清空当前所有数据吗？清空后将从零开始记录您的真实数据。')) {
      clearAllData();
      setTrades([]);
      setTPairs([]);
      setDividends([]);
      setFundMetas([]);
      alert('已清空全部数据！');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Global Navigation Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalRealizedTProfit={totalRealizedTProfit}
        totalMarketValue={totalMarketValue}
        totalFloatingProfit={totalFloatingProfit}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        onClearAllData={handleClearAllData}
        onOpenCalculator={() => {
          setCalculatorFund(positions[0] || null);
          setIsCalculatorOpen(true);
        }}
      />

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'calendar' && (
          <CalendarView
            trades={trades}
            tPairs={tPairs}
            dividends={dividends}
            onNavigateToEntryWithDate={handleNavigateToEntryWithDate}
            onDeleteTrade={handleDeleteTrade}
            onDeleteTPair={handleDeleteTPair}
            onDeleteDividend={handleDeleteDividend}
            onEditTrade={(tr) => setEditingRecord({ record: tr, recordType: 'trade' })}
            onEditTPair={(tp) => setEditingRecord({ record: tp, recordType: 'tpair' })}
            onEditDividend={(div) => setEditingRecord({ record: div, recordType: 'dividend' })}
          />
        )}

        {activeTab === 'holdings' && (
          <HoldingsView
            positions={positions}
            fundMetas={fundMetas}
            trades={trades}
            onUpdateFundPrice={handleUpdateFundPrice}
            onUpdateFundMeta={handleUpdateFundMeta}
            onSaveManualPosition={handleSaveManualPosition}
            onDeleteFundPosition={handleDeleteFundPosition}
            onNavigateToEntryWithFund={handleNavigateToEntryWithFund}
            onOpenGridCalculator={handleOpenGridCalculator}
          />
        )}

        {activeTab === 'tstats' && (
          <TStatsView
            tPairs={tPairs}
            trades={trades}
            positions={positions}
            onDeleteTPair={handleDeleteTPair}
            onEditTPair={(tp) => setEditingRecord({ record: tp, recordType: 'tpair' })}
            onAutoPairFIFO={handleAutoPairFIFO}
            onNavigateToEntry={() => setActiveTab('entry')}
          />
        )}

        {activeTab === 'profit' && (
          <ProfitView
            tPairs={tPairs}
            trades={trades}
            dividends={dividends}
            positions={positions}
          />
        )}

        {activeTab === 'dividends' && (
          <DividendsView
            dividends={dividends}
            fundMetas={fundMetas}
            onAddDividend={handleAddDividend}
            onDeleteDividend={handleDeleteDividend}
            onEditDividend={(div) => setEditingRecord({ record: div, recordType: 'dividend' })}
          />
        )}

        {activeTab === 'entry' && (
          <EntryView
            initialDate={entryPrefill.date}
            initialFundCode={entryPrefill.fundCode}
            initialFundName={entryPrefill.fundName}
            initialPrice={entryPrefill.price}
            fundMetas={fundMetas}
            feeRules={feeRules}
            recentTrades={trades}
            recentTPairs={tPairs}
            onAddTrade={handleAddTrade}
            onAddTPair={handleAddTPair}
            onBatchImportTrades={handleBatchImportTrades}
            onOpenFeeConfigModal={() => setIsFeeConfigOpen(true)}
            onEditTrade={(tr) => setEditingRecord({ record: tr, recordType: 'trade' })}
            onEditTPair={(tp) => setEditingRecord({ record: tp, recordType: 'tpair' })}
            onDeleteTrade={handleDeleteTrade}
            onDeleteTPair={handleDeleteTPair}
          />
        )}
      </main>

      {/* Grid Ladder Calculator Modal */}
      <GridCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        initialPosition={calculatorFund}
      />

      {/* Universal Edit Record Modal */}
      <EditRecordModal
        isOpen={!!editingRecord}
        recordData={editingRecord?.record || null}
        recordType={editingRecord?.recordType || 'trade'}
        feeRules={feeRules}
        fundMetas={fundMetas}
        onClose={() => setEditingRecord(null)}
        onSaveTrade={handleUpdateTrade}
        onSaveTPair={handleUpdateTPair}
        onSaveDividend={handleUpdateDividend}
      />

      {/* Comprehensive Fee Rules Configuration Modal */}
      <FeeRuleConfigModal
        isOpen={isFeeConfigOpen}
        onClose={() => setIsFeeConfigOpen(false)}
        rules={feeRules}
        onSaveRules={handleSaveFeeRules}
      />
    </div>
  );
}
