import React from 'react';
import { motion } from 'framer-motion';

const IconCard = ({ name, iconKey, onClick }) => {
    return (
        <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onClick}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center h-32 p-4 outline-none touch-manipulation"
        >
            {iconKey ? (
                <>
                    <img
                        src={`/assets/icons/${iconKey}.svg`}
                        alt={name}
                        className="w-12 h-12 mb-2 object-contain dark:invert"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.className = "text-lg font-bold text-gray-800";
                        }}
                    />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{name}</span>
                </>
            ) : (
                <span className="text-lg font-bold text-gray-800">{name}</span>
            )}
        </motion.button>
    );
};

export default IconCard;