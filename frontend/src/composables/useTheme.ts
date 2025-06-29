/**
 * Theme Composable
 * 
 * @description Manages application theme (light/dark mode) with persistence
 * and system preference detection.
 */

export type Theme = 'light' | 'dark' | 'system'

export const useTheme = () => {
  const colorMode = useColorMode()
  
  // Current theme state
  const theme = computed<Theme>({
    get: () => colorMode.preference as Theme,
    set: (value) => {
      colorMode.preference = value
    }
  })
  
  // Actual resolved theme (considering system preference)
  const resolvedTheme = computed(() => {
    if (theme.value === 'system') {
      return colorMode.value as 'light' | 'dark'
    }
    return theme.value as 'light' | 'dark'
  })
  
  // Is dark mode active
  const isDark = computed(() => resolvedTheme.value === 'dark')
  
  // Toggle between light and dark
  const toggleTheme = () => {
    const newTheme = isDark.value ? 'light' : 'dark'
    theme.value = newTheme
  }
  
  // Set specific theme
  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme
  }
  
  // Apply theme class to HTML element
  const applyTheme = () => {
    if (process.client) {
      const root = document.documentElement
      root.classList.toggle('dark', isDark.value)
      
      // Update meta theme-color
      const metaThemeColor = document.querySelector('meta[name="theme-color"]')
      if (metaThemeColor) {
        metaThemeColor.setAttribute(
          'content',
          isDark.value ? '#111827' : '#ffffff'
        )
      }
    }
  }
  
  // Watch for theme changes
  watch(resolvedTheme, () => {
    applyTheme()
  }, { immediate: true })
  
  // Listen for system theme changes
  onMounted(() => {
    if (!window.matchMedia) return
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme.value === 'system') {
        applyTheme()
      }
    }
    
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      onUnmounted(() => {
        mediaQuery.removeEventListener('change', handleChange)
      })
    } else {
      // Legacy browsers
      mediaQuery.addListener(handleChange)
      onUnmounted(() => {
        mediaQuery.removeListener(handleChange)
      })
    }
  })
  
  return {
    theme,
    resolvedTheme,
    isDark,
    toggleTheme,
    setTheme
  }
}

// Auto-import helper for theme icon
export const useThemeIcon = () => {
  const { isDark } = useTheme()
  
  return computed(() => ({
    name: isDark.value ? 'sun' : 'moon',
    label: isDark.value ? 'Switch to light mode' : 'Switch to dark mode'
  }))
}