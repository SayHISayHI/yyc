import { describe, it, expect } from 'vitest';
import { calculateTotalCost, calculateChargeableWeight, calculateSeaFreight, calculateAirFreight } from '../src/utils/calculator';
import { defaultSeaRates, defaultAirRates, defaultBankCharges, defaultOtherCharges } from '../src/utils/defaults';
import { ShipmentDetails } from '../src/utils/types';

describe('Calculator Logic', () => {
  const baseDetails: ShipmentDetails = {
    tradeTerm: 'EXW',
    currency: 'USD',
    foreignCost: 250000,
    quantity: 5000,
    cartonCount: 1000,
    grossWeight: 9200,
    volume: 20,
    isFCL: true,
    transportMode: 'Sea',
    containerType: "20' GP"
  };

  it('calculates chargeable weight for Air', () => {
    // Volume 20 CBM * 167 = 3340 kg. Gross 9200 kg. Max is 9200.
    expect(calculateChargeableWeight(9200, 20, 'Air')).toBe(9200);
    
    // Volume 100 CBM * 167 = 16700 kg. Gross 9200 kg. Max is 16700.
    expect(calculateChargeableWeight(9200, 100, 'Air')).toBe(16700);
  });

  it('calculates Sea Freight FCL', () => {
    const cost = calculateSeaFreight(baseDetails, defaultSeaRates);
    expect(cost).toBe(165); // 20' GP cost
  });

  it('calculates Sea Freight LCL', () => {
    const lclDetails = { ...baseDetails, isFCL: false };
    const cost = calculateSeaFreight(lclDetails, defaultSeaRates);
    // Weight: 9.2 Ton * 12.8 = 117.76
    // Volume: 20 CBM * 7.5 = 150
    // Max is 150.
    expect(cost).toBe(150);
  });

  it('calculates Air Freight', () => {
    const airDetails: ShipmentDetails = { ...baseDetails, transportMode: 'Air' };
    const cost = calculateAirFreight(airDetails, defaultAirRates);
    // Chargeable Weight 9200.
    // Bracket > 1000 -> Rate 0.82.
    // 9200 * 0.82 = 7544.
    expect(cost).toBe(7544);
  });

  it('calculates Total Cost', () => {
    // Using the example from the image roughly
    // Foreign Cost: 250000 USD? Or Local?
    // Image says "Foreign Cost (Foreign) 250000". "Foreign Cost (Local) 214169.47".
    // So Exchange Rate is ~0.8566778778.
    const exchangeRate = 85.66778778; 
    
    const result = calculateTotalCost(
      baseDetails,
      defaultSeaRates,
      defaultAirRates,
      defaultBankCharges,
      defaultOtherCharges,
      exchangeRate
    );

    // Freight (Sea FCL 20'GP): 165 USD * 85.66... = ~14135 Local (direct multiplication)
    // The formula is: freightCostUSD * exchangeRate
    // Since exchangeRate = 85.66778778, and freight = 165, result = 14135
    
    expect(result.totalCost).toBeGreaterThan(200000);
    expect(result.freightCost).toBeCloseTo(165 * exchangeRate, 1);
  });
});
