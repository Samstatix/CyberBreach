import { register, navigate } from './router.js';
import { menuScreen } from './screens/menu.js';
import { dashboardScreen } from './screens/dashboard.js';
import { tracksScreen } from './screens/tracks.js'; // <-- Make sure this path is exact
import { segmentsScreen } from './screens/segments.js';
import { briefingScreen } from './screens/briefing.js';
import { challengeScreen } from './screens/challenge.js';

register('menu', menuScreen);
register('dashboard', dashboardScreen);
register('tracks', tracksScreen); // <-- Make sure this is exactly the same name
register('segments', segmentsScreen);
register('briefing', briefingScreen);
register('challenge', challengeScreen);

const initialScreen = window.location.hash.replace('#', '') || 'menu';
navigate(initialScreen);