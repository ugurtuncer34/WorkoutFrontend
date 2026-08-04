import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api/axiosInstance';
import { getApiErrorMessage } from '../api/apiError';

const ExercisePicker = ({
    existingExerciseIds = [],
    onAdd,
    actionLabel = 'Add to Template',
    duplicateLabel = 'this template'
}) => {
    const [muscleGroups, setMuscleGroups] = useState([]);
    const [muscleGroupId, setMuscleGroupId] = useState('');
    const [targetMuscleId, setTargetMuscleId] = useState('');
    const [exerciseId, setExerciseId] = useState('');
    const [exercises, setExercises] = useState([]);
    const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
    const [isLoadingExercises, setIsLoadingExercises] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        let active = true;
        const fetchCatalog = async () => {
            try {
                const response = await api.get('/catalog/muscle-groups');
                if (active) setMuscleGroups(response.data || []);
            } catch (error) {
                console.error('Failed to fetch catalog for template picker', error);
                if (active) setMessage(getApiErrorMessage(error, 'Unable to load the exercise catalog.'));
            } finally {
                if (active) setIsLoadingCatalog(false);
            }
        };
        fetchCatalog();
        return () => { active = false; };
    }, []);

    useEffect(() => {
        if (!targetMuscleId) {
            setExercises([]);
            return;
        }

        let active = true;
        setIsLoadingExercises(true);
        setExerciseId('');
        setMessage('');
        api.get(`/catalog/target-muscles/${targetMuscleId}/exercises`)
            .then((response) => {
                if (active) setExercises(response.data || []);
            })
            .catch((error) => {
                console.error('Failed to fetch exercises for template picker', error);
                if (active) {
                    setExercises([]);
                    setMessage(getApiErrorMessage(error, 'Unable to load exercises for this target muscle.'));
                }
            })
            .finally(() => {
                if (active) setIsLoadingExercises(false);
            });

        return () => { active = false; };
    }, [targetMuscleId]);

    const selectedGroup = useMemo(
        () => muscleGroups.find((group) => group.id === Number(muscleGroupId)),
        [muscleGroups, muscleGroupId]
    );
    const targetMuscles = selectedGroup?.targetMuscles || [];
    const selectedTarget = targetMuscles.find((target) => target.id === Number(targetMuscleId));

    const handleAdd = () => {
        const selectedExercise = exercises.find((exercise) => exercise.id === Number(exerciseId));
        if (!selectedExercise) {
            setMessage('Choose an exercise to add.');
            return;
        }
        if (existingExerciseIds.includes(selectedExercise.id)) {
            setMessage(`${selectedExercise.name} is already in ${duplicateLabel}.`);
            return;
        }

        onAdd({
            exerciseId: selectedExercise.id,
            exerciseName: selectedExercise.name,
            exerciseType: selectedExercise.type,
            iconKey: selectedExercise.iconKey,
            targetMuscleId: selectedTarget?.id,
            targetMuscleName: selectedTarget?.name || selectedExercise.targetMuscleName || '',
            muscleGroupId: selectedGroup?.id,
            muscleGroupName: selectedGroup?.name || selectedExercise.muscleGroupName || ''
        });
        setExerciseId('');
        setMessage('');
    };

    const selectClass = 'w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none transition focus:ring-2 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-800/50 dark:bg-gray-900 dark:text-gray-200';

    return (
        <section className="rounded-3xl border-2 border-blue-100/60 bg-blue-50/30 p-5 dark:border-blue-900/30 dark:bg-blue-950/20">
            <h2 className="text-lg font-black text-gray-900 dark:text-white">Add Exercise</h2>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-blue-600/60 dark:text-blue-400/60">
                Group → Target → Exercise
            </p>

            {message && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300" role="alert">
                    {message}
                </div>
            )}

            <div className="mt-4 space-y-4">
                <div>
                    <label htmlFor="picker-group" className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Muscle Group</label>
                    <select
                        id="picker-group"
                        value={muscleGroupId}
                        onChange={(event) => {
                            setMuscleGroupId(event.target.value);
                            setTargetMuscleId('');
                            setExerciseId('');
                            setMessage('');
                        }}
                        disabled={isLoadingCatalog}
                        className={selectClass}
                    >
                        <option value="">{isLoadingCatalog ? 'Loading groups...' : 'Choose a group...'}</option>
                        {muscleGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
                    </select>
                </div>

                <div>
                    <label htmlFor="picker-target" className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Target Muscle</label>
                    <select
                        id="picker-target"
                        value={targetMuscleId}
                        onChange={(event) => {
                            setTargetMuscleId(event.target.value);
                            setExerciseId('');
                            setMessage('');
                        }}
                        disabled={!muscleGroupId}
                        className={selectClass}
                    >
                        <option value="">Choose a target...</option>
                        {targetMuscles.map((target) => <option key={target.id} value={target.id}>{target.name}</option>)}
                    </select>
                </div>

                <div>
                    <label htmlFor="picker-exercise" className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Exercise</label>
                    <select
                        id="picker-exercise"
                        value={exerciseId}
                        onChange={(event) => {
                            setExerciseId(event.target.value);
                            setMessage('');
                        }}
                        disabled={!targetMuscleId || isLoadingExercises}
                        className={selectClass}
                    >
                        <option value="">{isLoadingExercises ? 'Loading exercises...' : 'Choose an exercise...'}</option>
                        {exercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}
                    </select>
                </div>

                <button
                    type="button"
                    onClick={handleAdd}
                    disabled={!exerciseId}
                    className="app-primary min-h-12 w-full rounded-xl bg-blue-600 font-bold text-white transition hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50"
                >
                    {actionLabel}
                </button>
            </div>
        </section>
    );
};

export default ExercisePicker;
