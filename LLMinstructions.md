Instructions for Moonshot Kimi K2:
markdown

Copy code
# AI Web Dev Skill Tree Game - Build Instructions

You are building a Civilization III-inspired skill tree game for high school web development students. This is a React application with Firebase backend.

## Core Requirements:
1. **Pixel art aesthetic** - All UI elements should look like retro pixel art
2. **Non-linear skill progression** - Students can choose multiple paths
3. **Live website preview** - Shows features as they're unlocked
4. **Skill advisor** - AI character that suggests next skills
5. **Simple authentication** - Shared password, no OAuth needed

## Key Features to Implement:

### 1. Skill Tree Visualization
- Display skills in a tree layout with connecting lines
- Three tiers of skills leading to developer profiles
- Visual states: locked (gray), available (yellow glow), unlocked (green)
- Hover effects showing skill details

### 2. Documentation System
- Modal forms for submitting evidence
- Support for: reflections, code snippets, screenshots, AI chat logs
- Word count validation for reflections
- Templates provided for each skill type

### 3. Website Preview
- Live iframe showing student's website
- Features appear as skills are unlocked
- Website power score increases with each feature
- Browser frame UI for realism

### 4. Gamification Elements
- XP and leveling system
- Achievement notifications
- Progress bars with pixel art style
- Developer profiles as "end game" content

### 5. Instructor Dashboard
- View all student progress
- Manual skill override capability
- Timeline of student activities
- No complex admin features needed

## Code Style Guidelines:
- Use functional React components with hooks
- CSS Modules for component styling
- Pixel art created with pure CSS (no images)
- Mobile-responsive but optimized for desktop
- Comments explaining game logic

## Firebase Structure:
- Keep collections flat and simple
- Use timestamps for all dates
- Store minimal data to stay in free tier
- Real-time updates for student progress

## Testing Checklist:
1. Student can create account with name
2. Skills unlock when evidence submitted
3. Website preview updates immediately
4. Advisor appears every 10 minutes
5. Instructors can see all students
6. Progress persists between sessions

## Performance Considerations:
- Lazy load heavy components
- Minimize Firebase reads
- Cache static skill data
- Debounce frequent updates

Build this application step by step, starting with the core skill tree visualization, then adding features incrementally. Test each feature before moving to the next.
🎯 Implementation Priority Order
Phase 1: Core Structure

Project setup with Vite + React
Firebase initialization
Basic routing
Login screen
Phase 2: Skill Tree

Skill tree visualization
Skill node components
Connection lines
Unlock logic
Phase 3: Documentation

Document modal
Evidence submission
Validation logic
Firebase storage
Phase 4: Gamification

XP system
Level progression
Achievement notifications
Developer profiles
Phase 5: Website Preview

Live preview component
Feature integration
Power score calculation
Phase 6: Skill Advisor

Advisor character
Recommendation algorithm
Timed appearances
Adaptive suggestions
Phase 7: Instructor Features

Instructor dashboard
Student progress view
Manual overrides
Phase 8: Polish

Animations
Sound effects (optional)
Error handling
Loading states
🎨 Additional CSS for Pixel Art Elements
css

Copy code
/* src/styles/pixel-components.css */

/* Pixel Card */
.pixel-card {
  background: #fff;
  border: 4px solid #2c3e50;
  box-shadow: 
    0 4px 0 #2c3e50,
    0 8px 0 rgba(0,0,0,0.1);
  padding: 20px;
  position: relative;
}

.pixel-card::before {
  content: '';
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  background: 
    linear-gradient(to right, #2c3e50 4px, transparent 4px),
    linear-gradient(to bottom, #2c3e50 4px, transparent 4px);
  background-size: 4px 4px;
  pointer-events: none;
}

/* Pixel Text */
.pixel-text {
  font-family: 'Courier New', monospace;
  letter-spacing: 1px;
  text-transform: uppercase;
  text-shadow: 2px 2px 0 rgba(0,0,0,0.1);
}

/* Achievement Toast */
.achievement-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #f39c12;
  border: 4px solid #d68910;
  padding: 16px 24px;
  color: white;
  font-family: 'Courier New', monospace;
  animation: slideIn 0.3s ease-out, slideOut 0.3s ease-out 3s forwards;
  z-index: 1000;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes slideOut {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(400px);
  }
}

/* Skill Tree Connections */
.skill-connection {
  stroke: #7f8c8d;
  stroke-width: 4;
  fill: none;
  stroke-dasharray: 8 4;
}

.skill-connection.unlocked {
  stroke: #27ae60;
  stroke-dasharray: none;
}

.skill-connection.available {
  stroke: #f39c12;
  animation: pulse-line 2s infinite;
}

@keyframes pulse-line {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

/* Loading Spinner (Pixel Style) */
.pixel-spinner {
  width: 32px;
  height: 32px;
  position: relative;
  animation: pixel-spin 1s steps(4) infinite;
}

.pixel-spinner::before {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  background: #3498db;
  box-shadow:
    0 -16px 0 #3498db,
    16px -16px 0 #3498db,
    16px 0 0 #3498db,
    16px 16px 0 #3498db,
    0 16px 0 #3498db,
    -16px 16px 0 #3498db,
    -16px 0 0 #3498db,
    -16px -16px 0 #3498db;
}

@keyframes pixel-spin {
  to {
    transform: rotate(360deg);
  }
}
🔧 Utility Functions
javascript

Copy code
// src/utils/helpers.js

export const formatXP = (xp) => {
  if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}K`;
  }
  return xp.toString();
};

export const calculateReadTime = (text) => {
  const wordsPerMinute = 200;
  const words = text.split(' ').length;
  return Math.ceil(words / wordsPerMinute);
};

export const validateEvidence = (evidence, criteria) => {
  if (criteria.minWords && evidence.reflection) {
    const wordCount = evidence.reflection.split(' ').filter(w => w.length > 0).length;
    if (wordCount < criteria.minWords) return false;
  }
  
  if (criteria.evidence) {
    for (const type of criteria.evidence) {
      if (!evidence[type] || evidence[type].length === 0) return false;
    }
  }
  
  return true;
};

export const pixelColors = {
  primary: '#3498db',
  secondary: '#2ecc71',
  danger: '#e74c3c',
  warning: '#f39c12',
  dark: '#2c3e50',
  light: '#ecf0f1',
  gray: '#95a5a6'
};

export const generatePixelGradient = (color1, color2, steps = 4) => {
  // Creates a pixel-art style gradient
  let gradient = '';
  for (let i = 0; i < steps; i++) {
    const percent = (i / steps) * 100;
    gradient += `${color1} ${percent}%, ${color2} ${percent + (100/steps)}%, `;
  }
  return `repeating-linear-gradient(90deg, ${gradient.slice(0, -2)})`;
};
📝 Sample Student Flow
Login: Student enters name and class password
Dashboard: Sees skill tree, current level, and website preview
Skill Selection: Clicks on an available skill
Documentation: Fills out evidence form with reflection and code
Unlock: Skill turns green, XP awarded, website preview updates
Advisor: Pops up suggesting next skill based on interests
Profile Achievement: After unlocking required skills, adopts developer profile
Timeline: Reviews journey and celebrates progress
🎮 Game Balance
Tier 1 Skills: 50 XP each (4 skills = 200 XP = Level 2)
Tier 2 Skills: 100 XP each (6 skills = 600 XP = Level 4)
Tier 3 Skills: 150 XP each (5 skills = 750 XP = Level 7)
Developer Profile: 200 XP bonus
Total Possible: ~1,750 XP = Level 9
This creates a satisfying progression where students feel constant advancement without making the game too grindy.