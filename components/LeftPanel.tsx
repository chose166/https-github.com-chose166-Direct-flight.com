
import React from 'react';
import RouteInfo from './RouteInfo';
import BottomAd from './BottomAd';

interface LeftPanelProps {
    info: any | null;
    clearRoute: () => void;
    isMobileOrTablet: boolean;
}

const LeftPanel: React.FC<LeftPanelProps> = ({ info, clearRoute, isMobileOrTablet }) => {
    
    const desktopClasses = "w-96 h-full bg-white/80 backdrop-blur-md shadow-2xl text-gray-900 flex flex-col flex-shrink-0 border-r border-gray-200/80";
    
    const mobileClasses = `
        absolute top-0 left-0 right-0 h-full z-30
        bg-white/95 backdrop-blur-xl text-gray-900
        transition-opacity duration-300 ease-in-out
        flex flex-col
        ${info ? 'opacity-100' : 'opacity-0 pointer-events-none'}
    `;

    return (
        <aside className={isMobileOrTablet ? mobileClasses : desktopClasses}>
            {/* Ad Placeholder */}
            {(info || !isMobileOrTablet) && (
                 <div className="flex-shrink-0 px-12 pt-4">
                    <BottomAd isSquare={!isMobileOrTablet} />
                </div>
            )}

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
            <div className="flex-grow p-4 overflow-y-auto custom-scrollbar">
                {info ? (
                    <RouteInfo info={info} />
                ) : !isMobileOrTablet ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V7.618a1 1 0 01.553-.894L9 4l6.447 2.724A1 1 0 0116 7.618v8.764a1 1 0 01-.553.894L9 20z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l6-3" /></svg>
                        <h3 className="font-semibold text-lg text-gray-700">Explore Direct Flights</h3>
                        <p className="text-sm mt-1">Select a departure and arrival airport on the map to see route details.</p>
                    </div>
                ) : null}
            </div>
        </aside>
    );
};

export default LeftPanel;