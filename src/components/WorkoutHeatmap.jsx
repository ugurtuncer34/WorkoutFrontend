import React from 'react';
import { ActivityCalendar } from 'react-activity-calendar';

const WorkoutHeatmap = ({ history }) => {
    const data = [];

    // Show only the last 4 months to fit perfectly on mobile screens without scrolling
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

    // Define themes for both light and dark mode automatically handled by ActivityCalendar
    const customTheme = {
        light: ['#f3f4f6', '#dbeafe', '#93c5fd', '#3b82f6', '#1e3a8a'],
        dark: ['#374151', '#1e3a8a', '#3b82f6', '#60a5fa', '#bfdbfe'],
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 flex flex-col items-center transition-colors">
            <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4 self-start px-1">Activity Map</h4>

            {/* Removed scrollbar wrapper. It now fits nicely in the center */}
            <div className="w-full flex justify-center">
                <ActivityCalendar
                    data={data}
                    theme={customTheme}
                    hideColorLegend={true}
                    hideTotalCount={true}
                    blockSize={13}
                    blockMargin={4}
                    fontSize={12}
                    labels={{
                        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                        weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                    }}
                />
            </div>
        </div>
    );
};

export default WorkoutHeatmap;