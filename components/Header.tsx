
import React, { useState, useEffect } from 'react';

export const RouteFinder = ({ airports, departure, setDeparture, arrival, setArrival }: any) => {
    const [departureInput, setDepartureInput] = useState('');
    const [arrivalInput, setArrivalInput] = useState('');
    const [departureSuggestions, setDepartureSuggestions] = useState<any[]>([]);
    const [arrivalSuggestions, setArrivalSuggestions] = useState<any[]>([]);
    const [activeSuggestionBox, setActiveSuggestionBox] = useState<'departure' | 'arrival' | null>(null);

    useEffect(() => {
        setDepartureInput(departure ? `${departure.name} (${departure.iata_code})` : '');
        if (!departure) {
             setDepartureSuggestions([]);
        }
    }, [departure]);

    useEffect(() => {
        setArrivalInput(arrival ? `${arrival.name} (${arrival.iata_code})` : '');
         if (!arrival) {
             setArrivalSuggestions([]);
        }
    }, [arrival]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'departure' | 'arrival') => {
        const value = e.target.value;
        const setter = type === 'departure' ? setDepartureInput : setArrivalInput;
        const suggestionSetter = type === 'departure' ? setDepartureSuggestions : setArrivalSuggestions;
        const clearSelection = type === 'departure' ? setDeparture : setArrival;

        setter(value);

        if (value.length > 1) {
            const suggestions = airports.filter((a: any) =>
                a.name.toLowerCase().includes(value.toLowerCase()) ||
                (a.iata_code && a.iata_code.toLowerCase().includes(value.toLowerCase()))
            ).slice(0, 5);
            suggestionSetter(suggestions);
            setActiveSuggestionBox(type);
        } else {
            suggestionSetter([]);
            clearSelection(null);
        }
    };
    
    const selectSuggestion = (airport: any, type: 'departure' | 'arrival') => {
        const setter = type === 'departure' ? setDeparture : setArrival;
        setter(airport);
        setActiveSuggestionBox(null);
    };
    
    const handleSwitch = () => {
        const currentDeparture = departure;
        const currentArrival = arrival;
        setDeparture(currentArrival);
        setArrival(currentDeparture);
    };
    
    const handleBlur = () => {
        // Hide suggestions when input loses focus
        setTimeout(() => setActiveSuggestionBox(null), 150);
    }
    
    const clearDeparture = () => {
        setDeparture(null);
        setDepartureInput('');
        setDepartureSuggestions([]);
        // Also clear arrival when departure is cleared
        setArrival(null);
        setArrivalInput('');
        setArrivalSuggestions([]);
    };

    const clearArrival = () => {
        setArrival(null);
        setArrivalInput('');
        setArrivalSuggestions([]);
    };

    return (
        <div className="flex items-center space-x-2">
            <div className="flex flex-col md:flex-row items-stretch md:items-center md:space-x-2 space-y-2 md:space-y-0 flex-1">
                {/* Departure Input */}
                <div className="relative w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Departure"
                        value={departureInput}
                        onChange={(e) => handleInputChange(e, 'departure')}
                        onFocus={() => departureInput.length > 1 && setActiveSuggestionBox('departure')}
                        onBlur={handleBlur}
                        className="w-full bg-white/70 text-gray-900 placeholder-gray-500 px-3 py-2 pr-8 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300/50"
                    />
                    {departureInput && (
                        <button
                            onClick={clearDeparture}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                            type="button"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                    {activeSuggestionBox === 'departure' && departureSuggestions.length > 0 && (
                        <ul className="absolute mt-1 w-full bg-white rounded-md shadow-lg overflow-hidden z-20">
                            {departureSuggestions.map(airport => (
                                <li
                                    key={airport.iata_code || airport.id}
                                    onMouseDown={() => selectSuggestion(airport, 'departure')}
                                    className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                                >
                                    {airport.name} ({airport.iata_code})
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Switch Button - Desktop only (between inputs) */}
                <button onClick={handleSwitch} className="hidden md:block p-2 bg-white/70 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300/50 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                </button>

                {/* Arrival Input */}
                <div className="relative w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Arrival"
                        value={arrivalInput}
                        onChange={(e) => handleInputChange(e, 'arrival')}
                        onFocus={() => arrivalInput.length > 1 && setActiveSuggestionBox('arrival')}
                        onBlur={handleBlur}
                        className="w-full bg-white/70 text-gray-900 placeholder-gray-500 px-3 py-2 pr-8 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300/50"
                    />
                    {arrivalInput && (
                        <button
                            onClick={clearArrival}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                            type="button"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                     {activeSuggestionBox === 'arrival' && arrivalSuggestions.length > 0 && (
                        <ul className="absolute mt-1 w-full bg-white rounded-md shadow-lg overflow-hidden z-20">
                            {arrivalSuggestions.map(airport => (
                                <li
                                    key={airport.iata_code || airport.id}
                                    onMouseDown={() => selectSuggestion(airport, 'arrival')}
                                    className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                                >
                                    {airport.name} ({airport.iata_code})
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Switch Button - Mobile only (on the right with vertical arrows) */}
            <button onClick={handleSwitch} className="md:hidden p-2 bg-white/70 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300/50 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
            </button>
        </div>
    );
};


interface HeaderProps {
    airports: any[];
    departure: any | null;
    setDeparture: (airport: any | null) => void;
    arrival: any | null;
    setArrival: (airport: any | null) => void;
    is3DView: boolean;
    setIs3DView: (is3D: boolean) => void;
    isMobileOrTablet: boolean;
    selectedRouteInfo: any | null;
}

const Header: React.FC<HeaderProps> = (props) => {
    const { is3DView, setIs3DView, isMobileOrTablet, selectedRouteInfo } = props;
    const isSearchVisible = isMobileOrTablet && !selectedRouteInfo;
    const isDesktop = !isMobileOrTablet;

    return (
        <>
            <header className="bg-white/80 backdrop-blur-md shadow-md px-2 flex items-center z-20 border-b border-gray-200/80 flex-shrink-0 h-[72px]">
                {/* Logo - smaller on tablets */}
                <div className="flex-shrink-0 pl-2 md:pl-4">
                    <img
                        src="/logo.svg"
                        alt="Directflights"
                        className="h-[70px] w-auto"
                    />
                </div>

                {/* Search inputs - visible on md and up, takes available space */}
                <div className="hidden md:flex flex-1 justify-center px-4 min-w-0">
                    <RouteFinder {...props} />
                </div>

                {/* 3D/2D Toggle - only on desktop (1280px+) */}
                <div className="flex-shrink-0 flex justify-end items-center">
                    {isDesktop && (
                        <div className="bg-gray-200/80 p-1 rounded-lg flex items-center space-x-1 border border-gray-300/50 mr-2 md:mr-4">
                            <button
                                onClick={() => setIs3DView(true)}
                                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${is3DView ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                            >
                                3D
                            </button>
                            <button
                                onClick={() => setIs3DView(false)}
                                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${!is3DView ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                            >
                                2D
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Search inputs - visible on mobile only */}
            {isSearchVisible && (
                 <div className="md:hidden bg-white/80 backdrop-blur-md p-4 shadow-md z-10 border-b border-gray-200/50">
                    <RouteFinder {...props} />
                </div>
            )}
        </>
    );
};

export default Header;
