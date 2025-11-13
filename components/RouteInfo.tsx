import React, { useState } from 'react';

interface RouteInfoProps {
    info: {
        departure: any;
        arrival: any;
        distance: number;
        duration: string;
        airlines: string[];
        equipment: string;
    } | null;
}

const CalendarPlaceholder = () => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const handlePrevMonth = () => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setMonth(newDate.getMonth() - 1);
            return newDate;
        });
    };

    const handleNextMonth = () => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setMonth(newDate.getMonth() + 1);
            return newDate;
        });
    };

    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const dates = Array(firstDayOfMonth).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    
    const now = new Date();
    const isPrevDisabled = currentDate.getFullYear() < now.getFullYear() || 
                         (currentDate.getFullYear() === now.getFullYear() && currentDate.getMonth() <= now.getMonth());

    return (
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-2 px-1">
                <button 
                    onClick={handlePrevMonth}
                    disabled={isPrevDisabled}
                    className={`p-1 rounded-full transition-colors ${isPrevDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'}`}
                >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h3 className="font-semibold text-gray-800 text-sm">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <button onClick={handleNextMonth} className="p-1 rounded-full hover:bg-gray-200 transition-colors">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>
            <div className="grid grid-cols-7 text-center text-xs text-gray-400 mb-2 font-medium">
                {days.map((day, i) => <div key={i}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 text-center text-sm">
                {dates.map((date, i) => (
                    <div 
                        key={i} 
                        className={`py-1 rounded-full flex items-center justify-center h-7 w-7 mx-auto ${date ? 'text-gray-700' : 'text-transparent'} ${isCurrentMonth && date === today.getDate() ? 'bg-blue-600 text-white font-bold' : ''}`}
                    >
                        {date}
                    </div>
                ))}
            </div>
        </div>
    );
};


const RouteInfo: React.FC<RouteInfoProps> = ({ info }) => {
    if (!info) {
        return null;
    }

    const { departure, arrival, distance, duration, airlines } = info;

    return (
        <div className="w-full">
            <div className="mb-4">
                <h2 className="text-xl font-bold">Route Information</h2>
            </div>

            <div className="flex flex-col space-y-4">
                {/* Departure */}
                <div className="text-left border-b border-gray-200 pb-4">
                    <p className="text-sm text-gray-500">Departure</p>
                    <p className="text-lg font-semibold">{departure.name}</p>
                    <p className="text-md text-pink-600">{departure.iata_code}</p>
                </div>

                 {/* Arrival */}
                <div className="text-left border-b border-gray-200 pb-4">
                    <p className="text-sm text-gray-500">Arrival</p>
                    <p className="text-lg font-semibold">{arrival.name}</p>
                    <p className="text-md text-violet-600">{arrival.iata_code}</p>
                </div>

                {/* New Calendar and Affiliate Button Section */}
                <div className="pb-4 border-b border-gray-200">
                    <h3 className="text-md font-semibold text-gray-800 mb-3">Find Flights</h3>
                    <CalendarPlaceholder />
                    <button className="w-full mt-4 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                        Book Now
                    </button>
                </div>

                {/* Route Details */}
                <div className="text-left">
                     <div className="flex justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Distance</p>
                            <p className="text-lg font-semibold">{distance.toLocaleString()} km</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Est. Duration</p>
                            <p className="text-lg font-semibold">{duration}</p>
                        </div>
                    </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                    <div className="flex flex-col space-y-4">
                         <div>
                            <p className="text-sm text-gray-500 mb-1">Airlines</p>
                            <p className="font-medium text-sm">{airlines.join(', ') || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RouteInfo;