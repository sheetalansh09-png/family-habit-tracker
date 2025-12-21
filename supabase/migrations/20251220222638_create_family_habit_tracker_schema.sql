/*
  # Family Habit Tracker Database Schema

  ## Overview
  Creates the complete database structure for a family habit tracking application
  with members, habits, and completion records.

  ## New Tables
  
  ### `family_members`
  Stores information about each family member who can track habits.
  - `id` (uuid, primary key) - Unique identifier for each member
  - `name` (text, required) - Member's display name
  - `color` (text, required) - Visual identifier color (hex code)
  - `avatar` (text, required) - Avatar emoji or icon identifier
  - `created_at` (timestamptz) - Timestamp of creation
  
  ### `habits`
  Stores habit definitions that family members can complete.
  - `id` (uuid, primary key) - Unique identifier for each habit
  - `name` (text, required) - Habit display name
  - `icon` (text, required) - Icon identifier for visual display
  - `points` (integer, required) - Points earned per completion
  - `unit` (text, required) - Unit of measurement (e.g., "times", "minutes")
  - `daily_target` (integer, required) - Target completions per day
  - `weekly_target` (integer, required) - Target completions per week
  - `monthly_target` (integer, required) - Target completions per month
  - `category` (text, optional) - Optional category/label for organization
  - `created_at` (timestamptz) - Timestamp of creation
  
  ### `completions`
  Tracks habit completions for each member on each date.
  - `id` (uuid, primary key) - Unique identifier for each completion record
  - `member_id` (uuid, foreign key) - References family_members.id
  - `habit_id` (uuid, foreign key) - References habits.id
  - `date` (date, required) - Date of completion
  - `count` (integer, required) - Number of completions (default 0)
  - `created_at` (timestamptz) - Timestamp of creation
  - `updated_at` (timestamptz) - Timestamp of last update
  - Unique constraint on (member_id, habit_id, date)

  ## Security
  
  ### RLS Policies
  All tables have Row Level Security enabled with policies for public access.
  This is a single-household app, so all authenticated and anonymous users
  can read and modify all records.
  
  ## Important Notes
  
  1. **Cascading Deletes**: When a member or habit is deleted, all related
     completion records are automatically removed via CASCADE constraints.
  
  2. **Data Integrity**: The unique constraint on completions ensures only
     one record exists per member/habit/date combination.
  
  3. **Public Access**: RLS policies allow full access since this is designed
     for a single family household. For multi-tenant deployments, policies
     would need to be updated.
*/

-- Create family_members table
CREATE TABLE IF NOT EXISTS family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL,
  avatar text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create habits table
CREATE TABLE IF NOT EXISTS habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text NOT NULL,
  points integer NOT NULL DEFAULT 10,
  unit text NOT NULL DEFAULT 'times',
  daily_target integer NOT NULL DEFAULT 1,
  weekly_target integer NOT NULL DEFAULT 7,
  monthly_target integer NOT NULL DEFAULT 30,
  category text,
  created_at timestamptz DEFAULT now()
);

-- Create completions table
CREATE TABLE IF NOT EXISTS completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date date NOT NULL,
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(member_id, habit_id, date)
);

-- Enable RLS on all tables
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;

-- Create policies for family_members (public access for single household)
CREATE POLICY "Allow all access to family_members"
  ON family_members
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create policies for habits (public access for single household)
CREATE POLICY "Allow all access to habits"
  ON habits
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create policies for completions (public access for single household)
CREATE POLICY "Allow all access to completions"
  ON completions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index for faster completion queries
CREATE INDEX IF NOT EXISTS idx_completions_member_date 
  ON completions(member_id, date);

CREATE INDEX IF NOT EXISTS idx_completions_habit_date 
  ON completions(habit_id, date);

CREATE INDEX IF NOT EXISTS idx_completions_date 
  ON completions(date);