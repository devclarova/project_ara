import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"
type ResolvedTheme = "dark" | "light"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  resolvedTheme?: ResolvedTheme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "light",
  resolvedTheme: "light",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "theme-mode",
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem(storageKey)
    if (saved === "light" || saved === "dark" || saved === "system") {
      return saved as Theme
    }
    return "light" // 기본값 light 통일 정책
  })

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    if (theme === "system") {
      if (typeof window !== "undefined") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      }
      return "light"
    }
    return theme as ResolvedTheme
  })

  useEffect(() => {
    const root = window.document.documentElement

    // 1. resolvedTheme 계산
    let currentResolved: ResolvedTheme = "light"
    if (theme === "system") {
      currentResolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    } else {
      currentResolved = theme as ResolvedTheme
    }

    setResolvedTheme(currentResolved)

    // 2. DOM 반영
    root.classList.remove("light", "dark")
    root.classList.add(currentResolved)
    root.setAttribute("data-theme-mode", theme)
    root.style.colorScheme = currentResolved

    // 3. 시스템 미디어 쿼리 리스너 설정
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      
      const handleChange = (e: MediaQueryListEvent) => {
        const newSystemTheme: ResolvedTheme = e.matches ? "dark" : "light"
        setResolvedTheme(newSystemTheme)
        
        root.classList.remove("light", "dark")
        root.classList.add(newSystemTheme)
        root.style.colorScheme = newSystemTheme
      }

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener("change", handleChange)
      } else {
        mediaQuery.addListener(handleChange)
      }

      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener("change", handleChange)
        } else {
          mediaQuery.removeListener(handleChange)
        }
      }
    }
  }, [theme])

  const value = {
    theme,
    resolvedTheme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setThemeState(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
