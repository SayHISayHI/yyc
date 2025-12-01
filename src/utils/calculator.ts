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
  airRates: AirFreightRates,
  bankCharges: BankCharges,
  otherCharges: OtherCharges,
  exchangeRate: number // USD to Local
): CalculationResult => {
  let freightCostUSD = 0;
  
  if (details.transportMode === 'Sea') {
    freightCostUSD = calculateSeaFreight(details, seaRates);
  } else {
    freightCostUSD = calculateAirFreight(details, airRates);
  }

  // Bank and Other charges are usually in local currency or converted?
  // The Excel shows "Bank Charges" and "Other Charges" in the same column as "Freight Cost".
  // "Freight Cost" is in USD (implied by "Unit Freight (USD)").
  // But the final "Cost (Local)" sums them up.
  // Let's assume Bank/Other charges are calculated in Local Currency directly or converted.
  // The rates in Excel (e.g., 26.99, 13.49) look like local currency (CNY?) or USD?
  // Given "USD 100 = 85.66...", 1 USD ~ 0.85 EUR? Or 100 USD = 85.66 Local?
  // If 100 USD = 85.66, then 1 USD = 0.8566.
  // If the currency is CNY, 100 USD is usually 700+.
  // Maybe it's EUR? "EUR 85.66".
  // Let's assume the Bank/Other charges are defined in the TARGET currency (Local).
  // And Freight is in USD, so we convert Freight to Local.

  const freightCostLocal = freightCostUSD * exchangeRate;
  
  // Bank/Other charges calculation base:
  // Usually calculated on the Invoice Value (Foreign Cost).
  // Foreign Cost is in Foreign Currency (e.g. USD).
  // So we convert Foreign Cost to Local first? Or calculate in USD and convert?
  // Excel: "Foreign Cost (Local)" = 214169.47.
  // "Foreign Cost (Foreign)" = 250000.
  // Exchange Rate: 85.6677... (USD 100 = 85.66).
  // 250000 * (85.66/100) = 214169.
  // So the rate is Foreign -> Local.
  
  const foreignCostLocal = details.foreignCost * (exchangeRate / 100); // Assuming rate is per 100 units if it's like 85.66

  // Actually, let's look at the rate input. "USD 100 = 85.66".
  // So Rate = 0.8566.
  // If input is 85.66, we divide by 100.
  
  // Bank charges often depend on the amount.
  // Let's assume the rates (percentages) apply to the Local Value.
  
  const bankCost = calculateBankCharges(foreignCostLocal, bankCharges);
  const otherCost = calculateOtherCharges(foreignCostLocal, otherCharges);

  const totalCost = freightCostLocal + bankCost + otherCost + foreignCostLocal;

  return {
    freightCost: freightCostLocal,
    bankCharges: bankCost,
    otherCharges: otherCost,
    totalCost,
    unitCost: totalCost / details.quantity,
    breakdown: {
      freight: freightCostLocal,
      bank: { total: bankCost }, // Simplified for now
      other: { total: otherCost },
    }
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
  rates: SeaFreightRates
): ContainerCombination => {
  const containerTypes = Object.keys(rates.fcl);
  let bestCombination: ContainerCombination | null = null;

  // Try all possible combinations with dynamic programming approach
  // Maximum containers to consider (to avoid infinite loops)
  const maxContainers = 20;

  // Recursive function to find all valid combinations
  const findCombinations = (
    currentCombination: Record<string, number>,
    currentCost: number,
    currentVolume: number,
    currentWeight: number,
    index: number
  ) => {
    // Check if current combination satisfies requirements
    if (currentVolume >= requiredVolume && currentWeight >= requiredWeight) {
      if (!bestCombination || currentCost < bestCombination.totalCost) {
        bestCombination = {
          containers: { ...currentCombination },
          totalCost: currentCost,
          totalVolume: currentVolume,
          totalWeight: currentWeight,
          valid: true,
        };
      }
      return;
    }

    // Prune: if we already have a better solution, skip
    if (bestCombination && currentCost >= bestCombination.totalCost) {
      return;
    }

    // Prune: if we've added too many containers
    const totalContainers = Object.values(currentCombination).reduce((a, b) => a + b, 0);
    if (totalContainers >= maxContainers) {
      return;
    }

    // Try adding each container type
    for (let i = index; i < containerTypes.length; i++) {
      const type = containerTypes[i];
      const containerData = rates.fcl[type];

      const newCombination = { ...currentCombination };
      newCombination[type] = (newCombination[type] || 0) + 1;

      findCombinations(
        newCombination,
        currentCost + containerData.cost,
        currentVolume + containerData.maxVolume,
        currentWeight + containerData.maxWeight,
        i // Allow reusing the same container type
      );
    }
  };

  findCombinations({}, 0, 0, 0, 0);

  if (!bestCombination) {
    // Fallback: if no solution found, return the largest container
    const largestContainer = containerTypes.reduce((best, type) => {
      const current = rates.fcl[type];
      const bestData = rates.fcl[best];
      return current.maxVolume > bestData.maxVolume ? type : best;
    });

    return {
      containers: { [largestContainer]: 1 },
      totalCost: rates.fcl[largestContainer].cost,
      totalVolume: rates.fcl[largestContainer].maxVolume,
      totalWeight: rates.fcl[largestContainer].maxWeight,
      valid: false,
    };
  }

  return bestCombination;
};
