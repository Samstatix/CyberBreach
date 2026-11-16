// js/screens/briefing.js
import { navigate } from '../router.js';

export function briefingScreen(params) {
  const div = document.createElement('div');
  
  // We pass the track and segment so we can route back properly
  const { trackId, segmentId } = params;

  div.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;">
      <div>
        <p class="muted" style="margin-bottom: 4px; font-size: 12px; font-family: var(--font-mono);">MISSION BRIEFING</p>
        <h2 style="margin: 0; color: var(--accent);">Phishing Hunter</h2>
      </div>
      <button id="btn-abort">Abort</button>
    </div>

    <div style="background: var(--bg-1); border: 1px solid var(--border); border-radius: var(--radius); padding: 32px; max-width: 800px; margin: 0 auto;">
      <h3>Scenario</h3>
      <p>A suspicious email has been flagged by the mail server. As an analyst, you must review the email and identify any indicators of a phishing attempt.</p>
      
      <h3 style="margin-top: 24px;">Objectives</h3>
      <ul style="color: var(--text-1); line-height: 1.8;">
        <li>Review the sender address and display name.</li>
        <li>Analyze the email subject and body for urgency or manipulation.</li>
        <li>Inspect the links for suspicious destinations.</li>
        <li>Identify all malicious indicators, or mark the email as safe.</li>
      </ul>

      <div style="margin-top: 32px; display: flex; gap: 16px;">
        <button id="btn-start-mission" style="background: var(--accent); color: var(--bg-0); font-weight: bold; border: none; padding: 12px 24px;">
          Initialize Mission
        </button>
      </div>
    </div>
  `;

  div.querySelector('#btn-abort').addEventListener('click', () => navigate('segments', { trackId }));
  
  div.querySelector('#btn-start-mission').addEventListener('click', () => {
    // We route to the challenge screen. We pass a random seed for now.
    // Later, this seed will come from the backend or URL.
    const seed = Math.floor(Math.random() * 1000000);
    navigate('challenge', { trackId, segmentId, seed });
  });

  return div;
}