'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  React.useEffect(() => {
    // Load current user untuk mendapatkan tema per user
    const savedUser = localStorage.getItem("currentUser")
    let userId = null
    let userName = "Unknown"
    
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        userId = parsedUser.id // Gunakan user.id yang pasti ada
        userName = parsedUser.nama || "Unknown"
      } catch (e) {
        console.error("Error parsing user:", e)
      }
    }

    // Load dan apply custom theme (green, blue, purple) PER USER
    const userThemeKey = userId ? `appTheme_user_${userId}` : "appTheme"
    const savedTheme = localStorage.getItem(userThemeKey)
    
    if (savedTheme) {
      document.documentElement.setAttribute("data-theme", savedTheme)
      
      // Apply CSS variables untuk tema
      const themes: Record<string, string> = {
        green: "#4caf50",
        blue: "#2196f3",
        purple: "#9c27b0",
      }
      
      const themeColor = themes[savedTheme]
      if (themeColor) {
        document.documentElement.style.setProperty("--theme-color", themeColor)
      }
      
      console.log("🎨 Custom theme loaded for user", userId, "(", userName, "):", savedTheme, "Key:", userThemeKey)
    } else {
      // Default theme hijau jika tidak ada tema tersimpan
      document.documentElement.setAttribute("data-theme", "green")
      console.log("🎨 Default theme loaded for user", userId, "(", userName, "): green")
    }

    // Load dark mode PER USER
    const userDarkModeKey = userId ? `darkMode_user_${userId}` : "darkMode"
    const savedDarkMode = localStorage.getItem(userDarkModeKey)
    
    if (savedDarkMode === "true") {
      document.documentElement.classList.add("dark")
      console.log("🌙 Dark mode loaded for user", userId, "(", userName, "): true, Key:", userDarkModeKey)
    } else if (savedDarkMode === "false") {
      document.documentElement.classList.remove("dark")
      console.log("🌙 Dark mode loaded for user", userId, "(", userName, "): false, Key:", userDarkModeKey)
    }
  }, [])

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
