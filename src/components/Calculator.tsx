import { useState } from 'react';
import { useRates } from '../context/RatesContext';
import { calculateTotalCost, calculateOptimalContainers } from '../utils/calculator';
import type { ShipmentDetails } from '../utils/types';

export default function Calculator() {
  const { seaRates, airRates } = useRates();
  
  const [formData, setFormData] = useState<ShipmentDetails>({
    grossWeight: 0,
    volume: 0,
    isFCL: true,
    transportMode: 'Sea',
    containerType: "20' GP",
    isReeferContainer: false,
  });

  const [result, setResult] = useState<ReturnType<typeof calculateTotalCost> | null>(null);
  const [useOptimization, setUseOptimization] = useState(true);

  const handleCalculate = () => {
    let calculationResult = calculateTotalCost(
      formData,
      seaRates,
      airRates
    );

    // If optimization mode and FCL, calculate optimal containers
    if (formData.transportMode === 'Sea' && formData.isFCL && useOptimization) {
      const optimalContainers = calculateOptimalContainers(
        formData.volume,
        formData.grossWeight,
        seaRates,
        formData.isReeferContainer || false
      );

      // Recalculate with optimal combination cost
      const freightCostUSD = optimalContainers.totalCost;
      const totalCost = freightCostUSD;

      calculationResult = {
        ...calculationResult,
        freightCost: freightCostUSD,
        totalCost,
        containerCombination: {
          containers: optimalContainers.containers,
          totalCost: optimalContainers.totalCost,
        },
      };
    }

    setResult(calculationResult);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-8">运费计算</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="space-y-6">
          <div className="border border-gray-300 p-6">
            <h3 className="text-xl font-semibold mb-4">货物信息</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">毛重 (kg)</label>
                  <input
                    type="number"
                    value={formData.grossWeight || ''}
                    onChange={(e) => setFormData({ ...formData, grossWeight: Number(e.target.value) })}
                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">体积 (CBM)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.volume || ''}
                    onChange={(e) => setFormData({ ...formData, volume: Number(e.target.value) })}
                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border border-gray-300 p-6">
            <h3 className="text-xl font-semibold mb-4">运输方式</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">选择运输方式</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={formData.transportMode === 'Sea'}
                      onChange={() => setFormData({ ...formData, transportMode: 'Sea' })}
                      className="mr-2"
                    />
                    <span>海运</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={formData.transportMode === 'Air'}
                      onChange={() => setFormData({ ...formData, transportMode: 'Air' })}
                      className="mr-2"
                    />
                    <span>空运</span>
                  </label>
                </div>
              </div>

              {formData.transportMode === 'Sea' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">集装箱类型</label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={formData.isFCL}
                          onChange={() => setFormData({ ...formData, isFCL: true })}
                          className="mr-2"
                        />
                        <span>整柜 (FCL)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={!formData.isFCL}
                          onChange={() => setFormData({ ...formData, isFCL: false })}
                          className="mr-2"
                        />
                        <span>拼柜 (LCL)</span>
                      </label>
                    </div>
                  </div>

                  {formData.isFCL && (
                    <>
                      <div className="mt-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.isReeferContainer || false}
                            onChange={(e) => setFormData({ ...formData, isReeferContainer: e.target.checked })}
                            className="mr-2"
                          />
                          <span>冻柜运输</span>
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">优化模式</label>
                        <div className="flex gap-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              checked={useOptimization}
                              onChange={() => setUseOptimization(true)}
                              className="mr-2"
                            />
                            <span>自动优化</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              checked={!useOptimization}
                              onChange={() => setUseOptimization(false)}
                              className="mr-2"
                            />
                            <span>手动选择</span>
                          </label>
                        </div>
                      </div>

                      {!useOptimization && (
                        <div>
                          <label className="block text-sm font-medium mb-1">柜型</label>
                          <select
                            value={formData.containerType}
                            onChange={(e) => setFormData({ ...formData, containerType: e.target.value })}
                            className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                          >
                            {Object.entries(seaRates.fcl)
                              .filter(([, data]) => data.isReefer === (formData.isReeferContainer || false))
                              .map(([type]) => (
                                <option key={type} value={type}>{type}</option>
                              ))
                            }
                          </select>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          <button
            onClick={handleCalculate}
            className="w-full bg-black text-white py-3 font-semibold hover:bg-gray-800 transition-colors"
          >
            计算运费
          </button>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {result && (
            <>
              {result.containerCombination && (
                <div className="border-2 border-black bg-white p-6">
                  <h3 className="text-xl font-semibold mb-3">📦 最优柜型组合</h3>
                  <div className="space-y-2">
                    {Object.entries(result.containerCombination.containers).map(([type, count]) => (
                      <div key={type} className="flex justify-between text-lg">
                        <span className="font-medium">{type}</span>
                        <span className="font-bold">× {count}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-gray-300 text-sm text-gray-600">
                      <p>优化费用: {result.containerCombination.totalCost.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="border border-gray-300 p-6 bg-gray-50">
                <h3 className="text-xl font-semibold mb-4">计算结果</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-300">
                    <span className="font-medium">运费</span>
                    <span className="font-mono">{result.freightCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-3 border-t-2 border-black text-lg">
                    <span className="font-bold">总成本</span>
                    <span className="font-mono font-bold">{result.totalCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {!result && (
            <div className="border border-gray-300 p-6 bg-gray-50 text-center text-gray-500">
              <p>请填写货物信息并点击"计算运费"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
