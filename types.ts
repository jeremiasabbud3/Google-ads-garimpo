
export enum Platform {
  HOTMART = 'Hotmart',
  KIWIFY = 'Kiwify',
  EDUZZ = 'Eduzz',
  MONETIZZE = 'Monetizze',
  CLICKBANK = 'ClickBank',
  AMAZON = 'Amazon',
  OUTRA = 'Outra'
}

export enum Niche {
  FINANCAS = 'Finanças',
  SAUDE = 'Saúde',
  RELACIONAMENTO = 'Relacionamento',
  HOBBIES = 'Hobbies',
  NEGOCIOS = 'Negócios Online',
  DESENVOLVIMENTO = 'Desenvolvimento Pessoal',
  OUTRO = 'Outro'
}

export interface AdsAssets {
  keywords: string[];
  titles: string[];
  descriptions: string[];
}

export interface MarketInsights {
  searchVolume: string;
  trendStatus: 'Crescente' | 'Estável' | 'Queda';
  estimatedCPC: number;
  competitionLevel: 'Baixa' | 'Média' | 'Alta';
}

export interface FinancialAnalysis {
  profitPerSale: number;
  roiPercent: number;
  breakEvenClicks: number;
  maxCpcRecommended: number;
  viabilityStatus: 'Lucrativo' | 'Alerta' | 'Prejuízo';
  totalCommissionCash: number;
  totalAdsCost: number;
}

export interface ActualPerformance {
  totalSpent: number;
  actualClicks: number;
  conversions: number;
  salesValue: number;
  lastUpdate: number;
  // Novos campos de gestão
  accountName?: string;
  campaignName?: string;
  launchDate?: string;
  adStatus?: 'Ativo' | 'Pausado' | 'Reprovado';
  pixelStatus?: 'Ok' | 'Erro' | 'Sem Pixel';
  bidStrategy?: string;
}

export interface AffiliateProduct {
  id: string;
  name: string;
  platform: Platform;
  niche: Niche;
  platformPrice: number;
  platformCommPercent: number;
  actualPrice: number;
  actualCommPercent: number;
  avgCPC: number; 
  minBidCPC?: number; 
  maxBidCPC?: number; 
  gravityOrTemp: number; 
  ranking: number; 
  salesPageScore: number; 
  link: string;
  finalScore: number;
  createdAt: number;
  adsAssets?: AdsAssets;
  aiVerdict?: string;
  groundingUrls?: { title: string; uri: string }[];
  financialAnalysis?: FinancialAnalysis;
  marketInsights?: MarketInsights;
  performance?: ActualPerformance;
}
