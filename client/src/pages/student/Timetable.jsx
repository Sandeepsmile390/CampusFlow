import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../utils/axios';
import { Calendar, Clock, MapPin, BookOpen, Loader2, User } from 'lucide-react';

export default function Timetable() {
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['studentSchedules'],
    queryFn: async () => {
      const res = await axiosInstance.get('/courses/schedules');
      return res.data.data;
    }
  });

  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#4338CA] dark:text-[#14B8A6]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-display font-extrabold tracking-tight">Class Timetable</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Review your weekly academic lecture calendar and classrooms.</p>
      </div>

      {/* Grid Layout by Day */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {days.map(day => {
          // Filter slots for this day
          const daySlots = schedules?.filter(s => s.dayOfWeek === day) || [];

          return (
            <div key={day} className="glass-card flex flex-col gap-4 p-6 hover:scale-[1.02] transition-transform duration-300">
              <h3 className="font-display font-extrabold text-sm text-[#4338CA] dark:text-[#14B8A6] uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
                {day}
              </h3>
              
              <div className="space-y-3 flex-1">
                {daySlots.length > 0 ? (
                  daySlots.map(slot => (
                    <div key={slot.id} className="p-4 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/20 dark:border-slate-800/40 rounded-2xl space-y-2.5">
                      <div>
                        <span className="text-[9px] px-2 py-0.5 bg-brand-50/10 dark:bg-[#14B8A6]/10 text-[#4338CA] dark:text-[#14B8A6] border border-[#4338CA]/20 dark:border-[#14B8A6]/20 rounded-full font-bold">
                          {slot.course?.code}
                        </span>
                        <p className="font-bold text-xs mt-1.5 text-slate-900 dark:text-white leading-snug">{slot.course?.name}</p>
                      </div>
                      <div className="space-y-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                        <p className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-[#4338CA] dark:text-[#14B8A6]" />
                          {slot.startTime} - {slot.endTime}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-[#4338CA] dark:text-[#14B8A6]" />
                          {slot.room}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-[#4338CA] dark:text-[#14B8A6]" />
                          <span className="truncate">Faculty: {slot.teacher?.name}</span>
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs italic">No Lectures Scheduled</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
