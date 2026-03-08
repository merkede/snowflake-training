# ❄️ Snowflake Academy - COF-C02 Certification Prep

A comprehensive, interactive training website for mastering Snowflake and passing the **SnowPro Core Certification (COF-C02)** exam.

![Snowflake](https://img.shields.io/badge/Snowflake-29B5E8?style=for-the-badge&logo=snowflake&logoColor=white)
![Astro](https://img.shields.io/badge/Astro-FF5D01?style=for-the-badge&logo=astro&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## ✨ Features

- **📚 Comprehensive Content** - All 6 COF-C02 exam domains covered
- **🎴 Interactive Flashcards** - Flip-card style for active learning
- **💻 Code Examples** - Syntax-highlighted SQL with copy buttons
- **📊 Progress Tracking** - LocalStorage-based progress persistence
- **🎨 Professional Design** - Snowflake-themed, modern UI
- **🔍 Search** - Fast full-text search (coming soon)
- **📱 Responsive** - Works on all devices

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ and npm
- Git

### Local Development

```bash
# Clone the repository
git clone <your-repo-url>
cd snowflake-training

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:4321
```

### Build for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## 📖 Exam Domains Covered

### Domain 1: Architecture & Features (25%)
- Snowflake Architecture Overview ✅
- Virtual Warehouses
- Databases, Schemas & Tables
- Data Storage & Clustering

### Domain 2: Account Access & Security (20%)
- User & Role Management
- Role-Based Access Control (RBAC)
- Network Policies & Security
- Authentication & SSO

### Domain 3: Performance Concepts (15%)
- Query Optimization
- Caching Mechanisms
- Clustering Keys
- Search Optimization Service

### Domain 4: Data Loading & Unloading (15%)
- Bulk Data Loading
- Snowpipe & Continuous Loading
- Stages & File Formats
- Data Unloading

### Domain 5: Data Transformations (15%)
- Snowflake SQL Essentials
- Functions & Procedures
- Streams & Tasks

### Domain 6: Data Protection & Sharing (10%)
- Time Travel & Fail-safe
- Zero-Copy Cloning
- Secure Data Sharing

## 🎯 Usage

### Adding New Modules

1. Create a new `.mdx` file in `src/pages/<domain>/`
2. Use the `CourseLayout` and import components:

```mdx
---
layout: ../../layouts/CourseLayout.astro
title: "Your Module Title"
description: "Module description"
moduleId: "unique-id"
domain: "Domain Name"
---

import Flashcard from '../../components/Flashcard.tsx';
import CodeBlock from '../../components/CodeBlock.tsx';

## Your Content Here

<Flashcard
  client:load
  category="Category"
  question="Your question?"
  answer="Your answer"
/>

<CodeBlock
  client:load
  language="sql"
  title="Example Title"
  code={`SELECT * FROM table;`}
/>
```

### Components

#### Flashcard
```tsx
<Flashcard
  client:load
  category="Category"
  question="Question text"
  answer="Answer text"
/>
```

#### CodeBlock
```tsx
<CodeBlock
  client:load
  language="sql"
  title="Optional Title"
  code={`YOUR CODE HERE`}
  showLineNumbers={true}
/>
```

#### ProgressTracker
Automatically included in `CourseLayout` - tracks completion via localStorage.

## 🌐 Deployment to Netlify

### Option 1: Deploy from GitHub

1. **Create GitHub Repository**
   ```bash
   # Create a new repo on GitHub, then:
   git remote add origin <your-github-repo-url>
   git add .
   git commit -m "Initial commit: Snowflake Academy"
   git push -u origin main
   ```

2. **Connect to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub account
   - Select your repository
   - Build settings are auto-detected from `netlify.toml`:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Click "Deploy site"

### Option 2: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize and deploy
netlify init

# Deploy
netlify deploy --prod
```

### Environment Variables

No environment variables required for basic functionality.

## 🛠️ Tech Stack

- **Framework**: [Astro](https://astro.build) - Fast, modern static site generator
- **UI Library**: [React](https://react.dev) - Interactive components
- **Styling**: [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS
- **Content**: [MDX](https://mdxjs.com) - Markdown + JSX
- **Icons**: [Lucide React](https://lucide.dev) - Beautiful icon set
- **Syntax Highlighting**: [Shiki](https://shiki.matsu.io) - VS Code themes
- **Hosting**: [Netlify](https://netlify.com) - Continuous deployment

## 📁 Project Structure

```
snowflake-training/
├── public/
│   └── images/
│       └── diagrams/          # Architecture diagrams
├── src/
│   ├── components/
│   │   ├── Flashcard.tsx      # Interactive flashcard
│   │   ├── CodeBlock.tsx      # Code with syntax highlighting
│   │   └── ProgressTracker.tsx # Progress sidebar
│   ├── layouts/
│   │   ├── Layout.astro       # Main layout
│   │   └── CourseLayout.astro # Module layout
│   ├── pages/
│   │   ├── index.astro        # Homepage
│   │   ├── modules.astro      # All modules
│   │   ├── flashcards.astro   # Flashcard practice
│   │   ├── architecture/
│   │   │   └── overview.mdx   # Sample module
│   │   └── [other-domains]/
│   └── styles/
│       └── global.css         # Snowflake theme
├── astro.config.mjs           # Astro configuration
├── netlify.toml               # Netlify deployment config
└── package.json
```

## 🎨 Customization

### Colors

The Snowflake brand colors are defined in `src/styles/global.css`:

```css
--color-snowflake-blue: #29b5e8;
--color-snowflake-dark: #164365;
--color-snowflake-navy: #0e3655;
--color-snowflake-light: #d4ebf8;
```

### Fonts

Using Inter for UI and JetBrains Mono for code. Change in `global.css`.

## 🤝 Contributing

This is an internal training resource. To add content:

1. Research official Snowflake documentation
2. Create comprehensive module content
3. Add interactive flashcards
4. Include code examples
5. Add diagrams where helpful

## 📚 Resources

- [Snowflake Documentation](https://docs.snowflake.com)
- [COF-C02 Exam Guide](https://www.snowflake.com/certifications/)
- [Snowflake Community](https://community.snowflake.com)
- [Snowflake University](https://learn.snowflake.com)

## 📱 Android Release Workflow

### Build + Sync

```bash
npm run android:sync
```

### Open Android Studio

```bash
npm run android:open
```

### Generate Release AAB

```bash
npm run android:bundle:release
```

### Versioning

`android/app/build.gradle` supports CI or local version overrides:

```bash
cd android
./gradlew bundleRelease -PAPP_VERSION_CODE=3 -PAPP_VERSION_NAME=1.0.2
```

## ✅ Google Play Pre-Submission Checklist

1. Verify `targetSdkVersion` is current policy-compliant.
2. Upload a signed `.aab` (not debug APK) to internal testing first.
3. Complete Play Console sections:
   - Data Safety
   - App Content
   - Content Rating
   - App Access (if any gated content exists)
4. Add store assets:
   - app icon
   - feature graphic
   - screenshots
   - short/full description
5. Publish and link a valid privacy policy:
   - In-app route: `/privacy`
   - Play Store listing privacy URL should match deployed page.
6. Run pre-launch report and resolve crashes/ANRs/layout issues before production rollout.
7. Use staged rollout for production release.

Detailed runbook: `docs/PLAY_STORE_LAUNCH_CHECKLIST.md`
Play Console form draft: `docs/PLAY_CONSOLE_RESPONSE_TEMPLATE.md`

## 📝 License

Internal training material. Not for redistribution.

---

Built with ❄️ for Snowflake mastery

## 🎬 New Components

### YouTubeEmbed
Embed Snowflake training videos directly in your modules:

```tsx
<YouTubeEmbed
  client:load
  videoId="VIDEO_ID"
  title="Video Title"
  description="Optional description shown above video"
/>
```

### Diagram
Add visual diagrams with placeholders for images:

```tsx
<Diagram
  client:load
  title="Diagram Title"
  description="What the diagram illustrates"
  imagePath="/images/diagrams/your-image.png"  // Optional
  altText="Descriptive alt text"
/>
```

## 🇬🇧 Language Note

This site uses **British English** spellings throughout (organise, optimise, analyse, etc.) to maintain consistency with international standards.
