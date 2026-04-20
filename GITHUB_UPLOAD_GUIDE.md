# 📤 How to Upload to GitHub

## Option 1: Using GitHub Desktop (Easiest)

### Step 1: Install GitHub Desktop
1. Download from: https://desktop.github.com/
2. Install and sign in with your GitHub account

### Step 2: Create Repository
1. Open GitHub Desktop
2. Click **"File"** → **"Add Local Repository"**
3. Click **"Choose..."** and select your project folder
4. Click **"Create Repository"**
5. Add description: "Sports Complex Booking System"
6. Click **"Create Repository"**

### Step 3: Publish to GitHub
1. Click **"Publish repository"** button
2. Choose a name: `sports-complex-booking`
3. Add description (optional)
4. Uncheck **"Keep this code private"** if you want it public
5. Click **"Publish Repository"**

Done! Your code is now on GitHub! 🎉

---

## Option 2: Using Git Command Line

### Step 1: Install Git
Download from: https://git-scm.com/download/win

### Step 2: Initialize Repository
Open PowerShell in your project folder:

```bash
# Initialize git
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: Sports Complex Booking System"
```

### Step 3: Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `sports-complex-booking`
3. Description: "Sports Complex Booking System with React and Supabase"
4. Choose Public or Private
5. **DO NOT** initialize with README (we already have one)
6. Click **"Create repository"**

### Step 4: Push to GitHub
Copy the commands from GitHub (they look like this):

```bash
git remote add origin https://github.com/YOUR_USERNAME/sports-complex-booking.git
git branch -M main
git push -u origin main
```

---

## Option 3: Upload via GitHub Web Interface (No Git Required)

### Step 1: Create Repository
1. Go to https://github.com/new
2. Repository name: `sports-complex-booking`
3. Description: "Sports Complex Booking System"
4. Choose Public or Private
5. Click **"Create repository"**

### Step 2: Upload Files
1. Click **"uploading an existing file"** link
2. Drag and drop your entire project folder
3. Or click **"choose your files"** and select all files
4. Add commit message: "Initial commit"
5. Click **"Commit changes"**

⚠️ **Important**: Make sure to exclude:
- `frontend/node_modules/` folder
- `frontend/.env.local` file (contains secrets!)
- `.kiro/specs/` folder (if you don't want to share)

---

## 🔒 Security Checklist

Before uploading, make sure:

- [ ] `frontend/.env.local` is in `.gitignore` ✅
- [ ] No Supabase keys in code ✅
- [ ] No passwords in code ✅
- [ ] `.env.example` has placeholder values ✅
- [ ] `node_modules/` is in `.gitignore` ✅

---

## 📝 After Upload

### Update README
1. Replace `YOUR_USERNAME` with your GitHub username in README
2. Add screenshots (optional)
3. Update contact information

### Add Topics (Tags)
Add these topics to your repository:
- `react`
- `typescript`
- `supabase`
- `booking-system`
- `sports`
- `tailwindcss`
- `real-time`

### Enable GitHub Pages (Optional)
If you want to deploy:
1. Go to Settings → Pages
2. Source: GitHub Actions
3. Or connect to Vercel/Netlify

---

## 🎯 Recommended Repository Settings

### About Section
- Description: "Modern sports facility booking system with real-time updates"
- Website: Your deployed URL (if any)
- Topics: react, typescript, supabase, booking-system

### Features to Enable
- ✅ Issues (for bug reports)
- ✅ Discussions (for Q&A)
- ✅ Projects (for roadmap)

---

## 📸 Add Screenshots (Optional)

Create a `screenshots/` folder and add:
- Homepage screenshot
- Booking calendar screenshot
- Dashboard screenshot
- Admin panel screenshot

Then update README with:
```markdown
## Screenshots

![Homepage](screenshots/homepage.png)
![Booking Calendar](screenshots/booking.png)
```

---

## 🚀 Next Steps After Upload

1. **Add a demo link** if you deploy it
2. **Write a blog post** about your project
3. **Share on social media** (Twitter, LinkedIn)
4. **Add to your portfolio**
5. **Star your own repo** 😄

---

## ❓ Need Help?

- GitHub Docs: https://docs.github.com
- GitHub Desktop Guide: https://docs.github.com/en/desktop
- Git Tutorial: https://git-scm.com/docs/gittutorial

---

**Good luck with your GitHub upload! 🎉**
