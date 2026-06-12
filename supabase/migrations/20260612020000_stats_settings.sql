-- SQL Migration: Add settings JSONB column to voc_stats table for syncing preferences

ALTER TABLE public.voc_stats 
ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}'::jsonb;
