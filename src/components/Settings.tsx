
import { useRates } from '../context/RatesContext';

export default function Settings() {
  const { 
    seaRates, 
    airRates, 
  } = useRates();

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-8">费率设置</h2>

      <div className="space-y-6">
        {/* Sea Freight Rates */}
        <div className="border border-gray-300 p-6">
          <h3 className="text-xl font-semibold mb-4">海运费率 (FCL)</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-2 px-3 font-semibold">柜型</th>
                  <th className="text-left py-2 px-3 font-semibold">类型</th>
                  <th className="text-right py-2 px-3 font-semibold">最大重量 (kg)</th>
                  <th className="text-right py-2 px-3 font-semibold">最大体积 (CBM)</th>
                  <th className="text-right py-2 px-3 font-semibold">费用</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(seaRates.fcl).map(([type, data]) => (
                  <tr key={type} className="border-b border-gray-200">
                    <td className="py-2 px-3">{type}</td>
                    <td className="py-2 px-3">
                      {data.isReefer ? (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">冻柜</span>
                      ) : (
                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">普通</span>
                      )}
                    </td>
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

        <div className="bg-gray-50 border border-gray-300 p-4 text-sm text-gray-700">
          <p>💡 提示: 当前版本费率显示为只读。如需更新费率，请修改源代码中的默认值。</p>
        </div>
      </div>
    </div>
  );
}
