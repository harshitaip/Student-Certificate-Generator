# GitHub Upload Guide for Student Certificate Generator

## Step-by-Step Instructions to Upload Your Project to GitHub

### Method 1: Using GitHub Web Interface (Easiest)

#### Step 1: Create a New Repository
1. Go to [GitHub.com](https://github.com) and sign in
2. Click the **"+"** icon in the top-right corner
3. Select **"New repository"**
4. Fill in the repository details:
   - **Repository name**: `student-certificate-generator`
   - **Description**: `A comprehensive web application for generating professional student certificates`
   - **Visibility**: Choose Public or Private
   - **DO NOT** check "Add a README file" (we already have one)
   - **DO NOT** check "Add .gitignore" (we already have one)
   - **DO NOT** check "Choose a license" (we already have one)
5. Click **"Create repository"**

#### Step 2: Upload Files
1. On the new repository page, click **"uploading an existing file"**
2. **IMPORTANT**: Navigate to your project folder:
   ```
   c:\Users\rohan\Desktop\Student Certificate Generator\Student Certificate Generator
   ```
3. **Select ALL files and folders EXCEPT**:
   - `node_modules/` folder (too large, will be recreated)
   - `.next/` folder (build cache, will be recreated)
   - `package-lock.json` (can cause conflicts)

#### Step 3: Drag and Drop Files
1. Select these files and folders to upload:
   ```
   ✅ app/
   ✅ components/
   ✅ database/
   ✅ lib/
   ✅ public/
   ✅ .gitignore
   ✅ components.json
   ✅ LICENSE
   ✅ next-env.d.ts
   ✅ next.config.mjs
   ✅ package.json
   ✅ postcss.config.mjs
   ✅ README.md
   ✅ tailwind.config.js
   ✅ tsconfig.json
   ```

2. Drag and drop all selected files into the GitHub upload area
3. Wait for the upload to complete
4. Add a commit message: `Initial commit: Student Certificate Generator`
5. Click **"Commit changes"**

### Method 2: Using GitHub Desktop (Recommended for Future Updates)

#### Step 1: Install GitHub Desktop
1. Download from [desktop.github.com](https://desktop.github.com/)
2. Install and sign in to your GitHub account

#### Step 2: Add Repository
1. Click **"Add an Existing Repository from your hard drive"**
2. Browse to: `c:\Users\rohan\Desktop\Student Certificate Generator\Student Certificate Generator`
3. Click **"create a repository"**
4. Click **"Publish repository"** to upload to GitHub

### Method 3: Install Git and Use Command Line

#### Step 1: Install Git
1. Download from [git-scm.com](https://git-scm.com/download/win)
2. Install with default settings
3. Restart VS Code

#### Step 2: Initialize and Push
```bash
cd "c:\Users\rohan\Desktop\Student Certificate Generator\Student Certificate Generator"
git init
git add .
git commit -m "Initial commit: Student Certificate Generator"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/student-certificate-generator.git
git push -u origin main
```

## After Upload

### Enable GitHub Pages (Optional)
1. Go to your repository → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: **main** → **/ (root)**
4. Click **Save**

### Add Repository Topics
1. Go to your repository main page
2. Click the gear icon next to "About"
3. Add topics: `nextjs`, `react`, `certificate-generator`, `typescript`, `tailwindcss`, `education`

### Clone for Development
After uploading, anyone can clone and run your project:
```bash
git clone https://github.com/YOUR_USERNAME/student-certificate-generator.git
cd student-certificate-generator
npm install
npm run dev
```

## Your Repository is Ready! 🎉

Your Student Certificate Generator will be available at:
`https://github.com/YOUR_USERNAME/student-certificate-generator`
