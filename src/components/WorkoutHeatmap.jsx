import React, { useEffect, useState } from 'react';
import { ActivityCalendar } from 'react-activity-calendar';

const WorkoutHeatmap = ({ history }) => {
    // Track if dark mode is active to pass the correct colorScheme to the calendar
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

    // Listen for class changes on the HTML element (triggered by our ThemeToggle)
    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains('dark'));
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        return () => observer.disconnect();
    }, []);

    const data = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(today.getMonth() - 4);

    const workoutMap = {};
    let maxVolume = 0;

    history.forEach(session => {
        const dateStr = session.date.split('T')[0];
        workoutMap[dateStr] = (workoutMap[dateStr] || 0) + session.totalVolumeKg;

        if (workoutMap[dateStr] > maxVolume) {
            maxVolume = workoutMap[dateStr];
        }
    });

    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const volume = workoutMap[dateStr] || 0;

        let level = 0;
        if (volume > 0) {
            if (volume <= maxVolume * 0.25) level = 1;
            else if (volume <= maxVolume * 0.5) level = 2;
            else if (volume <= maxVolume * 0.75) level = 3;
            else level = 4;
        }

        data.push({ date: dateStr, count: volume, level: level });
    }

    const customTheme = {
        light: ['#f3f4f6', '#dbeafe', '#93c5fd', '#3b82f6', '#1e3a8a'],
        dark: ['#374151', '#1e3a8a', '#3b82f6', '#60a5fa', '#bfdbfe'],
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 flex flex-col items-center transition-colors">
            <h4 className="text-sm font-black text-gray-600 dark:text-gray-200 mb-4 self-start px-1 uppercase tracking-[0.15em]">
                Activity Map
            </h4>

            {/* Text color dynamically inherits from this wrapper */}
            <div className="w-full flex justify-center text-gray-800 dark:text-gray-300">
                <ActivityCalendar
                    data={data}
                    theme={customTheme}
                    colorScheme={isDark ? 'dark' : 'light'} // Tells the SVG text to switch colors
                    hideColorLegend={false}
                    blockSize={13}
                    blockMargin={4}
                    fontSize={12}
                    labels={{
                        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                        weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                        // Turning the total sum logic into a total volume feature
                        totalCount: '{{count}} kg lifted in this period',
                    }}
                />
            </div>
        </div>
    );
};

export default WorkoutHeatmap;