import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface UseExerciseExitGuardOptions {
  enabled: boolean;
  exitTo: string;
}

export function useExerciseExitGuard({ enabled, exitTo }: UseExerciseExitGuardOptions) {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const allowExitRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    const handlePopState = () => {
      if (allowExitRef.current) return;
      setIsDialogOpen(true);
      window.history.pushState({ exerciseGuard: true }, '', window.location.href);
    };

    window.history.pushState({ exerciseGuard: true }, '', window.location.href);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [enabled]);

  const confirmExit = () => {
    allowExitRef.current = true;
    setIsDialogOpen(false);
    navigate(exitTo);
  };

  return {
    isDialogOpen,
    setIsDialogOpen,
    confirmExit,
  };
}