import { useState, useEffect } from 'react';
import { Home, Trophy, Award, Settings as SettingsIcon } from 'lucide-react';
import { supabase } from './lib/supabase';
import { FamilyMember, Habit, Family } from './types';
import { HomePage } from './components/HomePage';
import { Leaderboard } from './components/Leaderboard';
import { Rewards } from './components/Rewards';
import { Settings } from './components/Settings';
import { FamilySelector } from './components/FamilySelector';
import { useFamily } from './context/FamilyContext';

type Tab = 'home' | 'leaderboard' | 'rewards' | 'settings';

function AppContent() {
  const { currentFamily } = useFamily();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentFamily) {
      loadData();
    }
  }, [currentFamily]);

  useEffect(() => {
    if (!currentFamily) return;

    const membersChannel = supabase
      .channel(`public:family_members:${currentFamily.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_members',
          filter: `family_id=eq.${currentFamily.id}`,
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    const habitsChannel = supabase
      .channel(`public:habits:${currentFamily.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'habits',
          filter: `family_id=eq.${currentFamily.id}`,
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(membersChannel);
      supabase.removeChannel(habitsChannel);
    };
  }, [currentFamily]);

  const loadData = async () => {
    if (!currentFamily) return;

    setLoading(true);

    try {
      const [membersResult, habitsResult] = await Promise.all([
        supabase
          .from('family_members')
          .select('*')
          .eq('family_id', currentFamily.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('habits')
          .select('*')
          .eq('family_id', currentFamily.id)
          .order('created_at', { ascending: true }),
      ]);

      if (membersResult.data) {
        setMembers(membersResult.data);
      }

      if (habitsResult.data) {
        setHabits(habitsResult.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'home' as Tab, label: 'Home', icon: Home },
    { id: 'leaderboard' as Tab, label: 'Leaderboard', icon: Trophy },
    { id: 'rewards' as Tab, label: 'Rewards', icon: Award },
    { id: 'settings' as Tab, label: 'Settings', icon: SettingsIcon },
  ];

  if (!currentFamily) {
    return <FamilySelector />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Family Habit Tracker</h1>
          <p className="text-gray-600">Track habits, earn points, and achieve goals together!</p>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="flex justify-center items-center">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Setting up your family...</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex border-b border-gray-200">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-6">
              {activeTab === 'home' && (
                <HomePage members={members} habits={habits} family={currentFamily} onDataChange={loadData} />
              )}
              {activeTab === 'leaderboard' && (
                <Leaderboard members={members} habits={habits} family={currentFamily} />
              )}
              {activeTab === 'rewards' && (
                <Rewards members={members} habits={habits} family={currentFamily} />
              )}
              {activeTab === 'settings' && (
                <Settings members={members} habits={habits} family={currentFamily} onDataChange={loadData} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const { currentFamily, setCurrentFamily } = useFamily();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initializeFamily = async () => {
      const savedFamilyCode = localStorage.getItem('familyCode');
      if (savedFamilyCode && !currentFamily) {
        try {
          const { data } = await supabase
            .from('families')
            .select('*')
            .eq('join_code', savedFamilyCode)
            .maybeSingle();
          if (isMounted && data) {
            setCurrentFamily(data);
          } else if (!data) {
            localStorage.removeItem('familyCode');
          }
        } catch (err) {
          console.error('Failed to load family:', err);
          if (isMounted) {
            localStorage.removeItem('familyCode');
          }
        }
      }
      if (isMounted) {
        setInitialized(true);
      }
    };

    initializeFamily();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!initialized) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <AppContent />;
}

export default App;
