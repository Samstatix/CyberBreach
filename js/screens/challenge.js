// js/screens/challenge.js
import { navigate } from '../router.js';
import { generatePhishingChallenge } from '../challenges/phishing.js';

export function challengeScreen(params) {
  const div = document.createElement('div');
  const { trackId, segmentId, seed } = params;

  // Generate the scenario using the seed!
  const scenario = generatePhishingChallenge(seed);
  const email = scenario.email;
  const answerKey = scenario.answerKey;
  let selected = new Set();

  div.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <h2>Mission: Phishing Hunter</h2>
      <div style="font-family: var(--font-mono); font-size: 14px; color: var(--warn);">SEED: ${seed}</div>
    </div>

    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
      
      <!-- Email Interface -->
      <div style="background: var(--bg-1); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px;">
        
        <!-- Sender (Clickable) -->
        <div class="clickable-region" data-indicator="sender" style="padding: 12px; border-radius: 4px; cursor: pointer; margin-bottom: 16px;">
          <p class="muted" style="margin-bottom: 4px; font-size: 12px;">FROM</p>
          <p><strong>${email.fromName}</strong> &lt;${email.fromEmail}&gt;</p>
        </div>

        <!-- Subject (Clickable) -->
        <div class="clickable-region" data-indicator="subject" style="padding: 12px; border-radius: 4px; cursor: pointer; margin-bottom: 16px;">
          <p class="muted" style="margin-bottom: 4px; font-size: 12px;">SUBJECT</p>
          <p style="font-weight: bold;">${email.subject}</p>
        </div>

        <!-- Body & Link -->
        <div style="padding: 12px; margin-top: 24px; border-top: 1px solid var(--border);">
          <p>${email.body}</p>
          <p style="margin-top: 16px;">
            <a href="#" class="clickable-region" data-indicator="link" style="color: var(--accent); text-decoration: underline; padding: 4px; border-radius: 4px; display: inline-block;">${email.linkText}</a>
          </p>
          <p class="muted" style="font-size: 12px; margin-top: 8px;">Destination: ${email.linkUrl}</p>
        </div>

      </div>

      <!-- Action Panel -->
      <div>
        <div style="background: var(--bg-1); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px;">
          <h3>Analysis</h3>
          <p class="muted" style="font-size: 14px; margin-bottom: 24px;">Click on the parts of the email that look suspicious. When you are done, submit your analysis.</p>
          
          <button id="btn-submit" style="width: 100%; background: var(--accent); color: var(--bg-0); font-weight: bold; border: none;">Submit Analysis</button>
        </div>
      </div>
    </div>
  `;

  // Handle clicking the email regions
  const regions = div.querySelectorAll('.clickable-region');
  regions.forEach(region => {
    region.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent link navigation
      const indicator = region.getAttribute('data-indicator');
      
      if (selected.has(indicator)) {
        selected.delete(indicator);
        region.classList.remove('selected');
      } else {
        selected.add(indicator);
        region.classList.add('selected');
      }
    });
  });

  // Handle submission
  div.querySelector('#btn-submit').addEventListener('click', () => {
    let correct = 0;
    let falsePositives = 0;
    
    selected.forEach(item => {
      if (answerKey.includes(item)) correct++;
      else falsePositives++;
    });

    const isPerfect = correct === answerKey.length && falsePositives === 0;

    if (isPerfect) {
      if (scenario.isPhish) {
        alert("SUCCESS!\nYou correctly identified all indicators of a phishing attempt.");
      } else {
        alert("SUCCESS!\nYou correctly identified this email as legitimate and flagged no false indicators.");
      }
    } else {
      alert(`MISSION FAILED\nCorrect indicators found: ${correct}/${answerKey.length}\nFalse positives: ${falsePositives}`);
    }
    
    navigate('segments', { trackId });
  });

  return div;
}