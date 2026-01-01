import { useState, useEffect } from 'react';
import { Trophy, Star, Award, Zap, Target, Crown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { FamilyMember, Habit, Completion, Badge, Family } from '../types';

interface RewardsProps {
  members: FamilyMember[];
  habits: Habit[];
  family: Family;
}

const BADGES: Badge[] = [
  {
    id: 'beginner',
    name: 'Getting Started',
    description: 'Earned your first 10 points',
    icon: 'star',
    threshold: 10,
    color: '#93c5fd',
  },
  {
    id: 'motivated',
    name: 'Motivated',
    description: 'Earned 50 points',
    icon: 'zap',
    threshold: 50,
    color: '#fbbf24',
  },
  {
    id: 'dedicated',
    name: 'Dedicated',
    description: 'Earned 100 points',
    icon: 'target',
    threshold: 100,
    color: '#34d399',
  },
  {
    id: 'champion',
    name: 'Champion',
    description: 'Earned 250 points',
    icon: 'award',
    threshold: 250,
    color: '#f97316',
  },
  {
    id: 'master',
    name: 'Habit Master',
    description: 'Earned 500 points',
    icon: 'trophy',
    threshold: 500,
    color: '#a855f7',
  },
  {
    id: 'legend',
    name: 'Legend',
    description: 'Earned 1000 points',
    icon: 'crown',
    threshold: 1000,
    color: '#ef4444',
  },
];

interface MemberBadges {
  member: FamilyMember;
  totalPoints: number;
  badges: Badge[];
}

export function Rewards({ members, habits, family }: RewardsProps) {
  const [memberBadges, setMemberBadges] = useState<MemberBadges[]>([]);

  useEffect(() => {
    calculateBadges();

    const channel = supabase
      .channel(`rewards:${family.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'completions',
          filter: `family_id=eq.${family.id}`,
        },
        () => {
          calculateBadges();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [members, habits, family.id]);

  const calculateBadges = async () => {
    const { data: completions } = await supabase.from('completions').select('*').eq('family_id', family.id);

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

    const results: MemberBadges[] = members.map((member) => {
      const totalPoints = memberPoints.get(member.id) || 0;
      const earnedBadges = BADGES.filter((badge) => totalPoints >= badge.threshold);

      return {
        member,
        totalPoints,
        badges: earnedBadges,
      };
    });

    setMemberBadges(results);
  };

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'star':
        return Star;
      case 'zap':
        return Zap;
      case 'target':
        return Target;
      case 'award':
        return Award;
      case 'trophy':
        return Trophy;
      case 'crown':
        return Crown;
      default:
        return Star;
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
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Achievements & Badges</h2>

      <div className="space-y-6">
        {memberBadges.map((memberData) => (
          <div key={memberData.member.id} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                style={{ backgroundColor: memberData.member.color }}
              >
                {memberData.member.avatar}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{memberData.member.name}</h3>
                <p className="text-sm text-gray-600">
                  {memberData.totalPoints} total points • {memberData.badges.length} / {BADGES.length} badges
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {BADGES.map((badge) => {
                const isEarned = memberData.badges.some((b) => b.id === badge.id);
                const Icon = getBadgeIcon(badge.icon);
                const progress = Math.min(
                  (memberData.totalPoints / badge.threshold) * 100,
                  100
                );

                return (
                  <div
                    key={badge.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isEarned
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Icon
                        className={`w-6 h-6 ${
                          isEarned ? 'text-green-600' : 'text-gray-400'
                        }`}
                        style={{ color: isEarned ? badge.color : undefined }}
                      />
                      {isEarned && (
                        <span className="text-xs font-medium text-green-600">✓</span>
                      )}
                    </div>
                    <h4
                      className={`font-semibold text-sm mb-1 ${
                        isEarned ? 'text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      {badge.name}
                    </h4>
                    <p className="text-xs text-gray-600 mb-2">{badge.description}</p>
                    {!isEarned && (
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
