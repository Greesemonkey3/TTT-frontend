import { useState, useCallback, useEffect, useRef } from 'react';
import { StepsDisplay } from './components/StepsDisplay';
import { AnimationCanvas } from './components/AnimationCanvas';
import { useTowerOfHanoi } from './hooks/useTowerOfHanoi';
import { solveTowerOfHanoi } from './utils/api';
import { Solution, SolutionResponse } from './types';
import confetti from 'canvas-confetti';

const formatTime = (totalSteps: number): string => {
  const totalSeconds = totalSteps * 2; // 2 seconds per move
  const secondsPerMinute = 60;
  const secondsPerHour = 60 * secondsPerMinute;
  const secondsPerDay = 24 * secondsPerHour;
  const secondsPerYear = 365.25 * secondsPerDay; // Account for leap years

  if (totalSeconds < secondsPerMinute) {
    return `${totalSeconds.toLocaleString()} second${totalSeconds !== 1 ? 's' : ''}`;
  } else if (totalSeconds < secondsPerHour) {
    const minutes = Math.floor(totalSeconds / secondsPerMinute);
    const seconds = totalSeconds % secondsPerMinute;
    if (seconds === 0) {
      return `${minutes.toLocaleString()} minute${minutes !== 1 ? 's' : ''}`;
    }
    return `${minutes.toLocaleString()} minute${minutes !== 1 ? 's' : ''} ${seconds.toLocaleString()} second${seconds !== 1 ? 's' : ''}`;
  } else if (totalSeconds < secondsPerDay) {
    const hours = Math.floor(totalSeconds / secondsPerHour);
    const minutes = Math.floor((totalSeconds % secondsPerHour) / secondsPerMinute);
    if (minutes === 0) {
      return `${hours.toLocaleString()} hour${hours !== 1 ? 's' : ''}`;
    }
    return `${hours.toLocaleString()} hour${hours !== 1 ? 's' : ''} ${minutes.toLocaleString()} minute${minutes !== 1 ? 's' : ''}`;
  } else if (totalSeconds < secondsPerYear) {
    const days = Math.floor(totalSeconds / secondsPerDay);
    const hours = Math.floor((totalSeconds % secondsPerDay) / secondsPerHour);
    if (hours === 0) {
      return `${days.toLocaleString()} day${days !== 1 ? 's' : ''}`;
    }
    return `${days.toLocaleString()} day${days !== 1 ? 's' : ''} ${hours.toLocaleString()} hour${hours !== 1 ? 's' : ''}`;
  } else {
    const years = Math.floor(totalSeconds / secondsPerYear);
    const days = Math.floor((totalSeconds % secondsPerYear) / secondsPerDay);
    if (days === 0) {
      return `${years.toLocaleString()} year${years !== 1 ? 's' : ''}`;
    }
    return `${years.toLocaleString()} year${years !== 1 ? 's' : ''} ${days.toLocaleString()} day${days !== 1 ? 's' : ''}`;
  }
};

function App() {
  const [numberOfDisks, setnumberOfDisks] = useState<number>(3);
  const [solution, setSolution] = useState<Solution | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const gameboardRef = useRef<HTMLDivElement>(null);

  const {
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
  } = useTowerOfHanoi();

  useEffect(() => {
    if (isSolved && solution && 'steps' in solution) {
      // Trigger confetti celebration
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);
    }
  }, [isSolved, solution]);

  const handleGenerate = useCallback(async (disks: number) => {
    setIsLoading(true);
    setError('');
    setSolution(null);
    reset(disks);
    setnumberOfDisks(disks);

    try {
      const result = await solveTowerOfHanoi(disks);
      setSolution(result);
      // Set solution ref for step validation - must be set before user can make moves
      if ('steps' in result) {
        setSolutionRef(result);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to generate solution. Please try again.'
      );
      console.error('Error generating solution:', err);
    } finally {
      setIsLoading(false);
    }
  }, [reset, setSolutionRef]);

  const handlePegClick = useCallback(
    (peg: 'A' | 'B' | 'C') => {
      if (isAutoSolving) return;

      if (selectedPeg === null) {
        // No disk selected, try to select one
        selectDisk(peg);
      } else {
        // Disk selected, try to place it
        const isValid = placeDisk(peg);
        if (!isValid) {
          // Show error message for invalid move
          alert('Invalid move! You can only move the top disk, and cannot place a larger disk on a smaller one.');
        }
      }
    },
    [selectedPeg, selectDisk, placeDisk, isAutoSolving]
  );

  const handleAutoSolve = useCallback(() => {
    if (!solution || !('steps' in solution)) return;

    // Scroll gameboard into view when auto-solve starts
    if (gameboardRef.current) {
      setTimeout(() => {
        gameboardRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      }, 100);
    }

    const handleComplete = () => {
      // Celebration is handled by useEffect watching isSolved
    };

    startAutoSolve(solution as SolutionResponse, handleComplete);
  }, [solution, startAutoSolve]);

  // Keep gameboard in view during auto-solve
  useEffect(() => {
    if (isAutoSolving && gameboardRef.current) {
      // Scroll to gameboard periodically during auto-solve to keep it visible
      const scrollInterval = setInterval(() => {
        if (gameboardRef.current && isAutoSolving) {
          gameboardRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 1000); // Check every second

      return () => clearInterval(scrollInterval);
    }
  }, [isAutoSolving]);

  const handleReset = useCallback(() => {
    reset(numberOfDisks);
  }, [reset, numberOfDisks]);

  return (
    <div className="min-h-screen py-4 sm:py-8 px-4 overflow-y-auto">
      <div className="w-full">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black text-center mb-4 sm:mb-8">
          Tim's Tower Trial
        </h1>

        {/* Main Container: Input section + Gameboard on left, Steps on right */}
        <style>{`
          @media (min-width: 1024px) {
            .main-game-container {
              min-height: calc(100vh - 200px) !important;
              height: calc(100vh - 150px) !important;
            }
          }
        `}</style>
        <div className="main-game-container flex flex-col lg:flex-row gap-2 sm:gap-4 md:gap-6 w-full items-stretch">
          <div className="flex-1 flex flex-col min-h-0">
            <div className="bg-white rounded-lg shadow-lg-top p-4 sm:p-6 h-full flex flex-col min-h-0">
              <div className="flex-shrink-0 mb-4">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const input = form.querySelector('input[type="number"]') as HTMLInputElement;
                    if (input) {
                      const value = parseInt(input.value, 10);
                      if (!isNaN(value) && value >= 1 && value <= 1000) {
                        handleGenerate(value);
                      }
                    }
                  }} 
                  className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-end"
                >
                  <div className="flex-1 w-full sm:w-auto">
                    <label htmlFor="numberOfDisks" className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Disks (1-1000)
                    </label>
                    <input
                      id="numberOfDisks"
                      type="number"
                      min="1"
                      max="1000"
                      defaultValue={numberOfDisks}
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
                      disabled={isLoading}
                    />
                    {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 sm:flex-none px-4 sm:px-6 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                      style={{ backgroundColor: 'rgb(0, 106, 255)' }}
                      onMouseEnter={(e) => {
                        if (!isLoading) {
                          e.currentTarget.style.backgroundColor = 'rgb(0, 90, 220)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgb(0, 106, 255)';
                      }}
                    >
                      {isLoading ? 'Generating...' : 'Generate Solution'}
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      disabled={!solution || numberOfDisks >25}
                      className="flex-1 sm:flex-none px-4 sm:px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                    >
                      Reset Game
                    </button>
                  </div>
                </form>
              </div>

              <div 
                ref={gameboardRef}
                className="flex-1 flex justify-center lg:justify-start min-h-0 overflow-auto lg:overflow-hidden"
              >
                {numberOfDisks <= 10 ? (
                <AnimationCanvas
                  pegs={pegs}
                  selectedDisk={selectedDisk}
                  selectedPeg={selectedPeg}
                  targetPeg={targetPeg}
                  onPegClick={handlePegClick}
                  numberOfDisks={numberOfDisks}
                />
                ) : solution ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="bg-white rounded-lg shadow-lg-top p-8 text-center flex flex-col justify-center">
                      <h3 className="text-2xl font-bold text-gray-800 mb-4">Solution</h3>
                      <p className="text-lg text-gray-700 mb-2">
                        Total moves required: <span className="font-bold text-purple-600 text-2xl">{solution.totalSteps.toLocaleString()}</span>
                      </p>
                      <p className="text-lg text-gray-700 mb-2 mt-4">
                        Time required: <span className="font-bold text-blue-600 text-xl">{formatTime(solution.totalSteps)}</span>
                      </p>
                      <p className="text-sm text-gray-500 mt-4">
                        For more than 10 disks, only the step count is provided.
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="w-full lg:w-80 lg:flex-shrink-0 min-h-0 flex flex-col">
          {numberOfDisks <= 10 ? (<StepsDisplay
              solution={solution}
              currentStep={currentStep}
              completedSteps={completedSteps}
              onAutoSolve={handleAutoSolve}
              isAutoSolving={isAutoSolving}
            />) :
            null }
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
