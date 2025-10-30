# # Changelog Generator

A GitHub Pages changelog generator that converts Markdown files into a beautiful, Windsurf-style HTML page with automatic deployment.

## Features

- ✨ **Windsurf-style Design**: Clean two-column layout with sticky sidebar
- 📦 **Semver Sorting**: Automatically sorts releases by semantic versioning
- 🚀 **Auto-deployment**: GitHub Actions deploys on every push
- 📝 **Markdown Support**: Write releases in simple Markdown with frontmatter
- 🎨 **Responsive**: Mobile-friendly design

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Export from GitHub (Optional)

If you want to import existing releases from a GitHub repository:

```bash
# Set your GitHub token (required for private repos)
export GITHUB_TOKEN=your_github_token

# Export releases (production only)
node export-github-releases.js rs-roadsoft roadsoft-be

# Or use npm script
npm run export rs-roadsoft roadsoft-be
```

This will fetch **production releases only** (tags containing `rs-prd-` or `prd`) from the GitHub repository and create markdown files in the `/releases` folder. Development (`rs-dev-`) and staging (`rs-stg-`) releases are automatically skipped.

**Getting a GitHub Token:**
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token with `repo` scope
3. Copy the token and use it in the command above

### 3. Add Release Files Manually

Create Markdown files in the `/releases` folder with frontmatter:

```markdown
---
version: 1.12.27
date: October 28, 2025
title: Falcon Alpha
---

## New Features

- Feature description here

## Bug Fixes

- Bug fix description here
```

### 4. Build Locally

```bash
npm run build
```

This generates `docs/index.html` from all releases in `/releases`.

### 5. Deploy to GitHub Pages

Push to the `main` branch and the GitHub Action will automatically:
- Build the changelog
- Deploy to GitHub Pages

## Setup GitHub Pages

1. Go to your repository **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. Push changes to trigger the workflow

Your changelog will be available at: `https://[username].github.io/[repo-name]/`

## Release File Format

Each release file should follow this structure:

```markdown
---
version: 1.2.3
date: Month DD, YYYY
title: Optional Release Title
---

## Section Title

- Bullet point
- Another point

Regular paragraph text is also supported.
```

### Frontmatter Fields

- `version` (required): Semantic version number (e.g., 1.12.27)
- `date` (optional): Release date in any format
- `title` (optional): Special release title (e.g., "Falcon Alpha")

## Project Structure

```
.
├── releases/           # Markdown release files
│   ├── 1.12.27.md
│   ├── 1.12.25.md
│   └── ...
├── build.js           # Build script
├── docs/              # Generated HTML (auto-created)
│   └── index.html
├── .github/
│   └── workflows/
│       └── deploy.yml # GitHub Actions workflow
└── package.json
```

## Customization

### Styling

Edit the `<style>` section in `build.js` to customize colors, fonts, and layout.

### Header Links

Modify the navigation links in the `generateHTML()` function in `build.js`.

## Development

```bash
# Build and open in browser (macOS)
npm run dev

# Just build
npm run build
```

## License

MIT