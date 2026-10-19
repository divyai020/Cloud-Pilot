import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun } from 'lucide-react';

const ThemeToggle = ({ showLabel = false }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="theme-toggle-wrapper">
      <button 
        type="button"
        className={`moon-glide-toggle ${isDark ? 'is-dark' : 'is-light'}`}
        onClick={toggleTheme}
        aria-label="Toggle dark and light theme"
        title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      >
        {/* Track background graphics (Stars / Sky) */}
        <div className="toggle-track-bg">
          <span className="track-star star-1">✦</span>
          <span className="track-star star-2">✨</span>
          <span className="track-cloud cloud-1">☁️</span>
        </div>

        {/* Gliding Thumb with Moon/Sun */}
        <div className="toggle-thumb-glide">
          {isDark ? (
            <Moon size={15} className="thumb-icon icon-moon" />
          ) : (
            <Sun size={15} className="thumb-icon icon-sun" />
          )}
        </div>
      </button>

      {showLabel && (
        <span className="theme-toggle-label">
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}
    </div>
  );
};

export default ThemeToggle;
