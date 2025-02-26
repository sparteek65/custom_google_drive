'use client'

import { useEffect, useState } from 'react'

const themes = [
  "light",
  "dark",
  "cupcake",
  "dracula",
  "night",
  "winter"
] as const

export default function ThemeToggler() {
  const [theme, setTheme] = useState<string>("dracula")

  useEffect(() => {
    // Get the initial theme from localStorage or default to "dracula"
    const savedTheme = localStorage.getItem("theme") || "dracula"
    setTheme(savedTheme)
    document.documentElement.setAttribute('data-theme', savedTheme)
  }, [])

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  return (
    <div className="dropdown dropdown-top bg-base-100 rounded-full">
      <div tabIndex={0} role="button" className="btn btn-ghost m-1 normal-case">
        <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block h-5 w-5 stroke-current md:h-6 md:w-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path></svg>
        <span className="hidden md:inline">{theme}</span>
        <svg width="12px" height="12px" className="ml-1 h-3 w-3 fill-current opacity-60" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048"><path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path></svg>
      </div>
      <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-52">
        {themes.map((t) => (
          <li key={t}>
            <button
              className={`${theme === t ? 'active' : ''}`}
              onClick={() => handleThemeChange(t)}
            >
              {t}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
} 