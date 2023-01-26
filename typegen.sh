#!/bin/bash
PROJECT_ID=`grep SUPABASE_URL .env | sed 's|.*https://\(.*\)\.supabase\.co.*|\1|' | tr -d '\n'`
npx supabase gen types typescript --project-id "$PROJECT_ID" --schema public > src/lib/types/supabase.ts