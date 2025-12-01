import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { SeaFreightRates, AirFreightRates, BankCharges, OtherCharges } from '../utils/types';
import { defaultSeaRates, defaultAirRates, defaultBankCharges, defaultOtherCharges } from '../utils/defaults';

interface RatesContextType {
  seaRates: SeaFreightRates;
  airRates: AirFreightRates;
  bankCharges: BankCharges;
  otherCharges: OtherCharges;
  exchangeRate: number;
  setSeaRates: (rates: SeaFreightRates) => void;
  setAirRates: (rates: AirFreightRates) => void;
  setBankCharges: (charges: BankCharges) => void;
  setOtherCharges: (charges: OtherCharges) => void;
  setExchangeRate: (rate: number) => void;
}

const RatesContext = createContext<RatesContextType | undefined>(undefined);

export const RatesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [seaRates, setSeaRates] = useState<SeaFreightRates>(defaultSeaRates);
  const [airRates, setAirRates] = useState<AirFreightRates>(defaultAirRates);
  const [bankCharges, setBankCharges] = useState<BankCharges>(defaultBankCharges);
  const [otherCharges, setOtherCharges] = useState<OtherCharges>(defaultOtherCharges);
  const [exchangeRate, setExchangeRate] = useState<number>(85.66778778);

  return (
    <RatesContext.Provider
      value={{
        seaRates,
        airRates,
        bankCharges,
        otherCharges,
        exchangeRate,
        setSeaRates,
        setAirRates,
        setBankCharges,
        setOtherCharges,
        setExchangeRate,
      }}
    >
      {children}
    </RatesContext.Provider>
  );
};

export const useRates = () => {
  const context = useContext(RatesContext);
  if (!context) {
    throw new Error('useRates must be used within RatesProvider');
  }
  return context;
};
