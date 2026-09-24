'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ReactNode, useEffect, useState } from 'react'

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}

// ─── Font Size Provider ───────────────────────────────────────────────────────
// Applies a data-font-size attribute to <html> so CSS can adjust base sizes.

const FONT_SIZE_KEY = 'fatorah-font-size'

export type FontSizeOption = 'sm' | 'md' | 'lg' | 'xl'

export function FontSizeApplier() {
  useEffect(() => {
    const saved = (localStorage.getItem(FONT_SIZE_KEY) ?? 'md') as FontSizeOption
    applyFontSize(saved)
  }, [])
  return null
}

export function applyFontSize(size: FontSizeOption) {
  const map: Record<FontSizeOption, string> = {
    sm: '14px',
    md: '16px',
    lg: '18px',
    xl: '20px',
  }
  document.documentElement.style.setProperty('--base-font-size', map[size])
  document.documentElement.setAttribute('data-font-size', size)
  localStorage.setItem(FONT_SIZE_KEY, size)
}
