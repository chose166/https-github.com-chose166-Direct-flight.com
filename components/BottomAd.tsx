import React from 'react';

const BottomAd: React.FC = () => {
    return (
        <div className="absolute bottom-0 left-0 w-full p-2 z-10 pointer-events-none">
            <div className="max-w-4xl mx-auto h-24 bg-white/80 backdrop-blur-md rounded-lg shadow-lg flex items-center justify-center text-gray-500 text-lg font-semibold border border-gray-200/80">
                Ad Placeholder
            </div>
        </div>
    );
};

export default BottomAd;
