import { useState, useEffect } from 'react';
import { Plus, Minus, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { FamilyMember, Habit, Completion, Family } from '../types';

interface HomePageProps {
  members: FamilyMember[];
  habits: Habit[];
  family: Family;
  onDataChange: () => void;
}

export function HomePage({ members, habits, family, onDataChange }: HomePageProps) {
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (members.length > 0 && !selectedMember) {
      setSelectedMember(members[0]);
    }
  }, [members, selectedMember]);

  useEffect(() => {
    if (selectedMember) {
      loadCompletions();
    }
  }, [selectedMember]);

  useEffect(() => {
    if (!selectedMember) return;

    const subscription = supabase
      .from('completions')
      .on('*', (payload) => {
        if (
          payload.new.member_id === selectedMember.id &&
          payload.new.date === today &&
          payload.new.family_id === family.id
        ) {
          loadCompletions();
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedMember, family.id, today]);

  const loadCompletions = async () => {
    if (!selectedMember) return;

    const { data } = await supabase
      .from('completions')
      .select('*')
      .eq('member_id', selectedMember.id)
      .eq('date', today)
      .eq('family_id', family.id);

    if (data) {
      setCompletions(data);
    }
  };

  const getCompletionCount = (habitId: string): number => {
    const completion = completions.find((c) => c.habit_id === habitId);
    return completion?.count || 0;
  };

  const updateCompletion = async (habitId: string, delta: number) => {
    if (!selectedMember) return;

    const currentCount = getCompletionCount(habitId);
    const newCount = Math.max(0, currentCount + delta);

    const { data: existing } = await supabase
      .from('completions')
      .select('*')
      .eq('member_id', selectedMember.id)
      .eq('habit_id', habitId)
      .eq('date', today)
      .eq('family_id', family.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('completions')
        .update({ count: newCount, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase.from('completions').insert({
        member_id: selectedMember.id,
        habit_id: habitId,
        date: today,
        count: newCount,
        family_id: family.id,
      });
    }

    await loadCompletions();
    onDataChange();
  };

  if (members.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 mb-2">No family members yet</p>
        <p className="text-sm text-gray-500">Go to Settings to add family members</p>
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-2">No habits yet</p>
        <p className="text-sm text-gray-500">Go to Settings to add habits</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Select Family Member</h2>
        <div className="flex flex-wrap gap-2">
          {members.map((member) => (
            <button
              key={member.id}
              onClick={() => setSelectedMember(member)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedMember?.id === member.id
                  ? 'ring-2 ring-offset-2 shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={{
                backgroundColor:
                  selectedMember?.id === member.id ? member.color : undefined,
                color: selectedMember?.id === member.id ? 'white' : undefined,
                borderColor: member.color,
              }}
            >
              <span className="mr-2">{member.avatar}</span>
              {member.name}
            </button>
          ))}
        </div>
      </div>

      {selectedMember && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Today's Habits for {selectedMember.name}
          </h2>
          <div className="space-y-3">
            {habits.map((habit) => {
              const count = getCompletionCount(habit.id);
              const progress = (count / habit.daily_target) * 100;

              return (
                <div
                  key={habit.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{habit.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{habit.name}</h3>
                        <p className="text-sm text-gray-600">
                          {count} / {habit.daily_target} {habit.unit}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-blue-600">
                        {count * habit.points} points
                      </p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => updateCompletion(habit.id, -1)}
                      disabled={count === 0}
                      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="w-5 h-5 text-gray-700" />
                    </button>
                    <span className="text-2xl font-bold text-gray-900">{count}</span>
                    <button
                      onClick={() => updateCompletion(habit.id, 1)}
                      className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
