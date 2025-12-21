export interface Family {
  id: string;
  name: string;
  join_code: string;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  name: string;
  color: string;
  avatar: string;
  created_at: string;
}

export interface Habit {
  id: string;
  family_id: string;
  name: string;
  icon: string;
  points: number;
  unit: string;
  daily_target: number;
  weekly_target: number;
  monthly_target: number;
  category: string | null;
  created_at: string;
}

export interface Completion {
  id: string;
  family_id: string;
  member_id: string;
  habit_id: string;
  date: string;
  count: number;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardEntry {
  member: FamilyMember;
  totalPoints: number;
  rank: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  threshold: number;
  color: string;
}
