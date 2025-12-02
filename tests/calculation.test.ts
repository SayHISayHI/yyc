import { describe, it, expect } from 'vitest';
import { calculateTotalCost, calculateChargeableWeight, calculateSeaFreight, calculateAirFreight } from '../src/utils/calculator';
import { defaultSeaRates, defaultAirRates } from '../src/utils/defaults';
import { ShipmentDetails } from '../src/utils/types';

describe('Calculator Logic', () => {
  const baseDetails: ShipmentDetails = {
    grossWeight: 9200,
    volume: 20,
    isFCL: true,
    transportMode: 'Sea',
    containerType: "20' GP",
    isReeferContainer: false
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
 
    
    const result = calculateTotalCost(
      baseDetails,
      defaultSeaRates,
      defaultAirRates
    );

    // Now totalCost is just freightCost in USD
    expect(result.totalCost).toBe(165);
    expect(result.freightCost).toBe(165);
  });
});
