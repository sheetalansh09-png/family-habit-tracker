import { useState } from 'react';
import { Plus, Trash2, Settings as SettingsIcon, Users, ListChecks, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { FamilyMember, Habit, Family } from '../types';
import { ConfirmDialog } from './ConfirmDialog';

interface SettingsProps {
  members: FamilyMember[];
  habits: Habit[];
  family: Family;
  onDataChange: () => void;
}

const AVATAR_OPTIONS = ['👨', '👩', '👦', '👧', '🧑', '👴', '👵', '🧒'];
const COLOR_OPTIONS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#84cc16',
  '#10b981',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
];

const ICON_OPTIONS = [
  '💪',
  '📚',
  '🏃',
  '🧘',
  '💧',
  '🥗',
  '😴',
  '🎨',
  '🎵',
  '🧹',
  '💼',
  '🎯',
];

export function Settings({ members, habits, family, onDataChange }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'habits' | 'family'>('family');
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const [memberName, setMemberName] = useState('');
  const [memberAvatar, setMemberAvatar] = useState(AVATAR_OPTIONS[0]);
  const [memberColor, setMemberColor] = useState(COLOR_OPTIONS[0]);

  const [habitName, setHabitName] = useState('');
  const [habitIcon, setHabitIcon] = useState(ICON_OPTIONS[0]);
  const [habitPoints, setHabitPoints] = useState(10);
  const [habitUnit, setHabitUnit] = useState('times');
  const [habitDailyTarget, setHabitDailyTarget] = useState(1);
  const [habitWeeklyTarget, setHabitWeeklyTarget] = useState(7);
  const [habitMonthlyTarget, setHabitMonthlyTarget] = useState(30);
  const [habitCategory, setHabitCategory] = useState('');

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'member' | 'habit';
    id: string;
    name: string;
  } | null>(null);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();

    await supabase.from('family_members').insert({
      name: memberName,
      avatar: memberAvatar,
      color: memberColor,
      family_id: family.id,
    });

    setMemberName('');
    setMemberAvatar(AVATAR_OPTIONS[0]);
    setMemberColor(COLOR_OPTIONS[0]);
    setShowMemberForm(false);
    onDataChange();
  };

  const handleDeleteMember = async (id: string) => {
    await supabase.from('family_members').delete().eq('id', id);
    setDeleteConfirm(null);
    onDataChange();
  };

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();

    await supabase.from('habits').insert({
      name: habitName,
      icon: habitIcon,
      points: habitPoints,
      unit: habitUnit,
      daily_target: habitDailyTarget,
      weekly_target: habitWeeklyTarget,
      monthly_target: habitMonthlyTarget,
      category: habitCategory || null,
      family_id: family.id,
    });

    setHabitName('');
    setHabitIcon(ICON_OPTIONS[0]);
    setHabitPoints(10);
    setHabitUnit('times');
    setHabitDailyTarget(1);
    setHabitWeeklyTarget(7);
    setHabitMonthlyTarget(30);
    setHabitCategory('');
    setShowHabitForm(false);
    onDataChange();
  };

  const handleDeleteHabit = async (id: string) => {
    await supabase.from('habits').delete().eq('id', id);
    setDeleteConfirm(null);
    onDataChange();
  };

  const openDeleteConfirm = (
    type: 'member' | 'habit',
    id: string,
    name: string
  ) => {
    setDeleteConfirm({ isOpen: true, type, id, name });
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirm(null);
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === 'member') {
      handleDeleteMember(deleteConfirm.id);
    } else {
      handleDeleteHabit(deleteConfirm.id);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <SettingsIcon className="w-6 h-6 text-gray-700" />
        <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('family')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'family'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          Family
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'members'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Users className="w-4 h-4" />
          Family Members
        </button>
        <button
          onClick={() => setActiveTab('habits')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'habits'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <ListChecks className="w-4 h-4" />
          Habits
        </button>
      </div>

      {activeTab === 'family' && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{family.name}</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <p className="text-sm text-gray-600 mb-3">Family Join Code</p>
            <div className="flex items-center gap-3">
              <p className="text-4xl font-bold text-blue-600 font-mono">
                {family.join_code}
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(family.join_code);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {copiedCode ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-3">
              Share this code with family members to let them join
            </p>
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div>
          <div className="mb-4">
            <button
              onClick={() => setShowMemberForm(!showMemberForm)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Family Member
            </button>
          </div>

          {showMemberForm && (
            <form onSubmit={handleAddMember} className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="Enter name"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Avatar
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_OPTIONS.map((avatar) => (
                    <button
                      key={avatar}
                      type="button"
                      onClick={() => setMemberAvatar(avatar)}
                      className={`text-2xl p-2 rounded-lg border-2 transition-all ${
                        memberAvatar === avatar
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setMemberColor(color)}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        memberColor === color
                          ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-900'
                          : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Member
                </button>
                <button
                  type="button"
                  onClick={() => setShowMemberForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.avatar}
                  </div>
                  <span className="font-semibold text-gray-900">{member.name}</span>
                </div>
                <button
                  onClick={() => openDeleteConfirm('member', member.id, member.name)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            {members.length === 0 && (
              <p className="text-center text-gray-500 py-8">No family members yet</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'habits' && (
        <div>
          <div className="mb-4">
            <button
              onClick={() => setShowHabitForm(!showHabitForm)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Habit
            </button>
          </div>

          {showHabitForm && (
            <form onSubmit={handleAddHabit} className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Habit Name
                </label>
                <input
                  type="text"
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="e.g., Exercise, Read, Meditate"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon
                </label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setHabitIcon(icon)}
                      className={`text-2xl p-2 rounded-lg border-2 transition-all ${
                        habitIcon === icon
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Points per completion
                  </label>
                  <input
                    type="number"
                    value={habitPoints}
                    onChange={(e) => setHabitPoints(Number(e.target.value))}
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={habitUnit}
                    onChange={(e) => setHabitUnit(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="times, minutes, pages"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Daily Target
                  </label>
                  <input
                    type="number"
                    value={habitDailyTarget}
                    onChange={(e) => setHabitDailyTarget(Number(e.target.value))}
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weekly Target
                  </label>
                  <input
                    type="number"
                    value={habitWeeklyTarget}
                    onChange={(e) => setHabitWeeklyTarget(Number(e.target.value))}
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Target
                  </label>
                  <input
                    type="number"
                    value={habitMonthlyTarget}
                    onChange={(e) => setHabitMonthlyTarget(Number(e.target.value))}
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category (Optional)
                </label>
                <input
                  type="text"
                  value={habitCategory}
                  onChange={(e) => setHabitCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="e.g., Health, Learning, Wellness"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Habit
                </button>
                <button
                  type="button"
                  onClick={() => setShowHabitForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {habits.map((habit) => (
              <div
                key={habit.id}
                className="bg-white rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{habit.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{habit.name}</h3>
                      <p className="text-sm text-gray-600">
                        {habit.points} points per {habit.unit}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => openDeleteConfirm('habit', habit.id, habit.name)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  <p>
                    Targets: {habit.daily_target} daily • {habit.weekly_target} weekly • {habit.monthly_target} monthly
                  </p>
                  {habit.category && (
                    <p className="text-blue-600 mt-1">Category: {habit.category}</p>
                  )}
                </div>
              </div>
            ))}
            {habits.length === 0 && (
              <p className="text-center text-gray-500 py-8">No habits yet</p>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm?.isOpen || false}
        title={`Delete ${deleteConfirm?.type === 'member' ? 'Family Member' : 'Habit'}?`}
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This will permanently remove all associated data including completion records. This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={closeDeleteConfirm}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
