# 🎮 Skill Tree Game - Web Development Learning Platform

A Civilization III-inspired skill tree game designed for high school web development students. This interactive educational platform gamifies the learning process with a retro aesthetic and progressive skill unlocking system.

## 🎯 Features

- **🏛️ Civilization III Aesthetic**: Ancient parchment backgrounds, gold accents, and medieval styling
- **🎓 Progressive Skill Tree**: 3-tier system from foundations to specializations
- **📸 Screenshot Evidence**: Firebase Storage integration for image uploads
- **🧙‍♂️ AI Advisor**: Contextual guidance and recommendations
- **📊 Real-time Progress**: XP tracking, leveling, and achievement system
- **🔗 Clear Prerequisites**: Visual arrows showing skill dependencies

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- Firebase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/tnystrand1/futurecoding.git
   cd futurecoding/skill-tree-game
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase configuration**
   ```bash
   # Copy the example environment file
   cp env.example .env
   
   # Edit .env with your Firebase project credentials
   # Get these from Firebase Console > Project Settings > Web App
   ```

4. **Initialize Firestore database**
   ```bash
   npm run init-db
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Civilization UI: `http://localhost:5173/civ/sample_student`
   - Original UI: `http://localhost:5173/student/sample_student`

## 🔐 Security Configuration

**⚠️ Important**: Never commit your `.env` file to version control!

### Environment Variables Required

Create a `.env` file in the project root with:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Firebase Setup

1. Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore Database
3. Enable Storage
4. Configure security rules (see `firestore.rules` and `storage.rules`)
5. Get your web app configuration from Project Settings

## 🎮 Game Mechanics

### Skill Tree Structure

**Tier 1: Foundations** (50 XP each)
- Cultural Asset Mapping
- Client Discovery  
- Descriptive Prompting
- Code Implementation

**Tier 2: Applications** (100 XP each)
- Project Scoping
- Iterative Refinement
- User Testing
- AI-Assisted Debugging
- Output Evaluation
- Peer Feedback

**Tier 3: Specializations** (150 XP each)
- AI Tool Evaluation
- Accessibility (A11y)
- CSS Variables
- Form Validation
- Deployment

### Evidence Types
- **Reflections**: Written analysis (min word count)
- **Code Snippets**: Implementation examples
- **Screenshots**: Visual documentation
- **AI Chat Logs**: Conversation with AI tools

### Developer Profiles (End Game)
- **Community-Centered Designer**: Focus on inclusion and empathy
- **Creative Technologist**: Blend art and code
- **Resilient Problem-Solver**: Thrive on challenges

## 🛠️ Technology Stack

- **Frontend**: React 18 + Vite
- **Backend**: Firebase (Firestore + Storage + Hosting)
- **Styling**: CSS Modules with pixel art aesthetic
- **Testing**: Playwright (E2E)
- **Routing**: React Router

## 📁 Project Structure

```
skill-tree-game/
├── src/
│   ├── components/
│   │   ├── Student/        # Student dashboard components
│   │   ├── Game/           # Skill tree visualization
│   │   ├── Documentation/  # Evidence submission
│   │   └── Shared/         # Reusable UI components
│   ├── data/               # Skill tree configuration
│   ├── hooks/              # Custom React hooks
│   ├── styles/             # CSS modules and themes
│   └── utils/              # Firebase config and helpers
├── tests/                  # Playwright test suites
├── scripts/                # Database initialization
└── public/                 # Static assets
```

## 🎨 UI Themes

The application supports two distinct UI themes:

1. **Civilization III Theme** (`/civ/...`) - Medieval aesthetic with parchment backgrounds
2. **Modern Theme** (`/student/...`) - Clean, modern interface

## 🧪 Testing

```bash
# Run E2E tests
npm test

# Run in headed mode
npm run test:headed

# Debug mode
npm run test:debug
```

## 🚀 Deployment

### Firebase Hosting

```bash
# Build for production
npm run build

# Deploy to Firebase
firebase deploy
```

### Environment Variables for Production

Set up your production environment variables in your hosting platform:
- Vercel: Add to project settings
- Netlify: Add to site settings
- Firebase: Use Firebase functions config

## 📚 Educational Design

This platform is designed around evidence-based learning principles:

- **Competency Mapping**: Each skill ties to real-world competencies
- **Progressive Disclosure**: Skills unlock based on mastery
- **Reflective Practice**: Students document their learning journey
- **Authentic Assessment**: Real code and project evidence
- **Peer Learning**: Feedback and collaboration features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License



## 🙏 Acknowledgments

- Inspired by Civilization III's Science Advisor interface
- Built for high school web development education
- Designed with gamification and engagement principles

---

**🎯 Ready to start your web development journey?** Fire up the development server and begin unlocking skills!