import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ExerciseList from './pages/ExerciseList';
import Logger from './pages/Logger';
import Summary from './pages/Summary';
import ThemeToggle from './components/ThemeToggle'; // Imported

const PageTransition = ({ children }) => {
  return (
    // Updated background for dark mode global safety
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="w-full min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors"
    >
      {children}
    </motion.div>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <>
      <ThemeToggle /> {/* Placed globally outside standard routes */}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Home /></PageTransition>} />
          <Route path="/catalog" element={<PageTransition><Catalog /></PageTransition>} />
          <Route path="/exercises/:targetMuscleId" element={<PageTransition><ExerciseList /></PageTransition>} />
          <Route path="/logger/:exerciseId" element={<PageTransition><Logger /></PageTransition>} />
          <Route path="/summary/:sessionId" element={<PageTransition><Summary /></PageTransition>} />
        </Routes>
      </AnimatePresence>
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;