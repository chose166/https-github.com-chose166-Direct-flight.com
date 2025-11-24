
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
            {info ? (
                // When route is selected, make everything scrollable
                <div className="flex-grow overflow-y-auto custom-scrollbar">
                    {/* Top Bar for the Close Button */}
                    <div className="h-12 flex-shrink-0 flex justify-end items-center px-4 sticky top-0 bg-white/80 backdrop-blur-md z-10">
                        <button
                            onClick={clearRoute}
                            className="text-gray-500 hover:text-gray-900 transition-colors z-20 p-1 rounded-full hover:bg-gray-200/50"
                            aria-label="Clear route selection"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Ad Placeholder */}
                    <div className="px-4 pb-4">
                        <BottomAd isSquare={!isMobileOrTablet} />
                    </div>

                    {/* Route Info */}
                    <div className="p-4 pt-0">
                        <RouteInfo info={info} />
                    </div>
                </div>
            ) : (
                // When no route selected, keep original layout
                <>
                    {/* Ad Placeholder */}
                    {!isMobileOrTablet && (
                        <div className="flex-shrink-0 px-4 pt-4">
                            <BottomAd isSquare={true} />
                        </div>
                    )}

                    {/* Top Bar for the Close Button */}
                    <div className="h-12 flex-shrink-0"></div>

                    {/* Main scrollable content */}
                    <div className="flex-grow p-4 overflow-y-auto custom-scrollbar">
                        {!isMobileOrTablet && (
                            <div className="flex flex-col justify-start pt-4 text-gray-700 px-3">
                                <h1 className="font-bold text-2xl text-gray-900 mb-4">Direct Flight Search Tool</h1>
                                <p className="text-sm leading-relaxed mb-3">
                                    Welcome to our comprehensive direct flight finder. Explore nonstop flight routes between major airports worldwide using our interactive 3D globe visualization.
                                </p>
                                <p className="text-sm leading-relaxed mb-3">
                                    Search and discover direct flights from any departure airport to your destination. Our tool provides detailed information including flight distances, estimated flight duration, operating airlines, and aircraft types for thousands of direct routes.
                                </p>
                                <p className="text-sm leading-relaxed mb-3">
                                    Whether you're planning international travel or domestic trips, find the most convenient nonstop connections. Compare direct flight options, view flight paths on an interactive map, and access comprehensive route details instantly.
                                </p>
                                <p className="text-sm font-semibold text-gray-800 mb-2">
                                    How to use:
                                </p>
                                <ul className="text-sm space-y-2 mb-3">
                                    <li className="flex items-start">
                                        <span className="text-blue-600 mr-2">•</span>
                                        <span>Select departure and arrival airports using the search above</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-blue-600 mr-2">•</span>
                                        <span>Click airports on the globe to explore available routes</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-blue-600 mr-2">•</span>
                                        <span>View detailed flight information and airline options</span>
                                    </li>
                                </ul>
                                <p className="text-xs text-gray-500 italic">
                                    Start exploring direct flights now to find the best nonstop connections for your journey.
                                </p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </aside>
    );
};

export default LeftPanel;