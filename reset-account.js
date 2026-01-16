/**
 * COMPLETE ACCOUNT RESET SCRIPT
 * 
 * This script will:
 * 1. Clear ALL localStorage data (complete wipe)
 * 2. Set up a fresh account with mobile: 9447147230, PIN: 2255
 * 3. Reload the page
 * 
 * HOW TO USE:
 * 1. Open your app in the browser
 * 2. Open DevTools (F12 or Right-click > Inspect)
 * 3. Go to the Console tab
 * 4. Copy and paste the code below
 * 5. Press Enter
 */

// Step 1: Complete wipe of all localStorage
console.log('🗑️  Clearing all localStorage data...');
localStorage.clear();

// Step 2: Set up fresh authenticated user
console.log('👤 Setting up fresh user account...');
console.log('   Mobile: 9447147230');
console.log('   PIN: 2255');

localStorage.setItem('finhub_auth', JSON.stringify({
    mobile: '9447147230',
    pin: '2255',
    isAuthenticated: true
}));

// Step 3: Set up default settings
localStorage.setItem('finhub_settings', JSON.stringify({
    currency: 'INR',
    theme: 'dark',
    name: 'User',
    photoURL: '',
    unlockedAchievements: [],
    aiProvider: 'gemini',
    aiApiKey: '',
    notificationsEnabled: true
}));

// Step 4: Reload the page
console.log('✅ Fresh account created! Reloading page...');
setTimeout(() => {
    location.reload();
}, 500);
