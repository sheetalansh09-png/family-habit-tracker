import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Family, FamilyMember, Habit, Completion } from '../types';

interface CalendarProps {
  family: Family;
  members: FamilyMember[];
  habits: Habit[];
}

export function Calendar({ family, members, habits }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [habitMemberCount, setHabitMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [family.id]);

  const loadData = async () => {
    try {
      const { data: completionData } = await supabase
        .from('completions')
        .select('*')
        .eq('family_id', family.id);

      const { data: habitMemberData } = await supabase
        .from('habit_members')
        .select('id')
        .eq('family_id', family.id);

      if (completionData) {
        setCompletions(completionData);
      }

      if (habitMemberData) {
        setHabitMemberCount(habitMemberData.length);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getCompletionPercentage = (date: Date) => {
    if (habitMemberCount === 0) return 0;

    const dateStr = date.toISOString().split('T')[0];
    const dayCompletions = completions.filter((c) => c.date === dateStr);

    if (dayCompletions.length === 0) return 0;

    return (dayCompletions.length / habitMemberCount) * 100;
  };

  const getColorByPercentage = (percentage: number) => {
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage > 0) return 'bg-red-500';
    return 'bg-gray-300';
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
  }

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Habit Calendar</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h3 className="text-lg font-semibold text-gray-900 min-w-48 text-center">{monthName}</h3>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-6">
        {dayNames.map((day) => (
          <div key={day} className="text-center font-semibold text-gray-600 text-sm py-2">
            {day}
          </div>
        ))}

        {days.map((date, index) => {
          const percentage = date ? getCompletionPercentage(date) : 0;
          const bgColor = getColorByPercentage(percentage);
          const isCurrentMonth = date && date.getMonth() === currentDate.getMonth();

          return (
            <div
              key={index}
              className={`aspect-square flex items-center justify-center rounded-lg border-2 border-gray-200 ${
                isCurrentMonth ? bgColor : 'bg-gray-100'
              } transition-all hover:shadow-md cursor-pointer group relative`}
            >
              {date && (
                <>
                  <span className={`text-sm font-semibold ${isCurrentMonth ? 'text-white' : 'text-gray-400'}`}>
                    {date.getDate()}
                  </span>
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 transition-opacity">
                    {Math.round(percentage)}% complete
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span className="text-sm text-gray-700">100%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded" />
            <span className="text-sm text-gray-700">75%+</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded" />
            <span className="text-sm text-gray-700">50%+</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded" />
            <span className="text-sm text-gray-700">1%+</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-300 rounded" />
            <span className="text-sm text-gray-700">0%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
