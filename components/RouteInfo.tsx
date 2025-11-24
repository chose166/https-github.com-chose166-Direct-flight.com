import React, { useState, useEffect } from 'react';
import { trackKayakClick } from '../utils/analytics';

interface RouteInfoProps {
    info: {
        departure: any;
        arrival: any;
        distance: number;
        duration: string;
        airlines: string[];
        equipment: string;
        verified?: boolean | null;
        verificationSource?: string;
        dailyFlights?: number | null;
    } | null;
}

interface CalendarProps {
    selectedDate: Date | null;
    onDateSelect: (date: Date) => void;
}

const CalendarPlaceholder: React.FC<CalendarProps> = ({ selectedDate, onDateSelect }) => {
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

    const handleDateClick = (day: number) => {
        const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        onDateSelect(selected);
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

    const isSameDay = (date1: Date | null, year: number, month: number, day: number) => {
        if (!date1) return false;
        return date1.getFullYear() === year && date1.getMonth() === month && date1.getDate() === day;
    };

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
                {dates.map((date, i) => {
                    const isPast = date && year === now.getFullYear() && month === now.getMonth() && date < now.getDate();
                    const isSelected = date && isSameDay(selectedDate, year, month, date);

                    return (
                        <div
                            key={i}
                            onClick={() => date && !isPast && handleDateClick(date)}
                            className={`py-1 rounded-full flex items-center justify-center h-7 w-7 mx-auto transition-colors
                                ${date ? 'text-gray-700' : 'text-transparent'}
                                ${isPast ? 'text-gray-300 cursor-not-allowed' : date ? 'cursor-pointer hover:bg-gray-200' : ''}
                                ${isSelected ? 'bg-blue-600 text-white font-bold' : ''}
                            `}
                        >
                            {date}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


const RouteInfo: React.FC<RouteInfoProps> = ({ info }) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [tripType, setTripType] = useState<'oneway' | 'roundtrip'>('roundtrip');
    const [returnDate, setReturnDate] = useState<Date | null>(null);
    const [cabinClass, setCabinClass] = useState<'economy' | 'premium' | 'business' | 'first'>('economy');
    const [passengers, setPassengers] = useState(1);

    // Reset selected date when route changes
    useEffect(() => {
        setSelectedDate(null);
        setReturnDate(null);
    }, [info?.departure?.iata_code, info?.arrival?.iata_code]);

    if (!info) {
        return null;
    }

    const { departure, arrival, distance, duration, airlines, verified, verificationSource, dailyFlights } = info;

    // Generate Kayak affiliate link
    const generateKayakLink = () => {
        const baseUrl = 'https://www.kayak.com/flights';
        const fromCode = departure.iata_code;
        const toCode = arrival.iata_code;

        // Use selected date or default to 7 days from now
        const departureDate = selectedDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const formatDate = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const departureDateStr = formatDate(departureDate);

        // Build URL based on trip type
        let url = `${baseUrl}/${fromCode}-${toCode}/${departureDateStr}`;

        if (tripType === 'roundtrip') {
            // Add return date (default 7 days after departure if not selected)
            const returnDateToUse = returnDate || new Date(departureDate.getTime() + 7 * 24 * 60 * 60 * 1000);
            const returnDateStr = formatDate(returnDateToUse);
            url += `/${returnDateStr}`;
        }

        // Add cabin class and passengers - Kayak format: /cabin/passengers
        const cabinMap: { [key: string]: string } = {
            economy: '',
            premium: 'premium',
            business: 'business',
            first: 'first'
        };

        // Cabin class comes BEFORE passengers
        if (cabinClass !== 'economy') {
            url += `/${cabinMap[cabinClass]}`;
        }

        url += `/${passengers}adults`;

        return url;
    };

    const handleBookNow = () => {
        const kayakLink = generateKayakLink();

        console.log('Generated Kayak URL:', kayakLink);
        console.log('Cabin class:', cabinClass);
        console.log('Passengers:', passengers);

        // Track the affiliate click
        trackKayakClick(departure.iata_code, arrival.iata_code);

        // Open Kayak in new tab
        window.open(kayakLink, '_blank', 'noopener,noreferrer');
    };

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

                {/* Flight Options and Calendar Section */}
                <div className="pb-4 border-b border-gray-200">
                    {/* Trip Type Selection */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Trip Type</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setTripType('oneway')}
                                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                    tripType === 'oneway'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                One-way
                            </button>
                            <button
                                onClick={() => setTripType('roundtrip')}
                                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                    tripType === 'roundtrip'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Round-trip
                            </button>
                        </div>
                    </div>

                    {/* Cabin Class Selection */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cabin Class</label>
                        <select
                            value={cabinClass}
                            onChange={(e) => setCabinClass(e.target.value as any)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="economy">Economy</option>
                            <option value="premium">Premium Economy</option>
                            <option value="business">Business</option>
                            <option value="first">First Class</option>
                        </select>
                    </div>

                    {/* Passengers Selection */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Passengers</label>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setPassengers(Math.max(1, passengers - 1))}
                                className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                                </svg>
                            </button>
                            <span className="flex-1 text-center font-medium">{passengers} {passengers === 1 ? 'Adult' : 'Adults'}</span>
                            <button
                                onClick={() => setPassengers(Math.min(9, passengers + 1))}
                                className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Departure Date */}
                    <h3 className="text-md font-semibold text-gray-800 mb-3">Departure Date</h3>
                    <CalendarPlaceholder selectedDate={selectedDate} onDateSelect={setSelectedDate} />
                    {selectedDate && (
                        <p className="text-sm text-gray-600 mt-2">
                            Selected: {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    )}

                    {/* Return Date - Only for Round-trip */}
                    {tripType === 'roundtrip' && (
                        <>
                            <h3 className="text-md font-semibold text-gray-800 mb-3 mt-4">Return Date</h3>
                            <CalendarPlaceholder selectedDate={returnDate} onDateSelect={setReturnDate} />
                            {returnDate && (
                                <p className="text-sm text-gray-600 mt-2">
                                    Selected: {returnDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            )}
                        </>
                    )}

                    <button
                        onClick={handleBookNow}
                        className="w-full mt-4 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        Search Flights on Kayak
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

                        {/* Route Verification Status */}
                        <div className={`rounded-lg p-3 border ${
                            verificationSource === 'aerodatabox'
                                ? verified
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-red-50 border-red-200'
                                : 'bg-gray-50 border-gray-200'
                        }`}>
                            <div className="flex items-center mb-2">
                                {verificationSource === 'aerodatabox' ? (
                                    verified ? (
                                        <>
                                            <svg className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <p className="text-sm font-semibold text-green-800">✓ Verified Route</p>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="h-5 w-5 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <p className="text-sm font-semibold text-red-800">Route Not Operating</p>
                                        </>
                                    )
                                ) : (
                                    <>
                                        <svg className="h-5 w-5 text-gray-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-sm font-semibold text-gray-800">Historical Data Only</p>
                                    </>
                                )}
                            </div>

                            {verificationSource === 'aerodatabox' && verified && dailyFlights && (
                                <p className="text-xs text-green-700">
                                    Average {dailyFlights.toFixed(1)} daily flights
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RouteInfo;