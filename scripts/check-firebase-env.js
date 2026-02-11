// Pre-deploy check for Firebase environment variables
const required = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID'
];

const optional = [
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_MEASUREMENT_ID'
];

console.log('Firebase Environment Variables Check');
console.log('====================================');

let hasAll = true;
for (const key of required) {
  const val = process.env[key];
  if (val) {
    console.log(`  [OK] ${key} = ${val.substring(0, 8)}...`);
  } else {
    console.log(`  [MISSING] ${key}`);
    hasAll = false;
  }
}

for (const key of optional) {
  const val = process.env[key];
  if (val) {
    console.log(`  [OK] ${key} = ${val.substring(0, 8)}...`);
  } else {
    console.log(`  [SKIP] ${key} (optional)`);
  }
}

if (!hasAll) {
  console.log('\n  WARNING: Firebase features (auth, comments) will be DISABLED in this build.');
  console.log('  To enable, set the missing variables on Vercel:');
  console.log('    vercel env add VITE_FIREBASE_API_KEY');
  console.log('    (or set them in the Vercel Dashboard > Settings > Environment Variables)');
}

console.log('\n  NOTE: Vite embeds VITE_* vars at BUILD TIME.');
console.log('  After adding vars on Vercel, you must REDEPLOY for them to take effect.\n');
