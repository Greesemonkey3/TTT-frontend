import { useMemo, useState, useEffect } from 'react';
import { animated, useSpring } from '@react-spring/web';
import { Peg } from '../types';

interface AnimationCanvasProps {
  pegs: { A: number[]; B: number[]; C: number[] };
  selectedDisk: number | null;
  selectedPeg: Peg | null;
  targetPeg: Peg | null;
  onPegClick: (peg: Peg) => void;
  numberOfDisks: number;
}

const PEG_WIDTH = 14;
const PEG_HEIGHT = 300;
const BASE_HEIGHT = 20;
const DISK_HEIGHT = 25;
const MIN_DISK_WIDTH = 40;
const MAX_DISK_WIDTH = 180;
const PEG_SPACING = 200;
const PEG_TOP_Y = 50;
const LIFT_HEIGHT = 30; // Height above peg top when selected

const getDiskWidth = (diskNumber: number, numberOfDisks: number): number => {
  const ratio = diskNumber / numberOfDisks;
  return MIN_DISK_WIDTH + (MAX_DISK_WIDTH - MIN_DISK_WIDTH) * ratio;
};

const getDiskColor = (diskNumber: number, numberOfDisks: number): string => {
  const hue = (diskNumber / numberOfDisks) * 360;
  return `hsl(${hue}, 70%, 50%)`;
};

interface DiskProps {
  diskNumber: number;
  peg: Peg;
  index: number;
  totalDisksOnPeg: number;
  isSelected: boolean;
  targetPeg: Peg | null;
  targetPegDisks: number[];
  numberOfDisks: number;
  pegX: number;
  targetPegX: number | null;
  onPegClick: (peg: Peg) => void;
}

const Disk = ({
  diskNumber,
  peg,
  index,
  totalDisksOnPeg,
  isSelected,
  targetPeg,
  targetPegDisks,
  numberOfDisks,
  pegX,
  targetPegX,
  onPegClick,
}: DiskProps) => {
  const width = getDiskWidth(diskNumber, numberOfDisks);
  const color = getDiskColor(diskNumber, numberOfDisks);
  const baseY = PEG_HEIGHT - BASE_HEIGHT;
  
  // Determine target position
  let targetX = pegX;
  let targetY: number;
  
  if (isSelected && targetPeg && targetPegX !== null) {
    // Disk is being moved - keep it above the target peg until targetPeg is cleared
    // This allows smooth animation: horizontal movement, then downward when targetPeg clears
    targetX = targetPegX;
    targetY = PEG_TOP_Y - LIFT_HEIGHT;
  } else if (isSelected) {
    // Just selected: rise above current peg
    targetX = pegX;
    targetY = PEG_TOP_Y - LIFT_HEIGHT;
  } else {
    // Normal position: index 0 should be at bottom
    targetY = baseY - (index + 1) * DISK_HEIGHT;
  }

  const spring = useSpring({
    x: targetX - width / 2,
    y: targetY,
    config: { tension: 300, friction: 30 },
  });

  const handleDiskClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event from bubbling to peg
    onPegClick(peg);
  };

  return (
    <animated.rect
      x={spring.x}
      y={spring.y}
      width={width}
      height={DISK_HEIGHT}
      rx={8}
      fill={color}
      stroke="#333"
      strokeWidth={2}
      onClick={handleDiskClick}
      style={{
        cursor: 'pointer',
        filter: isSelected ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' : 'none',
      }}
    />
  );
};

export const AnimationCanvas = ({
  pegs,
  selectedDisk,
  selectedPeg,
  targetPeg,
  onPegClick,
  numberOfDisks,
}: AnimationCanvasProps) => {
  // Responsive spacing - smaller on mobile
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  // Calculate responsive spacing: ensure minimum space, scale down on mobile
  const minSpacing = 80;
  const maxSpacing = PEG_SPACING;
  const availableWidth = windowWidth - 80; // Account for padding
  const responsivePegSpacing = isMobile 
    ? Math.max(minSpacing, Math.min(maxSpacing, (availableWidth - MAX_DISK_WIDTH) / 2))
    : PEG_SPACING;
  
  const canvasWidth = responsivePegSpacing * 2 + MAX_DISK_WIDTH;
  const canvasHeight = PEG_HEIGHT + BASE_HEIGHT + 100;

  const pegPositions = useMemo(() => {
    const centerX = canvasWidth / 2;
    return {
      A: centerX - responsivePegSpacing,
      B: centerX,
      C: centerX + responsivePegSpacing,
    };
  }, [canvasWidth, responsivePegSpacing]);

  const allDisks = useMemo(() => {
    const disks: Array<{
      diskNumber: number;
      peg: Peg;
      index: number;
      totalDisksOnPeg: number;
    }> = [];

    (['A', 'B', 'C'] as Peg[]).forEach((peg) => {
      pegs[peg].forEach((diskNumber, index) => {
        disks.push({
          diskNumber,
          peg,
          index,
          totalDisksOnPeg: pegs[peg].length,
        });
      });
    });

    return disks;
  }, [pegs]);

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-2 sm:mb-4 flex-shrink-0">Game Board</h3>
      <div className="flex-1 flex justify-center overflow-auto items-center min-h-0 p-1 sm:p-2">
        <svg
          width={canvasWidth}
          height={canvasHeight}
          className="border border-gray-200 rounded-md bg-gradient-to-b from-blue-50 to-purple-50"
          viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ 
            maxWidth: '100%', 
            maxHeight: '100%',
            minWidth: isMobile ? '280px' : 'auto',
            minHeight: isMobile ? '200px' : 'auto'
          }}
        >
          {/* Base */}
          <rect
            x={0}
            y={PEG_HEIGHT}
            width={canvasWidth}
            height={BASE_HEIGHT}
            fill="#8B7355"
            rx={4}
          />

          {/* Pegs */}
          {(['A', 'B', 'C'] as Peg[]).map((peg) => {
            const pegX = pegPositions[peg];
            const pegActualHeight = PEG_HEIGHT - PEG_TOP_Y + 20; // Height from top to base
            return (
              <g key={peg}>
                {/* Peg */}
                <rect
                  x={pegX - PEG_WIDTH / 2}
                  y={PEG_TOP_Y}
                  width={PEG_WIDTH}
                  height={pegActualHeight}
                  fill="#654321"
                  rx={PEG_WIDTH / 2}
                  onClick={() => onPegClick(peg)}
                  style={{ cursor: 'pointer' }}
                />
                {/* Peg Label */}
                <text
                  x={pegX}
                  y={PEG_HEIGHT + BASE_HEIGHT}
                  textAnchor="middle"
                  fontSize="20"
                  fontWeight="bold"
                  fill="white"
                >
                  {peg}
                </text>
              </g>
            );
          })}

          {/* Disks */}
          {allDisks.map(({ diskNumber, peg, index, totalDisksOnPeg }) => {
            const isThisDiskSelected = selectedDisk === diskNumber && selectedPeg === peg;
            return (
              <Disk
                key={`disk-${diskNumber}-${peg}-${index}`}
                diskNumber={diskNumber}
                peg={peg}
                index={index}
                totalDisksOnPeg={totalDisksOnPeg}
                isSelected={isThisDiskSelected}
                targetPeg={isThisDiskSelected ? targetPeg : null}
                targetPegDisks={targetPeg ? pegs[targetPeg] : []}
                numberOfDisks={numberOfDisks}
                pegX={pegPositions[peg]}
                targetPegX={targetPeg ? pegPositions[targetPeg] : null}
                onPegClick={onPegClick}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
};
