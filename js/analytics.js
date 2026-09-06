// Vercel Web Analytics initialization
// This script manually injects the Vercel Analytics tracking script
(function() {
    // Initialize the analytics queue
    window.va = window.va || function () { 
        (window.vaq = window.vaq || []).push(arguments); 
    };
    
    // Create and inject the analytics script
    const script = document.createElement('script');
    script.defer = true;
    script.src = '/_vercel/insights/script.js';
    document.head.appendChild(script);
})();
