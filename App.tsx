
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Trash2, Search, BrainCircuit, Loader2, Rocket, 
  FileSpreadsheet, Download, ExternalLink, Table as TableIcon, X, TrendingUp
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

  const downloadTemplate = () => {
    try {
      const template = [{ 'Nome': 'Exemplo', 'Preço': 97.0, 'Comissão %': 50, 'ROI Est': '100%' }];
      const ws = XLSX.utils.json_to_sheet(template);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Modelo");
      XLSX.writeFile(wb, "modelo_garimpo.xlsx");
    } catch (e) {
      alert("Erro ao gerar Excel: " + e);
    }
  };

  const filteredProducts = useMemo(() => {
    const list = products || [];
    return list.filter(p => {
      const name = p.name || "";
      const matchSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
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

  const roiEst = useMemo(() => {
    const commission = calcState.actualPrice * (calcState.actualCommPercent / 100);
    const adsCost = calcState.manualCPC * 30;
    return adsCost > 0 ? ((commission - adsCost) / adsCost) * 100 : 0;
  }, [calcState]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
        <p className="text-[10px] uppercase font-black tracking-widest">Iniciando Sistema...</p>
      </div>
    );
  }

  if (products.length === 0 && !isFormOpen) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-slate-900 border border-white/10 rounded-[3rem] p-12 text-center space-y-8">
          <Rocket className="w-16 h-16 text-emerald-400 mx-auto" />
          <h1 className="text-3xl font-black text-white italic">GARIMPO <span className="text-emerald-400">EXPERT</span></h1>
          <div className="flex flex-col gap-4">
            <button onClick={() => setIsFormOpen(true)} className="w-full bg-emerald-500 text-slate-900 py-6 rounded-2xl font-black uppercase text-xs">Começar Agora</button>
            <button onClick={downloadTemplate} className="text-white/50 text-[10px] font-bold uppercase hover:text-emerald-400 flex items-center justify-center gap-2 transition-colors">
              <FileSpreadsheet className="w-4 h-4" /> Baixar Modelo Excel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 text-slate-900">
      <header className="bg-slate-900 text-white p-5 sticky top-0 z-[60] shadow-xl">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <h1 className="text-xl font-black italic">GARIMPO <span className="text-emerald-400">EXPERT</span></h1>
          <button onClick={() => setIsFormOpen(true)} className="bg-emerald-500 text-slate-900 px-6 py-2 rounded-xl font-black text-xs uppercase">Novo Produto</button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase">Produtos</p>
            <p className="text-3xl font-black">{stats.count}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase">Lucro Est.</p>
            <p className="text-3xl font-black text-indigo-600">R$ {stats.totalPotential.toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase">ROI Médio</p>
            <p className="text-3xl font-black text-emerald-500">{stats.avgROI.toFixed(1)}%</p>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase">
                  <th className="px-8 py-6">Produto</th>
                  <th className="px-4 py-6">Preço</th>
                  <th className="px-4 py-6">ROI Est.</th>
                  <th className="px-8 py-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 group">
                    <td className="px-8 py-6 font-black">{p.name}</td>
                    <td className="px-4 py-6 font-mono">R$ {p.actualPrice?.toFixed(2)}</td>
                    <td className="px-4 py-6 text-emerald-600 font-bold">{p.finalScore?.toFixed(0)}%</td>
                    <td className="px-8 py-6 text-right">
                      <button onClick={() => window.open(p.link, '_blank')} className="p-2 text-slate-400 hover:text-indigo-600"><ExternalLink className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/20">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
              <h2 className="text-xl font-black italic">NOVO <span className="text-emerald-400">PRODUTO</span></h2>
              <button onClick={() => setIsFormOpen(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-10">
              <p className="text-center text-slate-500 py-10">Interface de cadastro pronta. Preencha os dados básicos para iniciar o cálculo de ROI.</p>
              <button onClick={() => setIsFormOpen(false)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-xs">Fechar Modal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
