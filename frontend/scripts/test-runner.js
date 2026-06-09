const fs = require('fs');
const path = require('path');

console.log("=== ECOSPHERE FRONTEND SANITY TEST ===");

const REQUIRED_FILES = [
  'package.json',
  'tsconfig.json',
  'src/app/page.tsx',
  'src/app/globals.css',
  'src/components/Sidebar.tsx',
  'src/components/views/DashboardView.tsx',
  'src/components/views/GamesView.tsx',
  'src/components/views/ChatbotView.tsx',
  'src/components/views/TrackerView.tsx',
  'src/components/views/SimulatorView.tsx'
];

let failed = false;
for (const file of REQUIRED_FILES) {
  const fullPath = path.join(__dirname, '..', file);
  if (fs.existsSync(fullPath)) {
    console.log(`[PASS] File exists: ${file}`);
  } else {
    console.error(`[FAIL] Required file is missing: ${file}`);
    failed = true;
  }
}

if (failed) {
  console.error("Frontend sanity check failed!");
  process.exit(1);
} else {
  console.log("All required frontend assets verified. Sanity check passed!");
  process.exit(0);
}
