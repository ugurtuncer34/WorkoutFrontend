import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWorkoutPrograms, setWorkoutProgramArchived } from '../api/workoutPrograms';
import { getApiErrorMessage } from '../api/apiError';
import ConfirmationDialog from '../components/ConfirmationDialog';
import ProgramActivationDialog from '../components/ProgramActivationDialog';
import ProgramCard from '../components/ProgramCard';
import useActiveWorkoutProgram from '../hooks/useActiveWorkoutProgram';

const Programs = () => {
    const navigate = useNavigate();
    const [programs, setPrograms] = useState([]);
    const [includeArchived, setIncludeArchived] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [pendingActions, setPendingActions] = useState({});
    const [activationProgram, setActivationProgram] = useState(null);
    const [activationError, setActivationError] = useState('');
    const [isActivating, setIsActivating] = useState(false);
    const [confirmation, setConfirmation] = useState(null);
    const { activeProgram, loading: isLoadingActive, error: activeError, refetch: refetchActive, activate, deactivate } = useActiveWorkoutProgram();

    const fetchPrograms = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            setPrograms(await getWorkoutPrograms(includeArchived));
        } catch (requestError) {
            console.error('Failed to fetch workout programs', requestError);
            setError(getApiErrorMessage(requestError, 'Unable to load workout programs.'));
        } finally {
            setIsLoading(false);
        }
    }, [includeArchived]);

    useEffect(() => {
        let active = true;
        setIsLoading(true);
        setError('');
        getWorkoutPrograms(includeArchived)
            .then((nextPrograms) => { if (active) setPrograms(nextPrograms); })
            .catch((requestError) => {
                console.error('Failed to fetch workout programs', requestError);
                if (active) setError(getApiErrorMessage(requestError, 'Unable to load workout programs.'));
            })
            .finally(() => { if (active) setIsLoading(false); });
        return () => { active = false; };
    }, [includeArchived]);

    const handleActivate = async (startingStepId) => {
        if (!activationProgram || isActivating) return;
        setIsActivating(true);
        setActivationError('');
        try {
            await activate(activationProgram.id, startingStepId);
            navigate('/');
        } catch (requestError) {
            console.error('Failed to activate workout program', requestError);
            setActivationError(getApiErrorMessage(requestError, 'Unable to activate this program.'));
        } finally {
            setIsActivating(false);
        }
    };

    const handleArchiveToggle = async (program) => {
        setConfirmation(null);
        const label = program.isArchived ? 'Unarchiving...' : 'Archiving...';
        setPendingActions((current) => ({ ...current, [program.id]: label }));
        setError('');
        try {
            await setWorkoutProgramArchived(program.id, !program.isArchived);
            await fetchPrograms();
        } catch (requestError) {
            console.error('Failed to change workout program archive status', requestError);
            setError(getApiErrorMessage(requestError, `Unable to ${program.isArchived ? 'unarchive' : 'archive'} this program.`));
        } finally {
            setPendingActions((current) => {
                const next = { ...current };
                delete next[program.id];
                return next;
            });
        }
    };

    const handleDeactivate = async (program) => {
        setPendingActions((current) => ({ ...current, [program.id]: 'Deactivating...' }));
        setError('');
        try {
            await deactivate();
            setPrograms((current) => current.map((item) => (
                item.id === program.id ? { ...item, isActive: false } : item
            )));
            setConfirmation(null);
            await fetchPrograms();
        } catch (requestError) {
            console.error('Failed to deactivate workout program', requestError);
            setError(getApiErrorMessage(requestError, 'Unable to deactivate the active program.'));
            setConfirmation(null);
        } finally {
            setPendingActions((current) => {
                const next = { ...current };
                delete next[program.id];
                return next;
            });
        }
    };

    const combinedError = error || activeError;
    const loading = isLoading || isLoadingActive;
    const knownActiveProgram = activeProgram || (() => {
        const program = programs.find((item) => item.isActive);
        return program ? { programId: program.id, programName: program.name } : null;
    })();

    return (
        <div className="min-h-[100dvh] bg-gray-50 px-4 pb-[calc(env(safe-area-inset-bottom)+2rem)] pt-4 transition-colors dark:bg-gray-900">
            <main className="mx-auto w-full max-w-md pt-4">
                <header className="mb-6 flex items-center gap-4 pr-12">
                    <button type="button" onClick={() => navigate('/')} aria-label="Back to home" className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl border border-gray-100 bg-white text-xl font-bold text-gray-800 shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white">←</button>
                    <div className="min-w-0"><h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Workout Programs</h1><p className="text-xs font-black uppercase tracking-[0.15em] text-blue-600/70 dark:text-blue-400/70">Persistent rolling cycles</p></div>
                </header>

                <button type="button" onClick={() => navigate('/programs/new')} className="app-primary mb-4 min-h-14 w-full rounded-2xl bg-blue-600 font-bold text-white focus-visible:ring-2 focus-visible:ring-blue-400">Create Program</button>

                <label className="mb-5 flex min-h-12 cursor-pointer items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"><span className="text-sm font-bold text-gray-700 dark:text-gray-200">Include archived programs</span><input type="checkbox" checked={includeArchived} onChange={(event) => setIncludeArchived(event.target.checked)} className="h-5 w-5 accent-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500" /></label>

                {combinedError && <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-400" role="alert"><p>{combinedError}</p><button type="button" onClick={() => Promise.all([fetchPrograms(), refetchActive()]).catch(() => {})} className="mt-2 underline underline-offset-2">Try again</button></div>}

                {loading ? <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800"><p className="animate-pulse font-semibold text-gray-400">Loading programs...</p></div> : programs.length === 0 ? <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800"><p className="font-bold text-gray-700 dark:text-gray-200">{includeArchived ? 'No programs found.' : 'No programs yet.'}</p><p className="mt-2 text-sm text-gray-400">Build an ordered rolling cycle from templates and Rest steps.</p></div> : <div className="space-y-4">{programs.map((program) => <ProgramCard key={program.id} program={program} activeProgram={knownActiveProgram} pendingAction={pendingActions[program.id]} onActivate={() => { setActivationError(''); setActivationProgram(program); }} onEdit={() => navigate(`/programs/${program.id}/edit`)} onArchiveToggle={() => program.isArchived ? handleArchiveToggle(program) : setConfirmation({ type: 'archive', program })} onDeactivate={() => setConfirmation({ type: 'deactivate', program })} />)}</div>}
            </main>

            {activationProgram && <ProgramActivationDialog program={activationProgram} activeProgram={knownActiveProgram} isActivating={isActivating} error={activationError} onClose={() => { if (!isActivating) { setActivationProgram(null); setActivationError(''); } }} onActivate={handleActivate} />}
            {confirmation?.type === 'archive' && <ConfirmationDialog title="Archive Program?" description={`“${confirmation.program.name}” will be hidden from the default list. You can restore it later.`} confirmLabel="Archive" pendingLabel="Archiving..." tone="danger" isPending={Boolean(pendingActions[confirmation.program.id])} onClose={() => setConfirmation(null)} onConfirm={() => handleArchiveToggle(confirmation.program)} />}
            {confirmation?.type === 'deactivate' && <ConfirmationDialog title="Deactivate Program?" description="This pauses program tracking. Your program definition and workout history are preserved." confirmLabel="Deactivate" pendingLabel="Deactivating..." isPending={Boolean(pendingActions[confirmation.program.id])} onClose={() => setConfirmation(null)} onConfirm={() => handleDeactivate(confirmation.program)} />}
        </div>
    );
};

export default Programs;
