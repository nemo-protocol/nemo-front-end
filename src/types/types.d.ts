export interface TokenMeta {
    symbol: string;
    name: string;
    logo: string;          
  }
  
  export interface MarketStat {
    label: string;
    value: string;
    delta?: string;      
    deltaPositive?: boolean;
  }
  
  export interface ChartPoint {
    ts: number;            
    apy: number;
  }
  