import { useState, useCallback, useRef } from 'react';
import { Peg, SolutionResponse } from '../types';

interface UseTowerOfHanoiReturn {
  pegs: { A: number[]; B: number[]; C: number[] };
  selectedDisk: number | null;
  selectedPeg: Peg | null;
  targetPeg: Peg | null;
  currentStep: number;
  completedSteps: Set<number>;
  isAutoSolving: boolean;
  isSolved: boolean;
  selectDisk: (peg: Peg) => void;
  placeDisk: (peg: Peg) => boolean;
  reset: (numberOfDisks: number) => void;
  setSolution: (solution: SolutionResponse | null) => void;
  startAutoSolve: (solution: SolutionResponse, onComplete: () => void) => void;
  stopAutoSolve: () => void;
}

export const useTowerOfHanoi = (_numberOfDisks: number): UseTowerOfHanoiReturn => {
  const [pegs, setPegs] = useState<{ A: number[]; B: number[]; C: number[] }>({
    A: [],
    B: [],
    C: [],
  });
  const [selectedDisk, setSelectedDisk] = useState<number | null>(null);
  const [selectedPeg, setSelectedPeg] = useState<Peg | null>(null);
  const [targetPeg, setTargetPeg] = useState<Peg | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isAutoSolving, setIsAutoSolving] = useState<boolean>(false);
  const [isSolved, setIsSolved] = useState<boolean>(false);

  // @ts-ignore
  const autoSolveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const solutionRef = useRef<SolutionResponse | null>(null);
  const onCompleteRef = useRef<(() => void) | null>(null);
  const currentStepRef = useRef<number>(1);
  const pegsRef = useRef<{ A: number[]; B: number[]; C: number[] }>({
    A: [],
    B: [],
    C: [],
  });
  const isAutoSolvingRef = useRef<boolean>(false);

  const reset = useCallback((disks: number) => {
    // Only initialize pegs if disks <= 10 (gameboard is shown)
    if (disks <= 10) {
      const initialPegs = Array.from({ length: disks }, (_, i) => disks - i);
      const newPegs = {
        A: initialPegs,
        B: [],
        C: [],
      };
      setPegs(newPegs);
      pegsRef.current = newPegs;
    } else {
      // Clear pegs for numberOfDisks > 10
      const emptyPegs = { A: [], B: [], C: [] };
      setPegs(emptyPegs);
      pegsRef.current = emptyPegs;
    }
    setSelectedDisk(null);
    setSelectedPeg(null);
    setTargetPeg(null);
    setCurrentStep(1);
    currentStepRef.current = 1;
    setCompletedSteps(new Set());
    setIsAutoSolving(false);
    isAutoSolvingRef.current = false;
    setIsSolved(false);
    // Clear solution ref on reset so it can be set again with new solution
    solutionRef.current = null;
    if (autoSolveTimeoutRef.current) {
      clearTimeout(autoSolveTimeoutRef.current);
      autoSolveTimeoutRef.current = null;
    }
  }, []);

  const selectDisk = useCallback((peg: Peg) => {
    if (isAutoSolvingRef.current) return;

    // Use ref to get current peg state to avoid stale closures
    const currentPegs = pegsRef.current;
    const pegDisks = currentPegs[peg];
    
    if (pegDisks.length === 0) {
      // Deselect if clicking empty peg
      setSelectedDisk(null);
      setSelectedPeg(null);
      return;
    }

    // If clicking the same peg, deselect
    if (selectedPeg === peg) {
      setSelectedDisk(null);
      setSelectedPeg(null);
      return;
    }

    // Select the top disk (use current state from ref)
    const topDisk = pegDisks[pegDisks.length - 1];
    setSelectedDisk(topDisk);
    setSelectedPeg(peg);
  }, [selectedPeg]);

  const placeDisk = useCallback((peg: Peg): boolean => {
    if (isAutoSolvingRef.current || selectedDisk === null || selectedPeg === null) {
      return false;
    }

    // Cannot place on same peg
    if (selectedPeg === peg) {
      setSelectedDisk(null);
      setSelectedPeg(null);
      setTargetPeg(null);
      return false;
    }

    const targetPegDisks = pegs[peg];

    // Validation: Cannot place larger disk on smaller disk
    if (targetPegDisks.length > 0) {
      const topDiskOnTarget = targetPegDisks[targetPegDisks.length - 1];
      if (selectedDisk > topDiskOnTarget) {
        // Invalid move - return disk to original position
        setSelectedDisk(null);
        setSelectedPeg(null);
        setTargetPeg(null);
        return false;
      }
    }

    // Store original values for step validation (capture before async operations)
    const originalSelectedPeg = selectedPeg;
    const originalSelectedDisk = selectedDisk;
    const currentStepNum = currentStepRef.current;

    // Set target peg for animation
    setTargetPeg(peg);

    // Phase 1: Move horizontally to above target peg (300ms)
    setTimeout(() => {
      // Phase 2: Update pegs array but keep targetPeg set so disk animates down
      const currentPegs = pegsRef.current;
      const newPegs = { ...currentPegs };
      const currentSourcePegDisks = [...newPegs[originalSelectedPeg!]];
      const currentTargetPegDisks = [...newPegs[peg]];

      newPegs[originalSelectedPeg!] = currentSourcePegDisks.slice(0, -1);
      newPegs[peg] = [...currentTargetPegDisks, originalSelectedDisk!];

      setPegs(newPegs);
      pegsRef.current = newPegs;
      
      // Update selectedPeg to the new peg so the disk renders on the correct peg
      setSelectedPeg(peg);

      // Phase 3: After downward animation completes, clear selection
      setTimeout(() => {
        setSelectedDisk(null);
        setSelectedPeg(null);
        setTargetPeg(null);

        // Check if this matches the expected step from solution
        if (solutionRef.current) {
          const expectedStep = solutionRef.current.steps.find(
            (s) => s.stepNumber === currentStepNum
          );

          if (expectedStep) {
            // Check if the move matches the expected step
            const moveMatches = 
              expectedStep.from === originalSelectedPeg &&
              expectedStep.to === peg &&
              expectedStep.disk === originalSelectedDisk;

            if (moveMatches) {
              // Correct move - mark step as completed
              setCompletedSteps((prev) => {
                const newSet = new Set(prev);
                newSet.add(currentStepNum);
                return newSet;
              });
              const nextStep = currentStepNum + 1;
              setCurrentStep(nextStep);
              currentStepRef.current = nextStep;

              // Check if solved
              if (nextStep > solutionRef.current.steps.length) {
                setIsSolved(true);
              }
            }
          }
        }
      }, 400); // Time for downward animation
    }, 300); // Time for horizontal movement

    return true;
  }, [pegs, selectedDisk, selectedPeg]);

  const stopAutoSolve = useCallback(() => {
    setIsAutoSolving(false);
    isAutoSolvingRef.current = false;
    if (autoSolveTimeoutRef.current) {
      clearTimeout(autoSolveTimeoutRef.current);
      autoSolveTimeoutRef.current = null;
    }
  }, []);

  const executeAutoSolveStep = useCallback(() => {
    if (!solutionRef.current || !isAutoSolvingRef.current) return;

    const step = solutionRef.current.steps.find(
      (s) => s.stepNumber === currentStepRef.current
    );

    if (!step) {
      setIsAutoSolving(false);
      isAutoSolvingRef.current = false;
      if (onCompleteRef.current) {
        onCompleteRef.current();
      }
      return;
    }

    // Get the disk to move from the source peg
    const currentPegs = pegsRef.current;
    const sourcePegDisks = [...currentPegs[step.from]];
    const diskToMove = sourcePegDisks[sourcePegDisks.length - 1]; // Top disk

    // Select the disk and set target peg for animation
    setSelectedDisk(diskToMove);
    setSelectedPeg(step.from);
    setTargetPeg(step.to);

    // Phase 1: Move horizontally to above target peg (300ms)
    setTimeout(() => {
      // Phase 2: Update pegs array but keep targetPeg set so disk animates down
      const updatedPegs = { ...pegsRef.current };
      const updatedSourcePegDisks = [...updatedPegs[step.from]];
      const updatedTargetPegDisks = [...updatedPegs[step.to]];

      updatedSourcePegDisks.pop(); // Remove disk from source
      updatedTargetPegDisks.push(diskToMove); // Add to target

      updatedPegs[step.from] = updatedSourcePegDisks;
      updatedPegs[step.to] = updatedTargetPegDisks;

      setPegs(updatedPegs);
      pegsRef.current = updatedPegs;
      
      // Update selectedPeg to the new peg so the disk renders on the correct peg
      setSelectedPeg(step.to);

      // Phase 3: After downward animation completes, clear selection and mark step as completed
      setTimeout(() => {
        setSelectedDisk(null);
        setSelectedPeg(null);
        setTargetPeg(null);

        // Mark step as completed (capture step number before state update)
        const stepToComplete = currentStepRef.current;
        setCompletedSteps((prev) => {
          const newSet = new Set(prev);
          newSet.add(stepToComplete);
          return newSet;
        });
        const nextStep = currentStepRef.current + 1;
        setCurrentStep(nextStep);
        currentStepRef.current = nextStep;

        // Check if solved
        if (solutionRef.current && nextStep > solutionRef.current.steps.length) {
          setIsAutoSolving(false);
          isAutoSolvingRef.current = false;
          setIsSolved(true);
          if (onCompleteRef.current) {
            onCompleteRef.current();
          }
          return;
        }

        // Schedule next step
        autoSolveTimeoutRef.current = setTimeout(() => {
          executeAutoSolveStep();
        }, 100); // Small delay before next step starts
      }, 400); // Time for downward animation
    }, 300); // Time for horizontal movement
  }, []);

  const setSolutionRef = useCallback((solution: SolutionResponse | null) => {
    solutionRef.current = solution;
  }, []);

  const startAutoSolve = useCallback(
    (solution: SolutionResponse, onComplete: () => void) => {
      solutionRef.current = solution;
      onCompleteRef.current = onComplete;
      setIsAutoSolving(true);
      isAutoSolvingRef.current = true;
      // Continue from current step - don't reset
      // Only reset if we've already completed all steps
      if (currentStepRef.current > solution.steps.length) {
        currentStepRef.current = 1;
        setCurrentStep(1);
        setCompletedSteps(new Set());
      }
      // Otherwise, continue from current step
      executeAutoSolveStep();
    },
    [executeAutoSolveStep]
  );

  return {
    pegs,
    selectedDisk,
    selectedPeg,
    targetPeg,
    currentStep,
    completedSteps,
    isAutoSolving,
    isSolved,
    selectDisk,
    placeDisk,
    reset,
    setSolution: setSolutionRef,
    startAutoSolve,
    stopAutoSolve,
  };
};
