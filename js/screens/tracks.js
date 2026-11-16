// js/screens/tracks.js
import { navigate } from '../router.js';

export function tracksScreen() {
  const div = document.createElement('div');
  
  const tracks = [
    { id: 'cyber-basics', title: 'Cyber Basics', desc: 'Foundational threats and security practices.' },
    { id: 'network', title: 'Network Security', desc: 'Packets, protocols, and traffic analysis.' },
    { id: 'web', title: 'Web Security', desc: 'Web vulnerabilities and secure coding.' },
    { id: 'crypto', title: 'Cryptography', desc: 'Ciphers, hashing, and encryption.' },
    { id: 'forensics', title: 'Digital Forensics', desc: 'Evidence gathering and timeline reconstruction.' },
    { id: 'incident', title: 'Incident Response', desc: 'SOC operations and threat mitigation.' }
  ];

  const cardsHTML = tracks.map(track => `
    <div class="track-card" data-id="${track.id}">
      <h3 style="color: var(--accent); margin-bottom: 8px;">${track.title}</h3>
      <p class="muted" style="font-size: 14px; margin-bottom: 24px; min-height: 40px;">${track.desc}</p>
      <div style="display: flex; justify-content: space-between; font-size: 12px; font-family: var(--font-mono); border-top: 1px solid var(--border); padding-top: 12px;">
        <span>Progress: 0%</span>
        <span>0/4 Missions</span>
      </div>
    </div>
  `).join('');

  div.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <h2>Select Track</h2>
      <button id="btn-back">Back to Dashboard</button>
    </div>
    
    <div class="track-grid">
      ${cardsHTML}
    </div>
  `;

  div.querySelector('#btn-back').addEventListener('click', () => navigate('dashboard'));

  // Handle clicking a track card
  div.querySelectorAll('.track-card').forEach(card => {
    card.addEventListener('click', () => {
      const trackId = card.getAttribute('data-id');
      navigate('segments', { trackId: trackId }); // <-- This now points to the new screen
    });
  });

  return div;
}