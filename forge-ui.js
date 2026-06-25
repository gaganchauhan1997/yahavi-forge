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
            '<a href="https://www.instagram.com/forge.hackknow" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg></a>',
            '<a href="https://www.facebook.com/share/14cL5EheR2u/" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg></a>',
          '</div>',
          '<div class="footer-founders">',
            '<span class="ff-label">Founders</span>',
            '<a href="https://www.linkedin.com/in/gagan-yahavi-hackknow" target="_blank" rel="noopener noreferrer">Gagan Chauhan · CEO ↗</a>',
            '<a href="https://www.linkedin.com/in/manish-k-singh-007b6540a" target="_blank" rel="noopener noreferrer">Manish K. Singh · Co-Founder ↗</a>',
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
