import { useState } from 'react';
import Calculator from './components/Calculator';
import Settings from './components/Settings';
import { RatesProvider } from './context/RatesContext';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState<'calculator' | 'settings'>('calculator');

  return (
    <RatesProvider>
      <div className="min-h-screen bg-white text-black">
        {/* Header */}
        <header className="border-b border-gray-300">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight">运费计算器</h1>
              <nav className="flex gap-4">
                <button
                  onClick={() => setCurrentView('calculator')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    currentView === 'calculator'
                      ? 'bg-black text-white'
                      : 'bg-white text-black border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  计算器
                </button>
                <button
                  onClick={() => setCurrentView('settings')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    currentView === 'settings'
                      ? 'bg-black text-white'
                      : 'bg-white text-black border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  设置费率
                </button>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8">
          {currentView === 'calculator' ? <Calculator /> : <Settings />}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-300 mt-12">
          <div className="container mx-auto px-6 py-4 text-center text-sm text-gray-600">
            运费计算器 © {new Date().getFullYear()}
          </div>
        </footer>
      </div>
    </RatesProvider>
  );
}

export default App;
