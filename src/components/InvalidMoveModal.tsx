import React from 'react';

interface InvalidMoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

export const InvalidMoveModal: React.FC<InvalidMoveModalProps> = ({
  isOpen,
  onClose,
  message,
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
          Invalid Move
        </h3>
        <p className="text-base sm:text-lg text-gray-700 mb-6">
          {message}
        </p>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors text-base sm:text-lg font-medium"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

