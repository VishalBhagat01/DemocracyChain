-- ============================================================
-- ethereum_voting — Database Reset Script
-- WARNING: This drops ALL schemas and data from the database.
-- Run this ONCE before running db_init.sql
-- ============================================================

-- Drop all custom schemas and everything inside them
DROP SCHEMA IF EXISTS voter CASCADE;
DROP SCHEMA IF EXISTS blockchain_meta CASCADE;
DROP SCHEMA IF EXISTS integration CASCADE;
DROP SCHEMA IF EXISTS voting CASCADE;

-- Also drop any loose tables in public schema from old project
DROP TABLE IF EXISTS public.vote_sessions CASCADE;
DROP TABLE IF EXISTS public.elections CASCADE;
DROP TABLE IF EXISTS public.candidates CASCADE;
DROP TABLE IF EXISTS public.voters CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.booths CASCADE;
DROP TABLE IF EXISTS public.voter_attributes CASCADE;
DROP TABLE IF EXISTS public.engagement_events CASCADE;
DROP TABLE IF EXISTS public.voter_segments CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.audit_log CASCADE;

SELECT 'Database wiped clean.' AS status;
