// js/screens/menu.js
import { navigate } from '../router.js';

export function menuScreen() {
  // Create the container
  const div = document.createElement('div');
  div.style.textAlign = 'center';
  div.style.marginTop = '100px';

  // Add content
  div.innerHTML = `
    <h1 style="font-size: 64px; margin-bottom: 8px;">CYBER BREACH</h1>
    <p class="muted" style="font-size: 20px; margin-bottom: 48px;">SECURE OPERATIONS CENTER</p>
    <div style="display: flex; flex-direction: column; gap: 16px; width: 300px; margin: 0 auto;">
      <button id="btn-start">START MISSION</button>
      <button class="muted">SETTINGS (LOCKED)</button>
    </div>
  `;

  // Add event listeners
  div.querySelector('#btn-start').addEventListener('click', () => {
    navigate('dashboard');
  });

  return div;
}