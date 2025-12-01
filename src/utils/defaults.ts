import type { SeaFreightRates, AirFreightRates, BankCharges, OtherCharges } from './types';

export const defaultSeaRates: SeaFreightRates = {
  fcl: {
    "20' GP": { maxWeight: 25000, maxVolume: 33, cost: 165 },
    "40' GP": { maxWeight: 29000, maxVolume: 67, cost: 330 },
    "40' HC": { maxWeight: 29000, maxVolume: 76, cost: 330 },
    "20' RF": { maxWeight: 21000, maxVolume: 27, cost: 183 },
    "40' RF": { maxWeight: 26000, maxVolume: 58, cost: 383 },
    "40' RH": { maxWeight: 26000, maxVolume: 66, cost: 383 },
  },
  lcl: {
    m_mtq: 7.5,
    w_tne: 12.8,
    min: 0, // Not specified, assuming 0 or low
  }
};

export const defaultAirRates: AirFreightRates = {
  min: 17,
  brackets: [
    { maxWeight: 45, rate: 1.05 },
    { maxWeight: 100, rate: 0.93 },
    { maxWeight: 300, rate: 0.88 },
    { maxWeight: 500, rate: 0.88 },
    { maxWeight: 1000, rate: 0.82 },
    { maxWeight: 999999, rate: 0.82 }, // >1000
  ],
  mscMin: 5.6,
  awc: 5.6,
  myc: 0.82,
  msc: 0.12,
};

export const defaultBankCharges: BankCharges = {
  openingCable: 26.99,
  acceptance: { rate: 1, min: 13.49, max: 67.47 }, // Rate is likely per mille or percent? 1 seems high for percent if min is 13.
  // If 250,000 * 1% = 2500. Max is 67. So 1% is too high.
  // Maybe 1 per mille (0.1%)? 250000 * 0.001 = 250. Still > 67.
  // Maybe the rate is fixed? No, "1" is in a column that looks like rate.
  // Let's assume it's per mille (0.1%) for now, or we need to check the math.
  // Wait, the image shows "1" in the column before "13.49".
  // Let's stick to the values and adjust logic if needed.
  payment: { rate: 1.25, min: 13.49 },
  cable: 26.99,
};

export const defaultOtherCharges: OtherCharges = {
  importInspection: { rate: 0.08, min: 8.1 },
  importCustoms: 13.49,
  importForwarder: { rate: 0.25, min: 67.47 },
  exwOverseas: { rate: 1, min: 134.94 },
};
