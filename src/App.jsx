import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ExerciseList from './pages/ExerciseList';
import Logger from './pages/Logger';
import Summary from './pages/Summary';
import Login from './pages/Login';
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

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <>
      <ThemeToggle />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          
          <Route path="/login" element={<PageTransition><Login /></PageTransition>} />

          {/* PROTECTED */}
          <Route path="/" element={<ProtectedRoute><PageTransition><Home /></PageTransition></ProtectedRoute>} />
          <Route path="/catalog" element={<ProtectedRoute><PageTransition><Catalog /></PageTransition></ProtectedRoute>} />
          <Route path="/exercises/:muscleGroupId" element={<ProtectedRoute><PageTransition><ExerciseList /></PageTransition></ProtectedRoute>} />
          <Route path="/logger/:exerciseId" element={<ProtectedRoute><PageTransition><Logger /></PageTransition></ProtectedRoute>} />
          <Route path="/summary/:sessionId" element={<ProtectedRoute><PageTransition><Summary /></PageTransition></ProtectedRoute>} />
          
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