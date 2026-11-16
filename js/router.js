// js/router.js
const routes = {};
let currentScreenCleanup = null;

// Register a screen function
export function register(name, renderFn) {
  routes[name] = renderFn;
}

// Navigate to a screen
export function navigate(name, params = {}) {
  const app = document.getElementById('app');
  
  // If the previous screen had a cleanup function, run it (good for timers)
  if (currentScreenCleanup && typeof currentScreenCleanup === 'function') {
    currentScreenCleanup();
  }

  const screen = routes[name];
  if (!screen) {
    app.innerHTML = `<h1>404</h1><p>Screen "${name}" not found.</p>`;
    return;
  }

  // Clear the app div and render the new screen
  app.innerHTML = '';
  const result = screen(params);
  
  // If the screen returns an element, append it. 
  // If it returns a cleanup function, save it for later.
  if (result instanceof HTMLElement) {
    app.appendChild(result);
  } else if (typeof result === 'function') {
    currentScreenCleanup = result;
  }

  // Update the URL hash so refresh works (e.g., #menu)
  window.location.hash = name;
}