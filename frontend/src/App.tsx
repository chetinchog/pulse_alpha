import Dashboard from './components/Dashboard'
import DarkModeToggle from './components/DarkModeToggle'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 animate-fadeIn">
      <header className="gradient-header shadow-soft-lg dark:shadow-gray-900/50 transition-all duration-200 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between animate-slideDown">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 dark:from-indigo-500 dark:to-indigo-600 rounded-lg flex items-center justify-center shadow-soft">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Pulse Alpha
              </h1>
            </div>
            <DarkModeToggle />
          </div>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Dashboard />
        </div>
      </main>

      {/* Footer with version and credits */}
      <footer className="fixed bottom-4 right-4 z-10">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-soft border border-gray-200/50 dark:border-gray-700/50 px-4 py-2 transition-all duration-200 hover:shadow-soft-lg">
          <div className="text-right space-y-0.5">
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              v1.1.2
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              By iCTG
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center justify-end gap-1">
              Powered by
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
              </svg>
              Claude
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
