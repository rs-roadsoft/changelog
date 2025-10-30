#!/usr/bin/env node

/**
 * Export GitHub releases to markdown files
 * 
 * Usage:
 *   node export-github-releases.js <owner> <repo> [token]
 * 
 * Example:
 *   node export-github-releases.js rs-roadsoft roadsoft-be YOUR_GITHUB_TOKEN
 * 
 * Or set GITHUB_TOKEN in .env file or environment variable:
 *   GITHUB_TOKEN=your_token node export-github-releases.js rs-roadsoft roadsoft-be
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load .env file if it exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

// Parse command line arguments
const args = process.argv.slice(2);
const owner = args[0];
const repo = args[1];
const token = args[2] || process.env.GITHUB_TOKEN;

if (!owner || !repo) {
  console.error('Usage: node export-github-releases.js <owner> <repo> [token]');
  console.error('Example: node export-github-releases.js rs-roadsoft roadsoft-be');
  console.error('\nYou can also set GITHUB_TOKEN environment variable for authentication.');
  process.exit(1);
}

// Function to make GitHub API request
function fetchReleases(page = 1) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}/releases?per_page=100&page=${page}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Node.js Release Exporter',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `token ${token}`;
    }

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`GitHub API returned ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Function to clean and format release body
function cleanReleaseBody(body) {
  if (!body || body.trim() === '') {
    return null;
  }

  let cleaned = body.trim();

  // Remove "Full Changelog" links
  cleaned = cleaned.replace(/\*\*Full Changelog\*\*:.*$/gm, '');
  
  // Process line by line to preserve structure
  const lines = cleaned.split('\n');
  const processedLines = lines.map(line => {
    let processedLine = line;
    
    // Skip RELEASE date lines (e.g., "* RELEASE: 23-02-2023" or "* STG RELEASE: 23-02-2023")
    if (/^\s*[\*\-]\s*(STG\s+)?RELEASE:\s*\d{2,4}-\d{2}-\d{2,4}/i.test(processedLine)) {
      return '';
    }
    
    // Skip "Bump" and "Build(deps): bump" lines
    if (/^\s*[\*\-]\s*(Bump|Build\(deps\):\s*bump)/i.test(processedLine)) {
      return '';
    }
    
    // Remove GitHub PR/issue links
    processedLine = processedLine.replace(/https?:\/\/github\.com\/[^\s)]+/g, '');
    
    // Remove " by @username in " patterns
    processedLine = processedLine.replace(/\s+by\s+@[\w-]+\s+in\s*/g, '');
    
    // Remove Jira keys at the start of bullet points (e.g., "* RS-2019: Fix bug")
    processedLine = processedLine.replace(/^(\s*[\*\-]\s+)[A-Z]+-\d+:?\s*/g, '$1');
    
    // Clean up multiple spaces
    processedLine = processedLine.replace(/\s{2,}/g, ' ').trim();
    
    return processedLine;
  }).filter(line => line.length > 0); // Remove empty lines
  
  cleaned = processedLines.join('\n');
  
  // Remove empty lines at the end
  cleaned = cleaned.trim();

  // If nothing left after cleaning, return null (but release will still be exported with empty body)
  if (cleaned === '' || cleaned === '## What\'s Changed') {
    return null;
  }

  return cleaned;
}

// Function to convert GitHub markdown to our format
function convertToMarkdown(release) {
  const version = release.tag_name.replace(/^v/, ''); // Remove 'v' prefix if present
  const date = new Date(release.published_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Clean the release body
  const cleanedBody = cleanReleaseBody(release.body);

  let markdown = `---
version: ${version}
date: ${date}`;

  if (release.name && release.name !== release.tag_name) {
    markdown += `\ntitle: ${release.name}`;
  }

  markdown += `\n---\n\n`;
  
  // Add body if available, otherwise just leave it empty
  if (cleanedBody) {
    markdown += cleanedBody;
  }

  return markdown;
}

// Main function
async function exportReleases() {
  console.log(`Fetching releases from ${owner}/${repo}...`);
  
  try {
    let allReleases = [];
    let page = 1;
    let hasMore = true;

    // Fetch all pages
    while (hasMore) {
      console.log(`Fetching page ${page}...`);
      const releases = await fetchReleases(page);
      
      if (releases.length === 0) {
        hasMore = false;
      } else {
        allReleases = allReleases.concat(releases);
        page++;
      }
    }

    console.log(`Found ${allReleases.length} releases`);

    // Create releases directory if it doesn't exist
    const releasesDir = path.join(__dirname, 'releases');
    if (!fs.existsSync(releasesDir)) {
      fs.mkdirSync(releasesDir);
    }

    // Export each release to a markdown file
    let exported = 0;
    let skipped = 0;
    for (const release of allReleases) {
      if (release.draft) {
        console.log(`Skipping draft release: ${release.tag_name}`);
        skipped++;
        continue;
      }

      // Filter: Only export production releases (rs-prd-* or version-only like v2.0.146)
      const tagName = release.tag_name.toLowerCase();
      const isPrdRelease = tagName.includes('rs-prd-') || tagName.includes('prd');
      const isVersionOnly = /^v?\d+\.\d+\.\d+$/.test(release.tag_name); // Matches v2.0.146 or 2.0.146
      
      if (!isPrdRelease && !isVersionOnly) {
        skipped++;
        continue;
      }

      const version = release.tag_name.replace(/^v/, '');
      const filename = `${version}.md`;
      const filepath = path.join(releasesDir, filename);

      const markdown = convertToMarkdown(release);

      fs.writeFileSync(filepath, markdown);
      
      console.log(`✓ Exported ${filename}`);
      exported++;
    }

    console.log(`\n✅ Successfully exported ${exported} production releases to ${releasesDir}`);
    console.log(`   (Skipped ${skipped} non-production releases)`);
    console.log('\nNext steps:');
    console.log('1. Review the generated markdown files in /releases');
    console.log('2. Run: npm run build');
    console.log('3. Check the generated changelog');

  } catch (error) {
    console.error('Error:', error.message);
    
    if (error.message.includes('401')) {
      console.error('\n⚠️  Authentication failed. The repository might be private.');
      console.error('Please provide a GitHub token with repo access:');
      console.error('  node export-github-releases.js rs-roadsoft roadsoft-be YOUR_TOKEN');
      console.error('\nOr set it as an environment variable:');
      console.error('  export GITHUB_TOKEN=your_token');
      console.error('  node export-github-releases.js rs-roadsoft roadsoft-be');
    } else if (error.message.includes('404')) {
      console.error('\n⚠️  Repository not found. Please check:');
      console.error('  - Repository owner and name are correct');
      console.error('  - You have access to the repository');
      console.error('  - The repository exists');
    }
    
    process.exit(1);
  }
}

// Run the export
exportReleases();
