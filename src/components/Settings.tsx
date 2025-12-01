import { useState } from 'react';
import { useRates } from '../context/RatesContext';

export default function Settings() {
  const { 
    seaRates, 
    airRates, 
    bankCharges, 
    otherCharges, 
    exchangeRate,
    setExchangeRate,
  } = useRates();

  const [localExchangeRate, setLocalExchangeRate] = useState(exchangeRate);

  const handleSaveExchangeRate = () => {
    setExchangeRate(localExchangeRate);
    alert('汇率已更新');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-8">费率设置</h2>

      <div className="space-y-6">
        {/* Exchange Rate */}
        <div className="border border-gray-300 p-6">
          <h3 className="text-xl font-semibold mb-4">汇率设置</h3>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                USD 100 = 本币
              </label>
              <input
                type="number"
                step="0.01"
                value={localExchangeRate}
                onChange={(e) => setLocalExchangeRate(Number(e.target.value))}
                className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <button
              onClick={handleSaveExchangeRate}
              className="bg-black text-white px-6 py-2 hover:bg-gray-800 transition-colors"
            >
              保存
            </button>
          </div>
        </div>

        {/* Sea Freight Rates */}
        <div className="border border-gray-300 p-6">
          <h3 className="text-xl font-semibold mb-4">海运费率 (FCL)</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-2 px-3 font-semibold">柜型</th>
                  <th className="text-right py-2 px-3 font-semibold">最大重量 (kg)</th>
                  <th className="text-right py-2 px-3 font-semibold">最大体积 (CBM)</th>
                  <th className="text-right py-2 px-3 font-semibold">费用</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(seaRates.fcl).map(([type, data]) => (
                  <tr key={type} className="border-b border-gray-200">
                    <td className="py-2 px-3">{type}</td>
                    <td className="text-right py-2 px-3 font-mono">{data.maxWeight}</td>
                    <td className="text-right py-2 px-3 font-mono">{data.maxVolume}</td>
                    <td className="text-right py-2 px-3 font-mono">{data.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-300">
            <h4 className="font-semibold mb-2">拼柜 (LCL) 费率</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">按体积:</span>
                <span className="ml-2 font-mono">{seaRates.lcl.m_mtq} / CBM</span>
              </div>
              <div>
                <span className="font-medium">按重量:</span>
                <span className="ml-2 font-mono">{seaRates.lcl.w_tne} / Ton</span>
              </div>
              <div>
                <span className="font-medium">最低:</span>
                <span className="ml-2 font-mono">{seaRates.lcl.min}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Air Freight Rates */}
        <div className="border border-gray-300 p-6">
          <h3 className="text-xl font-semibold mb-4">空运费率</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-2 px-3 font-semibold">重量区间 (kg)</th>
                  <th className="text-right py-2 px-3 font-semibold">费率</th>
                </tr>
              </thead>
              <tbody>
                {airRates.brackets.map((bracket, idx) => (
                  <tr key={idx} className="border-b border-gray-200">
                    <td className="py-2 px-3">
                      {idx === 0 ? '0' : airRates.brackets[idx - 1].maxWeight} - {bracket.maxWeight === 999999 ? '∞' : bracket.maxWeight}
                    </td>
                    <td className="text-right py-2 px-3 font-mono">{bracket.rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-sm">
            <span className="font-medium">最低费用:</span>
            <span className="ml-2 font-mono">{airRates.min}</span>
          </div>
        </div>

        {/* Bank Charges */}
        <div className="border border-gray-300 p-6">
          <h3 className="text-xl font-semibold mb-4">银行费用</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="font-medium">开证电报费</span>
              <span className="font-mono">{bankCharges.openingCable}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="font-medium">承兑费 (比例/最小/最大)</span>
              <span className="font-mono">
                {bankCharges.acceptance.rate}‰ / {bankCharges.acceptance.min}
                {bankCharges.acceptance.max && ` / ${bankCharges.acceptance.max}`}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="font-medium">付款费 (比例/最小)</span>
              <span className="font-mono">
                {bankCharges.payment.rate}‰ / {bankCharges.payment.min}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="font-medium">电报费</span>
              <span className="font-mono">{bankCharges.cable}</span>
            </div>
          </div>
        </div>

        {/* Other Charges */}
        <div className="border border-gray-300 p-6">
          <h3 className="text-xl font-semibold mb-4">其他费用</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="font-medium">进口检验 (比例/最小)</span>
              <span className="font-mono">
                {otherCharges.importInspection.rate}% / {otherCharges.importInspection.min}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="font-medium">进口报关</span>
              <span className="font-mono">{otherCharges.importCustoms}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="font-medium">进口货代 (比例/最小)</span>
              <span className="font-mono">
                {otherCharges.importForwarder.rate}% / {otherCharges.importForwarder.min}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="font-medium">EXW境外 (比例/最小)</span>
              <span className="font-mono">
                {otherCharges.exwOverseas.rate}% / {otherCharges.exwOverseas.min}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-300 p-4 text-sm text-gray-700">
          <p>💡 提示: 当前版本费率显示为只读。如需更新费率，请修改源代码中的默认值。</p>
        </div>
      </div>
    </div>
  );
}
