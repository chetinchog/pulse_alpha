import { useState, useEffect } from 'react'

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check localStorage and system preference on mount
    const stored = localStorage.getItem('darkMode')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    const shouldBeDark = stored === 'true' || (stored === null && prefersDark)

    setIsDark(shouldBeDark)

    // Apply immediately on mount
    if (shouldBeDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    const newValue = !isDark

    console.log('Toggling dark mode:', { from: isDark, to: newValue })

    setIsDark(newValue)
    localStorage.setItem('darkMode', String(newValue))

    if (newValue) {
      document.documentElement.classList.add('dark')
      console.log('Dark mode enabled, classes:', document.documentElement.className)
    } else {
      document.documentElement.classList.remove('dark')
      console.log('Dark mode disabled, classes:', document.documentElement.className)
    }
  }

  return (
    <button
      onClick={toggleDarkMode}
      type="button"
      className="relative inline-flex items-center justify-center p-2.5 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      aria-label="Toggle dark mode"
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {/* Sun Icon */}
      <svg
        className={`w-5 h-5 text-yellow-500 transition-all duration-300 ${
          isDark ? 'scale-0 rotate-180 opacity-0' : 'scale-100 rotate-0 opacity-100'
        } absolute`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>

      {/* Moon Icon */}
      <svg
        className={`w-5 h-5 text-indigo-400 transition-all duration-300 ${
          isDark ? 'scale-100 rotate-0 opacity-100' : 'scale-0 -rotate-180 opacity-0'
        } absolute`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>

      {/* Placeholder for layout */}
      <div className="w-5 h-5" />
    </button>
  )
}
