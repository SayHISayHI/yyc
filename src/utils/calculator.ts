import type {
  ShipmentDetails,
  SeaFreightRates,
  AirFreightRates,
  BankCharges,
  OtherCharges,
  CalculationResult,
} from './types';

export const calculateChargeableWeight = (grossWeight: number, volume: number, mode: 'Sea' | 'Air'): number => {
  if (mode === 'Air') {
    // Standard IATA volumetric weight: 1 CBM = 166.67 kg (often simplified to 167)
    const volWeight = volume * 167;
    return Math.max(grossWeight, volWeight);
  }
  return grossWeight; // For Sea LCL, usually per ton or per CBM, handled separately
};

export const calculateSeaFreight = (
  details: ShipmentDetails,
  rates: SeaFreightRates
): number => {
  if (details.isFCL && details.containerType) {
    const containerRate = rates.fcl[details.containerType];
    if (!containerRate) return 0;
    // Assuming quantity implies number of containers if unitType is container?
    // But usually quantity is goods quantity.
    // We need number of containers.
    // For now, let's assume 1 container if not specified, or we need a field for container count.
    // The Excel has "Single size required quantity" and "Mixed size required quantity".
    // Let's assume 1 for now or derive from volume/weight limits.
    // Simple version: 1 container.
    return containerRate.cost; 
  } else {
    // LCL
    const weightTon = details.grossWeight / 1000;
    const costByWeight = weightTon * rates.lcl.w_tne;
    const costByVolume = details.volume * rates.lcl.m_mtq;
    return Math.max(costByWeight, costByVolume, rates.lcl.min);
  }
};

export const calculateAirFreight = (
  details: ShipmentDetails,
  rates: AirFreightRates
): number => {
  const chargeableWeight = calculateChargeableWeight(details.grossWeight, details.volume, 'Air');
  
  // Find applicable rate
  let rate = rates.brackets[rates.brackets.length - 1].rate; // Default to highest bracket
  
  for (const bracket of rates.brackets) {
    if (chargeableWeight < bracket.maxWeight) {
      rate = bracket.rate;
      break;
    }
  }

  const freightCost = chargeableWeight * rate;
  return Math.max(freightCost, rates.min);
};

export const calculateBankCharges = (
  foreignCost: number,
  charges: BankCharges
): number => {
  let total = 0;
  total += charges.openingCable;
  
  // Acceptance
  const acceptance = Math.max(
    (foreignCost * charges.acceptance.rate) / 100, // Assuming rate is %
    charges.acceptance.min
  );
  // Apply max if exists
  total += charges.acceptance.max ? Math.min(acceptance, charges.acceptance.max) : acceptance;

  // Payment
  const payment = Math.max(
    (foreignCost * charges.payment.rate) / 100,
    charges.payment.min
  );
  total += payment;

  total += charges.cable;

  return total;
};

export const calculateOtherCharges = (
  foreignCost: number,
  charges: OtherCharges
): number => {
  let total = 0;
  
  // Import Inspection
  total += Math.max(
    (foreignCost * charges.importInspection.rate) / 100,
    charges.importInspection.min
  );

  // Import Customs
  total += charges.importCustoms;

  // Import Forwarder
  total += Math.max(
    (foreignCost * charges.importForwarder.rate) / 100,
    charges.importForwarder.min
  );

  // EXW Overseas
  total += Math.max(
    (foreignCost * charges.exwOverseas.rate) / 100,
    charges.exwOverseas.min
  );

  return total;
};

export const calculateTotalCost = (
  details: ShipmentDetails,
  seaRates: SeaFreightRates,
  airRates: AirFreightRates
): CalculationResult => {
  let freightCostUSD = 0;
  
  if (details.transportMode === 'Sea') {
    freightCostUSD = calculateSeaFreight(details, seaRates);
  } else {
    freightCostUSD = calculateAirFreight(details, airRates);
  }

  // Simplified: Just return freight cost in USD
  const totalCost = freightCostUSD;

  return {
    freightCost: freightCostUSD,
    totalCost,
  };
};

export interface ContainerCombination {
  containers: Record<string, number>; // e.g., { "20' GP": 2, "40' HC": 1 }
  totalCost: number;
  totalVolume: number;
  totalWeight: number;
  valid: boolean;
}

export const calculateOptimalContainers = (
  requiredVolume: number,
  requiredWeight: number,
  rates: SeaFreightRates,
  isReeferContainer: boolean = false
): ContainerCombination => {
  // Optimized for large shipments and edge cases (High Volume/Low Weight or vice versa)
  
  // 1. Filter and Sort container types
  // Sort by efficiency (Cost per CBM) to find good solutions early for pruning
  const containerTypes = Object.keys(rates.fcl)
    .filter(type => rates.fcl[type].isReefer === isReeferContainer)
    .sort((a, b) => {
      const effA = rates.fcl[a].cost / rates.fcl[a].maxVolume;
      const effB = rates.fcl[b].cost / rates.fcl[b].maxVolume;
      return effA - effB;
    });

  if (containerTypes.length === 0) {
    return {
      containers: {},
      totalCost: 0,
      totalVolume: 0,
      totalWeight: 0,
      valid: false,
    };
  }

  // 2. Define constants for optimization
  // We use a "Bulk + Remainder" strategy.
  const BUFFER_SIZE = 5; // Number of large containers to leave for the solver
  const MAX_RECURSION_DEPTH = 15; // Max depth for the solver

  // 3. Helper for brute force (optimized with backtracking)
  let bestRemainderSolution: { cost: number; counts: number[] } | null = null;
  
  const solveSmall = (
    targetVol: number, 
    targetWeight: number, 
    currentCounts: number[], 
    currentCost: number, 
    currentVol: number, 
    currentWeight: number,
    startIndex: number
  ) => {
    // Pruning: Cost exceeded best found so far
    if (bestRemainderSolution && currentCost >= bestRemainderSolution.cost) return;
    
    // Pruning: Depth exceeded
    const totalCount = currentCounts.reduce((a, b) => a + b, 0);
    if (totalCount >= MAX_RECURSION_DEPTH) return;

    // Check if valid solution
    if (currentVol >= targetVol && currentWeight >= targetWeight) {
      if (!bestRemainderSolution || currentCost < bestRemainderSolution.cost) {
        bestRemainderSolution = { cost: currentCost, counts: [...currentCounts] };
      }
      return;
    }

    // Recurse
    for (let i = startIndex; i < containerTypes.length; i++) {
      const type = containerTypes[i];
      const data = rates.fcl[type];
      
      currentCounts[i]++;
      solveSmall(
        targetVol, targetWeight, 
        currentCounts, 
        currentCost + data.cost, 
        currentVol + data.maxVolume, 
        currentWeight + data.maxWeight, 
        i 
      );
      currentCounts[i]--; // Backtrack
    }
  };

  // 4. Main Logic
  const maxVol = Math.max(...containerTypes.map(t => rates.fcl[t].maxVolume));
  const maxWeight = Math.max(...containerTypes.map(t => rates.fcl[t].maxWeight));
  
  const volBuffer = maxVol * BUFFER_SIZE;
  const weightBuffer = maxWeight * BUFFER_SIZE;

  let globalBest: ContainerCombination | null = null;

  // Try each container type as the "Bulk" carrier
  for (let i = 0; i < containerTypes.length; i++) {
    const bulkType = containerTypes[i];
    const bulkData = rates.fcl[bulkType];

    // Calculate how many bulk containers we can use safely.
    // CRITICAL FIX: Use Math.max to ensure we fill the constraint that requires MORE containers.
    // If Volume requires 100 containers but Weight requires 1, we must use ~100 containers.
    const bulkCount = Math.max(0, Math.max(
      Math.floor((requiredVolume - volBuffer) / bulkData.maxVolume),
      Math.floor((requiredWeight - weightBuffer) / bulkData.maxWeight)
    ));

    const remVol = Math.max(0, requiredVolume - bulkCount * bulkData.maxVolume);
    const remWeight = Math.max(0, requiredWeight - bulkCount * bulkData.maxWeight);

    // Reset solver for this bulk scenario
    bestRemainderSolution = null;
    solveSmall(remVol, remWeight, new Array(containerTypes.length).fill(0), 0, 0, 0, 0);

    if (bestRemainderSolution) {
      const solution = bestRemainderSolution;
      // Construct full solution
      const combination: Record<string, number> = {};
      
      // Add bulk
      if (bulkCount > 0) {
        combination[bulkType] = bulkCount;
      }

      // Add remainder
      let remainderCost = 0;
      let remainderVol = 0;
      let remainderWt = 0;

      solution.counts.forEach((count, idx) => {
        if (count > 0) {
          const type = containerTypes[idx];
          combination[type] = (combination[type] || 0) + count;
          
          const data = rates.fcl[type];
          remainderCost += count * data.cost;
          remainderVol += count * data.maxVolume;
          remainderWt += count * data.maxWeight;
        }
      });

      const totalCost = bulkCount * bulkData.cost + remainderCost;
      const totalVolume = bulkCount * bulkData.maxVolume + remainderVol;
      const totalWeight = bulkCount * bulkData.maxWeight + remainderWt;

      if (!globalBest || totalCost < globalBest.totalCost) {
        globalBest = {
          containers: combination,
          totalCost,
          totalVolume,
          totalWeight,
          valid: true
        };
      }
    }
  }

  // Fallback if no solution found
  if (!globalBest) {
     return {
      containers: {},
      totalCost: 0,
      totalVolume: 0,
      totalWeight: 0,
      valid: false,
    };
  }

  return globalBest;
};
