import { useState, useEffect } from 'react'
import { Activity, Rocket, Bot, Database } from 'lucide-react'

function App() {
  const [health, setHealth] = useState<{ status: string, version: string } | null>(null)

  useEffect(() => {
    // Check backend health
    fetch('http://localhost:8080/health')
      .then(res => res.json())
      .then(data => setHealth(data))
      .catch(err => console.error("Backend offline", err))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-primary-100 rounded-2xl mb-4">
            <Activity className="w-10 h-10 text-primary-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">PulseAlpha</h1>
          <p className="text-xl text-gray-600">Institutional Grade Financial Intelligence</p>
          <div className="mt-4 inline-flex items-center space-x-2 text-sm">
            <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 font-medium border border-yellow-200">
              v0.1.0 Preliminary
            </span>
            {health ? (
              <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 font-medium border border-green-200 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                Backend Connected
              </span>
            ) : (
              <span className="px-2 py-1 rounded-full bg-red-100 text-red-800 font-medium border border-red-200 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                Backend Offline
              </span>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card hover:border-primary-300 transition-colors group cursor-pointer">
            <div className="mb-4 p-3 bg-blue-50 w-fit rounded-lg group-hover:bg-blue-100 transition-colors">
              <Bot className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Agents</h3>
            <p className="text-gray-500 text-sm">Autonomous multi-agent system headed by Ollama (mistral:7b).</p>
          </div>

          <div className="card hover:border-primary-300 transition-colors group cursor-pointer">
            <div className="mb-4 p-3 bg-green-50 w-fit rounded-lg group-hover:bg-green-100 transition-colors">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Market Analysis</h3>
            <p className="text-gray-500 text-sm">Technical & Fundamental analysis using free data sources.</p>
          </div>

          <div className="card hover:border-primary-300 transition-colors group cursor-pointer">
            <div className="mb-4 p-3 bg-purple-50 w-fit rounded-lg group-hover:bg-purple-100 transition-colors">
              <Database className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Plugin Architecture</h3>
            <p className="text-gray-500 text-sm">Modular providers for LLMs, Database, and Data Feeds.</p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <button className="btn-primary flex items-center gap-2 mx-auto">
            <Rocket className="w-4 h-4" />
            Launch Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
