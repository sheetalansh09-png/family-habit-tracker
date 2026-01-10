/*
  # Add habit_members junction table

  1. New Tables
    - `habit_members`
      - `id` (uuid, primary key)
      - `habit_id` (uuid, foreign key to habits)
      - `member_id` (uuid, foreign key to family_members)
      - `created_at` (timestamp)

  2. Purpose
    - Links habits to specific family members
    - Allows habits to be assigned to individual people
    - Enables filtering habits by member in UI

  3. Security
    - Enable RLS on `habit_members` table
    - Add policy for authenticated users to read habit_members for their family
*/

CREATE TABLE IF NOT EXISTS habit_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(habit_id, member_id)
);

ALTER TABLE habit_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read habit_members for their family habits"
  ON habit_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM habits
      WHERE habits.id = habit_members.habit_id
      AND habits.family_id IN (
        SELECT family_id FROM family_members
        WHERE family_members.family_id IN (
          SELECT family_id FROM family_members fm
          INNER JOIN families f ON fm.family_id = f.id
          WHERE fm.id = (
            SELECT id FROM family_members
            ORDER BY created_at DESC
            LIMIT 1
          )
        )
      )
    )
  );

CREATE POLICY "Users can insert habit_members for their family"
  ON habit_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM habits
      WHERE habits.id = habit_members.habit_id
      AND habits.family_id IN (
        SELECT family_id FROM family_members
        WHERE family_id IN (
          SELECT family_id FROM family_members
          ORDER BY created_at DESC
          LIMIT 1
        )
      )
    )
  );

CREATE POLICY "Users can delete habit_members for their family"
  ON habit_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM habits
      WHERE habits.id = habit_members.habit_id
      AND habits.family_id IN (
        SELECT family_id FROM family_members
        WHERE family_id IN (
          SELECT family_id FROM family_members
          ORDER BY created_at DESC
          LIMIT 1
        )
      )
    )
  );