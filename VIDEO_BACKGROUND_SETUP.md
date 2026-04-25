# Video Background Setup Guide

## 🎥 **What Was Changed**

I've replaced the gradient background in the hero section with a **video background loop** that will make your homepage much more dynamic and engaging.

## 📁 **Video Files Needed**

You need to add video files to your `frontend/public/videos/` directory:

### **Required Video Files:**
1. `sports-background.mp4` (MP4 format for broad compatibility)
2. `sports-background.webm` (WebM format for better compression)

### **Recommended Video Specifications:**
- **Duration**: 10-30 seconds (will loop automatically)
- **Resolution**: 1920x1080 (Full HD) or higher
- **Aspect Ratio**: 16:9 (landscape)
- **File Size**: Under 10MB for good loading performance
- **Content**: Sports-related footage (football, padel, or general sports)

## 🎬 **Video Content Suggestions**

### **Ideal Video Content:**
- **Football players** in action on a field
- **Padel players** playing on a court
- **Sports facility** overview shots
- **Dynamic sports movements** (running, jumping, playing)
- **Aerial shots** of sports complexes
- **Slow-motion** sports action

### **Video Style Tips:**
- **High contrast** scenes work better with text overlay
- **Avoid busy backgrounds** that might distract from text
- **Smooth, flowing movements** rather than quick cuts
- **Professional quality** footage for best impression

## 📂 **File Structure**

Create this folder structure in your project:

```
frontend/
├── public/
│   └── videos/
│       ├── sports-background.mp4
│       └── sports-background.webm
```

## 🛠️ **Implementation Details**

### **What the Code Does:**
1. **Plays video automatically** when page loads
2. **Loops continuously** for seamless background
3. **Muted by default** (required for autoplay)
4. **Responsive sizing** - covers full hero section
5. **Fallback gradient** - shows if video fails to load
6. **Dark overlay** - ensures text remains readable
7. **Multiple formats** - MP4 and WebM for browser compatibility

### **Technical Features:**
- `autoPlay` - Starts playing immediately
- `muted` - Required for autoplay in most browsers
- `loop` - Repeats video continuously
- `playsInline` - Prevents fullscreen on mobile
- `object-cover` - Maintains aspect ratio while covering area

## 🎯 **Benefits of Video Background**

### **User Experience:**
- **More Engaging** - Dynamic movement catches attention
- **Professional Look** - Modern, high-end appearance
- **Brand Storytelling** - Shows actual sports action
- **Emotional Connection** - Video creates stronger impact

### **Technical Benefits:**
- **Graceful Fallback** - Gradient shows if video fails
- **Performance Optimized** - Compressed video formats
- **Mobile Friendly** - Responsive and touch-optimized
- **Accessibility** - Muted by default, doesn't interfere

## 📱 **Mobile Considerations**

The video background will work on mobile devices with these optimizations:
- **Compressed file sizes** for faster loading
- **playsInline** attribute prevents fullscreen
- **Fallback gradient** for slower connections
- **Dark overlay** ensures text readability on all devices

## 🔧 **How to Add Your Videos**

### **Step 1: Get Video Files**
- Record your own sports facility footage
- Use stock video from sites like Pexels, Unsplash, or Pixabay
- Hire a videographer for custom content

### **Step 2: Optimize Videos**
- Compress to under 10MB using tools like HandBrake
- Convert to both MP4 and WebM formats
- Ensure 16:9 aspect ratio

### **Step 3: Add to Project**
1. Create `frontend/public/videos/` folder
2. Add your video files with exact names:
   - `sports-background.mp4`
   - `sports-background.webm`

### **Step 4: Test**
- Refresh your homepage
- Video should start playing automatically
- Check on both desktop and mobile

## 🎨 **Customization Options**

### **Change Video Files:**
Update the file names in `HomePage.tsx`:
```jsx
<source src="/videos/your-video-name.mp4" type="video/mp4" />
<source src="/videos/your-video-name.webm" type="video/webm" />
```

### **Adjust Overlay Opacity:**
Change the dark overlay intensity:
```jsx
<div className="absolute inset-0 bg-black/50"></div>
// Change /50 to /30 (lighter) or /70 (darker)
```

### **Add Multiple Videos:**
You can create an array of videos and rotate them:
```jsx
const videos = [
  'sports-background-1.mp4',
  'sports-background-2.mp4',
  'sports-background-3.mp4'
]
```

## 🚀 **Result**

Once you add the video files, your homepage will have:
- **Dynamic video background** instead of static gradient
- **Professional sports atmosphere** 
- **Engaging visual experience**
- **Modern, premium feel**
- **Automatic looping** for continuous motion

The video background will make your FiveStars booking platform look much more professional and engaging! 🎬⚽🎾