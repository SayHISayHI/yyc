import { describe, it, expect } from 'vitest';
import { calculateTotalCost, calculateSeaFreight, calculateAirFreight } from '../src/utils/calculator';
import { defaultSeaRates, defaultAirRates, defaultBankCharges, defaultOtherCharges } from '../src/utils/defaults';
import type { ShipmentDetails } from '../src/utils/types';

describe('Integration Tests - Real World Scenarios', () => {
  const exchangeRate = 85.66778778; // USD 100 = 85.66778778 CNY

  describe('Sea Freight FCL Scenarios', () => {
    it('calculates correctly for 20\' GP container', () => {
      const shipment: ShipmentDetails = {
        tradeTerm: 'EXW',
        currency: 'USD',
        foreignCost: 250000,
        quantity: 5000,
        cartonCount: 1000,
        grossWeight: 9200,
        volume: 20,
        isFCL: true,
        transportMode: 'Sea',
        containerType: "20' GP",
      };

      const result = calculateTotalCost(
        shipment,
        defaultSeaRates,
        defaultAirRates,
        defaultBankCharges,
        defaultOtherCharges,
        exchangeRate
      );

      // Verify freight cost: 165 USD * 85.66778778 = 14135.18
      expect(result.freightCost).toBeCloseTo(14135.18, 1);
      
      // Verify total cost is calculated
      expect(result.totalCost).toBeGreaterThan(214169.47); // Foreign cost local
      expect(result.unitCost).toBeGreaterThan(0);
      
      // Verify breakdown exists
      expect(result.breakdown.freight).toBe(result.freightCost);
      expect(result.bankCharges).toBeGreaterThan(0);
      expect(result.otherCharges).toBeGreaterThan(0);
    });

    it('calculates correctly for 40\' GP container', () => {
      const shipment: ShipmentDetails = {
        tradeTerm: 'FOB',
        currency: 'USD',
        foreignCost: 500000,
        quantity: 10000,
        cartonCount: 2000,
        grossWeight: 18000,
        volume: 50,
        isFCL: true,
        transportMode: 'Sea',
        containerType: "40' GP",
      };

      const freight = calculateSeaFreight(shipment, defaultSeaRates);
      expect(freight).toBe(330); // 40' GP cost
    });
  });

  describe('Sea Freight LCL Scenarios', () => {
    it('calculates by volume when volume cost is higher', () => {
      const shipment: ShipmentDetails = {
        tradeTerm: 'EXW',
        currency: 'USD',
        foreignCost: 100000,
        quantity: 1000,
        cartonCount: 500,
        grossWeight: 3000, // 3 tons * 12.8 = 38.4
        volume: 10, // 10 CBM * 7.5 = 75
        isFCL: false,
        transportMode: 'Sea',
      };

      const freight = calculateSeaFreight(shipment, defaultSeaRates);
      expect(freight).toBe(75); // Higher of volume vs weight
    });

    it('calculates by weight when weight cost is higher', () => {
      const shipment: ShipmentDetails = {
        tradeTerm: 'EXW',
        currency: 'USD',
        foreignCost: 100000,
        quantity: 1000,
        cartonCount: 500,
        grossWeight: 15000, // 15 tons * 12.8 = 192
        volume: 10, // 10 CBM * 7.5 = 75
        isFCL: false,
        transportMode: 'Sea',
      };

      const freight = calculateSeaFreight(shipment, defaultSeaRates);
      expect(freight).toBe(192); // Higher of volume vs weight
    });
  });

  describe('Air Freight Scenarios', () => {
    it('calculates for small shipment (45kg bracket)', () => {
      const shipment: ShipmentDetails = {
        tradeTerm: 'EXW',
        currency: 'USD',
        foreignCost: 50000,
        quantity: 500,
        cartonCount: 100,
        grossWeight: 30,
        volume: 0.1,
        isFCL: false,
        transportMode: 'Air',
      };

      const freight = calculateAirFreight(shipment, defaultAirRates);
      // Chargeable: max(30, 0.1*167) = 30kg
      // Rate: 1.05 (0-45kg bracket)
      // Cost: 30 * 1.05 = 31.5
      expect(freight).toBe(31.5);
    });

    it('calculates for medium shipment (100kg bracket)', () => {
      const shipment: ShipmentDetails = {
        tradeTerm: 'EXW',
        currency: 'USD',
        foreignCost: 100000,
        quantity: 1000,
        cartonCount: 200,
        grossWeight: 80,
        volume: 0.3,
        isFCL: false,
        transportMode: 'Air',
      };

      const freight = calculateAirFreight(shipment, defaultAirRates);
      // Chargeable: max(80, 0.3*167) = 80kg
      // Rate: 0.93 (45-100kg bracket)
      // Cost: 80 * 0.93 = 74.4
      expect(freight).toBe(74.4);
    });

    it('calculates for large shipment (>1000kg bracket)', () => {
      const shipment: ShipmentDetails = {
        tradeTerm: 'EXW',
        currency: 'USD',
        foreignCost: 250000,
        quantity: 5000,
        cartonCount: 1000,
        grossWeight: 9200,
        volume: 20,
        isFCL: false,
        transportMode: 'Air',
      };

      const freight = calculateAirFreight(shipment, defaultAirRates);
      // Chargeable: max(9200, 20*167) = 9200kg
      // Rate: 0.82 (>1000kg bracket)
      // Cost: 9200 * 0.82 = 7544
      expect(freight).toBe(7544);
    });

    it('uses volumetric weight when higher than gross weight', () => {
      const shipment: ShipmentDetails = {
        tradeTerm: 'EXW',
        currency: 'USD',
        foreignCost: 50000,
        quantity: 500,
        cartonCount: 100,
        grossWeight: 100,
        volume: 1, // 1 CBM * 167 = 167kg volumetric
        isFCL: false,
        transportMode: 'Air',
      };

      const freight = calculateAirFreight(shipment, defaultAirRates);
      // Chargeable: max(100, 167) = 167kg
      // Rate: 0.88 (100-300kg bracket)
      // Cost: 167 * 0.88 = 146.96
      expect(freight).toBeCloseTo(146.96, 2);
    });

    it('applies minimum charge when calculated cost is too low', () => {
      const shipment: ShipmentDetails = {
        tradeTerm: 'EXW',
        currency: 'USD',
        foreignCost: 10000,
        quantity: 100,
        cartonCount: 10,
        grossWeight: 5,
        volume: 0.01,
        isFCL: false,
        transportMode: 'Air',
      };

      const freight = calculateAirFreight(shipment, defaultAirRates);
      // Chargeable: 5kg, Rate: 1.05 = 5.25
      // But minimum is 17
      expect(freight).toBe(17);
    });
  });

  describe('Complete Cost Calculation', () => {
    it('calculates all components correctly for Sea FCL', () => {
      const shipment: ShipmentDetails = {
        tradeTerm: 'EXW',
        currency: 'USD',
        foreignCost: 250000,
        quantity: 5000,
        cartonCount: 1000,
        grossWeight: 9200,
        volume: 20,
        isFCL: true,
        transportMode: 'Sea',
        containerType: "20' GP",
      };

      const result = calculateTotalCost(
        shipment,
        defaultSeaRates,
        defaultAirRates,
        defaultBankCharges,
        defaultOtherCharges,
        exchangeRate
      );

      // Foreign cost local: 250000 * (85.66778778/100) = 214169.47
      const expectedForeignCostLocal = 250000 * (exchangeRate / 100);
      expect(expectedForeignCostLocal).toBeCloseTo(214169.47, 1);

      // Freight: 165 * 85.66778778 = 14135.18
      expect(result.freightCost).toBeCloseTo(14135.18, 1);

      // Total should include freight + bank + other + foreign cost
      expect(result.totalCost).toBeGreaterThan(result.freightCost);
      expect(result.totalCost).toBeGreaterThan(expectedForeignCostLocal);

      // Unit cost = total / quantity
      expect(result.unitCost).toBeCloseTo(result.totalCost / shipment.quantity, 4);
    });

    it('calculates all components correctly for Air', () => {
      const shipment: ShipmentDetails = {
        tradeTerm: 'EXW',
        currency: 'USD',
        foreignCost: 100000,
        quantity: 2000,
        cartonCount: 400,
        grossWeight: 500,
        volume: 2,
        isFCL: false,
        transportMode: 'Air',
      };

      const result = calculateTotalCost(
        shipment,
        defaultSeaRates,
        defaultAirRates,
        defaultBankCharges,
        defaultOtherCharges,
        exchangeRate
      );

      // Air freight for 500kg (chargeable = max(500, 2*167) = 500kg)
      // Rate 0.82 (500-1000 bracket) = 500 * 0.82 = 410
      const expectedAirFreight = 410 * exchangeRate;
      expect(result.freightCost).toBeCloseTo(expectedAirFreight, 1);

      expect(result.totalCost).toBeGreaterThan(0);
      expect(result.bankCharges).toBeGreaterThan(0);
      expect(result.otherCharges).toBeGreaterThan(0);
    });
  });
});
