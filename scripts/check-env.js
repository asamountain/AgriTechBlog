// Pre-deploy environment variables check
// Run: npm run check:env

function checkVars(label, vars, type) {
  console.log(`\n${label}`);
  console.log('-'.repeat(label.length));

  let hasAll = true;
  for (const { key, required } of vars) {
    const val = process.env[key];
    if (val) {
      console.log(`  [OK]      ${key} = ${val.substring(0, 8)}...`);
    } else if (required) {
      console.log(`  [MISSING] ${key}`);
      hasAll = false;
    } else {
      console.log(`  [SKIP]    ${key} (optional)`);
    }
  }
  return hasAll;
}

console.log('=== Vercel Deploy Environment Check ===\n');

// Server-side vars (read at runtime by serverless functions)
const serverOk = checkVars('Server-side (API / Serverless Functions)', [
  { key: 'MONGODB_URI', required: true },
  { key: 'MONGODB_DATABASE', required: false },
  { key: 'SESSION_SECRET', required: true },
], 'server');

// Client-side vars (embedded at build time by Vite)
const clientOk = checkVars('Client-side (Firebase - embedded at build time)', [
  { key: 'VITE_FIREBASE_API_KEY', required: true },
  { key: 'VITE_FIREBASE_AUTH_DOMAIN', required: true },
  { key: 'VITE_FIREBASE_PROJECT_ID', required: true },
  { key: 'VITE_FIREBASE_APP_ID', required: true },
  { key: 'VITE_FIREBASE_STORAGE_BUCKET', required: false },
  { key: 'VITE_FIREBASE_MESSAGING_SENDER_ID', required: false },
  { key: 'VITE_FIREBASE_MEASUREMENT_ID', required: false },
], 'client');

console.log('\n=== Summary ===\n');

if (!serverOk) {
  console.log('  WARNING: Missing server-side vars.');
  console.log('  -> MONGODB_URI is required for blog posts to load.');
  console.log('  -> Add via Vercel Dashboard > Settings > Environment Variables');
}

if (!clientOk) {
  console.log('  WARNING: Missing Firebase client vars.');
  console.log('  -> Comments and auth will be DISABLED (site still works).');
  console.log('  -> VITE_* vars are embedded at BUILD TIME - redeploy after adding.');
}

if (serverOk && clientOk) {
  console.log('  All required environment variables are set.');
}

console.log('');
