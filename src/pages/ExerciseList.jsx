import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/axiosInstance';
import IconCard from '../components/IconCard';

const ExerciseList = () => {
    const { muscleGroupId } = useParams();
    const [exercises, setExercises] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchExercises = async () => {
            try {
                const response = await api.get(`/catalog/muscle-groups/${muscleGroupId}/exercises`);
                setExercises(response.data);
            } catch (error) {
                console.error('Failed to fetch exercises', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchExercises();
    }, [muscleGroupId]);

    const handleExerciseClick = (exerciseId) => {
        navigate(`/logger/${exerciseId}`);
    };

    const handleBack = () => {
        navigate('/catalog');
    };

    // Group exercises visually by their Target Muscle Name
    const groupedExercises = exercises.reduce((acc, ex) => {
        const target = ex.targetMuscleName || 'Other';
        if (!acc[target]) {
            acc[target] = [];
        }
        acc[target].push(ex);
        return acc;
    }, {});

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
                <p className="text-gray-500 dark:text-gray-400 font-semibold animate-pulse">Loading exercises...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 transition-colors">
            <div className="max-w-md mx-auto pt-6">
                <div className="flex items-center mb-6 gap-4">
                    <button
                        onClick={handleBack}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 rounded-2xl shadow-sm active:bg-gray-100 dark:active:bg-gray-700 transition-colors border border-gray-100 dark:border-gray-700 text-xl font-bold text-gray-800 dark:text-white"
                    >
                        ←
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Select Exercise</h2>
                </div>

                {exercises.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center transition-colors">
                        <p className="text-gray-500 dark:text-gray-400">No exercises found for this muscle group.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {Object.entries(groupedExercises).map(([targetName, targetExercises]) => (
                            <div key={targetName} className="space-y-4">
                                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">
                                    {targetName}
                                </h3>
                                <div className="grid grid-cols-2 gap-4 content-start">
                                    {targetExercises.map((exercise) => (
                                        <IconCard
                                            key={exercise.id}
                                            name={exercise.name}
                                            iconKey={exercise.iconKey}
                                            onClick={() => handleExerciseClick(exercise.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExerciseList;