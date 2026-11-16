// js/app.js
import { register, navigate } from './router.js';
import { menuScreen } from './screens/menu.js';
import { dashboardScreen } from './screens/dashboard.js';

// 1. Register all screens
register('menu', menuScreen);
register('dashboard', dashboardScreen);

// 2. Handle initial load
// If the URL has #dashboard, go there. Otherwise, go to menu.
const initialScreen = window.location.hash.replace('#', '') || 'menu';
navigate(initialScreen);

console.log('[cyber-breach] router initialized');