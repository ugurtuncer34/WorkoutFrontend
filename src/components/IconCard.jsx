import React from 'react';
import { motion } from 'framer-motion';

const IconCard = ({ name, iconKey, onClick }) => {
    return (
        <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onClick}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center h-36 p-4 outline-none touch-manipulation transition-colors"
        >
            {iconKey ? (
                <>
                    <img
                        src={`/assets/icons/${iconKey}.svg`}
                        alt={name}
                        // brightness-0 forces the image to black, invert flips it to pure white
                        className="w-20 h-20 mb-3 object-contain dark:brightness-0 dark:invert transition-all"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.className = "text-lg font-bold text-gray-800 dark:text-white";
                        }}
                    />
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{name}</span>
                </>
            ) : (
                <span className="text-lg font-bold text-gray-800 dark:text-white">{name}</span>
            )}
        </motion.button>
    );
};

export default IconCard;