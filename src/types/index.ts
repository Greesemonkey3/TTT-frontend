export type Peg = 'A' | 'B' | 'C';

export interface Step {
  stepNumber: number;
  from: Peg;
  to: Peg;
  disk: number;
}

export interface SolutionResponse {
  steps: Step[];
  totalSteps: number;
}

export interface TotalStepsResponse {
  totalSteps: number;
}

export type Solution = SolutionResponse | TotalStepsResponse;

export interface GameState {
  pegs: {
    A: number[];
    B: number[];
    C: number[];
  };
  selectedDisk: number | null;
  selectedPeg: Peg | null;
  currentStep: number;
  completedSteps: Set<number>;
  isAutoSolving: boolean;
  isSolved: boolean;
}
