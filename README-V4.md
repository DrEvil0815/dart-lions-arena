# Dart Lions Arena v4.0 – Dashboard preview

Based on the uploaded v0.3 application. Existing scorer and Kids Academy files retained.

## Setup
1. Upload all files to the existing GitHub Pages repository.
2. Run SQL-AVATARS.sql in Supabase SQL Editor to enable profile photo uploads.
3. Confirm email signup remains enabled in Supabase Authentication.
4. Verify the migration 03 trigger stores first_name, last_name and display_name from signup metadata.
5. Test signup with a NEW email and confirm the email before logging in.

## Scope and known limitations
- Login and registration forms, personal dashboard and avatar upload added.
- Dashboard match metrics intentionally show dashes: existing match scorer is not yet writing cloud match statistics. We do not invent statistics.
- Registered second-player sign-in, guest match mode, bot 5-point AVG steps and automatic profile AVG handicap are planned for the next implementation phase; the original scorer/bot remain unchanged.
- The database must enforce unique names server-side; migration 03 has a partial unique index excluding placeholder 'Neuer Spieler'. Do not rely on client-side name checks.
- Signup confirmation email requires Supabase email configuration; check email delivery quotas and URL Configuration / Site URL for GitHub Pages.
- Test RLS cross-account access before using children's profiles publicly.
