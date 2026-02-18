/*
  # Create Onboarding and Trader Profile Schema

  1. New Tables
    - `trader_profiles`
      - Stores trader's experience level, goals, and trading style
    - `onboarding_responses`
      - Stores all 15 onboarding question responses
    - `trader_settings`
      - Stores personalized settings derived from onboarding

  2. Security
    - Enable RLS on all tables
    - Policies ensure users can only access their own data

  3. Indexes
    - Created on frequently queried columns for performance
*/

-- Create trader_profiles table
CREATE TABLE IF NOT EXISTS trader_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  experience_level text NOT NULL CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'professional')),
  primary_goal text NOT NULL CHECK (primary_goal IN ('capital_protection', 'consistent_income', 'aggressive_growth', 'prop_firm_challenge')),
  trading_style text NOT NULL CHECK (trading_style IN ('scalper', 'day_trader', 'swing_trader', 'position_trader')),
  preferred_sessions text NOT NULL,
  risk_tolerance text NOT NULL CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive', 'very_aggressive')),
  trade_duration text NOT NULL CHECK (trade_duration IN ('minutes', 'hours', 'days', 'weeks')),
  account_size_range text NOT NULL CHECK (account_size_range IN ('under_1k', '1k_5k', '5k_25k', '25k_100k', '100k_plus')),
  risk_per_trade numeric NOT NULL DEFAULT 1,
  trading_instruments text NOT NULL,
  main_challenge text NOT NULL,
  preferred_features text,
  prop_firm_participation text NOT NULL CHECK (prop_firm_participation IN ('yes_specific', 'planning', 'not_interested')),
  current_platform text NOT NULL CHECK (current_platform IN ('mt4', 'mt5', 'both', 'planning')),
  daily_availability text NOT NULL CHECK (daily_availability IN ('full_time', 'part_time_morning', 'part_time_evening', 'weekend_only')),
  automation_preference text NOT NULL CHECK (automation_preference IN ('manual', 'semi_automated', 'highly_automated')),
  onboarding_completed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create onboarding_responses table for detailed tracking
CREATE TABLE IF NOT EXISTS onboarding_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES trader_profiles(user_id) ON DELETE CASCADE,
  question_1_experience text,
  question_2_goal text,
  question_3_style text,
  question_4_sessions text,
  question_5_risk text,
  question_6_duration text,
  question_7_account_size text,
  question_8_risk_per_trade numeric,
  question_9_instruments text,
  question_10_challenge text,
  question_11_features text,
  question_12_prop_firm text,
  question_13_platform text,
  question_14_availability text,
  question_15_automation text,
  completed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create trader_settings table for personalized configurations
CREATE TABLE IF NOT EXISTS trader_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES trader_profiles(user_id) ON DELETE CASCADE,
  recommended_risk_per_trade numeric NOT NULL DEFAULT 1,
  recommended_position_size numeric NOT NULL DEFAULT 1,
  auto_breakeven_enabled boolean NOT NULL DEFAULT false,
  partial_tp_enabled boolean NOT NULL DEFAULT false,
  news_protection_enabled boolean NOT NULL DEFAULT false,
  ai_aggressiveness text NOT NULL DEFAULT 'moderate' CHECK (ai_aggressiveness IN ('conservative', 'moderate', 'aggressive')),
  trailing_stop_enabled boolean NOT NULL DEFAULT false,
  prop_firm_mode_enabled boolean NOT NULL DEFAULT false,
  default_take_profit_level numeric,
  default_stop_loss_level numeric,
  preferred_indicators text,
  theme_preference text DEFAULT 'dark' CHECK (theme_preference IN ('light', 'dark', 'system')),
  notification_preferences text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE trader_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE trader_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for trader_profiles
CREATE POLICY "Users can view own trader profile"
  ON trader_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own trader profile"
  ON trader_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own trader profile"
  ON trader_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create RLS policies for onboarding_responses
CREATE POLICY "Users can view own onboarding responses"
  ON onboarding_responses FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own onboarding responses"
  ON onboarding_responses FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own onboarding responses"
  ON onboarding_responses FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create RLS policies for trader_settings
CREATE POLICY "Users can view own trader settings"
  ON trader_settings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own trader settings"
  ON trader_settings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own trader settings"
  ON trader_settings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trader_profiles_user_id ON trader_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_trader_profiles_experience ON trader_profiles(experience_level);
CREATE INDEX IF NOT EXISTS idx_trader_profiles_created ON trader_profiles(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_onboarding_responses_user_id ON onboarding_responses(user_id);

CREATE INDEX IF NOT EXISTS idx_trader_settings_user_id ON trader_settings(user_id);