
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
    
    return (
        <div className="flex flex-row items-center space-x-2">
            <div className="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0 flex-grow">
                <div className="relative w-full md:w-auto">
                    <input 
                        type="text"
                        placeholder="Departure"
                        value={departureInput}
                        onChange={(e) => handleInputChange(e, 'departure')}
                        onFocus={() => departureInput.length > 1 && setActiveSuggestionBox('departure')}
                        onBlur={handleBlur}
                        className="w-full bg-white/70 text-gray-900 placeholder-gray-500 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300/50"
                    />
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
                <div className="relative w-full md:w-auto">
                    <input 
                        type="text"
                        placeholder="Arrival"
                        value={arrivalInput}
                        onChange={(e) => handleInputChange(e, 'arrival')}
                        onFocus={() => arrivalInput.length > 1 && setActiveSuggestionBox('arrival')}
                        onBlur={handleBlur}
                        className="w-full bg-white/70 text-gray-900 placeholder-gray-500 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300/50"
                    />
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
            <button onClick={handleSwitch} className="p-2 bg-white/70 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300/50 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
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
            <header className="bg-white/80 backdrop-blur-md shadow-md p-2 flex items-center justify-between z-20 border-b border-gray-200/80 flex-shrink-0">
                <div className="flex-1 min-w-0">
                    <div className="text-2xl font-bold text-blue-600 tracking-tight pl-2 md:pl-4">
                        Directflights
                    </div>
                </div>
                <div className="hidden md:flex justify-center">
                    <RouteFinder {...props} />
                </div>
                <div className="flex-1 min-w-0 flex justify-end items-center">
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
            {isSearchVisible && (
                 <div className="md:hidden bg-white/80 backdrop-blur-md p-4 shadow-md z-10 border-b border-gray-200/50">
                    <RouteFinder {...props} />
                </div>
            )}
        </>
    );
};

export default Header;
