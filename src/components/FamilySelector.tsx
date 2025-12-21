import { useState } from 'react';
import { Plus, LogIn, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Family } from '../types';
import { useFamily } from '../context/FamilyContext';

function generateJoinCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function FamilySelector() {
  const { setCurrentFamily } = useFamily();
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [familyName, setFamilyName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdFamily, setCreatedFamily] = useState<Family | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const code = generateJoinCode();

      const { data, error: createError } = await supabase
        .from('families')
        .insert({ name: familyName, join_code: code })
        .select()
        .single();

      if (createError) throw createError;

      localStorage.setItem('familyCode', data.join_code);
      setCurrentFamily(data);
      setCreatedFamily(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create family');
      setLoading(false);
    }
  };

  const handleJoinFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const code = joinCode.toUpperCase().trim();

      const { data, error: joinError } = await supabase
        .from('families')
        .select('*')
        .eq('join_code', code)
        .single();

      if (joinError || !data) {
        setError('Invalid join code. Please check and try again.');
        setLoading(false);
        return;
      }

      localStorage.setItem('familyCode', data.join_code);
      setCurrentFamily(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join family');
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (createdFamily) {
      navigator.clipboard.writeText(createdFamily.join_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  if (createdFamily) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Family Created!</h2>
            <p className="text-gray-600">Share this code with family members</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 text-center mb-2">Join Code</p>
            <p className="text-4xl font-bold text-blue-600 text-center font-mono mb-3">
              {createdFamily.join_code}
            </p>
            <button
              onClick={copyToClipboard}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {copiedCode ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Code
                </>
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">Family: {createdFamily.name}</p>
            <p className="text-xs text-gray-500">Redirecting to tracker...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Family Habit Tracker
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Track habits together in real-time
        </p>

        {mode === 'select' && (
          <div className="space-y-3">
            <button
              onClick={() => setMode('create')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Create New Family
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              <LogIn className="w-5 h-5" />
              Join Family
            </button>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreateFamily} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Family Name
              </label>
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                required
                placeholder="e.g., Smith Family"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('select')}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoinFamily} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Join Code
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                required
                placeholder="e.g., ABC123"
                maxLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono text-lg text-center"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('select')}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Joining...' : 'Join'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
