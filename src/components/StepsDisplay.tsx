import { useEffect, useRef } from 'react';
import { Step, Solution, SolutionResponse } from '../types';

interface StepsDisplayProps {
  solution: Solution | null;
  currentStep: number;
  completedSteps: Set<number>;
  onAutoSolve: () => void;
  isAutoSolving: boolean;
}

export const StepsDisplay = ({
  solution,
  currentStep,
  completedSteps,
  onAutoSolve,
  isAutoSolving,
}: StepsDisplayProps) => {
  const currentStepRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Don't scroll solution steps during auto-solve - keep focus on gameboard
    if (currentStepRef.current && !isAutoSolving) {
      currentStepRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentStep, isAutoSolving]);

  if (!solution) {
    return (
      <div className="bg-white rounded-lg shadow-lg-top p-4 sm:p-6 h-full flex flex-col min-h-0 max-h-[50vh] lg:max-h-none">
        <div className="flex flex-col gap-3 mb-4 flex-shrink-0">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800">
            Solution Steps
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto border border-gray-200 rounded-md min-h-0 flex items-center justify-center">
          <p className="text-gray-500 text-sm">No solution generated yet</p>
        </div>
      </div>
    );
  }

  // Handle case where only totalSteps is returned (numberOfDisks > 10)
  if (!('steps' in solution) || (solution as SolutionResponse).steps.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg-top p-6 h-full flex flex-col min-h-0">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex-shrink-0">Solution</h3>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-gray-700 mb-2">
              Total moves required:
            </p>
            <p className="text-3xl font-bold text-purple-600 mb-4">
              {solution.totalSteps.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">
              For more than 10 disks, only the step count is provided.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const steps = (solution as { steps: Step[] }).steps;

  return (
    <div className="bg-white rounded-lg shadow-lg-top p-4 sm:p-6 h-full flex flex-col min-h-0 max-h-[50vh] lg:max-h-none">
      <div className="flex flex-col gap-3 mb-4 flex-shrink-0">
        <h3 className="text-lg sm:text-xl font-bold text-gray-800">
          Solution Steps ({steps.length} total)
        </h3>
        <button
          onClick={onAutoSolve}
          disabled={isAutoSolving || currentStep > steps.length}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
        >
          {isAutoSolving ? 'Auto Solving...' : 'Auto Solve'}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto border border-gray-200 rounded-md min-h-0 max-h-[calc(50vh-140px)] lg:max-h-none">
        <div className="divide-y divide-gray-200">
          {steps.map((step) => {
            const isCurrent = step.stepNumber === currentStep;
            const isCompleted = completedSteps.has(step.stepNumber);

            return (
              <div
                key={step.stepNumber}
                ref={isCurrent ? currentStepRef : null}
                className={`px-4 py-3 transition-colors ${
                  isCurrent
                    ? 'bg-yellow-100 font-bold'
                    : isCompleted
                    ? 'bg-green-50'
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Step {step.stepNumber}:</span>
                  <span className="text-gray-800">
                    Move disk {step.disk} from peg {step.from} to peg {step.to}
                  </span>
                  {isCompleted && (
                    <span className="ml-auto text-green-600 font-bold">✓</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
