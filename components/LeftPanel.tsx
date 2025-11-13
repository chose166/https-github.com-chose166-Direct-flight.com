import React from 'react';
import RouteInfo from './RouteInfo';

interface LeftPanelProps {
    info: any | null;
    clearRoute: () => void;
}

const AdPlaceholder = ({ className }: { className?: string }) => (
    <div className={`bg-gray-200/80 border border-gray-300/80 rounded-lg flex items-center justify-center text-gray-500 text-sm ${className}`}>
        Ad Placeholder
    </div>
);

const LeftPanel: React.FC<LeftPanelProps> = ({ info, clearRoute }) => {
    return (
        <aside className="w-96 h-full bg-white/80 backdrop-blur-md shadow-2xl text-gray-900 flex flex-col flex-shrink-0 border-r border-gray-200/80">
            {/* Top Bar for the Close Button */}
            <div className="h-12 flex-shrink-0 flex justify-end items-center px-4">
                {info && (
                    <button
                        onClick={clearRoute}
                        className="text-gray-500 hover:text-gray-900 transition-colors z-20 p-1 rounded-full hover:bg-gray-200/50"
                        aria-label="Clear route selection"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Main scrollable content */}
            <div className="flex-grow p-4 pt-0 flex flex-col space-y-4 overflow-y-auto custom-scrollbar">
                <AdPlaceholder className="h-48 flex-shrink-0" />
                
                <div className="flex-grow">
                    {info && (
                        <RouteInfo info={info} />
                    )}
                </div>
            </div>
        </aside>
    );
};

export default LeftPanel;