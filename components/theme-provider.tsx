'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  React.useEffect(() => {
    // Force remove dark mode class
    document.documentElement.classList.remove("dark")
    console.log("🌙 Dark mode forcefully disabled")

    // Load tema GLOBAL (tidak per user, berlaku untuk semua role)
    const globalThemeKey = "appTheme_global"
    const savedTheme = localStorage.getItem(globalThemeKey)
    
    // Default theme hijau jika tidak ada atau tidak valid
    const validThemes = ['green', 'blue', 'purple']
    const finalTheme = savedTheme && validThemes.includes(savedTheme) ? savedTheme : 'green'
    
    document.documentElement.setAttribute("data-theme", finalTheme)
    
    // Apply CSS variables untuk tema
    const themes: Record<string, string> = {
      green: "#4caf50",
      blue: "#2196f3",
      purple: "#9c27b0",
    }
    
    const themeColor = themes[finalTheme]
    if (themeColor) {
      document.documentElement.style.setProperty("--theme-color", themeColor)
    }
    
    console.log("🎨 Global theme loaded:", finalTheme, "(Key:", globalThemeKey, ")")
  }, [])

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
