import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    const themeColorMeta = document.getElementById('theme-color-meta');
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      if (themeColorMeta) themeColorMeta.setAttribute('content', '#111827'); 
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      if (themeColorMeta) themeColorMeta.setAttribute('content', '#f9fafb'); 
    }
  }, [isDark]);

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={() => setIsDark(!isDark)}
      style={{ top: 'calc(env(safe-area-inset-top) + 0.25rem)' }}
      className="fixed right-3 z-50 w-10 h-10 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center text-lg transition-colors outline-none select-none"
    >
      {isDark ? '☀️' : '🌙'}
    </motion.button>
  );
};

export default ThemeToggle;