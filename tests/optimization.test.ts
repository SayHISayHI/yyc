import { describe, it, expect } from 'vitest';
import { calculateOptimalContainers } from '../src/utils/calculator';
import { defaultSeaRates } from '../src/utils/defaults';

describe('Container Optimization Tests', () => {
  it('finds optimal single container for small shipment', () => {
    // Volume: 15 CBM, Weight: 5000 kg
    // Should fit in single 20' GP (33 CBM, 25000 kg)
    const result = calculateOptimalContainers(15, 5000, defaultSeaRates);
    
    expect(result.valid).toBe(true);
    expect(result.containers["20' GP"]).toBe(1);
    expect(result.totalCost).toBe(165);
  });

  it('finds optimal combination for medium shipment', () => {
    // Volume: 50 CBM, Weight: 20000 kg
    // Should use 1x 40' GP (67 CBM, 29000 kg) instead of 2x 20' GP
    const result = calculateOptimalContainers(50, 20000, defaultSeaRates);
    
    expect(result.valid).toBe(true);
    // Should prefer single 40' container
    expect(result.totalCost).toBeLessThanOrEqual(330);
  });

  it('finds optimal combination for large shipment requiring multiple containers', () => {
    // Volume: 100 CBM, Weight: 50000 kg
    // Options:
    // - 2x 40' HC (152 CBM, 58000 kg) = 660
    // - 2x 40' GP (134 CBM, 58000 kg) = 660
    // - 1x 40' HC + 1x 40' GP (143 CBM, 58000 kg) = 660
    // - 3x 20' GP (99 CBM, 75000 kg) = 495 ✓ (cheaper but less volume)
    // - 1x 40' HC + 2x 20' GP (142 CBM, 79000 kg) = 660
    // Best should be 1x 40' HC + 1x 20' GP = 495
    const result = calculateOptimalContainers(100, 50000, defaultSeaRates);
    
    expect(result.valid).toBe(true);
    expect(result.totalVolume).toBeGreaterThanOrEqual(100);
    expect(result.totalWeight).toBeGreaterThanOrEqual(50000);
    
    // Should find a cost-effective combination
    const totalContainers = Object.values(result.containers).reduce((a, b) => a + b, 0);
    expect(totalContainers).toBeGreaterThanOrEqual(2);
    expect(totalContainers).toBeLessThanOrEqual(4);
  });

  it('handles weight-constrained scenario', () => {
    // High weight, low volume: 30000 kg, 20 CBM
    // Single 40' GP can handle this (67 CBM, 29000 kg) - NO, weight exceeds
    // Need 2x 20' GP or similar
    const result = calculateOptimalContainers(20, 30000, defaultSeaRates);
    
    expect(result.valid).toBe(true);
    expect(result.totalWeight).toBeGreaterThanOrEqual(30000);
  });

  it('handles volume-constrained scenario', () => {
    // Low weight, high volume: 5000 kg, 80 CBM
    // Need containers with high volume capacity
    const result = calculateOptimalContainers(80, 5000, defaultSeaRates);
    
    expect(result.valid).toBe(true);
    expect(result.totalVolume).toBeGreaterThanOrEqual(80);
    expect(result.totalWeight).toBeGreaterThanOrEqual(5000);
  });

  it('minimizes cost when multiple options exist', () => {
    // 40 CBM, 15000 kg
    // Option 1: 1x 40' GP (330)
    // Option 2: 2x 20' GP (330)
    // Both are valid, should pick one efficiently
    const result = calculateOptimalContainers(40, 15000, defaultSeaRates);
    
    expect(result.valid).toBe(true);
    expect(result.totalCost).toBeLessThanOrEqual(330);
  });

  it('handles very large shipment with optimal combination', () => {
    // 200 CBM, 100000 kg
    // Need multiple containers, should find optimal mix
    const result = calculateOptimalContainers(200, 100000, defaultSeaRates);
    
    expect(result.valid).toBe(true);
    expect(result.totalVolume).toBeGreaterThanOrEqual(200);
    expect(result.totalWeight).toBeGreaterThanOrEqual(100000);
    
    // Should use multiple containers
    const totalContainers = Object.values(result.containers).reduce((a, b) => a + b, 0);
    expect(totalContainers).toBeGreaterThanOrEqual(3);
  });

  it('prefers cheaper containers when they satisfy requirements', () => {
    // Small shipment that fits in 20' GP
    const result1 = calculateOptimalContainers(10, 5000, defaultSeaRates);
    expect(result1.containers["20' GP"]).toBe(1);
    expect(result1.totalCost).toBe(165); // Cheaper than 40' options
    
    // Slightly larger, still fits in single 20' GP
    const result2 = calculateOptimalContainers(30, 20000, defaultSeaRates);
    expect(result2.totalCost).toBeLessThanOrEqual(330);
  });

  it('optimizes for reefer containers when requested', () => {
    // Volume: 20 CBM, Weight: 15000 kg
    // Should use 1x 20' RF (27 CBM, 21000 kg, cost 183)
    // If not reefer, would use 20' GP (cost 165)
    const result = calculateOptimalContainers(20, 15000, defaultSeaRates, true);
    
    expect(result.valid).toBe(true);
    expect(result.containers["20' RF"]).toBe(1);
    expect(result.totalCost).toBe(183);
    
    // Ensure no non-reefer containers are used
    expect(result.containers["20' GP"]).toBeUndefined();
    expect(result.containers["40' GP"]).toBeUndefined();
  });

  it('handles massive shipment efficiently', () => {
    // 5000 CBM, 1,000,000 kg
    // 40' HC is 76 CBM, 29000 kg.
    // 5000 / 76 ~= 65.7 containers.
    // 1,000,000 / 29000 ~= 34.5 containers.
    // So volume is the constraint.
    // Should use roughly 66 containers.
    const start = performance.now();
    const result = calculateOptimalContainers(5000, 1000000, defaultSeaRates);
    const end = performance.now();
    
    expect(result.valid).toBe(true);
    expect(result.totalVolume).toBeGreaterThanOrEqual(5000);
    expect(result.totalWeight).toBeGreaterThanOrEqual(1000000);
    
    const totalContainers = Object.values(result.containers).reduce((a, b) => a + b, 0);
    expect(totalContainers).toBeGreaterThan(60);
    
    // Should be fast (< 100ms)
    expect(end - start).toBeLessThan(100);
  });
});
