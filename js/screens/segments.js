// js/screens/segments.js
import { navigate } from '../router.js';

export function segmentsScreen(params) {
  const div = document.createElement('div');
  
  // A simple lookup so the title looks nice based on the ID
  const trackTitles = {
    'cyber-basics': 'Cyber Basics',
    'network': 'Network Security',
    'web': 'Web Security',
    'crypto': 'Cryptography',
    'forensics': 'Digital Forensics',
    'incident': 'Incident Response'
  };
  
  const trackName = trackTitles[params.trackId] || params.trackId;

  div.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;">
      <div>
        <p class="muted" style="margin-bottom: 4px;">TRACK</p>
        <h2 style="margin: 0;">${trackName}</h2>
      </div>
      <button id="btn-back">Back to Tracks</button>
    </div>
    
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4);">
      
      <!-- Academy -->
      <div class="segment-card" data-segment="academy">
        <h3 style="color: var(--ok);">Academy</h3>
        <p class="muted">Learn concepts through guided tutorials and immediate feedback.</p>
        <button style="margin-top: 16px; width: 100%; border-color: var(--ok); color: var(--ok);">Enter Academy</button>
      </div>

      <!-- Operations -->
      <div class="segment-card" data-segment="operations">
        <h3 style="color: var(--warn);">Operations</h3>
        <p class="muted">Apply your knowledge in randomized, scenario-based missions.</p>
        <button style="margin-top: 16px; width: 100%; border-color: var(--warn); color: var(--warn);">Enter Operations</button>
      </div>

      <!-- CTF Arena -->
      <div class="segment-card" data-segment="ctf">
        <h3 style="color: var(--xp);">CTF Arena</h3>
        <p class="muted">Prove your skills. Independent investigation and flag submission.</p>
        <button style="margin-top: 16px; width: 100%; border-color: var(--xp); color: var(--xp);">Enter CTF</button>
      </div>

    </div>
  `;

  // Back button
  div.querySelector('#btn-back').addEventListener('click', () => navigate('tracks'));

  // Handle clicking the segments
    // Handle clicking the segments
  div.querySelectorAll('.segment-card').forEach(card => {
    card.addEventListener('click', () => {
      const segmentId = card.getAttribute('data-segment');
      // Route to briefing instead of alert
      navigate('briefing', { trackId: params.trackId, segmentId: segmentId });
    });
  });

  return div;
}