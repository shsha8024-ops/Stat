import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

function ThemeSwitcher() {
  const { themes, currentTheme, changeTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themeKeys = Object.keys(themes);

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {/* Theme Options */}
      {isOpen && (
        <div className="mb-4 space-y-2 animate-slideUp">
          {themeKeys.map((key) => (
            <button
              key={key}
              onClick={() => {
                changeTheme(key);
                setIsOpen(false);
              }}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all transform hover:scale-110 shadow-lg ${
                currentTheme === key ? 'ring-4 ring-white scale-110' : ''
              }`}
              style={{
                background: themes[key].gradient,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
              }}
              title={themes[key].name}
            >
              {themes[key].icon}
            </button>
          ))}
        </div>
      )}

      {/* Main Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-all transform hover:scale-110 shadow-2xl"
        style={{
          background: 'var(--gradient)',
          animation: isOpen ? 'rotate 0.3s ease' : 'none'
        }}
        title="تغيير الثيم"
      >
        🎨
      </button>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(180deg);
          }
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease;
        }
      `}</style>
    </div>
  );
}

export default ThemeSwitcher;
