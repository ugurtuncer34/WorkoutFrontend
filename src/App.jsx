import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ExerciseList from './pages/ExerciseList';
import Logger from './pages/Logger';
import Summary from './pages/Summary';
import ThemeToggle from './components/ThemeToggle';

const PageTransition = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="w-full h-full flex flex-col"
    >
      {children}
    </motion.div>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <>
      <ThemeToggle />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Home /></PageTransition>} />
          <Route path="/catalog" element={<PageTransition><Catalog /></PageTransition>} />
          <Route path="/exercises/:muscleGroupId" element={<PageTransition><ExerciseList /></PageTransition>} />          <Route path="/logger/:exerciseId" element={<PageTransition><Logger /></PageTransition>} />
          <Route path="/summary/:sessionId" element={<PageTransition><Summary /></PageTransition>} />
        </Routes>
      </AnimatePresence>
    </>
  );
};

function App() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors overflow-x-hidden">
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </div>
  );
}

export default App;