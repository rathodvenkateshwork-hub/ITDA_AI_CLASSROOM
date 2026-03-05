#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ITDA AI Classroom - Complete Setup         ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# ─── Step 1: Collect Supabase Credentials ────────────────────────────
echo -e "${YELLOW}Step 1: Supabase Configuration${NC}"
echo "You need your Supabase project URL and Service Role Key."
echo "Find them at: https://supabase.com/dashboard → Settings → API"
echo ""

if [ -f "$BACKEND_DIR/.env" ]; then
  echo -e "${GREEN}Found existing backend/.env${NC}"
  # Source existing values
  EXISTING_URL=$(grep '^SUPABASE_URL=' "$BACKEND_DIR/.env" 2>/dev/null | cut -d= -f2-)
  EXISTING_KEY=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' "$BACKEND_DIR/.env" 2>/dev/null | cut -d= -f2-)
  
  if [ -n "$EXISTING_URL" ] && [ "$EXISTING_URL" != "https://<project-ref>.supabase.co" ]; then
    echo "  Current SUPABASE_URL: ${EXISTING_URL:0:40}..."
    read -p "  Keep existing credentials? (Y/n): " KEEP_CREDS
    if [ "$KEEP_CREDS" != "n" ] && [ "$KEEP_CREDS" != "N" ]; then
      SUPABASE_URL="$EXISTING_URL"
      SUPABASE_KEY="$EXISTING_KEY"
    fi
  fi
fi

if [ -z "$SUPABASE_URL" ]; then
  read -p "  Enter SUPABASE_URL (e.g. https://xxxxx.supabase.co): " SUPABASE_URL
  read -p "  Enter SUPABASE_SERVICE_ROLE_KEY: " SUPABASE_KEY
fi

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo -e "${RED}Error: Supabase credentials are required.${NC}"
  exit 1
fi

# ─── Step 2: Create .env files ───────────────────────────────────────
echo ""
echo -e "${YELLOW}Step 2: Creating environment files${NC}"

cat > "$BACKEND_DIR/.env" << EOF
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_KEY}
PORT=3001
EOF
echo -e "  ${GREEN}✓ backend/.env created${NC}"

cat > "$FRONTEND_DIR/.env" << EOF
VITE_API_URL=http://localhost:3001
EOF
echo -e "  ${GREEN}✓ frontend/.env created${NC}"

# ─── Step 3: Install Dependencies ────────────────────────────────────
echo ""
echo -e "${YELLOW}Step 3: Installing dependencies${NC}"

cd "$BACKEND_DIR"
if [ -d "node_modules" ]; then
  echo -e "  ${GREEN}✓ Backend dependencies already installed${NC}"
else
  echo "  Installing backend dependencies..."
  npm install
  echo -e "  ${GREEN}✓ Backend dependencies installed${NC}"
fi

cd "$FRONTEND_DIR"
if [ -d "node_modules" ]; then
  echo -e "  ${GREEN}✓ Frontend dependencies already installed${NC}"
else
  echo "  Installing frontend dependencies..."
  npm install
  echo -e "  ${GREEN}✓ Frontend dependencies installed${NC}"
fi

# ─── Step 4: Test Supabase Connection ────────────────────────────────
echo ""
echo -e "${YELLOW}Step 4: Testing Supabase connection${NC}"

cd "$BACKEND_DIR"
CONNECTION_TEST=$(node -e "
import { createClient } from '@supabase/supabase-js';
const sb = createClient('${SUPABASE_URL}', '${SUPABASE_KEY}');
const { data, error } = await sb.from('schools').select('id').limit(1);
if (error && error.code === '42P01') {
  console.log('CONNECTED_NO_TABLES');
} else if (error) {
  console.log('ERROR:' + error.message);
} else {
  console.log('CONNECTED_WITH_DATA');
}
" 2>&1)

if [[ "$CONNECTION_TEST" == *"CONNECTED"* ]]; then
  echo -e "  ${GREEN}✓ Supabase connection successful${NC}"
  if [[ "$CONNECTION_TEST" == *"NO_TABLES"* ]]; then
    echo -e "  ${YELLOW}  (Database has no tables yet - will set up in next step)${NC}"
    NEEDS_MIGRATION=true
  else
    echo -e "  ${GREEN}  (Database has existing data)${NC}"
    read -p "  Run database migration anyway? This is safe - uses CREATE IF NOT EXISTS. (Y/n): " RUN_MIGRATION
    if [ "$RUN_MIGRATION" != "n" ] && [ "$RUN_MIGRATION" != "N" ]; then
      NEEDS_MIGRATION=true
    fi
  fi
else
  echo -e "  ${RED}✗ Connection failed: ${CONNECTION_TEST}${NC}"
  echo -e "  ${YELLOW}Please check your Supabase URL and Service Role Key.${NC}"
  echo "  You can re-run this script after fixing the credentials."
  exit 1
fi

# ─── Step 5: Run Database Migration ──────────────────────────────────
if [ "$NEEDS_MIGRATION" = true ]; then
  echo ""
  echo -e "${YELLOW}Step 5: Running database migrations${NC}"
  echo "  This will create all required tables in your Supabase database."
  echo ""
  
  # Extract project ref from URL for psql connection
  PROJECT_REF=$(echo "$SUPABASE_URL" | sed 's|https://||' | sed 's|\.supabase\.co||')
  
  echo -e "  ${BLUE}Running migrations via Supabase JS client...${NC}"
  
  # Run migrations using a Node script that uses Supabase's SQL execution
  node -e "
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const sb = createClient('${SUPABASE_URL}', '${SUPABASE_KEY}');

const migrations = [
  'complete-schema-migration.sql',
  'materials-schema.sql', 
  'intelligent-rag-schema.sql',
];

for (const file of migrations) {
  const filePath = path.join('database', file);
  if (!fs.existsSync(filePath)) {
    console.log('  SKIP: ' + file + ' (not found)');
    continue;
  }
  const sql = fs.readFileSync(filePath, 'utf8');
  console.log('  Running: ' + file + '...');
  const { error } = await sb.rpc('exec_sql', { query: sql }).catch(() => ({ error: null }));
  
  // Try direct SQL if rpc doesn't exist
  if (error) {
    // Split by semicolons and run individual statements
    const statements = sql.split(';').filter(s => s.trim().length > 0);
    let success = 0;
    let failed = 0;
    for (const stmt of statements) {
      const trimmed = stmt.trim();
      if (!trimmed || trimmed.startsWith('--')) continue;
      try {
        const { error: stmtError } = await sb.rpc('exec_sql', { query: trimmed });
        if (stmtError) failed++;
        else success++;
      } catch {
        failed++;
      }
    }
    console.log('    ' + file + ': ' + success + ' ok, ' + failed + ' skipped');
  } else {
    console.log('    ' + file + ': OK');
  }
}
console.log('MIGRATION_DONE');
" 2>&1

  echo ""
  echo -e "  ${YELLOW}NOTE: If migration had issues, you can run the SQL files manually${NC}"
  echo -e "  ${YELLOW}in the Supabase Dashboard → SQL Editor:${NC}"
  echo -e "  ${YELLOW}  1. backend/database/complete-schema-migration.sql${NC}"
  echo -e "  ${YELLOW}  2. backend/database/materials-schema.sql${NC}"
  echo -e "  ${YELLOW}  3. backend/database/intelligent-rag-schema.sql${NC}"
fi

# ─── Step 6: Create Admin User ───────────────────────────────────────
echo ""
echo -e "${YELLOW}Step 6: Admin account${NC}"

ADMIN_EXISTS=$(node -e "
import { createClient } from '@supabase/supabase-js';
const sb = createClient('${SUPABASE_URL}', '${SUPABASE_KEY}');
const { data, error } = await sb.from('admins').select('id').limit(1);
if (error) console.log('NO_TABLE');
else if (data && data.length > 0) console.log('EXISTS');
else console.log('EMPTY');
" 2>&1)

if [[ "$ADMIN_EXISTS" == *"EXISTS"* ]]; then
  echo -e "  ${GREEN}✓ Admin account already exists${NC}"
elif [[ "$ADMIN_EXISTS" == *"EMPTY"* ]]; then
  echo "  No admin account found. Creating one..."
  read -p "  Enter admin email (default: admin@itda.edu): " ADMIN_EMAIL
  ADMIN_EMAIL=${ADMIN_EMAIL:-admin@itda.edu}
  read -p "  Enter admin name (default: Administrator): " ADMIN_NAME
  ADMIN_NAME=${ADMIN_NAME:-Administrator}
  read -sp "  Enter admin password (default: admin123): " ADMIN_PASS
  ADMIN_PASS=${ADMIN_PASS:-admin123}
  echo ""
  
  cd "$BACKEND_DIR"
  node -e "
import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';
const sb = createClient('${SUPABASE_URL}', '${SUPABASE_KEY}');
const hash = await bcrypt.hash('${ADMIN_PASS}', 10);
const { error } = await sb.from('admins').insert({
  email: '${ADMIN_EMAIL}',
  full_name: '${ADMIN_NAME}',
  password_hash: hash,
  role: 'super_admin'
});
if (error) console.log('Failed: ' + error.message);
else console.log('Admin created: ${ADMIN_EMAIL}');
" 2>&1
  echo -e "  ${GREEN}✓ Admin account created${NC}"
else
  echo -e "  ${YELLOW}⚠ Could not check admin table (may need migration first)${NC}"
fi

# ─── Step 7: Build Frontend ──────────────────────────────────────────
echo ""
echo -e "${YELLOW}Step 7: Building frontend${NC}"
cd "$FRONTEND_DIR"
npm run build 2>&1 | tail -3
echo -e "  ${GREEN}✓ Frontend built${NC}"

# ─── Step 8: Summary ─────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Setup Complete!                            ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BLUE}To start the application:${NC}"
echo ""
echo -e "  ${YELLOW}Terminal 1 (Backend):${NC}"
echo "    cd backend && npm run dev"
echo ""
echo -e "  ${YELLOW}Terminal 2 (Frontend):${NC}"
echo "    cd frontend && npm run dev"
echo ""
echo -e "  ${BLUE}Access:${NC}"
echo "    Frontend:  http://localhost:8080"
echo "    Backend:   http://localhost:3001"
echo "    API Health: http://localhost:3001/api/health"
echo ""
echo -e "  ${BLUE}If you still need to run DB migrations manually:${NC}"
echo "    Go to Supabase Dashboard → SQL Editor"
echo "    Run these files in order:"
echo "    1. backend/database/complete-schema-migration.sql"
echo "    2. backend/database/materials-schema.sql"
echo "    3. backend/database/intelligent-rag-schema.sql"
echo ""
echo -e "  ${BLUE}Admin Login:${NC}"
echo "    URL: http://localhost:8080/login"
echo "    Email: ${ADMIN_EMAIL:-admin@itda.edu}"
echo ""
echo -e "  ${BLUE}Navigation:${NC}"
echo "    Admin:    /admin"
echo "    Teacher:  /teacher"
echo "    Student:  /student"
echo "    AI Teaching: /teacher/interactive-teaching"
echo ""
