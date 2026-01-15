import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const themes = {
  default: {
    name: 'الافتراضي',
    primary: '#667eea',
    primaryHover: '#5568d3',
    secondary: '#764ba2',
    background: '#f5f5f5',
    cardBg: '#ffffff',
    text: '#1f2937',
    textMuted: '#6b7280',
    border: '#e5e7eb',
    success: '#10b981',
    danger: '#ef4444',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    icon: '🟣'
  },
  ocean: {
    name: 'المحيط',
    primary: '#06b6d4',
    primaryHover: '#0891b2',
    secondary: '#3b82f6',
    background: '#f0f9ff',
    cardBg: '#ffffff',
    text: '#0c4a6e',
    textMuted: '#0369a1',
    border: '#bae6fd',
    success: '#14b8a6',
    danger: '#f43f5e',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
    icon: '🌊'
  },
  sunset: {
    name: 'الغروب',
    primary: '#f97316',
    primaryHover: '#ea580c',
    secondary: '#ec4899',
    background: '#fff7ed',
    cardBg: '#ffffff',
    text: '#7c2d12',
    textMuted: '#9a3412',
    border: '#fed7aa',
    success: '#84cc16',
    danger: '#dc2626',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
    icon: '🌅'
  },
  forest: {
    name: 'الغابة',
    primary: '#10b981',
    primaryHover: '#059669',
    secondary: '#14b8a6',
    background: '#f0fdf4',
    cardBg: '#ffffff',
    text: '#064e3b',
    textMuted: '#047857',
    border: '#bbf7d0',
    success: '#22c55e',
    danger: '#f43f5e',
    gradient: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
    icon: '🌲'
  }
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('default');

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme && themes[storedTheme]) {
      setCurrentTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    const theme = themes[currentTheme];
    const root = document.documentElement;
    
    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-primary-hover', theme.primaryHover);
    root.style.setProperty('--color-secondary', theme.secondary);
    root.style.setProperty('--color-background', theme.background);
    root.style.setProperty('--color-card-bg', theme.cardBg);
    root.style.setProperty('--color-text', theme.text);
    root.style.setProperty('--color-text-muted', theme.textMuted);
    root.style.setProperty('--color-border', theme.border);
    root.style.setProperty('--color-success', theme.success);
    root.style.setProperty('--color-danger', theme.danger);
    root.style.setProperty('--gradient', theme.gradient);
    
    localStorage.setItem('theme', currentTheme);
  }, [currentTheme]);

  const changeTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
    }
  };

  return (
    <ThemeContext.Provider value={{ 
      currentTheme, 
      theme: themes[currentTheme],
      themes,
      changeTheme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
