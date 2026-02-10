
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Search, BrainCircuit, Loader2, Zap, Target, ChevronDown, 
  Copy, Check, Activity, Calculator, ArrowUpCircle, Rocket, 
  Settings2, Sparkles, Layout, ShieldCheck, Flame, Wallet, Layers, Filter, 
  AlertTriangle, Database, CloudOff, Info, ArrowRight, ExternalLink
} from 'lucide-react';
import { Platform, Niche, AffiliateProduct, FinancialAnalysis, ActualPerformance } from './types';
import { extractMarketAndPageData } from './services/geminiService';
import { supabase, isSupabaseConfigured } from './services/supabase';

const App: React.FC = () => {
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'strategy' | 'performance'>('strategy');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [calcState, setCalcState] = useState({
    actualPrice: 0,
    actualCommPercent: 50,
    manualCPC: 1.50,
    minBidCPC: 0.50,
    maxBidCPC: 3.50,
    manualVolume: "1000"
  });

  useEffect(() => {
    if (isSupabaseConfigured) {
      fetchProducts();
    } else {
      // Tenta carregar do localStorage como fallback se não houver Supabase (para testes locais)
      const local = localStorage.getItem('garimpo_fallback');
      if (local) setProducts(JSON.parse(local));
      setIsLoading(false);
    }
  }, []);

  const fetchProducts = async () => {
    if (!supabase) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro Supabase:', error);
    } else {
      setProducts(data || []);
    }
    setIsLoading(false);
  };

  const saveProduct = async (product: AffiliateProduct) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('products')
        .upsert({
          id: product.id,
          name: product.name,
          platform: product.platform,
          niche: product.niche,
          actual_price: product.actualPrice,
          actual_comm_percent: product.actualCommPercent,
          avg_cpc: product.avgCPC,
          min_bid_cpc: product.minBidCPC,
          max_bid_cpc: product.maxBidCPC,
          sales_page_score: product.salesPageScore,
          link: product.link,
          created_at: product.createdAt,
          financial_analysis: product.financialAnalysis,
          market_insights: product.marketInsights,
          ads_assets: product.adsAssets,
          performance: product.performance,
          ai_verdict: product.aiVerdict
        });
      if (error) alert('Erro ao salvar no banco: ' + error.message);
      else fetchProducts();
    } else {
      const newProds = [product, ...products];
      setProducts(newProds);
      localStorage.setItem('garimpo_fallback', JSON.stringify(newProds));
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Remover este garimpo permanentemente?')) return;
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) alert('Erro ao deletar: ' + error.message);
      else fetchProducts();
    } else {
      const newProds = products.filter(p => p.id !== id);
      setProducts(newProds);
      localStorage.setItem('garimpo_fallback', JSON.stringify(newProds));
    }
  };

  const updateActualPerformance = async (id: string, perfUpdates: Partial<ActualPerformance>) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    const updatedPerf = { 
      ...(product.performance || { totalSpent: 0, actualClicks: 0, conversions: 0, salesValue: 0, lastUpdate: Date.now() }),
      ...perfUpdates,
      lastUpdate: Date.now()
    };

    if (isSupabaseConfigured && supabase) {
      await supabase.from('products').update({ performance: updatedPerf }).eq('id', id);
      setProducts(prev => prev.map(p => p.id === id ? { ...p, performance: updatedPerf } : p));
    } else {
      const newProds = products.map(p => p.id === id ? { ...p, performance: updatedPerf } : p);
      setProducts(newProds);
      localStorage.setItem('garimpo_fallback', JSON.stringify(newProds));
    }
  };

  // Fix: Implemented missing copyToClipboard function to handle copying ad titles
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleAudit = async () => {
    if (!formRef.current) return;
    const productName = (formRef.current.elements.namedItem('name') as HTMLInputElement).value;
    const salesUrl = (formRef.current.elements.namedItem('salesUrl') as HTMLInputElement).value;
    const niche = (formRef.current.elements.namedItem('niche') as HTMLSelectElement).value;

    if (!productName || !salesUrl) return alert("Preencha Nome e Link!");

    setIsAuditing(true);
    try {
      const data = await extractMarketAndPageData(productName, salesUrl, niche);
      if (data) {
        (formRef.current as any).marketAuditData = data;
        const scoreInput = formRef.current.elements.namedItem('salesPageScore') as HTMLInputElement;
        if (scoreInput) scoreInput.value = data.salesPageScore.toString();
      }
    } catch (err) {
      alert("Erro na auditoria da IA.");
    } finally {
      setIsAuditing(false);
    }
  };

  const calculateFinancials = (data: any): FinancialAnalysis => {
    const actualCommCash = data.actualPrice * (data.actualCommPercent / 100);
    const adsCost = data.avgCPC * 30; 
    const profit = actualCommCash - adsCost;
    const roi = adsCost > 0 ? (profit / adsCost) * 100 : 0;
    return {
      profitPerSale: profit,
      roiPercent: roi,
      breakEvenClicks: Math.floor(actualCommCash / data.avgCPC),
      maxCpcRecommended: actualCommCash / 30,
      viabilityStatus: roi > 80 ? 'Lucrativo' : roi > 20 ? 'Alerta' : 'Prejuízo',
      totalCommissionCash: actualCommCash,
      totalAdsCost: adsCost
    };
  };

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const auditData = (e.currentTarget as any).marketAuditData;
    const baseData = {
      actualPrice: Number(formData.get('actualPrice')),
      actualCommPercent: Number(formData.get('actualCommPercent')),
      avgCPC: Number(formData.get('avgCPC'))
    };
    const financials = calculateFinancials(baseData);
    const pData: AffiliateProduct = {
      id: crypto.randomUUID(),
      name: formData.get('name') as string,
      platform: formData.get('platform') as Platform,
      niche: formData.get('niche') as Niche,
      platformPrice: Number(formData.get('actualPrice')),
      platformCommPercent: Number(formData.get('actualCommPercent')),
      actualPrice: baseData.actualPrice,
      actualCommPercent: baseData.actualCommPercent,
      avgCPC: baseData.avgCPC,
      minBidCPC: Number(formData.get('minBidCPC')),
      maxBidCPC: Number(formData.get('maxBidCPC')),
      gravityOrTemp: Number(formData.get('gravityOrTemp')) || 0,
      ranking: Number(formData.get('ranking')) || 0,
      salesPageScore: Number(formData.get('salesPageScore')) || 7,
      link: formData.get('salesUrl') as string,
      finalScore: financials.roiPercent,
      createdAt: Date.now(),
      financialAnalysis: financials,
      marketInsights: { ...auditData?.marketInsights, searchVolume: formData.get('manualVolume') as string },
      adsAssets: auditData?.adsAssets,
      aiVerdict: auditData?.aiVerdict
    };
    await saveProduct(pData);
    setIsFormOpen(false);
  };

  const getActionSuggestions = (p: AffiliateProduct) => {
    const suggestions: { text: string; type: 'positive' | 'negative' | 'neutral' }[] = [];
    if (!p.performance || p.performance.totalSpent === 0) return [{ text: "Aguardando dados reais.", type: 'neutral' as const }];
    const perf = p.performance;
    const realROI = ((perf.conversions * (p.financialAnalysis?.totalCommissionCash || 0) - perf.totalSpent) / (perf.totalSpent || 1)) * 100;
    if (realROI < 0) suggestions.push({ text: "DRENAGEM: Prejuízo real detectado. Revise lances.", type: 'negative' });
    if (realROI > 50) suggestions.push({ text: "ESCALA: ROI saudável. Aumente o orçamento.", type: 'positive' });
    return suggestions.length > 0 ? suggestions : [{ text: "Monitorando.", type: 'positive' }];
  };

  // Fix: Calculated roiEst based on the current calculation state to show real-time projections in the UI
  const roiEst = (() => {
    const actualCommCash = calcState.actualPrice * (calcState.actualCommPercent / 100);
    const adsCost = calcState.manualCPC * 30; // Assuming 30 clicks per conversion for estimation
    if (adsCost <= 0) return 0;
    const profit = actualCommCash - adsCost;
    return (profit / adsCost) * 100;
  })();

  // UI DE CONFIGURAÇÃO PENDENTE
  if (!isSupabaseConfigured && products.length === 0 && !isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-['Inter']">
        <div className="max-w-xl w-full bg-slate-900 border border-white/10 rounded-[3rem] p-12 text-center space-y-8 shadow-2xl">
          <div className="bg-emerald-500/20 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto border border-emerald-500/30 animate-pulse">
            <Database className="w-12 h-12 text-emerald-400" />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">SUPABASE <span className="text-emerald-400">PENDENTE</span></h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Para salvar seus garimpos na nuvem e usar no Netlify, você precisa configurar as variáveis de ambiente <code className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">SUPABASE_URL</code> e <code className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">SUPABASE_ANON_KEY</code>.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white/5 p-6 rounded-3xl text-left border border-white/5 flex gap-4 items-start">
              <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400 mt-1"><Rocket className="w-4 h-4" /></div>
              <div>
                <p className="text-xs font-black text-white uppercase mb-1">Passo 1: Netlify</p>
                <p className="text-[10px] text-slate-500">Vá em Site Configuration > Environment Variables.</p>
              </div>
            </div>
            <div className="bg-white/5 p-6 rounded-3xl text-left border border-white/5 flex gap-4 items-start">
              <div className="bg-amber-500/20 p-2 rounded-lg text-amber-400 mt-1"><ShieldCheck className="w-4 h-4" /></div>
              <div>
                <p className="text-xs font-black text-white uppercase mb-1">Passo 2: Supabase</p>
                <p className="text-[10px] text-slate-500">Pegue as chaves em Project Settings > API.</p>
              </div>
            </div>
          </div>
          <button onClick={() => setIsFormOpen(true)} className="w-full bg-emerald-500 text-slate-900 py-6 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
            Usar modo Offline (Temporário) <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const topPlanned = [...products].filter(p => !p.performance || p.performance.totalSpent === 0).sort((a, b) => (b.financialAnalysis?.roiPercent || 0) - (a.financialAnalysis?.roiPercent || 0)).slice(0, 3);
  const topReal = [...products].filter(p => p.performance && p.performance.totalSpent > 0).sort((a, b) => {
      const roiA = ((a.performance!.conversions * (a.financialAnalysis?.totalCommissionCash || 0) - a.performance!.totalSpent) / (a.performance!.totalSpent || 1)) * 100;
      const roiB = ((b.performance!.conversions * (b.financialAnalysis?.totalCommissionCash || 0) - b.performance!.totalSpent) / (b.performance!.totalSpent || 1)) * 100;
      return roiB - roiA;
  }).slice(0, 3);

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-['Inter'] pb-24 text-slate-900">
      <header className="bg-slate-900 text-white p-6 sticky top-0 z-50 shadow-xl border-b border-emerald-500/30">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-5">
            <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-2.5 rounded-2xl shadow-lg">
              <Rocket className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase italic tracking-tighter leading-none">GARIMPO <span className="text-emerald-400">CONTROL</span></h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{isSupabaseConfigured ? 'Cloud Active' : 'Offline Mode'}</p>
              </div>
            </div>
          </div>
          <button onClick={() => setIsFormOpen(true)} className="bg-emerald-500 text-slate-900 px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Novo Garimpo
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><Target className="w-4 h-4 text-amber-500" /> Top Planejados</h3>
            <div className="space-y-3">
              {topPlanned.map((p, i) => (
                <div key={p.id} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-xs font-black text-slate-300">#0{i+1}</span>
                  <p className="flex-1 font-black text-sm text-slate-800 truncate">{p.name}</p>
                  <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg">{p.financialAnalysis?.roiPercent.toFixed(0)}% EST</span>
                </div>
              ))}
            </div>
          </section>
          <section className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl space-y-6">
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2"><Flame className="w-4 h-4 text-indigo-400" /> Top Escala Real</h3>
            <div className="space-y-3">
              {topReal.map((p, i) => (
                <div key={p.id} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                  <span className="text-xs font-black text-slate-600">#0{i+1}</span>
                  <p className="flex-1 font-black text-sm text-white truncate">{p.name}</p>
                  <span className="text-[10px] font-black bg-indigo-500 text-white px-2 py-1 rounded-lg">VENDAS: {p.performance?.conversions}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 border-b flex items-center gap-4">
            <Search className="w-5 h-5 text-slate-300" />
            <input 
              placeholder="Buscar no banco de dados..." 
              className="flex-1 outline-none font-bold text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                <th className="px-8 py-6">Oferta / Status</th>
                <th className="px-4 py-6">Comissão</th>
                <th className="px-4 py-6">ROI</th>
                <th className="px-8 py-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={4} className="p-20 text-center animate-pulse font-black text-slate-300 uppercase tracking-widest">Sincronizando...</td></tr>
              ) : products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => {
                const isLive = p.performance && p.performance.totalSpent > 0;
                const roiReal = isLive ? (((p.performance!.conversions * (p.financialAnalysis?.totalCommissionCash || 0) - p.performance!.totalSpent) / (p.performance!.totalSpent || 1)) * 100) : 0;
                const roiShow = isLive ? roiReal : p.financialAnalysis?.roiPercent || 0;
                return (
                  <React.Fragment key={p.id}>
                    <tr onClick={() => setExpandedId(expandedId === p.id ? null : p.id)} className="hover:bg-slate-50 cursor-pointer">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full ${roiShow > 0 ? 'bg-emerald-500' : 'bg-rose-500 shadow-lg shadow-rose-200'}`}></div>
                          <div><p className="font-black text-sm">{p.name}</p><p className="text-[9px] font-bold text-slate-400 uppercase">{p.platform}</p></div>
                        </div>
                      </td>
                      <td className="px-4 py-6 font-black text-sm">R$ {p.financialAnalysis?.totalCommissionCash.toFixed(2)}</td>
                      <td className="px-4 py-6">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full ${roiShow > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                          {roiShow.toFixed(0)}% {isLive ? 'REAL' : 'EST'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right"><ChevronDown className={`w-4 h-4 inline transition-transform ${expandedId === p.id ? 'rotate-180' : ''}`} /></td>
                    </tr>
                    {expandedId === p.id && (
                      <tr>
                        <td colSpan={4} className="bg-slate-50/50 p-10">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                            <div className="bg-white p-8 rounded-[2rem] border space-y-4 shadow-sm">
                              <h4 className="text-[10px] font-black uppercase text-slate-400">Ativos Ads</h4>
                              <div className="space-y-2">
                                {p.adsAssets?.titles.slice(0, 2).map((t, i) => (
                                  <div key={i} className="bg-slate-50 p-3 rounded-xl text-xs font-bold border flex justify-between">
                                    <span className="truncate">{t}</span>
                                    <Copy onClick={(e) => { e.stopPropagation(); copyToClipboard(t); }} className="w-3.5 h-3.5 text-slate-300 hover:text-indigo-500 cursor-pointer" />
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className={`p-8 rounded-[2rem] border shadow-sm space-y-4 ${roiShow > 0 ? 'bg-slate-900 text-white' : 'bg-rose-950 text-rose-100'}`}>
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Feedback IA</h4>
                              <p className="text-xs italic leading-relaxed">"{p.aiVerdict?.slice(0, 150)}..."</p>
                              <div className="pt-4 flex justify-between">
                                <button onClick={(e) => { e.stopPropagation(); deleteProduct(p.id); }} className="text-[10px] font-black uppercase text-rose-500 flex items-center gap-2"><Trash2 className="w-3.5 h-3.5" /> Excluir</button>
                                <ExternalLink className="w-4 h-4 text-slate-500" />
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
              <h2 className="text-xl font-black uppercase italic tracking-tighter">ADD <span className="text-emerald-400">OFERTA</span></h2>
              <button onClick={() => setIsFormOpen(false)} className="bg-white/10 p-2 rounded-full"><Plus className="w-6 h-6 rotate-45" /></button>
            </div>
            <form ref={formRef} onSubmit={handleAddProduct} className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Nome do Produto</label>
                  <input name="name" required className="w-full bg-slate-50 border-2 p-5 rounded-2xl font-black text-xl outline-none focus:border-emerald-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Página de Vendas</label>
                  <input name="salesUrl" required className="w-full bg-slate-50 border-2 p-4 rounded-xl font-bold outline-none" />
                </div>
                <button type="button" onClick={handleAudit} disabled={isAuditing} className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3">
                  {isAuditing ? <Loader2 className="animate-spin" /> : <BrainCircuit className="w-5 h-5 text-emerald-400" />} {isAuditing ? 'Analisando...' : 'Auditoria IA'}
                </button>
              </div>
              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Preço (R$)</label>
                    <input name="actualPrice" type="number" required className="w-full p-4 rounded-xl border font-black" onChange={e => setCalcState(prev => ({...prev, actualPrice: Number(e.target.value)}))} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Comissão (%)</label>
                    <input name="actualCommPercent" type="number" defaultValue="50" className="w-full p-4 rounded-xl border font-black text-emerald-600" onChange={e => setCalcState(prev => ({...prev, actualCommPercent: Number(e.target.value)}))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">CPC Alvo Sugerido</label>
                  <input name="avgCPC" type="number" step="0.01" defaultValue="1.50" className="w-full p-5 rounded-xl border-2 border-indigo-200 font-black text-2xl text-indigo-600" onChange={e => setCalcState(prev => ({...prev, manualCPC: Number(e.target.value)}))} />
                </div>
                <div className={`p-6 rounded-2xl text-center border-2 ${roiEst > 0 ? 'bg-white border-emerald-100' : 'bg-rose-50 border-rose-200'}`}>
                  <p className="text-[9px] font-black uppercase text-slate-400 mb-1">ROI Projetado</p>
                  <p className={`text-2xl font-black ${roiEst > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{roiEst.toFixed(0)}%</p>
                </div>
                <button type="submit" className="w-full bg-emerald-500 text-slate-900 py-6 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Salvar no Hub</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {copiedText && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-emerald-400 px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest z-[200] border border-emerald-500/30 animate-in slide-in-from-bottom">
          Copiado com sucesso!
        </div>
      )}
    </div>
  );
};

export default App;
