const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Nookipedia API configuration
const NOOKIPEDIA_API_KEY = process.env.NOOKIPEDIA_API_KEY;
const NOOKIPEDIA_BASE_URL = 'https://api.nookipedia.com';

// Rate limiting
const DELAY_MS = 500; // 500ms delay between requests to avoid rate limiting

// Sleep function
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch villager details from Nookipedia
async function fetchVillagerDetails(villagerName) {
  try {
    const url = `${NOOKIPEDIA_BASE_URL}/villagers?name=${encodeURIComponent(villagerName)}`;
    
    const response = await fetch(url, {
      headers: {
        'X-API-KEY': NOOKIPEDIA_API_KEY,
        'Accept-Version': '1.0.0'
      }
    });

    if (!response.ok) {
      console.warn(`Failed to fetch ${villagerName}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    // The API returns an array, get the first match
    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching ${villagerName}:`, error.message);
    return null;
  }
}

// Calculate rarity based on number of game appearances
function calculateRarity(appearances) {
  if (!appearances || appearances.length === 0) {
    return 10; // No appearances = extremely rare (shouldn't happen)
  }

  // Count main series games (excluding spin-offs)
  const mainGames = [
    'DNM', 'AC', 'E_PLUS', 'WW', 'CF', 'NL', 'WA', 'NH', 'HHD', 'PC'
  ];
  
  const gameCount = appearances.filter(game => 
    mainGames.some(mainGame => game.toUpperCase().includes(mainGame))
  ).length;

  // Rarity scale (inverse - fewer games = more rare)
  // 1 game = 10 (extremely rare)
  // 2 games = 9 (very rare)
  // 3 games = 8 (rare)
  // 4 games = 7 (uncommon)
  // 5 games = 6 (somewhat uncommon)
  // 6 games = 5 (common)
  // 7 games = 4 (fairly common)
  // 8 games = 3 (very common)
  // 9 games = 2 (extremely common)
  // 10+ games = 1 (ubiquitous)
  
  if (gameCount >= 10) return 1;
  if (gameCount >= 9) return 2;
  if (gameCount >= 8) return 3;
  if (gameCount >= 7) return 4;
  if (gameCount >= 6) return 5;
  if (gameCount >= 5) return 6;
  if (gameCount >= 4) return 7;
  if (gameCount >= 3) return 8;
  if (gameCount >= 2) return 9;
  return 10;
}

// Main function
async function addRarityToVillagers() {
  console.log('Starting villager rarity update...\n');

  // Load villagers.json
  const villagersPath = path.join(__dirname, 'data', 'villagers.json');
  const villagersData = JSON.parse(fs.readFileSync(villagersPath, 'utf8'));

  const villagerKeys = Object.keys(villagersData);
  const totalVillagers = villagerKeys.length;
  let processed = 0;
  let updated = 0;
  let failed = 0;

  console.log(`Found ${totalVillagers} villagers to process\n`);

  for (const key of villagerKeys) {
    const villager = villagersData[key];
    const villagerName = villager.name?.['name-USen'] || villager.name;

    processed++;
    console.log(`[${processed}/${totalVillagers}] Processing: ${villagerName}`);

    // Fetch villager details from Nookipedia
    const details = await fetchVillagerDetails(villagerName);

    if (details && details.appearances) {
      const appearances = details.appearances;
      const rarity = calculateRarity(appearances);
      
      // Add rarity to villager data
      villagersData[key].rarity = rarity;
      villagersData[key].appearances = appearances;
      villagersData[key].appearance_count = appearances.length;
      
      console.log(`  ✓ Rarity: ${rarity}/10 (${appearances.length} appearances: ${appearances.join(', ')})`);
      updated++;
    } else {
      console.log(`  ✗ Failed to fetch appearance data`);
      // Set default rarity for villagers we couldn't fetch
      villagersData[key].rarity = 5; // Default to middle rarity
      failed++;
    }

    // Rate limiting delay
    await sleep(DELAY_MS);
  }

  // Save updated villagers.json
  fs.writeFileSync(villagersPath, JSON.stringify(villagersData, null, 2), 'utf8');

  console.log('\n=== Summary ===');
  console.log(`Total villagers: ${totalVillagers}`);
  console.log(`Successfully updated: ${updated}`);
  console.log(`Failed: ${failed}`);
  console.log(`\nVillagers data saved to: ${villagersPath}`);
}

// Run the script
if (!NOOKIPEDIA_API_KEY || NOOKIPEDIA_API_KEY.includes('your_actual_api_key_here')) {
  console.error('ERROR: NOOKIPEDIA_API_KEY not found in .env file');
  process.exit(1);
}

addRarityToVillagers().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
