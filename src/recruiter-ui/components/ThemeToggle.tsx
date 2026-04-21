import React from 'react';

type ThemeToggleProps = {
  mode: 'dark' | 'light';
  onToggle: () => void;
};

const ThemeToggle: React.FC<ThemeToggleProps> = ({ mode, onToggle }) => {
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label="Toggle dark and light theme"
      title="Toggle dark and light theme"
    >
      <span className="theme-toggle__label">Theme</span>
      <span className="theme-toggle__value">{mode === 'dark' ? 'Dark' : 'Light'}</span>
    </button>
  );
};

export default ThemeToggle;
