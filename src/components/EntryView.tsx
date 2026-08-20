import React, { useState, useEffect, useRef } from 'react';
import {
  PlusCircle,
  FileSpreadsheet,
  Image as ImageIcon,
  Camera,
  UploadCloud,
  Download,
  Zap,
  Calculator,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Trash2,
  Edit2,
  ArrowRight,
  Info,
  Layers,
  Settings,
  Shield,
  HelpCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TradeRecord, TPairRecord, TType, FundMeta, ComprehensiveFeeRule, AssetClassType } from '../types';
import { calculateComprehensiveFee, formatMoney, formatPercent } from '../utils/calculations';
import { POPULAR_FUNDS } from '../data/initialData';
import { CameraCaptureModal } from './CameraCaptureModal';

interface EntryViewProps {
  initialDate?: string;
  initialFundCode?: string;
  initialFundName?: string;
  initialPrice?: number;
  fundMetas: FundMeta[];
  feeRules: ComprehensiveFeeRule[];
  recentTrades: TradeRecord[];
  recentTPairs: TPairRecord[];
  onAddTrade: (trade: TradeRecord) => void;
  onAddTPair: (tPair: TPairRecord, createIndependentTrades?: boolean) => void;
  onBatchImportTrades: (trades: TradeRecord[]) => void;
  onOpenFeeConfigModal: () => void;
  onEditTrade: (trade: TradeRecord) => void;
  onEditTPair: (tPair: TPairRecord) => void;
  onDeleteTrade: (id: string) => void;
  onDeleteTPair: (id: string) => void;
}

type EntryMode = 'manual' | 'csv' | 'image';
type ManualSubMode = 't_pair' | 'single';

export const EntryView: React.FC<EntryViewProps> = ({
  initialDate,
  initialFundCode,
  initialFundName,
  initialPrice,
  fundMetas,
  feeRules,
  recentTrades,
  recentTPairs,
  onAddTrade,
  onAddTPair,
  onBatchImportTrades,
  onOpenFeeConfigModal,
  onEditTrade,
  onEditTPair,
  onDeleteTrade,
  onDeleteTPair,
}) => {
  const [entryMode, setEntryMode] = useState<EntryMode>('manual');
  const [manualSubMode, setManualSubMode] = useState<ManualSubMode>('t_pair');

  // Selected Asset Class & Fee Rule
  const [selectedFeeRuleId, setSelectedFeeRuleId] = useState<string>(() => {
    const defaultRule = feeRules.find((r) => r.isDefault);
    return defaultRule?.id || feeRules[0]?.id || 'fee-etf-w1-min02';
  });

  const activeFeeRule = feeRules.find((r) => r.id === selectedFeeRuleId) || feeRules[0];

  // --- Manual Form State ---
  const [fundCode, setFundCode] = useState(initialFundCode || '510300');
  const [fundName, setFundName] = useState(initialFundName || '沪深300ETF');
  const [tType, setTType] = useState<TType>('POSITIVE_T'); // POSITIVE_T or REVERSE_T
  const [tradeDate, setTradeDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [tradeTime, setTradeTime] = useState('14:30:00');

  // T-Pair inputs
  const [buyPrice, setBuyPrice] = useState(initialPrice ? (initialPrice * 0.985).toFixed(3) : '3.750');
  const [buyQty, setBuyQty] = useState('5000');
  const [buyFee, setBuyFee] = useState('1.88');
  const [sellPrice, setSellPrice] = useState(initialPrice ? (initialPrice * 1.015).toFixed(3) : '3.835');
  const [sellQty, setSellQty] = useState('5000');
  const [sellFee, setSellFee] = useState('1.92');
  const [notes, setNotes] = useState('');

  // Single Trade inputs
  const [singleType, setSingleType] = useState<'BUY' | 'SELL'>('BUY');
  const [singlePrice, setSinglePrice] = useState(initialPrice?.toFixed(3) || '3.800');
  const [singleQty, setSingleQty] = useState('5000');
  const [singleFee, setSingleFee] = useState('1.90');

  // Success Notification banner
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // --- CSV Import State ---
  const [csvText, setCsvText] = useState('');
  const [csvParsedRecords, setCsvParsedRecords] = useState<Partial<TradeRecord>[]>([]);
  const [csvParseError, setCsvParseError] = useState<string | null>(null);

  // --- Image OCR State ---
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrSummary, setOcrSummary] = useState<string | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrRecognizedTrades, setOcrRecognizedTrades] = useState<
    {
      fundCode: string;
      fundName: string;
      type: 'BUY' | 'SELL';
      price: number;
      quantity: number;
      fee: number;
      date: string;
      time?: string;
      notes?: string;
    }[]
  >([]);

  // Update fund defaults if props change
  useEffect(() => {
    if (initialFundCode) setFundCode(initialFundCode);
    if (initialFundName) setFundName(initialFundName);
    if (initialDate) setTradeDate(initialDate);
    if (initialPrice) {
      setBuyPrice((initialPrice * 0.985).toFixed(3));
      setSellPrice((initialPrice * 1.015).toFixed(3));
      setSinglePrice(initialPrice.toFixed(3));
    }
  }, [initialFundCode, initialFundName, initialDate, initialPrice]);

  // Recalculate fees when prices/qty/rules change
  const buyFeeDetails = React.useMemo(() => {
    const bp = parseFloat(buyPrice) || 0;
    const bq = parseFloat(buyQty) || 0;
    const amount = bp * bq;
    return calculateComprehensiveFee(amount, false, activeFeeRule);
  }, [buyPrice, buyQty, activeFeeRule]);

  const sellFeeDetails = React.useMemo(() => {
    const sp = parseFloat(sellPrice) || 0;
    const sq = parseFloat(sellQty) || 0;
    const amount = sp * sq;
    return calculateComprehensiveFee(amount, true, activeFeeRule);
  }, [sellPrice, sellQty, activeFeeRule]);

  const singleFeeDetails = React.useMemo(() => {
    const sp = parseFloat(singlePrice) || 0;
    const sq = parseFloat(singleQty) || 0;
    const amount = sp * sq;
    return calculateComprehensiveFee(amount, singleType === 'SELL', activeFeeRule);
  }, [singlePrice, singleQty, singleType, activeFeeRule]);

  useEffect(() => {
    setBuyFee(buyFeeDetails.totalFee.toFixed(2));
    setSellFee(sellFeeDetails.totalFee.toFixed(2));
  }, [buyFeeDetails.totalFee, sellFeeDetails.totalFee]);

  useEffect(() => {
    setSingleFee(singleFeeDetails.totalFee.toFixed(2));
  }, [singleFeeDetails.totalFee]);

  // Handle Fund Code Selection / Input
  const handleSelectFund = (code: string) => {
    setFundCode(code);
    const popular = POPULAR_FUNDS.find((f) => f.code === code);
    const foundMeta = fundMetas.find((f) => f.code === code);
    const found = popular || foundMeta;

    if (found) {
      setFundName(found.name);
      if ('defaultPrice' in found && found.defaultPrice) {
        setBuyPrice((found.defaultPrice * 0.985).toFixed(3));
        setSellPrice((found.defaultPrice * 1.015).toFixed(3));
        setSinglePrice(found.defaultPrice.toFixed(3));
      } else if ('currentPrice' in found && found.currentPrice) {
        setBuyPrice((found.currentPrice * 0.985).toFixed(3));
        setSellPrice((found.currentPrice * 1.015).toFixed(3));
        setSinglePrice(found.currentPrice.toFixed(3));
      }

      // Auto match fee rule by asset class
      if (popular?.assetClass) {
        const matchingRule = feeRules.find((r) => r.assetClass === popular.assetClass);
        if (matchingRule) setSelectedFeeRuleId(matchingRule.id);
      } else if (code.startsWith('60') || code.startsWith('00') || code.startsWith('30')) {
        const stockRule = feeRules.find((r) => r.assetClass === 'STOCK');
        if (stockRule) setSelectedFeeRuleId(stockRule.id);
      } else if (code.startsWith('51') || code.startsWith('15') || code.startsWith('16') || code.startsWith('58')) {
        const etfRule = feeRules.find((r) => r.assetClass === 'ETF');
        if (etfRule) setSelectedFeeRuleId(etfRule.id);
      }
    }
  };

  // Switch asset class quickly
  const handleSelectAssetClass = (assetClass: AssetClassType) => {
    const matched = feeRules.find((r) => r.assetClass === assetClass);
    if (matched) {
      setSelectedFeeRuleId(matched.id);
    }
  };

  // Real-time calculation for T-Pair
  const tCalculation = React.useMemo(() => {
    const bPrice = parseFloat(buyPrice) || 0;
    const bQty = parseFloat(buyQty) || 0;
    const bFee = parseFloat(buyFee) || 0;
    const sPrice = parseFloat(sellPrice) || 0;
    const sQty = parseFloat(sellQty) || 0;
    const sFee = parseFloat(sellFee) || 0;

    const matchedQty = Math.min(bQty, sQty);
    const buyAmount = bPrice * bQty;
    const sellAmount = sPrice * sQty;

    const grossProfit = (sPrice - bPrice) * matchedQty;
    const totalFees = bFee + sFee;
    const netProfit = grossProfit - totalFees;
    const capital = bPrice * matchedQty;
    const profitRate = capital > 0 ? (netProfit / capital) * 100 : 0;
    const costDilutionPerShare = bQty > 0 ? netProfit / bQty : 0;

    return {
      buyAmount,
      sellAmount,
      matchedQty,
      grossProfit,
      totalFees,
      netProfit,
      profitRate,
      costDilutionPerShare,
    };
  }, [buyPrice, buyQty, buyFee, sellPrice, sellQty, sellFee]);

  // Submit Manual T-Pair
  const handleSaveTPair = (e: React.FormEvent) => {
    e.preventDefault();
    const bPrice = parseFloat(buyPrice);
    const bQty = parseFloat(buyQty);
    const bFee = parseFloat(buyFee);
    const sPrice = parseFloat(sellPrice);
    const sQty = parseFloat(sellQty);
    const sFee = parseFloat(sellFee);

    if (isNaN(bPrice) || isNaN(sPrice) || isNaN(bQty) || isNaN(sQty) || bQty <= 0 || sQty <= 0) {
      alert('请检查买入和卖出价格与数量');
      return;
    }

    const tPairId = `tp-${Date.now()}`;
    const newTPair: TPairRecord = {
      id: tPairId,
      fundCode: fundCode.trim(),
      fundName: fundName.trim(),
      tType,
      buyDate: tradeDate,
      buyTime: tradeTime,
      buyPrice: bPrice,
      buyQty: bQty,
      buyFee: isNaN(bFee) ? 0 : bFee,
      sellDate: tradeDate,
      sellTime: tradeTime,
      sellPrice: sPrice,
      sellQty: sQty,
      sellFee: isNaN(sFee) ? 0 : sFee,
      matchedQty: Math.min(bQty, sQty),
      grossProfit: tCalculation.grossProfit,
      totalFees: tCalculation.totalFees,
      netProfit: tCalculation.netProfit,
      profitRate: tCalculation.profitRate,
      costDilutionPerShare: tCalculation.costDilutionPerShare,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    onAddTPair(newTPair, true);

    // Confetti on profitable T
    if (tCalculation.netProfit > 0) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    }

    setSaveSuccessMsg(
      `做T记录已保存！标的: ${fundName}(${fundCode})，实现净收益 ${formatMoney(
        tCalculation.netProfit,
        true
      )}`
    );
    setTimeout(() => setSaveSuccessMsg(null), 5000);
  };

  // Submit Single Trade
  const handleSaveSingleTrade = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(singlePrice);
    const q = parseFloat(singleQty);
    const f = parseFloat(singleFee);

    if (isNaN(p) || isNaN(q) || p <= 0 || q <= 0) {
      alert('请输入有效的价格和数量');
      return;
    }

    const newTrade: TradeRecord = {
      id: `tr-${Date.now()}`,
      fundCode: fundCode.trim(),
      fundName: fundName.trim(),
      type: singleType,
      price: p,
      quantity: q,
      amount: p * q,
      fee: isNaN(f) ? 0 : f,
      date: tradeDate,
      time: tradeTime,
      notes: notes.trim(),
      tags: [singleType === 'BUY' ? '买入' : '卖出'],
      createdAt: new Date().toISOString(),
    };

    onAddTrade(newTrade);
    setSaveSuccessMsg(
      `单笔委托已保存！${singleType === 'BUY' ? '买入' : '卖出'} ${fundName}(${fundCode}) ${q} 份`
    );
    setTimeout(() => setSaveSuccessMsg(null), 5000);
  };

  // --- CSV Parser Handler ---
  const handleParseCsv = (content: string) => {
    setCsvText(content);
    setCsvParseError(null);
    try {
      const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length <= 1) {
        setCsvParsedRecords([]);
        return;
      }

      const records: Partial<TradeRecord>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length < 5) continue;

        const code = parts[0] || '510300';
        const name = parts[1] || 'ETF基金';
        const typeRaw = parts[2]?.toUpperCase();
        const type: 'BUY' | 'SELL' = typeRaw === 'SELL' || typeRaw === '卖出' ? 'SELL' : 'BUY';
        const price = parseFloat(parts[3]) || 0;
        const qty = parseFloat(parts[4]) || 0;
        const fee = parseFloat(parts[5]) || 0;
        const date = parts[6] || new Date().toISOString().split('T')[0];
        const time = parts[7] || '10:00:00';
        const note = parts[8] || 'CSV导入';

        records.push({
          id: `tr-csv-${Date.now()}-${i}`,
          fundCode: code,
          fundName: name,
          type,
          price,
          quantity: qty,
          amount: price * qty,
          fee,
          date,
          time,
          notes: note,
          createdAt: new Date().toISOString(),
        });
      }

      setCsvParsedRecords(records);
    } catch (e: any) {
      setCsvParseError('CSV格式解析失败，请参考模板格式');
    }
  };

  const handleDownloadCsvTemplate = () => {
    const header = '基金代码,基金名称,交易类型(BUY/SELL),成交单价,成交数量,手续费,交易日期,交易时间,备注\n';
    const sample1 = '510300,沪深300ETF,BUY,3.750,5000,1.88,2026-08-10,09:45:00,日内建T\n';
    const sample2 = '510300,沪深300ETF,SELL,3.820,5000,1.91,2026-08-10,14:30:00,日内平T\n';
    const sample3 = '513100,纳指ETF,BUY,1.580,8000,1.26,2026-08-12,10:15:00,网格下轨买入\n';

    const blob = new Blob(['\uFEFF' + header + sample1 + sample2 + sample3], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '网格做T记录导入模板.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmBatchCsvImport = () => {
    if (csvParsedRecords.length === 0) return;
    onBatchImportTrades(csvParsedRecords as TradeRecord[]);
    setCsvParsedRecords([]);
    setCsvText('');
    alert(`成功批量导入 ${csvParsedRecords.length} 笔交易流水！`);
  };

  // --- Image OCR Handlers ---
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setUploadedImageBase64(base64);
      triggerGeminiOcr(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = (base64Image: string) => {
    setUploadedImageBase64(base64Image);
    triggerGeminiOcr(base64Image);
  };

  const triggerGeminiOcr = async (imageBase64: string) => {
    setIsOcrLoading(true);
    setOcrError(null);
    setOcrSummary(null);
    setOcrRecognizedTrades([]);

    try {
      const res = await fetch('/api/ocr-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || '图片识别失败');
      }

      setOcrSummary(data.summary || '识别完成');
      setOcrRecognizedTrades(data.records || []);
    } catch (err: any) {
      console.error('OCR Error', err);
      setOcrError(err.message || '识别失败，请确保网络正常或手动录入');
    } finally {
      setIsOcrLoading(false);
    }
  };

  const handleConfirmOcrBatchImport = () => {
    if (ocrRecognizedTrades.length === 0) return;
    const tradesToImport: TradeRecord[] = ocrRecognizedTrades.map((r, i) => ({
      id: `tr-ocr-${Date.now()}-${i}`,
      fundCode: r.fundCode,
      fundName: r.fundName,
      type: r.type,
      price: r.price,
      quantity: r.quantity,
      amount: r.price * r.quantity,
      fee: r.fee || 0,
      date: r.date,
      time: r.time || '10:00:00',
      notes: r.notes ? `[AI识别] ${r.notes}` : '[AI识别导入]',
      createdAt: new Date().toISOString(),
    }));

    onBatchImportTrades(tradesToImport);
    setOcrRecognizedTrades([]);
    setUploadedImageBase64(null);
    setOcrSummary(null);
    alert(`成功从图片导入 ${tradesToImport.length} 笔交易记录并已加入流水！`);
  };

  return (
    <div className="space-y-6">
      {/* Top Notification Banner */}
      {saveSuccessMsg && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-2xl p-4 flex items-center justify-between text-emerald-300 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMsg(null)}
            className="text-emerald-400 hover:text-white text-xs px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Mode Toggle Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-1 sm:space-x-2 w-full">
          <button
            id="entry-mode-manual"
            onClick={() => setEntryMode('manual')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              entryMode === 'manual'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>手动录入交易</span>
          </button>

          <button
            id="entry-mode-csv"
            onClick={() => setEntryMode('csv')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              entryMode === 'csv'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>CSV 批量导入</span>
          </button>

          <button
            id="entry-mode-image"
            onClick={() => setEntryMode('image')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              entryMode === 'image'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>AI拍照/截图识单</span>
          </button>
        </div>
      </div>

      {/* ================= MODE 1: MANUAL ENTRY ================= */}
      {entryMode === 'manual' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-md space-y-6">
          {/* Sub-mode selector & Commission Config Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="inline-flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setManualSubMode('t_pair')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  manualSubMode === 't_pair'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>做T对冲录入 (买+卖配对)</span>
              </button>
              <button
                type="button"
                onClick={() => setManualSubMode('single')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  manualSubMode === 'single'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>单笔交易录入 (买入/卖出)</span>
              </button>
            </div>

            {/* Asset Category & Fee Rule Bar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Asset Class Chips */}
              <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleSelectAssetClass('ETF')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    activeFeeRule.assetClass === 'ETF'
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ETF/LOF
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAssetClass('STOCK')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    activeFeeRule.assetClass === 'STOCK'
                      ? 'bg-rose-500 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  A股股票
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAssetClass('BOND')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    activeFeeRule.assetClass === 'BOND'
                      ? 'bg-indigo-500 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  债券/货币
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAssetClass('CUSTOM')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    activeFeeRule.assetClass === 'CUSTOM'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  自定义
                </button>
              </div>

              {/* Fee Rules Dropdown */}
              <select
                value={selectedFeeRuleId}
                onChange={(e) => setSelectedFeeRuleId(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {feeRules.map((rule) => (
                  <option key={rule.id} value={rule.id}>
                    {rule.name}
                  </option>
                ))}
              </select>

              {/* Configure Fee Rules Modal Trigger */}
              <button
                type="button"
                onClick={onOpenFeeConfigModal}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/50 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="设置买卖佣金、最低五元、印花税及过户费"
              >
                <Settings className="w-3.5 h-3.5 text-cyan-400" />
                <span>自定义费率规则</span>
              </button>
            </div>
          </div>

          {/* Popular Fund Quick Chips */}
          <div>
            <span className="text-[11px] text-slate-400 block mb-2 font-medium">
              热门基金/股票标的快捷填入：
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_FUNDS.slice(0, 12).map((f) => (
                <button
                  key={f.code}
                  type="button"
                  onClick={() => handleSelectFund(f.code)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer font-medium ${
                    fundCode === f.code
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {f.name} <span className="font-mono text-slate-400">({f.code})</span>
                </button>
              ))}
            </div>
          </div>

          {/* SUBMODE A: QUICK T-PAIR FORM */}
          {manualSubMode === 't_pair' ? (
            <form onSubmit={handleSaveTPair} className="space-y-6">
              {/* Fund info & T-Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">标的代码</label>
                  <input
                    type="text"
                    value={fundCode}
                    onChange={(e) => handleSelectFund(e.target.value)}
                    placeholder="如 510300"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">标的名称</label>
                  <input
                    type="text"
                    value={fundName}
                    onChange={(e) => setFundName(e.target.value)}
                    placeholder="如 沪深300ETF"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">做T策略类型</label>
                  <select
                    value={tType}
                    onChange={(e) => setTType(e.target.value as TType)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="POSITIVE_T">正T (先低吸买入，再冲高卖出)</option>
                    <option value="REVERSE_T">倒T (先高抛卖出，再回落接回)</option>
                  </select>
                </div>
              </div>

              {/* Dual Cards: Buy Leg vs Sell Leg */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Buy Leg Card */}
                <div className="bg-slate-800/60 border border-rose-500/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
                    <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      买入端参数
                    </span>
                    <span className="text-[11px] text-slate-400">
                      总花费: {formatMoney(tCalculation.buyAmount)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">买入单价 (元)</label>
                      <input
                        type="number"
                        step="0.001"
                        value={buyPrice}
                        onChange={(e) => setBuyPrice(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">买入数量 (份)</label>
                      <input
                        type="number"
                        step="100"
                        value={buyQty}
                        onChange={(e) => setBuyQty(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                        required
                      />
                    </div>
                  </div>

                  <div className="text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-400">买入总费用 (元)</label>
                      <span className="text-[10px] text-slate-500">
                        佣金 ¥{buyFeeDetails.commission.toFixed(2)} + 过户费 ¥{buyFeeDetails.transferFee.toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={buyFee}
                      onChange={(e) => setBuyFee(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 font-mono"
                    />
                  </div>
                </div>

                {/* Sell Leg Card */}
                <div className="bg-slate-800/60 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      卖出端参数
                    </span>
                    <span className="text-[11px] text-slate-400">
                      总回款: {formatMoney(tCalculation.sellAmount)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">卖出单价 (元)</label>
                      <input
                        type="number"
                        step="0.001"
                        value={sellPrice}
                        onChange={(e) => setSellPrice(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">卖出数量 (份)</label>
                      <input
                        type="number"
                        step="100"
                        value={sellQty}
                        onChange={(e) => setSellQty(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                        required
                      />
                    </div>
                  </div>

                  <div className="text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-400">卖出总费用 (元)</label>
                      <span className="text-[10px] text-slate-500">
                        佣金 ¥{sellFeeDetails.commission.toFixed(2)} + 印花税 ¥{sellFeeDetails.stampDuty.toFixed(2)} + 过户费 ¥{sellFeeDetails.transferFee.toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={sellFee}
                      onChange={(e) => setSellFee(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Date & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">交易日期</label>
                  <input
                    type="date"
                    value={tradeDate}
                    onChange={(e) => setTradeDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">交易时间 (可选)</label>
                  <input
                    type="time"
                    step="1"
                    value={tradeTime}
                    onChange={(e) => setTradeTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">备注说明</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="如：触碰网格下轨加仓、止盈做T..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Real-time Profit Calculation Banner */}
              <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-emerald-500/10">
                <div>
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    做T收益实时核算
                  </span>
                  <div className="flex items-baseline space-x-3 mt-1">
                    <span
                      className={`text-2xl sm:text-3xl font-black ${
                        tCalculation.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {formatMoney(tCalculation.netProfit, true)}
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        tCalculation.netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {formatPercent(tCalculation.profitRate, true)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-3">
                    <span>毛利: {formatMoney(tCalculation.grossProfit)}</span>
                    <span>·</span>
                    <span>总佣金税费: {formatMoney(tCalculation.totalFees)}</span>
                    <span>·</span>
                    <span className="text-teal-300 font-medium">
                      摊薄每份成本: -¥{tCalculation.costDilutionPerShare.toFixed(4)}元
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  id="entry-submit-tpair-btn"
                  className="w-full sm:w-auto px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>保存成对做T记录</span>
                </button>
              </div>
            </form>
          ) : (
            /* SUBMODE B: SINGLE BUY/SELL TRADE */
            <form onSubmit={handleSaveSingleTrade} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">标的代码</label>
                  <input
                    type="text"
                    value={fundCode}
                    onChange={(e) => handleSelectFund(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">标的名称</label>
                  <input
                    type="text"
                    value={fundName}
                    onChange={(e) => setFundName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">买/卖方向</label>
                  <select
                    value={singleType}
                    onChange={(e) => setSingleType(e.target.value as 'BUY' | 'SELL')}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    <option value="BUY">买入 (BUY)</option>
                    <option value="SELL">卖出 (SELL)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">成交单价 (元)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={singlePrice}
                    onChange={(e) => setSinglePrice(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">成交份额 (份)</label>
                  <input
                    type="number"
                    step="100"
                    value={singleQty}
                    onChange={(e) => setSingleQty(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-400">手续费/税费 (元)</label>
                    <span className="text-[10px] text-slate-500">
                      {singleType === 'SELL'
                        ? `佣金¥${singleFeeDetails.commission.toFixed(2)} + 印花税¥${singleFeeDetails.stampDuty.toFixed(2)} + 过户费¥${singleFeeDetails.transferFee.toFixed(2)}`
                        : `佣金¥${singleFeeDetails.commission.toFixed(2)} + 过户费¥${singleFeeDetails.transferFee.toFixed(2)}`}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={singleFee}
                    onChange={(e) => setSingleFee(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">交易日期</label>
                  <input
                    type="date"
                    value={tradeDate}
                    onChange={(e) => setTradeDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">备注说明</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="如：建立底仓、分批减仓..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-md cursor-pointer"
                >
                  保存单笔委托流水
                </button>
              </div>
            </form>
          )}

          {/* ================= RECENT ENTRIES LIST WITH EDIT & DELETE ================= */}
          <div className="pt-6 border-t border-slate-800">
            <h4 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                最近录入的做T与流水明细 ({recentTPairs.length + recentTrades.length} 条)
              </span>
              <span className="text-xs text-slate-500">点击修改可实时调整录入错误</span>
            </h4>

            {recentTPairs.length === 0 && recentTrades.length === 0 ? (
              <div className="bg-slate-950/50 rounded-xl p-6 text-center border border-slate-800 text-slate-500 text-xs">
                暂无交易记录，录入后将显示在此处，支持一键修改与删除。
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {/* Recent T-Pairs */}
                {recentTPairs.slice(0, 5).map((tp) => (
                  <div
                    key={tp.id}
                    className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors text-xs"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white">{tp.fundName}</span>
                        <span className="font-mono text-slate-400">({tp.fundCode})</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            tp.tType === 'POSITIVE_T'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-indigo-500/20 text-indigo-300'
                          }`}
                        >
                          {tp.tType === 'POSITIVE_T' ? '正T' : '倒T'}
                        </span>
                        <span className="text-slate-400 text-[11px]">{tp.sellDate || tp.buyDate}</span>
                      </div>
                      <div className="text-slate-400 mt-1 space-x-3 text-[11px]">
                        <span>买入: ¥{tp.buyPrice.toFixed(3)} ({tp.buyQty}份)</span>
                        <span>卖出: ¥{tp.sellPrice.toFixed(3)} ({tp.sellQty}份)</span>
                        <span>配对: {tp.matchedQty}份</span>
                        <span>佣金: ¥{tp.totalFees.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-3 border-t sm:border-t-0 border-slate-850 pt-2 sm:pt-0">
                      <div className="text-right">
                        <div
                          className={`font-bold text-sm ${
                            tp.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {formatMoney(tp.netProfit, true)}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {formatPercent(tp.profitRate, true)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => onEditTPair(tp)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                          title="修改此条做T记录"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                          <span>修改</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTPair(tp.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                          title="删除此记录"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Recent Single Trades */}
                {recentTrades.slice(0, 5).map((tr) => (
                  <div
                    key={tr.id}
                    className="bg-slate-950/50 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                          tr.type === 'BUY'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {tr.type === 'BUY' ? '买入' : '卖出'}
                      </span>
                      <span className="font-semibold text-white">{tr.fundName}</span>
                      <span className="font-mono text-slate-400">({tr.fundCode})</span>
                      <span className="text-slate-400">¥{tr.price.toFixed(3)} × {tr.quantity}份</span>
                      <span className="text-slate-500 text-[11px]">({tr.date})</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-slate-300 font-medium">
                        {formatMoney(tr.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onEditTrade(tr)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3 text-cyan-400" />
                        <span>修改</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteTrade(tr.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODE 2: CSV BATCH IMPORT ================= */}
      {entryMode === 'csv' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                CSV 批量导入交易对账单
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                支持导入券商导出的 CSV 历史交割单或自定义流水
              </p>
            </div>
            <button
              onClick={handleDownloadCsvTemplate}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>下载标准 CSV 模板</span>
            </button>
          </div>

          {/* Drag & Drop Box */}
          <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl p-6 text-center transition-colors bg-slate-950/40">
            <UploadCloud className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">
              点击选择或将 CSV 文件拖入此处
            </p>
            <p className="text-xs text-slate-400 mt-1">
              支持 utf-8 / gbk 编码的 .csv 表格文件
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    handleParseCsv(ev.target?.result as string);
                  };
                  reader.readAsText(file);
                }
              }}
              className="mt-3 text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-500 file:text-slate-950 hover:file:bg-emerald-400 cursor-pointer"
            />
          </div>

          {/* Paste CSV textarea fallback */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              或者直接粘贴 CSV 文本内容：
            </label>
            <textarea
              rows={4}
              value={csvText}
              onChange={(e) => handleParseCsv(e.target.value)}
              placeholder="基金代码,基金名称,交易类型,成交单价,成交数量,手续费,交易日期,交易时间,备注&#10;510300,沪深300ETF,BUY,3.750,5000,1.88,2026-08-10,09:45:00,日内买入"
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          {csvParseError && (
            <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{csvParseError}</span>
            </div>
          )}

          {/* Preview Parsed CSV */}
          {csvParsedRecords.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">
                  已解析识别到 {csvParsedRecords.length} 笔交易记录预览：
                </span>
                <button
                  onClick={handleConfirmBatchCsvImport}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>确认导入这 {csvParsedRecords.length} 笔记录</span>
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto border border-slate-800 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] sticky top-0">
                    <tr>
                      <th className="px-3 py-2">标的代码/名称</th>
                      <th className="px-3 py-2">类型</th>
                      <th className="px-3 py-2">价格</th>
                      <th className="px-3 py-2">数量</th>
                      <th className="px-3 py-2">手续费</th>
                      <th className="px-3 py-2">日期</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {csvParsedRecords.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="px-3 py-2 font-medium text-white">
                          {r.fundName} ({r.fundCode})
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                              r.type === 'BUY'
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {r.type === 'BUY' ? '买入' : '卖出'}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono text-slate-200">
                          ¥{r.price?.toFixed(3)}
                        </td>
                        <td className="px-3 py-2 font-mono text-slate-200">
                          {r.quantity}
                        </td>
                        <td className="px-3 py-2 font-mono text-slate-400">
                          ¥{r.fee?.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-slate-400">{r.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= MODE 3: AI IMAGE / OCR ================= */}
      {entryMode === 'image' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-md space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                AI 智能识别交割单截图/交割小票
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                支持同花顺、华泰涨乐财富通、东方财富等券商对账单截图，AI 自动提取标的、买卖价格与佣金
              </p>
            </div>
          </div>

          {/* Action Buttons: Upload or Camera */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-2xl p-6 text-center transition-colors bg-slate-950/40 cursor-pointer flex flex-col items-center justify-center">
              <ImageIcon className="w-8 h-8 text-cyan-400 mb-2" />
              <span className="text-sm font-semibold text-white">上传交割单截图</span>
              <span className="text-xs text-slate-400 mt-1">支持 PNG, JPG, WebP 格式</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={() => setIsCameraOpen(true)}
              className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl p-6 text-center transition-colors bg-slate-950/40 cursor-pointer flex flex-col items-center justify-center"
            >
              <Camera className="w-8 h-8 text-emerald-400 mb-2" />
              <span className="text-sm font-semibold text-white">实时拍照识单</span>
              <span className="text-xs text-slate-400 mt-1">
                支持手机/电脑摄像头直接拍摄
              </span>
            </button>
          </div>

          {/* Loading Indicator */}
          {isOcrLoading && (
            <div className="bg-slate-950/80 p-8 rounded-2xl border border-cyan-500/30 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <p className="text-sm font-bold text-white">
                Gemini 正在分析交割单图谱...
              </p>
              <p className="text-xs text-slate-400">
                正在智能提取证券代码、买卖方向、单价、成交数量与印花税佣金
              </p>
            </div>
          )}

          {ocrError && (
            <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{ocrError}</span>
            </div>
          )}

          {/* OCR Results */}
          {ocrRecognizedTrades.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    AI 成功识别到 {ocrRecognizedTrades.length} 笔流水记录
                  </h4>
                  {ocrSummary && (
                    <p className="text-xs text-slate-400 mt-0.5">{ocrSummary}</p>
                  )}
                </div>

                <button
                  onClick={handleConfirmOcrBatchImport}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>一键导入全部流水</span>
                </button>
              </div>

              <div className="space-y-2">
                {ocrRecognizedTrades.map((r, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                          r.type === 'BUY'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {r.type === 'BUY' ? '买入' : '卖出'}
                      </span>
                      <div>
                        <span className="font-bold text-white text-sm">
                          {r.fundName}
                        </span>
                        <span className="font-mono text-slate-400 ml-1.5">
                          ({r.fundCode})
                        </span>
                        <span className="text-slate-400 text-[11px] ml-3">
                          {r.date} {r.time || ''}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-white font-mono font-bold">
                        ¥{r.price.toFixed(3)} × {r.quantity}份
                      </div>
                      <span className="text-slate-400 text-[10px]">
                        金额: {formatMoney(r.price * r.quantity)} · 佣金: ¥{r.fee?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
};
