
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, Search, BrainCircuit, Loader2, Rocket, 
  FileSpreadsheet, Download, ExternalLink, Table as TableIcon, X, TrendingUp,
  Filter, Calculator, Save, AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Platform, Niche, AffiliateProduct, FinancialAnalysis } from './types';
import { extractMarketAndPageData } from './services/geminiService';
import { supabase, isSupabaseConfigured } from './services/supabase';

const App: React.FC = () => {
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [nicheFilter, setNicheFilter] = useState<string>('Todos');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Estado do formulário integrado
  const [newProduct, setNewProduct] = useState({
    name: '',
    platform: Platform.HOTMART,
    niche: Niche.FINANCAS,
    actualPrice: 97,
    actualCommPercent: 50,
    link: '',
    avgCPC: 1.50
  });

  useEffect(() => {
    const init = async () => {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data, error } = await supabase.from('products').select('*').order('createdAt', { ascending: false });
          if (!error && data) {
            setProducts(data.map(p => ({
              ...p,
              financialAnalysis: typeof p.financialAnalysis === 'string' ? JSON.parse(p.financialAnalysis) : p.financialAnalysis,
            })));
          }
        } else {
          const local = localStorage.getItem('garimpo_fallback');
          if (local) setProducts(JSON.parse(local));
        }
      } catch (err) {
        console.error("Falha ao carregar dados:", err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.link) return alert("Preencha nome e link!");
    
    setIsSaving(true);
    
    const commission = newProduct.actualPrice * (newProduct.actualCommPercent / 100);
    const estimatedSales = 1; // Base de cálculo
    const estimatedClicks = 30; // Média para 1 venda
    const totalAdsCost = newProduct.avgCPC * estimatedClicks;
    
    const financial: FinancialAnalysis = {
      profitPerSale: commission - newProduct.avgCPC,
      roiPercent: totalAdsCost > 0 ? ((commission - totalAdsCost) / totalAdsCost) * 100 : 0,
      breakEvenClicks: Math.floor(commission / newProduct.avgCPC),
      maxCpcRecommended: commission / 20,
      viabilityStatus: 'Lucrativo',
      totalCommissionCash: commission,
      totalAdsCost: totalAdsCost
    };

    const product: AffiliateProduct = {
      id: crypto.randomUUID(),
      name: newProduct.name,
      platform: newProduct.platform,
      niche: newProduct.niche,
      platformPrice: newProduct.actualPrice,
      platformCommPercent: newProduct.actualCommPercent,
      actualPrice: newProduct.actualPrice,
      actualCommPercent: newProduct.actualCommPercent,
      avgCPC: newProduct.avgCPC,
      gravityOrTemp: 0,
      ranking: 0,
      salesPageScore: 8,
      link: newProduct.link,
      finalScore: financial.roiPercent,
      createdAt: Date.now(),
      financialAnalysis: financial
    };

    const updatedProducts = [product, ...products];
    setProducts(updatedProducts);
    localStorage.setItem('garimpo_fallback', JSON.stringify(updatedProducts));

    if (isSupabaseConfigured && supabase) {
      await supabase.from('products').insert([{
        ...product,
        financialAnalysis: JSON.stringify(financial)
      }]);
    }

    setNewProduct({
      name: '',
      platform: Platform.HOTMART,
      niche: Niche.FINANCAS,
      actualPrice: 97,
      actualCommPercent: 50,
      link: '',
      avgCPC: 1.50
    });
    setIsSaving(false);
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Excluir este garimpo?")) return;
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    localStorage.setItem('garimpo_fallback', JSON.stringify(updated));
    if (isSupabaseConfigured && supabase) {
      await supabase.from('products').delete().eq('id', id);
    }
  };

  const filteredProducts = useMemo(() => {
    return (products || []).filter(p => {
      const matchSearch = (p.name || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchNiche = nicheFilter === 'Todos' || p.niche === nicheFilter;
      return matchSearch && matchNiche;
    });
  }, [products, searchTerm, nicheFilter]);

  const stats = useMemo(() => {
    const list = filteredProducts || [];
    const totalPotential = list.reduce((acc, p) => acc + (p.financialAnalysis?.totalCommissionCash || 0), 0);
    const avgROI = list.length > 0 ? list.reduce((acc, p) => acc + (p.financialAnalysis?.roiPercent || 0), 0) / list.length : 0;
    return { totalPotential, avgROI, count: list.length };
  }, [filteredProducts]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
        <p className="text-[10px] uppercase font-black tracking-widest">Acessando Planilha...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-24 text-slate-900 font-sans">
      {/* Header Compacto */}
      <header className="bg-slate-900 text-white py-4 px-8 sticky top-0 z-[60] shadow-2xl flex justify-between items-center border-b border-emerald-500/30">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 p-1.5 rounded-lg">
            <TrendingUp className="w-5 h-5 text-slate-900" />
          </div>
          <h1 className="text-lg font-black tracking-tighter italic">GARIMPO <span className="text-emerald-400">PRO</span></h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex gap-4 border-r border-white/10 pr-6">
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase leading-none">Lucro Estimado</p>
              <p className="text-sm font-bold text-emerald-400">R$ {stats.totalPotential.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase leading-none">ROI Médio</p>
              <p className="text-sm font-bold text-white">{stats.avgROI.toFixed(1)}%</p>
            </div>
          </div>
          <button onClick={() => {
            const ws = XLSX.utils.json_to_sheet(products);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Produtos");
            XLSX.writeFile(wb, "meu_garimpo.xlsx");
          }} className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2">
            <Download className="w-4 h-4" /> Exportar Excel
          </button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-6">
        
        {/* Seção de Cadastro Rápido (Substitui o Modal) */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-8 py-4 border-b border-slate-100 flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-600" />
            <h2 className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Novo Garimpo</h2>
          </div>
          <form onSubmit={handleAddProduct} className="p-8 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6 items-end">
            <div className="lg:col-span-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 mb-2 block">Nome do Produto</label>
              <input 
                type="text" 
                value={newProduct.name}
                onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                placeholder="Ex: Método Emagrecer 2.0"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 mb-2 block">Plataforma</label>
              <select 
                value={newProduct.platform}
                onChange={e => setNewProduct({...newProduct, platform: e.target.value as Platform})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none"
              >
                {Object.values(Platform).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 mb-2 block">Preço (R$)</label>
              <input 
                type="number" 
                value={newProduct.actualPrice}
                onChange={e => setNewProduct({...newProduct, actualPrice: Number(e.target.value)})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 mb-2 block">Comissão (%)</label>
              <input 
                type="number" 
                value={newProduct.actualCommPercent}
                onChange={e => setNewProduct({...newProduct, actualCommPercent: Number(e.target.value)})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 mb-2 block">Link de Afiliado/Vendas</label>
              <input 
                type="url" 
                value={newProduct.link}
                onChange={e => setNewProduct({...newProduct, link: e.target.value})}
                placeholder="https://..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 mb-2 block">CPC Médio (R$)</label>
              <input 
                type="number" 
                step="0.01"
                value={newProduct.avgCPC}
                onChange={e => setNewProduct({...newProduct, avgCPC: Number(e.target.value)})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none"
              />
            </div>
            <div>
              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full bg-slate-900 text-white h-[46px] rounded-xl font-black text-xs uppercase hover:bg-emerald-600 hover:text-slate-900 transition-all flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar
              </button>
            </div>
          </form>
        </section>

        {/* Planilha de Dados */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Filtros da Planilha */}
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-white">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Pesquisar na planilha..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 ring-emerald-500/20"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              {['Todos', ...Object.values(Niche)].map(n => (
                <button
                  key={n}
                  onClick={() => setNicheFilter(n)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${
                    nicheFilter === n ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-8 py-5 text-left">Produto</th>
                  <th className="px-4 py-5 text-left">Plataforma</th>
                  <th className="px-4 py-5 text-right">Preço</th>
                  <th className="px-4 py-5 text-right">Comissão</th>
                  <th className="px-4 py-5 text-right">CPC</th>
                  <th className="px-4 py-5 text-center">ROI Est.</th>
                  <th className="px-4 py-5 text-center">Status</th>
                  <th className="px-8 py-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center text-slate-400">
                      <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="font-bold text-sm">Nenhum produto cadastrado nesta categoria.</p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-800 text-sm">{p.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{p.niche}</span>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-black uppercase tracking-tighter">
                          {p.platform}
                        </span>
                      </td>
                      <td className="px-4 py-5 text-right font-mono text-xs font-bold">R$ {p.actualPrice?.toFixed(2)}</td>
                      <td className="px-4 py-5 text-right font-mono text-xs font-bold text-emerald-600">
                        R$ {p.financialAnalysis?.totalCommissionCash.toFixed(2)}
                      </td>
                      <td className="px-4 py-5 text-right font-mono text-xs">R$ {p.avgCPC?.toFixed(2)}</td>
                      <td className="px-4 py-5 text-center">
                        <span className={`text-sm font-black ${p.financialAnalysis?.roiPercent && p.financialAnalysis.roiPercent > 50 ? 'text-emerald-500' : 'text-orange-500'}`}>
                          {p.financialAnalysis?.roiPercent.toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-4 py-5 text-center">
                        <div className="flex justify-center">
                          {p.financialAnalysis?.roiPercent && p.financialAnalysis.roiPercent > 20 ? (
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => window.open(p.link, '_blank')}
                            className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-900 hover:text-white transition-all"
                            title="Abrir Link"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => deleteProduct(p.id)}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cards de Insight Adicional */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <BrainCircuit className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="text-lg font-black italic mb-2 tracking-tight">INTELIGÊNCIA <span className="text-emerald-400">ARTIFICIAL</span></h3>
              <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                A IA do Garimpo analisa automaticamente o volume de buscas e a concorrência dos seus produtos para sugerir o lance ideal no Google Ads.
              </p>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <Calculator className="w-32 h-32" />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-200 flex items-center gap-6">
            <div className="p-4 bg-amber-100 rounded-2xl">
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-sm uppercase">Dica de Performance</h3>
              <p className="text-slate-500 text-xs mt-1">
                Foque em produtos com ROI estimado acima de 50% e CPC abaixo de R$ 2,00 para garantir escala com segurança financeira.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="fixed bottom-0 w-full bg-white border-t border-slate-200 py-3 px-8 text-center">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Sistema de Garimpo Profissional © {new Date().getFullYear()} — Dados salvos localmente
        </p>
      </footer>
    </div>
  );
};

export default App;
