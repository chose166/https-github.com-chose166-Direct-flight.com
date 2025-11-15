import React, { useState } from 'react';

interface BottomAdProps {
  isSquare?: boolean;
}

const BottomAd: React.FC<BottomAdProps> = ({ isSquare = false }) => {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) {
        return null;
    }
    
    const baseClasses = "relative bg-gray-100/90 backdrop-blur-sm border border-gray-300 shadow-lg flex items-center justify-center text-gray-500 font-semibold text-center px-4";
    
    const shapeClasses = isSquare 
        ? "aspect-square rounded-lg" 
        : "h-24 rounded-lg md:rounded-none md:border-x-0";

    return (
        <div className={`${baseClasses} ${shapeClasses}`}>
            <span>Advertisement Placeholder</span>
            <button
                onClick={() => setIsVisible(false)}
                className="absolute top-1 right-1 p-1 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-200"
                aria-label="Close ad"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

export default BottomAd;