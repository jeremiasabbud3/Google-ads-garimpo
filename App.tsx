
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Trash2, Search, BrainCircuit, Loader2, Zap, Target, ChevronDown, 
  Copy, Check, Activity, Calculator, ArrowUpCircle, Rocket, 
  Settings2, Sparkles, Layout, ShieldCheck, Flame, Wallet, Layers, Filter, 
  AlertTriangle, Database, CloudOff, Info, ArrowRight, ExternalLink, Download, Table as TableIcon, Grid, TrendingUp
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Platform, Niche, AffiliateProduct, FinancialAnalysis, ActualPerformance } from './types';
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [calcState, setCalcState] = useState({
    actualPrice: 0,
    actualCommPercent: 50,
    manualCPC: 1.50,
  });

  useEffect(() => {
    const init = async () => {
      if (isSupabaseConfigured) {
        await fetchProducts();
      } else {
        const local = localStorage.getItem('garimpo_fallback');
        if (local) setProducts(JSON.parse(local));
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const fetchProducts = async () => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setProducts(data);
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
            minBidCPC: product.minBidCPC,
            maxBidCPC: product.maxBidCPC,
            salesPageScore: product.salesPageScore,
            link: product.link,
            createdAt: product.createdAt,
            financialAnalysis: JSON.stringify(product.financialAnalysis),
            marketInsights: JSON.stringify(product.marketInsights),
            adsAssets: JSON.stringify(product.adsAssets),
            performance: JSON.stringify(product.performance),
            aiVerdict: product.aiVerdict
          });
        if (error) throw error;
        await fetchProducts();
      } catch (err: any) {
        alert('Erro ao salvar no banco: ' + err.message);
      }
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

  const exportToExcel = () => {
    const dataToExport = products.map(p => ({
      Nome: p.name,
      Plataforma: p.platform,
      Niche: p.niche,
      Preço: p.actualPrice,
      'Comissão (%)': p.actualCommPercent,
      'Comissão (R$)': p.financialAnalysis?.totalCommissionCash,
      'CPC Médio': p.avgCPC,
      'ROI Est (%)': p.financialAnalysis?.roiPercent.toFixed(2),
      'Score Vendas': p.salesPageScore,
      Link: p.link,
      'Veredito IA': p.aiVerdict
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Meus Garimpos");
    XLSX.writeFile(wb, "garimpo_afiliados_pro.xlsx");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const calculateFinancials = (data: any): FinancialAnalysis => {
    const actualCommCash = data.actualPrice * (data.actualCommPercent / 100);
    const adsCost = data.avgCPC * 30; // Média de 30 cliques por venda
    const profit = actualCommCash - adsCost;
    const roi = adsCost > 0 ? (profit / adsCost) * 100 : 0;
    return {
      profitPerSale: profit,
      roiPercent: roi,
      breakEvenClicks: Math.floor(actualCommCash / (data.avgCPC || 1)),
      maxCpcRecommended: actualCommCash / 30,
      viabilityStatus: roi > 80 ? 'Lucrativo' : roi > 20 ? 'Alerta' : 'Prejuízo',
      totalCommissionCash: actualCommCash,
      totalAdsCost: adsCost
    };
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
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
      gravityOrTemp: Number(formData.get('gravityOrTemp')) || 0,
      ranking: 0,
      salesPageScore: Number(formData.get('salesPageScore')) || 7,
      link: formData.get('salesUrl') as string,
      finalScore: financials.roiPercent,
      createdAt: Date.now(),
      financialAnalysis: financials,
      marketInsights: { ...auditData?.marketInsights, searchVolume: "1000" },
      adsAssets: auditData?.adsAssets,
      aiVerdict: auditData?.aiVerdict
    };
    await saveProduct(pData);
    setIsFormOpen(false);
  };

  const roiEst = useMemo(() => {
    const actualCommCash = calcState.actualPrice * (calcState.actualCommPercent / 100);
    const adsCost = calcState.manualCPC * 30;
    if (adsCost <= 0) return 0;
    return ((actualCommCash - adsCost) / adsCost) * 100;
  }, [calcState]);

  // UI Fallback se não configurado
  if (!isSupabaseConfigured && products.length === 0 && !isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-['Inter']">
        <div className="max-w-xl w-full bg-slate-900 border border-white/10 rounded-[3rem] p-12 text-center space-y-8 shadow-2xl">
          <div className="bg-emerald-500/20 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto border border-emerald-500/30 animate-pulse">
            <Database className="w-12 h-12 text-emerald-400" />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">SUPABASE <span className="text-emerald-400">OFFLINE</span></h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Você está no modo temporário. Para salvar permanentemente no Netlify, configure <code className="text-emerald-400">SUPABASE_URL</code> e <code className="text-emerald-400">SUPABASE_ANON_KEY</code> no painel de controle do seu site.
            </p>
          </div>
          <button onClick={() => setIsFormOpen(true)} className="w-full bg-emerald-500 text-slate-900 py-6 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
            Começar Garimpo <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['Inter'] pb-24 text-slate-900">
      <header className="bg-slate-900 text-white p-5 sticky top-0 z-[60] shadow-2xl border-b border-white/5">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-emerald-500 p-2.5 rounded-2xl shadow-lg">
              <TableIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase italic tracking-tighter leading-none">GARIMPO <span className="text-emerald-400">EXPERT</span></h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Sua Planilha Inteligente de Afiliado</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={exportToExcel} className="hidden lg:flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-3 rounded-xl text-xs font-bold transition-all border border-white/5">
              <Download className="w-4 h-4" /> Exportar Planilha
            </button>
            <button onClick={() => setIsFormOpen(true)} className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 flex items-center gap-2">
              <Plus className="w-5 h-5" /> Novo Produto
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 space-y-6">
        {/* Dashboard de Métricas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total de Garimpos</p>
            <p className="text-3xl font-black text-slate-900">{stats.count}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Potencial de Lucro (Venda Única)</p>
            <p className="text-3xl font-black text-indigo-600">R$ {stats.totalPotential.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ROI Médio Estimado</p>
            <p className="text-3xl font-black text-emerald-500">{stats.avgROI.toFixed(1)}%</p>
          </div>
          <div className="bg-slate-900 p-6 rounded-3xl border border-white/10 shadow-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Visualização</p>
              <div className="flex bg-white/5 p-1 rounded-lg mt-2">
                <button onClick={() => setViewMode('spreadsheet')} className={`px-4 py-2 rounded-md text-[10px] font-bold uppercase transition-all ${viewMode === 'spreadsheet' ? 'bg-emerald-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}>Planilha</button>
                <button onClick={() => setViewMode('cards')} className={`px-4 py-2 rounded-md text-[10px] font-bold uppercase transition-all ${viewMode === 'cards' ? 'bg-emerald-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}>Cards</button>
              </div>
            </div>
            <TrendingUp className="w-10 h-10 text-emerald-500/20" />
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 flex items-center gap-3 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 w-full">
            <Search className="w-5 h-5 text-slate-300" />
            <input 
              placeholder="Buscar por nome do produto..." 
              className="bg-transparent flex-1 outline-none font-bold text-sm text-slate-700"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              className="bg-slate-50 border border-slate-100 px-6 py-3 rounded-2xl font-bold text-sm text-slate-600 outline-none"
              value={nicheFilter}
              onChange={e => setNicheFilter(e.target.value)}
            >
              <option value="Todos">Todos os Nichos</option>
              {Object.values(Niche).map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        {/* Área Principal (Planilha ou Cards) */}
        {viewMode === 'spreadsheet' ? (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                    <th className="px-8 py-6">Produto</th>
                    <th className="px-4 py-6">Plataforma</th>
                    <th className="px-4 py-6">Preço (R$)</th>
                    <th className="px-4 py-6">Comissão (R$)</th>
                    <th className="px-4 py-6">CPC Médio</th>
                    <th className="px-4 py-6">ROI Est.</th>
                    <th className="px-4 py-6">Score Página</th>
                    <th className="px-8 py-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr><td colSpan={8} className="p-20 text-center animate-pulse font-black text-slate-300 uppercase tracking-widest">Sincronizando Banco de Dados...</td></tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr><td colSpan={8} className="p-20 text-center font-bold text-slate-400">Nenhum produto encontrado.</td></tr>
                  ) : filteredProducts.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full ${p.finalScore > 50 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`}></div>
                          <div>
                            <p className="font-black text-sm text-slate-800">{p.name}</p>
                            <p className="text-[9px] font-bold text-indigo-500 uppercase">{p.niche}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-6">
                        <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-3 py-1 rounded-full">{p.platform}</span>
                      </td>
                      <td className="px-4 py-6 font-mono font-bold text-sm">R$ {p.actualPrice.toFixed(2)}</td>
                      <td className="px-4 py-6 font-mono font-bold text-sm text-emerald-600">R$ {p.financialAnalysis?.totalCommissionCash.toFixed(2)}</td>
                      <td className="px-4 py-6 font-mono font-bold text-sm">R$ {p.avgCPC.toFixed(2)}</td>
                      <td className="px-4 py-6">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full ${p.finalScore > 50 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {p.finalScore.toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-4 py-6">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500" style={{width: `${p.salesPageScore * 10}%`}}></div>
                          </div>
                          <span className="text-[10px] font-black">{p.salesPageScore}/10</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => window.open(p.link, '_blank')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600"><ExternalLink className="w-4 h-4" /></button>
                          <button onClick={() => deleteProduct(p.id)} className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(p => (
              <div key={p.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-xl transition-shadow border-t-4 border-t-indigo-500">
                <div className="p-8 space-y-4 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-lg text-slate-900 leading-tight">{p.name}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase mt-1">{p.platform} • {p.niche}</p>
                    </div>
                    <span className="text-2xl font-black text-emerald-500">{p.finalScore.toFixed(0)}% <span className="text-[10px] text-slate-400 block text-right font-black">ROI EST</span></span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">Comissão</p>
                      <p className="font-black text-slate-800">R$ {p.financialAnalysis?.totalCommissionCash.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">CPC Sugerido</p>
                      <p className="font-black text-slate-800">R$ {p.avgCPC.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Veredito da IA</p>
                    <p className="text-xs text-slate-600 line-clamp-3 italic leading-relaxed">"{p.aiVerdict}"</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-6 flex justify-between items-center">
                  <button onClick={() => deleteProduct(p.id)} className="text-[10px] font-black text-rose-500 uppercase flex items-center gap-1 hover:underline"><Trash2 className="w-3.5 h-3.5" /> Remover</button>
                  <button onClick={() => window.open(p.link, '_blank')} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">Abrir Link <ExternalLink className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal de Cadastro */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200 border border-white/10">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black uppercase italic tracking-tighter">GARIMPAR <span className="text-emerald-400">NOVA OFERTA</span></h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Preencha os dados básicos e deixe a IA auditar</p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="bg-white/10 p-3 rounded-2xl hover:bg-rose-500 transition-colors"><Plus className="w-6 h-6 rotate-45" /></button>
            </div>
            <form ref={formRef} onSubmit={handleAddProduct} className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10 max-h-[80vh] overflow-y-auto">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Nome do Produto</label>
                  <input name="name" required placeholder="Ex: Método Seca Tudo 2.0" className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-2xl font-black text-xl outline-none focus:border-emerald-500 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Página de Vendas (URL)</label>
                  <input name="salesUrl" required placeholder="https://..." className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold text-slate-600 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Plataforma</label>
                    <select name="platform" className="w-full p-4 rounded-xl border-2 border-slate-100 font-bold text-slate-600">
                      {Object.values(Platform).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Nicho</label>
                    <select name="niche" className="w-full p-4 rounded-xl border-2 border-slate-100 font-bold text-slate-600">
                      {Object.values(Niche).map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
                <button type="button" onClick={handleAudit} disabled={isAuditing} className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-95">
                  {isAuditing ? <Loader2 className="animate-spin" /> : <BrainCircuit className="w-5 h-5 text-emerald-400" />} {isAuditing ? 'Analisando Estratégia...' : 'Auditoria de IA Profunda'}
                </button>
              </div>
              
              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200 space-y-6">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b pb-2">Calculadora Financeira</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Preço (R$)</label>
                    <input name="actualPrice" type="number" required defaultValue="97" className="w-full p-4 rounded-xl border-2 border-white bg-white font-black" onChange={e => setCalcState(prev => ({...prev, actualPrice: Number(e.target.value)}))} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Comissão (%)</label>
                    <input name="actualCommPercent" type="number" defaultValue="50" className="w-full p-4 rounded-xl border-2 border-white bg-white font-black text-emerald-600" onChange={e => setCalcState(prev => ({...prev, actualCommPercent: Number(e.target.value)}))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">CPC Máximo Alvo (R$)</label>
                  <input name="avgCPC" type="number" step="0.01" defaultValue="1.50" className="w-full p-5 rounded-xl border-2 border-indigo-200 bg-white font-black text-2xl text-indigo-600" onChange={e => setCalcState(prev => ({...prev, manualCPC: Number(e.target.value)}))} />
                </div>
                <div className={`p-6 rounded-2xl text-center border-2 transition-colors ${roiEst > 50 ? 'bg-emerald-50 border-emerald-100' : roiEst > 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-rose-50 border-rose-100'}`}>
                  <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Resultado Projetado</p>
                  <p className={`text-3xl font-black ${roiEst > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{roiEst.toFixed(0)}% ROI</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">Estimado baseado em 30 cliques/venda</p>
                </div>
                <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 py-6 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all">Salvar na Planilha</button>
              </div>
              <input type="hidden" name="salesPageScore" defaultValue="7" />
            </form>
          </div>
        </div>
      )}

      {/* Toaster de Cópia */}
      {copiedText && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-emerald-400 px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest z-[200] border border-emerald-500/30 animate-in slide-in-from-bottom flex items-center gap-3">
          <Check className="w-4 h-4" /> Copiado com sucesso!
        </div>
      )}
    </div>
  );
};

export default App;
