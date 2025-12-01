export type Currency = 'USD' | 'EUR' | 'CNY';

export interface ExchangeRate {
  source: Currency;
  target: Currency;
  rate: number;
}

export interface ShipmentDetails {
  tradeTerm: 'EXW' | 'FOB' | 'CIF';
  currency: Currency;
  foreignCost: number; // Total foreign cost
  quantity: number;
  cartonCount: number;
  grossWeight: number; // kg
  volume: number; // CBM
  isFCL: boolean; // Full Container Load
  containerType?: string; // e.g., "20' GP"
  transportMode: 'Sea' | 'Air';
}

export interface SeaFreightRates {
  fcl: Record<string, { maxWeight: number; maxVolume: number; cost: number }>;
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
  bankCharges: number;
  otherCharges: number;
  totalCost: number;
  unitCost: number;
  breakdown: {
    freight: number;
    bank: Record<string, number>;
    other: Record<string, number>;
  };
  containerCombination?: {
    containers: Record<string, number>;
    totalCost: number;
  };
}
