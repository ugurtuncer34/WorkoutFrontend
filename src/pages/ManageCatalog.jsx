import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axiosInstance';
import { motion, AnimatePresence } from 'framer-motion';

const ManageCatalog = () => {
    const exerciseTypeOptions = [
        { value: 0, label: 'Reps + Weight' },
        { value: 1, label: 'Reps Only' },
        { value: 2, label: 'Duration Only' },
        { value: 3, label: 'Reps + Optional Weight' }
    ];
    const exerciseTypeValueMap = {
        RepsAndWeight: '0',
        RepsOnly: '1',
        DurationOnly: '2',
        RepsWithOptionalWeight: '3'
    };
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('muscleGroup');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Veri havuzu
    const [muscleGroups, setMuscleGroups] = useState([]);

    // Form stateleri
    const [name, setName] = useState('');
    const [iconKey, setIconKey] = useState('');
    const [selectedMuscleGroupId, setSelectedMuscleGroupId] = useState('');
    const [selectedTargetMuscleId, setSelectedTargetMuscleId] = useState('');
    const [selectedExerciseType, setSelectedExerciseType] = useState('0');
    const [exercises, setExercises] = useState([]);
    const [editingExerciseId, setEditingExerciseId] = useState('');

    const fetchMuscleGroups = async () => {
        try {
            const response = await api.get('/catalog/muscle-groups');
            setMuscleGroups(response.data);
        } catch (error) {
            console.error('Failed to fetch muscle groups', error);
        }
    };

    const fetchExercises = async (targetMuscleId) => {
        if (!targetMuscleId) {
            setExercises([]);
            return;
        }
        try {
            const response = await api.get(
                `/catalog/target-muscles/${targetMuscleId}/exercises`
            );
            setExercises(response.data);
        } catch (error) {
            console.error('Failed to fetch exercises', error);
            setExercises([]);
        }
    };

    useEffect(() => {
        fetchMuscleGroups();
    }, []);

    useEffect(() => {
        if (activeTab !== 'exercise') {
            return;
        }
        fetchExercises(selectedTargetMuscleId);
        setEditingExerciseId('');
        setName('');
        setIconKey('');
        setSelectedExerciseType('0');
    }, [selectedTargetMuscleId, activeTab]);

    // Tab değiştiğinde formu temizle
    useEffect(() => {
        setName('');
        setIconKey('');
        setSelectedMuscleGroupId('');
        setSelectedTargetMuscleId('');
        setSelectedExerciseType('0');
        setExercises([]);
        setEditingExerciseId('');
        setMessage({ text: '', type: '' });
    }, [activeTab]);

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const handleExerciseSelect = (exerciseId) => {
        setEditingExerciseId(exerciseId);
        if (!exerciseId) {
            setName('');
            setIconKey('');
            setSelectedExerciseType('0');
            return;
        }
        const selectedExercise = exercises.find(
            (exercise) => exercise.id === parseInt(exerciseId)
        );
        if (!selectedExercise) {
            return;
        }
        setName(selectedExercise.name);
        setIconKey(selectedExercise.iconKey || '');
        setSelectedExerciseType(
            exerciseTypeValueMap[selectedExercise.type] ?? '0'
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (activeTab === 'muscleGroup') {
                await api.post('/catalog/muscle-groups', { name, iconKey });
                showMessage('Muscle Group added successfully!');
            }
            else if (activeTab === 'targetMuscle') {
                if (!selectedMuscleGroupId) throw new Error("Please select a Muscle Group");
                await api.post('/catalog/target-muscles', {
                    muscleGroupId: parseInt(selectedMuscleGroupId),
                    name,
                    iconKey
                });
                showMessage('Target Muscle added successfully!');
            }
            else if (activeTab === 'exercise') {
                if (!selectedTargetMuscleId) {
                    throw new Error('Please select a Target Muscle');
                }
                const payload = {
                    targetMuscleId: parseInt(selectedTargetMuscleId),
                    name,
                    iconKey,
                    type: parseInt(selectedExerciseType)
                };

                if (editingExerciseId) {
                    await api.put(
                        `/catalog/exercises/${editingExerciseId}`,
                        payload
                    );
                    showMessage('Exercise updated successfully!');
                } else {
                    await api.post('/catalog/exercises', payload);
                    showMessage('Exercise added successfully!');
                }
            }

            // Başarılı kayıttan sonra formları temizle ve güncel veriyi çek
            setName('');
            setIconKey('');
            setSelectedExerciseType('0');
            setEditingExerciseId('');
            fetchMuscleGroups();
            if (activeTab === 'exercise' && selectedTargetMuscleId) {
                await fetchExercises(selectedTargetMuscleId);
            }

        } catch (error) {
            console.error('Submit failed', error);
            const errMsg = error.response?.data?.message || error.message || 'An error occurred';
            showMessage(errMsg, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Dinamik dropdown mantığı: Seçili Muscle Group'a ait Target Muscle'ları filtrele
    const currentTargetMuscles = muscleGroups.find(g => g.id === parseInt(selectedMuscleGroupId))?.targetMuscles || [];

    return (
        <div className="h-[100dvh] bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-md w-full mx-auto pt-4 flex flex-col">

                    {/* Header */}
                    <div className="flex items-center mb-6 gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-12 h-12 flex-none flex items-center justify-center bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-xl font-bold text-gray-800 dark:text-white transition-colors"
                        >
                            ←
                        </button>
                        <div>
                            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 tracking-tight">Manage Catalog</h2>
                            <p className="text-xs font-black text-blue-600/70 dark:text-blue-400/70 uppercase tracking-[0.15em]">Add New Items</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-white dark:bg-gray-800 p-1 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 transition-colors">
                        {[
                            { id: 'muscleGroup', label: 'Group' },
                            { id: 'targetMuscle', label: 'Target' },
                            { id: 'exercise', label: 'Exercise' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${activeTab === tab.id
                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Messages */}
                    <AnimatePresence>
                        {message.text && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={`mb-6 p-4 rounded-xl text-sm font-bold text-center ${message.type === 'error'
                                    ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30'
                                    : 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30'
                                    }`}
                            >
                                {message.text}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Form */}
                    <div className="bg-blue-50/30 dark:bg-blue-950/20 p-6 rounded-3xl shadow-sm border-2 border-blue-100/50 dark:border-blue-900/30 mb-6 transition-colors">
                        <form onSubmit={handleSubmit} className="space-y-4">

                            {/* Target Muscle veya Exercise seçiliyse Muscle Group Dropdown'u göster */}
                            {(activeTab === 'targetMuscle' || activeTab === 'exercise') && (
                                <div>
                                    <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Select Muscle Group</label>
                                    <select
                                        value={selectedMuscleGroupId}
                                        onChange={(e) => {
                                            setSelectedMuscleGroupId(e.target.value);
                                            setSelectedTargetMuscleId(''); // Üst kategori değişirse alt kategoriyi sıfırla
                                        }}
                                        required
                                        className="w-full bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800/50 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium appearance-none"
                                    >
                                        <option value="" disabled>Choose a group...</option>
                                        {muscleGroups.map(mg => (
                                            <option key={mg.id} value={mg.id}>{mg.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {activeTab === 'exercise' && selectedTargetMuscleId && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 mt-2">
                                        Existing Exercise
                                    </label>

                                    <select
                                        value={editingExerciseId}
                                        onChange={(e) => handleExerciseSelect(e.target.value)}
                                        className="w-full bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800/50 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium appearance-none"
                                    >
                                        <option value="">
                                            Create New Exercise
                                        </option>

                                        {exercises.map((exercise) => (
                                            <option
                                                key={exercise.id}
                                                value={exercise.id}
                                            >
                                                {exercise.name}
                                            </option>
                                        ))}
                                    </select>
                                </motion.div>
                            )}

                            {/* Sadece Exercise seçiliyse Target Muscle Dropdown'u göster */}
                            {activeTab === 'exercise' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 mt-2">
                                        Exercise Type
                                    </label>

                                    <select
                                        value={selectedExerciseType}
                                        onChange={(e) => setSelectedExerciseType(e.target.value)}
                                        required
                                        className="w-full bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800/50 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium appearance-none"
                                    >
                                        {exerciseTypeOptions.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>

                                    <p className="text-[10px] text-gray-400 mt-1 italic">
                                        Optional Weight allows both bodyweight and weighted sets.
                                    </p>
                                </motion.div>
                            )}

                            <div>
                                <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 mt-2">Item Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Incline Bench Press"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800/50 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 mt-2">Icon Key</label>
                                <input
                                    type="text"
                                    placeholder="e.g. ic_incline_bench"
                                    value={iconKey}
                                    onChange={(e) => setIconKey(e.target.value)}
                                    required
                                    className="w-full bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800/50 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                                />
                                <p className="text-[10px] text-gray-400 mt-1 italic">Must match the exact SVG filename without .svg extension.</p>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-blue-600 dark:bg-blue-600 text-white font-bold py-4 rounded-xl outline-none transition-all active:bg-blue-700 mt-6 shadow-lg shadow-blue-500/20 disabled:opacity-50"
                            >
                                {isLoading
                                    ? 'Saving...'
                                    : editingExerciseId
                                        ? 'Update Exercise'
                                        : 'Save to Catalog'}
                            </button>
                        </form>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ManageCatalog;