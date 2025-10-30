const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// Semver comparison function
function compareSemver(a, b) {
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    if (aParts[i] > bParts[i]) return -1;
    if (aParts[i] < bParts[i]) return 1;
  }
  return 0;
}

// Parse frontmatter and content
function parseMarkdown(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { metadata: {}, content: content };
  }
  
  const frontmatter = match[1];
  const markdown = match[2];
  
  const metadata = {};
  frontmatter.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      metadata[key.trim()] = valueParts.join(':').trim();
    }
  });
  
  return { metadata, content: markdown };
}

// Read all release files
function getReleases() {
  const releasesDir = path.join(__dirname, 'releases');
  const files = fs.readdirSync(releasesDir).filter(f => f.endsWith('.md'));
  
  const releases = files.map(file => {
    const content = fs.readFileSync(path.join(releasesDir, file), 'utf-8');
    const { metadata, content: markdown } = parseMarkdown(content);
    
    return {
      version: metadata.version || file.replace('.md', ''),
      date: metadata.date || '',
      title: metadata.title || '',
      html: marked(markdown)
    };
  });
  
  // Sort by semver (newest first)
  releases.sort((a, b) => compareSemver(a.version, b.version));
  
  return releases;
}

// Generate HTML
function generateHTML(releases) {
  const releasesHTML = releases.map(release => `
    <div class="release-entry">
      <div class="release-sidebar">
        <div class="version-badge">${release.version}</div>
        <div class="release-date">${release.date}</div>
      </div>
      <div class="release-content">
        ${release.title ? `<h2 class="release-title">${release.title}</h2>` : ''}
        <div class="release-body">
          ${release.html}
        </div>
      </div>
    </div>
  `).join('\n');
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Roadsoft Changelog</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #2c3e50;
      background: #e8eaed;
      font-size: 16px;
    }
    
    .header {
      background: #e8eaed;
      border-bottom: none;
      padding: 1.5rem 2rem;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    
    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 2rem;
    }
    
    .logo {
      text-decoration: none;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
    }
    
    .logo img {
      height: 32px;
      width: auto;
    }
    
    .logo-tagline {
      font-size: 0.625rem;
      color: #5f6368;
      font-weight: 400;
      margin-left: 2px;
    }
    
    .nav {
      display: flex;
      gap: 2rem;
      margin-left: auto;
    }
    
    .nav a {
      color: #2c3e50;
      text-decoration: none;
      font-size: 0.9375rem;
      transition: color 0.2s;
      font-weight: 400;
    }
    
    .nav a:hover {
      color: #1db88e;
    }
    
    .nav .cta-button {
      background: #1db88e;
      color: white;
      padding: 0.625rem 1.5rem;
      border-radius: 4px;
      font-weight: 500;
      transition: background 0.2s;
    }
    
    .nav .cta-button:hover {
      background: #17a077;
      color: white;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 3rem 2rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    
    .main-container {
      max-width: 1240px;
      margin: 2rem auto;
      padding: 0 2rem;
    }
    
    h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 1.25rem;
      color: #2c3e50;
      letter-spacing: -0.02em;
    }
    
    .subtitle {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 3rem;
      flex-wrap: wrap;
    }
    
    .subtitle a {
      color: #1db88e;
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      transition: color 0.2s;
    }
    
    .subtitle a:hover {
      color: #17a077;
    }
    
    .divider {
      height: 1px;
      background: #e5e5e5;
      margin: 3rem 0;
    }
    
    .release-entry {
      display: grid;
      grid-template-columns: 180px 1fr;
      gap: 3rem;
      margin-bottom: 4rem;
      position: relative;
    }
    
    @media (max-width: 768px) {
      .release-entry {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
      
      .footer-grid {
        grid-template-columns: 1fr !important;
      }
    }
    
    .release-sidebar {
      position: sticky;
      top: 100px;
      height: fit-content;
    }
    
    .version-badge {
      background: #1db88e;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-size: 0.875rem;
      font-weight: 600;
      display: inline-block;
      margin-bottom: 0.5rem;
      box-shadow: 0 1px 2px rgba(29, 184, 142, 0.2);
    }
    
    .release-date {
      color: #5f6368;
      font-size: 0.8125rem;
    }
    
    .release-content {
      min-width: 0;
    }
    
    .release-title {
      font-size: 1.75rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      color: #2c3e50;
    }
    
    .release-body h2 {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 2rem 0 1rem;
      color: #2c3e50;
    }
    
    .release-body h3 {
      font-size: 1.1rem;
      font-weight: 600;
      margin: 1.5rem 0 0.75rem;
      color: #2c3e50;
    }
    
    .release-body p {
      margin-bottom: 1rem;
      color: #5f6368;
      line-height: 1.7;
    }
    
    .release-body ul {
      list-style: none;
      margin: 1rem 0;
    }
    
    .release-body li {
      padding-left: 1.5rem;
      margin-bottom: 0.5rem;
      position: relative;
      color: #5f6368;
    }
    
    .release-body li::before {
      content: "•";
      position: absolute;
      left: 0.5rem;
      color: #1db88e;
      font-weight: bold;
    }
    
    .release-body strong {
      font-weight: 600;
      color: #2c3e50;
    }
    
    .release-body a {
      color: #1db88e;
      text-decoration: none;
      transition: color 0.2s;
    }
    
    .release-body a:hover {
      color: #17a077;
      text-decoration: underline;
    }
    
    .release-body code {
      background: #f5f5f5;
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      font-size: 0.9em;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Courier New', monospace;
    }
    
    .release-body pre {
      background: #f5f5f5;
      padding: 1rem;
      border-radius: 6px;
      overflow-x: auto;
      margin: 1rem 0;
    }
    
    .release-body pre code {
      background: none;
      padding: 0;
    }
    
    /* Footer Styles */
    .footer-section {
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      padding: 4rem 0 0;
      margin: 2rem auto;
      max-width: 1240px;
    }
    
    .footer-logo {
      margin-bottom: 2rem;
    }
    
    .footer-logo img {
      height: 36px;
      width: auto;
    }
    
    .footer-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 3rem;
      margin-bottom: 3rem;
    }
    
    .footer-column h4 {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #5f6368;
      margin-bottom: 1.25rem;
    }
    
    .footer-link {
      display: block;
      color: #3c4043;
      text-decoration: none;
      margin-bottom: 0.875rem;
      font-size: 0.875rem;
      transition: color 0.2s;
      line-height: 1.5;
    }
    
    .footer-link:hover {
      color: #1db88e;
    }
    
    .footer-text {
      color: #5f6368;
      font-size: 0.875rem;
      margin-bottom: 0.625rem;
      line-height: 1.6;
    }
    
    .company-name {
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 0.75rem;
      font-size: 0.9375rem;
    }
    
    .footer-bottom {
      background: #fff;
      border-top: 1px solid #e8e8e8;
      padding: 1.75rem 0;
    }
    
    .footer-bottom-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    
    .copyright {
      color: #5f6368;
      font-size: 0.8125rem;
    }
    
    .footer-bottom-links {
      display: flex;
      gap: 2rem;
    }
    
    .footer-bottom-links a {
      color: #5f6368;
      text-decoration: none;
      font-size: 0.8125rem;
      transition: color 0.2s;
    }
    
    .footer-bottom-links a:hover {
      color: #1db88e;
    }
  </style>
</head>
<body>
  <header class="header">
    <div class="header-content">
      <a href="https://www.rs-roadsoft.com/en" class="logo">
        <img src="https://cdn.prod.website-files.com/66e9595434899670e17974c7/66e9595434899670e17977e1_logo-rs.svg" alt="Roadsoft" loading="lazy">
        <div class="logo-tagline">Since 2007</div>
      </a>
      <nav class="nav">
        <a href="https://www.rs-roadsoft.com/en/tachograph-reading">Tachograaf uitlezen</a>
        <a href="https://www.rs-roadsoft.com/en/tachograph-software">Tachograaf software</a>
        <a href="https://www.rs-roadsoft.com/en/about-us">Over ons</a>
        <a href="https://www.rs-roadsoft.com/en/articles">Artikelen</a>
        <a href="https://www.rs-roadsoft.com/en/contact">Contact</a>
        <a href="https://www.rs-roadsoft.com/en/quote-requests" class="cta-button">Prijzen</a>
      </nav>
    </div>
  </header>
  
  <div class="main-container">
    <div class="container">
      <h1>Roadsoft Changelog</h1>
    
    <div class="subtitle">
      <a href="https://www.rs-roadsoft.com/en/articles">View Documentation</a>
      <a href="https://www.rs-roadsoft.com/en/support">Support</a>
    </div>
    
    <div class="divider"></div>
    
      ${releasesHTML}
    </div>
  
    <footer class="footer-section">
      <div class="container">
      <div class="footer-logo">
        <a href="https://www.rs-roadsoft.com/en" style="display: flex; flex-direction: column; text-decoration: none; gap: 0.25rem;">
          <img src="https://cdn.prod.website-files.com/66e9595434899670e17974c7/66e9595434899670e17977e1_logo-rs.svg" alt="Roadsoft" loading="lazy">
          <span style="font-size: 0.625rem; color: #5f6368; margin-left: 2px;">Since 2007</span>
        </a>
      </div>
      
      <div class="footer-grid">
        <div class="footer-column">
          <div class="company-name">Roadsoft Nederland B.V.</div>
          <a href="https://goo.gl/maps/jep7dbdtm71jjUiK9" target="_blank" class="footer-link">
            Sint Pieterspoortsteeg 21<br/>
            1012 HM Amsterdam
          </a>
          <div style="margin-top: 1.5rem;">
            <h4>Contact</h4>
            <div class="footer-text">Available on weekdays from 8:30 AM to 5:00 PM</div>
            <a href="mailto:support@rs-roadsoft.com" class="footer-link">support@rs-roadsoft.com</a>
            <a href="tel:+31207163899" class="footer-link">+31 (0) 20 716 3899</a>
          </div>
        </div>
        
        <div class="footer-column">
          <h4>Business Information</h4>
          <a href="https://www.rs-roadsoft.com/en/about-us" class="footer-link">About us</a>
          <a href="https://www.rs-roadsoft.com/en/contact" class="footer-link">Contact</a>
          <a href="https://www.rs-roadsoft.com/en/quote-requests" class="footer-link">Request a quote</a>
          <a href="https://www.rs-roadsoft.com/en/trial-account" class="footer-link">Request a trial account</a>
          <a href="https://www.rs-roadsoft.com/en/personal-advice" class="footer-link">Personal advice</a>
        </div>
        
        <div class="footer-column">
          <h4>Products</h4>
          <a href="https://www.rs-roadsoft.com/en/tachograph-reading/digifob-pro" class="footer-link">Manual Reading</a>
          <a href="https://www.rs-roadsoft.com/en/tachograph-reading/digidl" class="footer-link">Automatic reading</a>
          <a href="https://www.rs-roadsoft.com/en/tachograph-software" class="footer-link">Tachograph software</a>
        </div>
        
        <div class="footer-column">
          <h4>Knowledge Base</h4>
          <a href="https://www.rs-roadsoft.com/en/articles" class="footer-link">Articles</a>
        </div>
        </div>
      </div>
      
      <div class="footer-bottom">
      <div class="footer-bottom-content">
        <div class="copyright">© ${new Date().getFullYear()} Roadsoft Nederland - All rights reserved</div>
        <div class="footer-bottom-links">
          <a href="https://cdn.prod.website-files.com/66e9595434899670e17974c7/66e9595434899670e1797803_Algemene%20voorwaarden%20Roadsoft.pdf" target="_blank">Terms & Conditions</a>
          <a href="https://cdn.prod.website-files.com/66e9595434899670e17974c7/66e9595434899670e179782a_Privacybeleid%20Roadsoft.pdf" target="_blank">Privacy Policy</a>
        </div>
        </div>
      </div>
    </footer>
  </div>
</body>
</html>`;
  
  return html;
}

// Main build function
function build() {
  console.log('Building changelog...');
  
  const releases = getReleases();
  console.log(`Found ${releases.length} releases`);
  
  const html = generateHTML(releases);
  
  const outputDir = path.join(__dirname, 'docs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  
  fs.writeFileSync(path.join(outputDir, 'index.html'), html);
  console.log('✓ Generated docs/index.html');
}

// Run build
build();
