
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Trash2, Search, BrainCircuit, Loader2, Zap, Target, ChevronDown, 
  Copy, Check, Activity, Calculator, ArrowUpCircle, Rocket, 
  Settings2, Sparkles, Layout, ShieldCheck, Flame, Wallet, Layers, Filter, 
  AlertTriangle, Database, CloudOff, Info, ArrowRight, ExternalLink, Download, Table as TableIcon, Grid, TrendingUp, X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Platform, Niche, AffiliateProduct, FinancialAnalysis } from './types';
import { extractMarketAndPageData } from './services/geminiService';
import { supabase, isSupabaseConfigured } from './services/supabase';

const App: React.FC = () => {
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [nicheFilter, setNicheFilter] = useState<string>('Todos');
  const [viewMode, setViewMode] = useState<'cards' | 'spreadsheet'>('spreadsheet');
  const [isAuditing, setIsAuditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [calcState, setCalcState] = useState({
    actualPrice: 97,
    actualCommPercent: 50,
    manualCPC: 1.50,
  });

  useEffect(() => {
    const init = async () => {
      try {
        if (isSupabaseConfigured && supabase) {
          await fetchProducts();
        } else {
          const local = localStorage.getItem('garimpo_fallback');
          if (local) {
            try {
              setProducts(JSON.parse(local));
            } catch (e) {
              localStorage.removeItem('garimpo_fallback');
            }
          }
        }
      } catch (err) {
        console.error("Erro na inicialização:", err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const fetchProducts = async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (!error && data) {
        const processedData = data.map(item => ({
          ...item,
          financialAnalysis: typeof item.financialAnalysis === 'string' ? JSON.parse(item.financialAnalysis) : item.financialAnalysis,
          marketInsights: typeof item.marketInsights === 'string' ? JSON.parse(item.marketInsights) : item.marketInsights,
          adsAssets: typeof item.adsAssets === 'string' ? JSON.parse(item.adsAssets) : item.adsAssets,
          performance: typeof item.performance === 'string' ? JSON.parse(item.performance) : item.performance,
        }));
        setProducts(processedData);
      }
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProduct = async (product: AffiliateProduct) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('products')
          .upsert({
            id: product.id,
            name: product.name,
            platform: product.platform,
            niche: product.niche,
            actualPrice: product.actualPrice,
            actualCommPercent: product.actualCommPercent,
            avgCPC: product.avgCPC,
            salesPageScore: product.salesPageScore,
            link: product.link,
            createdAt: product.createdAt,
            financialAnalysis: JSON.stringify(product.financialAnalysis),
            marketInsights: JSON.stringify(product.marketInsights),
            adsAssets: JSON.stringify(product.adsAssets),
            performance: JSON.stringify(product.performance),
            aiVerdict: product.aiVerdict,
            finalScore: product.finalScore
          });
        if (error) throw error;
        await fetchProducts();
      } catch (err: any) {
        alert('Erro no Supabase. Salvando localmente: ' + err.message);
        saveToLocalStorage(product);
      }
    } else {
      saveToLocalStorage(product);
    }
  };

  const saveToLocalStorage = (product: AffiliateProduct) => {
    const newProds = [product, ...products];
    setProducts(newProds);
    localStorage.setItem('garimpo_fallback', JSON.stringify(newProds));
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Deseja excluir este registro?')) return;
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) fetchProducts();
    } else {
      const newProds = products.filter(p => p.id !== id);
      setProducts(newProds);
      localStorage.setItem('garimpo_fallback', JSON.stringify(newProds));
    }
  };

  const calculateFinancials = (data: { actualPrice: number, actualCommPercent: number, avgCPC: number }): FinancialAnalysis => {
    const commission = data.actualPrice * (data.actualCommPercent / 100);
    const adsCost = data.avgCPC * 30; // Estimativa padrão
    const profit = commission - adsCost;
    const roi = adsCost > 0 ? (profit / adsCost) * 100 : 0;
    return {
      profitPerSale: profit,
      roiPercent: roi,
      breakEvenClicks: Math.floor(commission / (data.avgCPC || 1)),
      maxCpcRecommended: commission / 30,
      viabilityStatus: roi > 50 ? 'Lucrativo' : roi > 10 ? 'Alerta' : 'Prejuízo',
      totalCommissionCash: commission,
      totalAdsCost: adsCost
    };
  };

  const filteredProducts = useMemo(() => {
    return (products || []).filter(p => {
      const matchSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchNiche = nicheFilter === 'Todos' || p.niche === nicheFilter;
      return matchSearch && matchNiche;
    });
  }, [products, searchTerm, nicheFilter]);

  const stats = useMemo(() => {
    const totalPotential = filteredProducts.reduce((acc, p) => acc + (p.financialAnalysis?.totalCommissionCash || 0), 0);
    const avgROI = filteredProducts.length > 0 ? filteredProducts.reduce((acc, p) => acc + (p.financialAnalysis?.roiPercent || 0), 0) / filteredProducts.length : 0;
    return { totalPotential, avgROI, count: filteredProducts.length };
  }, [filteredProducts]);

  const handleAudit = async () => {
    if (!formRef.current) return;
    const productName = (formRef.current.elements.namedItem('name') as HTMLInputElement).value;
    const salesUrl = (formRef.current.elements.namedItem('salesUrl') as HTMLInputElement).value;
    const niche = (formRef.current.elements.namedItem('niche') as HTMLSelectElement).value;

    if (!productName || !salesUrl) return alert("Preencha o Nome e a URL!");

    setIsAuditing(true);
    try {
      const data = await extractMarketAndPageData(productName, salesUrl, niche);
      if (data) {
        (formRef.current as any).marketAuditData = data;
        const scoreInput = formRef.current.elements.namedItem('salesPageScore') as HTMLInputElement;
        if (scoreInput) scoreInput.value = data.salesPageScore.toString();
        alert("Auditoria IA Concluída!");
      }
    } catch (err) {
      alert("Erro na IA. Prossiga manualmente.");
    } finally {
      setIsAuditing(false);
    }
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
      platformPrice: baseData.actualPrice,
      platformCommPercent: baseData.actualCommPercent,
      actualPrice: baseData.actualPrice,
      actualCommPercent: baseData.actualCommPercent,
      avgCPC: baseData.avgCPC,
      gravityOrTemp: 0,
      ranking: 0,
      salesPageScore: Number(formData.get('salesPageScore')) || 7,
      link: formData.get('salesUrl') as string,
      finalScore: financials.roiPercent,
      createdAt: Date.now(),
      financialAnalysis: financials,
      marketInsights: auditData?.marketInsights || { searchVolume: "N/A", trendStatus: 'Estável', estimatedCPC: baseData.avgCPC, competitionLevel: 'Média' },
      adsAssets: auditData?.adsAssets,
      aiVerdict: auditData?.aiVerdict || "Auditado manualmente."
    };
    
    await saveProduct(pData);
    setIsFormOpen(false);
  };

  const roiEst = useMemo(() => {
    const commission = calcState.actualPrice * (calcState.actualCommPercent / 100);
    const adsCost = calcState.manualCPC * 30;
    return adsCost > 0 ? ((commission - adsCost) / adsCost) * 100 : 0;
  }, [calcState]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
        <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-4" />
        <p className="font-black uppercase tracking-widest text-[10px] animate-pulse">Iniciando Hub de Performance...</p>
      </div>
    );
  }

  // Componente de Empty State (Agora com botão que funciona)
  const EmptyState = () => (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-slate-900 border border-white/10 rounded-[3rem] p-12 text-center space-y-8 shadow-2xl">
        <div className="bg-emerald-500/20 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto border border-emerald-500/30">
          <Rocket className="w-12 h-12 text-emerald-400" />
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">BEM-VINDO AO <span className="text-emerald-400">GARIMPO</span></h1>
          <p className="text-slate-400 text-sm">Sua planilha inteligente está pronta. Comece adicionando seu primeiro produto para análise.</p>
          {!isSupabaseConfigured && (
            <div className="bg-amber-400/10 border border-amber-400/20 p-4 rounded-2xl flex items-center gap-3 text-left">
              <CloudOff className="w-5 h-5 text-amber-400 shrink-0" />
              <p className="text-[10px] font-bold text-amber-400/80 uppercase">Modo Local: Supabase não detectado. Seus dados ficarão salvos no seu navegador.</p>
            </div>
          )}
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="w-full bg-emerald-500 text-slate-900 py-6 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          Começar Garimpo <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // Se não tem produtos e o modal está fechado, mostra tela inicial
  if (products.length === 0 && !isFormOpen) {
    return <EmptyState />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 text-slate-900">
      <header className="bg-slate-900 text-white p-5 sticky top-0 z-[60] shadow-2xl">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500 p-2.5 rounded-2xl"><TableIcon className="w-6 h-6 text-slate-900" /></div>
            <div>
              <h1 className="text-xl font-black uppercase italic tracking-tighter">GARIMPO <span className="text-emerald-400">EXPERT</span></h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dashboard de Performance</p>
            </div>
          </div>
          <button onClick={() => setIsFormOpen(true)} className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all">
            Novo Produto
          </button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 space-y-6">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Produtos</p>
            <p className="text-3xl font-black">{stats.count}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lucro Estimado/Venda</p>
            <p className="text-3xl font-black text-indigo-600">R$ {stats.totalPotential.toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ROI Médio Projetado</p>
            <p className="text-3xl font-black text-emerald-500">{stats.avgROI.toFixed(1)}%</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-[2rem] p-4 border border-slate-200 flex flex-col md:flex-row gap-4">
          <div className="flex-1 bg-slate-50 rounded-2xl px-6 py-3 flex items-center gap-3">
            <Search className="w-5 h-5 text-slate-400" />
            <input 
              placeholder="Buscar produtos..." 
              className="bg-transparent w-full outline-none font-bold text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            value={nicheFilter} 
            onChange={e => setNicheFilter(e.target.value)}
            className="bg-slate-50 px-6 py-3 rounded-2xl font-bold text-sm outline-none border-none"
          >
            <option value="Todos">Todos Nichos</option>
            {Object.values(Niche).map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setViewMode('spreadsheet')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'spreadsheet' ? 'bg-white shadow-sm' : 'text-slate-400'}`}>Tabela</button>
            <button onClick={() => setViewMode('cards')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'cards' ? 'bg-white shadow-sm' : 'text-slate-400'}`}>Cards</button>
          </div>
        </div>

        {/* Listagem */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
          {viewMode === 'spreadsheet' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-8 py-6">Produto</th>
                    <th className="px-4 py-6">Preço</th>
                    <th className="px-4 py-6">Comissão</th>
                    <th className="px-4 py-6">CPC Alvo</th>
                    <th className="px-4 py-6">ROI Est.</th>
                    <th className="px-8 py-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <p className="font-black text-slate-800">{p.name}</p>
                        <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider">{p.platform} • {p.niche}</p>
                      </td>
                      <td className="px-4 py-6 font-mono text-sm">R$ {p.actualPrice.toFixed(2)}</td>
                      <td className="px-4 py-6 font-mono text-sm text-emerald-600 font-bold">R$ {p.financialAnalysis?.totalCommissionCash.toFixed(2)}</td>
                      <td className="px-4 py-6 font-mono text-sm">R$ {p.avgCPC.toFixed(2)}</td>
                      <td className="px-4 py-6">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full ${p.finalScore > 50 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {p.finalScore.toFixed(0)}% ROI
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => window.open(p.link, '_blank')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><ExternalLink className="w-4 h-4" /></button>
                          <button onClick={() => deleteProduct(p.id)} className="p-2 hover:bg-rose-50 rounded-lg text-rose-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
              {filteredProducts.map(p => (
                <div key={p.id} className="bg-slate-50 rounded-[2rem] p-6 border border-slate-200 flex flex-col gap-4">
                  <div className="flex justify-between">
                    <div>
                      <h4 className="font-black text-slate-800">{p.name}</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{p.platform}</p>
                    </div>
                    <span className="text-xl font-black text-emerald-500">{p.finalScore.toFixed(0)}%</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Veredito IA</p>
                    <p className="text-xs text-slate-600 italic">"{p.aiVerdict}"</p>
                  </div>
                  <button onClick={() => window.open(p.link, '_blank')} className="w-full bg-slate-900 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest mt-auto">Abrir Oferta</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal Cadastro */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200 border border-white/20">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black uppercase italic tracking-tighter">ADICIONAR <span className="text-emerald-400">GARIMPO</span></h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Métricas Financeiras & Auditoria</p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form ref={formRef} onSubmit={handleAddProduct} className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10 max-h-[75vh] overflow-y-auto">
              <div className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Produto</label>
                  <input name="name" required placeholder="Nome da oferta..." className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-black text-lg outline-none focus:border-emerald-500 transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">URL Página de Vendas</label>
                  <input name="salesUrl" required placeholder="https://..." className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold text-slate-600" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Plataforma</label>
                    <select name="platform" className="w-full p-4 rounded-xl border border-slate-200 font-bold bg-white">
                      {Object.values(Platform).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Nicho</label>
                    <select name="niche" className="w-full p-4 rounded-xl border border-slate-200 font-bold bg-white">
                      {Object.values(Niche).map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
                <button type="button" onClick={handleAudit} disabled={isAuditing} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3">
                  {isAuditing ? <Loader2 className="animate-spin" /> : <BrainCircuit className="w-5 h-5 text-emerald-400" />} {isAuditing ? 'Analisando...' : 'Auditoria IA da Página'}
                </button>
              </div>

              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200 space-y-6">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b pb-2">Calculadora de ROI</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Preço R$</label>
                    <input name="actualPrice" type="number" defaultValue="97" className="w-full p-4 rounded-xl font-black bg-white border border-slate-200" onChange={e => setCalcState(p => ({...p, actualPrice: Number(e.target.value)}))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Comissão %</label>
                    <input name="actualCommPercent" type="number" defaultValue="50" className="w-full p-4 rounded-xl font-black bg-white border border-slate-200 text-emerald-600" onChange={e => setCalcState(p => ({...p, actualCommPercent: Number(e.target.value)}))} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">CPC Alvo R$</label>
                  <input name="avgCPC" type="number" step="0.01" defaultValue="1.50" className="w-full p-5 rounded-xl font-black bg-white border border-indigo-200 text-2xl text-indigo-600" onChange={e => setCalcState(p => ({...p, manualCPC: Number(e.target.value)}))} />
                </div>
                <div className={`p-6 rounded-2xl text-center border-2 transition-all ${roiEst > 50 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">ROI Est.</p>
                  <p className={`text-4xl font-black ${roiEst > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{roiEst.toFixed(0)}%</p>
                </div>
                <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 py-6 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg">Salvar na Planilha</button>
              </div>
              <input type="hidden" name="salesPageScore" defaultValue="7" />
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
