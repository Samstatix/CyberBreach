// js/screens/dashboard.js
import { navigate } from '../router.js';

export function dashboardScreen() {
  const div = document.createElement('div');
  
  div.innerHTML = `
    <h2>Player Dashboard</h2>
    <p class="muted">Level 1 Trainee — 0 XP</p>
    <div style="background: var(--bg-1); padding: 20px; border-radius: 8px; margin-top: 20px; border: 1px solid var(--border);">
      <h3>Welcome back, Analyst.</h3>
      <p>You have 3 active missions.</p>    
    
      <p>Your first assignment is waiting: <strong>Phishing Hunter</strong>.</p>

      <button id="btn-enter-tracks" style="margin-right: 12px;">Enter Cyber Range</button>
      <button id="btn-return">Return to Main Menu</button>
    </div>
  `;

  div.querySelector('#btn-return').addEventListener('click', () => {
    navigate('menu');
  });
    div.querySelector('#btn-enter-tracks').addEventListener('click', () => {
    navigate('tracks');
  });

  return div;
}