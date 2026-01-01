import { useState, useEffect } from 'react';
import { Trophy, Medal, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { FamilyMember, Habit, Completion, LeaderboardEntry, Family } from '../types';

interface LeaderboardProps {
  members: FamilyMember[];
  habits: Habit[];
  family: Family;
}

export function Leaderboard({ members, habits, family }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'all'>('today');

  useEffect(() => {
    calculateLeaderboard();

    const channel = supabase
      .channel(`leaderboard:${family.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'completions',
          filter: `family_id=eq.${family.id}`,
        },
        () => {
          calculateLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [members, habits, timeframe, family.id]);

  const getDateRange = () => {
    const today = new Date();
    const startDate = new Date(today);

    switch (timeframe) {
      case 'today':
        return today.toISOString().split('T')[0];
      case 'week':
        startDate.setDate(today.getDate() - 7);
        return startDate.toISOString().split('T')[0];
      case 'month':
        startDate.setDate(today.getDate() - 30);
        return startDate.toISOString().split('T')[0];
      case 'all':
        return null;
    }
  };

  const calculateLeaderboard = async () => {
    const startDate = getDateRange();

    let query = supabase.from('completions').select('*').eq('family_id', family.id);

    if (startDate && timeframe !== 'all') {
      query = query.gte('date', startDate);
    }

    const { data: completions } = await query;

    if (!completions) return;

    const memberPoints = new Map<string, number>();

    members.forEach((member) => {
      memberPoints.set(member.id, 0);
    });

    completions.forEach((completion: Completion) => {
      const habit = habits.find((h) => h.id === completion.habit_id);
      if (habit) {
        const currentPoints = memberPoints.get(completion.member_id) || 0;
        memberPoints.set(
          completion.member_id,
          currentPoints + completion.count * habit.points
        );
      }
    });

    const entries: LeaderboardEntry[] = members
      .map((member) => ({
        member,
        totalPoints: memberPoints.get(member.id) || 0,
        rank: 0,
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);

    let currentRank = 1;
    entries.forEach((entry, index) => {
      if (index > 0 && entry.totalPoints < entries[index - 1].totalPoints) {
        currentRank = index + 1;
      }
      entry.rank = currentRank;
    });

    setLeaderboard(entries);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-600" />;
      default:
        return null;
    }
  };

  if (members.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600">No family members yet</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Leaderboard</h2>
        <div className="flex gap-2">
          {(['today', 'week', 'month', 'all'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeframe === tf
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tf.charAt(0).toUpperCase() + tf.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {leaderboard.map((entry) => (
          <div
            key={entry.member.id}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12">
                  {getRankIcon(entry.rank) || (
                    <span className="text-xl font-bold text-gray-400">
                      #{entry.rank}
                    </span>
                  )}
                </div>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                  style={{ backgroundColor: entry.member.color }}
                >
                  {entry.member.avatar}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{entry.member.name}</h3>
                  <p className="text-sm text-gray-600">
                    {entry.totalPoints} points
                  </p>
                </div>
              </div>
              {entry.rank === 1 && entry.totalPoints > 0 && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  Leader
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
