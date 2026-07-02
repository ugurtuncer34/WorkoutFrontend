import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/axiosInstance';
import { motion, AnimatePresence } from 'framer-motion';

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (localStorage.getItem('token')) {
            navigate('/');
        }
    }, [navigate]);

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!username || !password) return;

        setIsLoading(true);
        setErrorMessage('');

        try {
            const response = await api.post('/auth/register', { username, password });
            const token = response.data.data.token;

            localStorage.setItem('token', token);
            navigate('/');
        } catch (error) {
            console.error('Registration failed', error);

            const backendMsg = error.response?.data?.message || error.response?.data || '';

            if (typeof backendMsg === 'string' && backendMsg.toLowerCase().includes('disabled')) {
                setErrorMessage('New registrations are closed.');
            } else if (typeof backendMsg === 'string') {
                setErrorMessage(backendMsg);
            } else {
                setErrorMessage('Registration failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-[100dvh] bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors overflow-hidden justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full mx-auto bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-8 border border-gray-100 dark:border-gray-700 transition-colors"
            >
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 mb-2 tracking-tight">
                        Workout Tracker
                    </h1>
                    <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                        Create Account
                    </p>
                </div>

                <AnimatePresence>
                    {errorMessage && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-4 text-center bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-3 rounded-xl border border-red-100 dark:border-red-900/30 text-sm font-bold"
                        >
                            {errorMessage}
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-4 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-4 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 dark:bg-blue-600 text-white font-bold py-4 rounded-xl outline-none transition-all active:bg-blue-700 dark:active:bg-blue-700 mt-4 shadow-lg shadow-blue-500/20 disabled:opacity-50"
                    >
                        {isLoading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Already have an account?{' '}
                        <Link to="/login" className="text-blue-600 dark:text-blue-400 font-bold hover:underline transition-all">
                            Sign in here
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;