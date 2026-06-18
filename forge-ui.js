/* ============================================
   YAHAVI FORGE — UI LAYER
   (1) Inject shared ecosystem footer into #site-footer
   (2) Mobile sidebar drawer toggle
   By Hackknow · Operator: Myth
   ============================================ */
(function () {
  'use strict';

  /* ---------- Shared footer (mirrors www.hackknow.com, Forge-styled) ---------- */
  var FOOTER_HTML = [
    '<footer class="site-footer">',
      '<div class="footer-news"><div class="footer-news-inner">',
        '<div><h3>Get Free Resources Weekly</h3><p>Join 10,000+ creators getting free templates, tips &amp; exclusive deals.</p></div>',
        '<form id="hk-news-form"><input type="email" autocomplete="email" placeholder="Enter your email" aria-label="Email address" required><button type="submit">Subscribe</button></form>',
      '</div></div>',

      '<div class="footer-cols footer-wrap">',
        '<div class="footer-brandcol">',
          '<a class="footer-logo" href="index.html">HACK<span class="accent">KNOW</span></a>',
          '<div class="footer-sub">▸ Yahavi Forge · AI Career OS</div>',
          '<p class="blurb">Premium digital products & free AI tools. Made in India. Built for the World. Free intelligence, infinite capability.</p>',
          '<div class="footer-social">',
            '<a href="https://twitter.com/hackknow" target="_blank" rel="noopener noreferrer" aria-label="Twitter"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg></a>',
            '<a href="https://instagram.com/hackknow" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg></a>',
            '<a href="https://youtube.com/hackknow" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"></path><path d="m10 15 5-3-5-3z"></path></svg></a>',
            '<a href="https://linkedin.com/company/hackknow" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle></svg></a>',
          '</div>',
        '</div>',

        '<div class="footer-col"><h4>Shop</h4><ul>',
          '<li><a href="https://hackknow.com" target="_blank" rel="noopener noreferrer">All Products</a></li>',
          '<li><a href="https://hackknow.com" target="_blank" rel="noopener noreferrer">Best Sellers</a></li>',
          '<li><a href="https://hackknow.com" target="_blank" rel="noopener noreferrer">New Arrivals</a></li>',
          '<li><a href="https://hackknow.com" target="_blank" rel="noopener noreferrer">Free Resources</a></li>',
        '</ul></div>',

        '<div class="footer-col"><h4>Categories</h4><ul>',
          '<li><a href="https://hackknow.com" target="_blank" rel="noopener noreferrer">Themes &amp; Templates</a></li>',
          '<li><a href="https://hackknow.com" target="_blank" rel="noopener noreferrer">Excel &amp; Sheets</a></li>',
          '<li><a href="https://hackknow.com" target="_blank" rel="noopener noreferrer">PowerPoint Decks</a></li>',
          '<li><a href="https://hackknow.com" target="_blank" rel="noopener noreferrer">Dashboards</a></li>',
        '</ul></div>',

        '<div class="footer-col"><h4>Support</h4><ul>',
          '<li><a href="https://hackknow.com" target="_blank" rel="noopener noreferrer">Help Center</a></li>',
          '<li><a href="https://hackknow.com" target="_blank" rel="noopener noreferrer">FAQ</a></li>',
          '<li><a href="mailto:team@hackknow.com">Contact Us</a></li>',
        '</ul></div>',

        '<div class="footer-col"><h4>Company</h4><ul>',
          '<li><a href="https://hackknow.com" target="_blank" rel="noopener noreferrer">About Us</a></li>',
          '<li><a href="https://gaganchauhan1997.github.io/hackknow-os/" target="_blank" rel="noopener noreferrer">HackKnow//OS</a></li>',
          '<li><a href="https://hackknow.com" target="_blank" rel="noopener noreferrer">Tech Blogs &amp; News</a></li>',
          '<li><a href="https://hackknow.com" target="_blank" rel="noopener noreferrer">Affiliate Program</a></li>',
        '</ul></div>',
      '</div>',

      '<div class="footer-badges footer-wrap">',
        '<div class="footer-badge"><strong>100% Free</strong><span>No subscription, ever</span></div>',
        '<div class="footer-badge"><strong>Privacy-First</strong><span>Keys stay in your browser</span></div>',
        '<div class="footer-badge"><strong>Free-tier AI</strong><span>Groq · Gemini · +4 providers</span></div>',
        '<div class="footer-badge"><strong>10,000+ Customers</strong><span>Trusted in India + 60 countries</span></div>',
        '<div class="footer-badge"><strong>Made in India</strong><span>Built for the World</span></div>',
      '</div>',

      '<div class="footer-contact footer-wrap">',
        '<a href="mailto:team@hackknow.com">✉ team@hackknow.com</a><span class="sep">|</span>',
        '<a href="tel:+918796018700">📞 +91 87960 18700</a><span class="sep">|</span>',
        '<span>📍 Delhi, India</span>',
      '</div>',

      '<div class="footer-bottom footer-wrap">',
        '<p class="footer-copy">© 2026 HackKnow · Yahavi Forge. All rights reserved. Made in Delhi, India.</p>',
        '<nav class="footer-legal" aria-label="Legal">',
          '<a href="terms.html">Terms</a>',
          '<a href="privacy.html">Privacy</a>',
          '<a href="cookies.html">Cookies</a>',
          '<a href="refund.html">Refunds</a>',
          '<a href="dmca.html">DMCA</a>',
          '<a href="dpa.html">DPA</a>',
        '</nav>',
      '</div>',
    '</footer>'
  ].join('');

  function mountFooter() {
    var slot = document.getElementById('site-footer');
    if (!slot) return;
    slot.innerHTML = FOOTER_HTML;
    var form = document.getElementById('hk-news-form');
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      // The live newsletter lives on the main marketplace.
      window.open('https://hackknow.com', '_blank', 'noopener');
    });
  }

  /* ---------- Mobile sidebar drawer ---------- */
  function mountSidebar() {
    var burger = document.getElementById('nav-burger');
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebar-overlay');
    if (!sidebar) return;
    function open() { sidebar.classList.add('open'); if (overlay) overlay.classList.add('open'); }
    function close() { sidebar.classList.remove('open'); if (overlay) overlay.classList.remove('open'); }
    if (burger) burger.addEventListener('click', open);
    if (overlay) overlay.addEventListener('click', close);
    // Close the drawer after choosing a module (mobile). app.js handles the actual page switch.
    sidebar.querySelectorAll('.nav-tab').forEach(function (t) { t.addEventListener('click', close); });
  }

  function init() { mountFooter(); mountSidebar(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
