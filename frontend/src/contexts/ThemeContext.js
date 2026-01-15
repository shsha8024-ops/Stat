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
  },
  royal: {
    name: 'الملكي',
    primary: '#6366f1',
    primaryHover: '#4f46e5',
    secondary: '#8b5cf6',
    background: '#faf5ff',
    cardBg: '#ffffff',
    text: '#4c1d95',
    textMuted: '#6d28d9',
    border: '#e9d5ff',
    success: '#10b981',
    danger: '#ef4444',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    icon: '👑'
  },
  rose: {
    name: 'الوردي',
    primary: '#f43f5e',
    primaryHover: '#e11d48',
    secondary: '#ec4899',
    background: '#fff1f2',
    cardBg: '#ffffff',
    text: '#881337',
    textMuted: '#9f1239',
    border: '#fecdd3',
    success: '#10b981',
    danger: '#dc2626',
    gradient: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)',
    icon: '🌹'
  },
  midnight: {
    name: 'منتصف الليل',
    primary: '#1e40af',
    primaryHover: '#1e3a8a',
    secondary: '#312e81',
    background: '#eff6ff',
    cardBg: '#ffffff',
    text: '#1e3a8a',
    textMuted: '#3730a3',
    border: '#dbeafe',
    success: '#10b981',
    danger: '#ef4444',
    gradient: 'linear-gradient(135deg, #1e40af 0%, #312e81 100%)',
    icon: '🌙'
  },
  amber: {
    name: 'الكهرماني',
    primary: '#f59e0b',
    primaryHover: '#d97706',
    secondary: '#eab308',
    background: '#fffbeb',
    cardBg: '#ffffff',
    text: '#78350f',
    textMuted: '#92400e',
    border: '#fde68a',
    success: '#10b981',
    danger: '#ef4444',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #eab308 100%)',
    icon: '🔶'
  },
  berry: {
    name: 'التوت',
    primary: '#9333ea',
    primaryHover: '#7e22ce',
    secondary: '#c026d3',
    background: '#faf5ff',
    cardBg: '#ffffff',
    text: '#581c87',
    textMuted: '#6b21a8',
    border: '#f3e8ff',
    success: '#10b981',
    danger: '#ef4444',
    gradient: 'linear-gradient(135deg, #9333ea 0%, #c026d3 100%)',
    icon: '🍇'
  },
  emerald: {
    name: 'الزمردي',
    primary: '#059669',
    primaryHover: '#047857',
    secondary: '#0d9488',
    background: '#ecfdf5',
    cardBg: '#ffffff',
    text: '#064e3b',
    textMuted: '#065f46',
    border: '#a7f3d0',
    success: '#22c55e',
    danger: '#ef4444',
    gradient: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
    icon: '💎'
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
