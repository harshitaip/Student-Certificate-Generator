// Script to aggressively remove Next.js development tools
(function() {
  'use strict';
  
  function removeDevelopmentPanels() {
    // Common selectors for Next.js development panels
    const selectors = [
      // Next.js specific
      'div[data-nextjs-dev-overlay]',
      'div[data-nextjs-toast]',
      'div[class*="nextjs"]',
      'div[id*="nextjs"]',
      '.__nextjs-dev-panel',
      '.__nextjs-toolbar',
      
      // Generic development panels
      'div[style*="position: fixed"][style*="bottom"]',
      'div[style*="position: fixed"][style*="right"]',
      'div[style*="z-index: 99999"]',
      'div[style*="z-index: 9999"]',
      
      // Turbopack and development indicators
      'div[data-turbo]',
      'div[class*="turbo"]',
      'div[class*="dev-"]',
      'div[id*="dev-"]'
    ];
    
    selectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          const text = element.textContent || '';
          // Check if this looks like a development panel
          if (
            text.includes('Route') ||
            text.includes('Static') ||
            text.includes('Turbopack') ||
            text.includes('Preferences') ||
            text.includes('Fast Refresh') ||
            element.style.position === 'fixed'
          ) {
            element.remove();
            console.log('Removed development panel:', element);
          }
        });
      } catch (e) {
        // Ignore errors
      }
    });
    
    // Remove any fixed position divs in bottom-right area
    const allDivs = document.querySelectorAll('div');
    allDivs.forEach(div => {
      const style = window.getComputedStyle(div);
      if (
        style.position === 'fixed' &&
        (style.bottom === '20px' || style.right === '20px') &&
        parseInt(style.zIndex) > 1000
      ) {
        div.remove();
        console.log('Removed fixed position panel:', div);
      }
    });
  }
  
  // Run immediately
  removeDevelopmentPanels();
  
  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removeDevelopmentPanels);
  }
  
  // Run periodically to catch dynamically added panels
  setInterval(removeDevelopmentPanels, 1000);
  
  // Run on any DOM changes
  const observer = new MutationObserver(removeDevelopmentPanels);
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
})();
