import { TradeRecord, TPairRecord, DividendRecord, FundMeta, ComprehensiveFeeRule } from '../types';
import { DEFAULT_COMPREHENSIVE_FEE_RULES } from '../data/initialData';

const STORAGE_KEYS = {
  TRADES: 'grid_t_journal_trades_v1',
  T_PAIRS: 'grid_t_journal_tpairs_v1',
  DIVIDENDS: 'grid_t_journal_dividends_v1',
  FUND_METAS: 'grid_t_journal_fundmetas_v1',
  FEE_RULES: 'grid_t_journal_feerules_v1',
};

export function loadTrades(): TradeRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRADES);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading trades from storage', e);
    return [];
  }
}

export function saveTrades(trades: TradeRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(trades));
  } catch (e) {
    console.error('Error saving trades', e);
  }
}

export function loadTPairs(): TPairRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.T_PAIRS);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading T-pairs from storage', e);
    return [];
  }
}

export function saveTPairs(pairs: TPairRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.T_PAIRS, JSON.stringify(pairs));
  } catch (e) {
    console.error('Error saving T-pairs', e);
  }
}

export function loadDividends(): DividendRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DIVIDENDS);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading dividends from storage', e);
    return [];
  }
}

export function saveDividends(dividends: DividendRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DIVIDENDS, JSON.stringify(dividends));
  } catch (e) {
    console.error('Error saving dividends', e);
  }
}

export function loadFundMetas(): FundMeta[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FUND_METAS);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading fund metas from storage', e);
    return [];
  }
}

export function saveFundMetas(metas: FundMeta[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FUND_METAS, JSON.stringify(metas));
  } catch (e) {
    console.error('Error saving fund metas', e);
  }
}

export function loadFeeRules(): ComprehensiveFeeRule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FEE_RULES);
    if (!raw) {
      return DEFAULT_COMPREHENSIVE_FEE_RULES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_COMPREHENSIVE_FEE_RULES;
  } catch (e) {
    console.error('Error loading fee rules from storage', e);
    return DEFAULT_COMPREHENSIVE_FEE_RULES;
  }
}

export function saveFeeRules(rules: ComprehensiveFeeRule[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FEE_RULES, JSON.stringify(rules));
  } catch (e) {
    console.error('Error saving fee rules', e);
  }
}

export function clearAllData(): void {
  saveTrades([]);
  saveTPairs([]);
  saveDividends([]);
  saveFundMetas([]);
}

export function exportFullBackupJSON(): string {
  const data = {
    version: '1.1.0',
    exportTime: new Date().toISOString(),
    trades: loadTrades(),
    tPairs: loadTPairs(),
    dividends: loadDividends(),
    fundMetas: loadFundMetas(),
    feeRules: loadFeeRules(),
  };
  return JSON.stringify(data, null, 2);
}

export function exportAllDataJson(): void {
  const jsonStr = exportFullBackupJSON();
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `网格做T记录器备份_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function importFullBackupJSON(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed.trades)) saveTrades(parsed.trades);
    if (Array.isArray(parsed.tPairs)) saveTPairs(parsed.tPairs);
    if (Array.isArray(parsed.dividends)) saveDividends(parsed.dividends);
    if (Array.isArray(parsed.fundMetas)) saveFundMetas(parsed.fundMetas);
    if (Array.isArray(parsed.feeRules)) saveFeeRules(parsed.feeRules);
    return true;
  } catch (e) {
    console.error('Failed to import backup JSON', e);
    return false;
  }
}

export const importAllDataJson = importFullBackupJSON;
