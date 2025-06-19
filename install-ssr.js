const fs = require('fs');
const path = require('path');

// Read package.json
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Add @supabase/ssr if not present
if (!packageJson.dependencies['@supabase/ssr']) {
  packageJson.dependencies['@supabase/ssr'] = '^0.5.0';
  
  // Write back to package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('Added @supabase/ssr to package.json');
} else {
  console.log('@supabase/ssr already exists');
}