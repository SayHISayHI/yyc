export type Currency = 'USD' | 'EUR' | 'CNY';

export interface ExchangeRate {
  source: Currency;
  target: Currency;
  rate: number;
}

export interface ShipmentDetails {
  grossWeight: number; // kg
  volume: number; // CBM
  isFCL: boolean; // Full Container Load
  containerType?: string; // e.g., "20' GP"
  transportMode: 'Sea' | 'Air';
  isReeferContainer?: boolean; // 是否冻柜运输 (仅海运FCL)
}

export interface SeaFreightRates {
  fcl: Record<string, { maxWeight: number; maxVolume: number; cost: number; isReefer: boolean }>;
  lcl: {
    m_mtq: number; // Cost per CBM
    w_tne: number; // Cost per Ton
    min: number;
  };
}

export interface AirFreightRates {
  min: number;
  brackets: {
    maxWeight: number; // Upper bound of the bracket
    rate: number;
  }[];
  mscMin: number;
  awc: number;
  myc: number;
  msc: number;
}

export interface ChargeItem {
  name: string;
  cost: number;
  min?: number;
  max?: number;
  perUnit?: boolean; // If true, multiply by quantity (or some unit)
  unitType?: 'shipment' | 'container' | 'carton';
}

export interface BankCharges {
  openingCable: number;
  acceptance: { rate: number; min: number; max?: number };
  payment: { rate: number; min: number };
  cable: number;
}

export interface OtherCharges {
  importInspection: { rate: number; min: number };
  importCustoms: number;
  importForwarder: { rate: number; min: number };
  exwOverseas: { rate: number; min: number };
}

export interface CalculationResult {
  freightCost: number;
  totalCost: number;
  containerCombination?: {
    containers: Record<string, number>;
    totalCost: number;
  };
}
