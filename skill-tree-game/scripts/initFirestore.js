// scripts/initFirestore.js
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { config } from 'dotenv';

// Load environment variables
config();

// Firebase config using environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function initializeDatabase() {
  try {
    // Create sample student
    await setDoc(doc(db, 'students', 'sample_student'), {
      name: 'Sample Student',
      joinedAt: new Date(),
      currentLevel: 1,
      totalXP: 0,
      websitePower: 0,
      developerProfile: null,
      skills: {},
      achievements: [],
      settings: {
        advisorFrequency: 'normal',
        preferredLearningStyle: 'visual'
      }
    });

    console.log('✅ Sample student created successfully!');
    console.log('📝 You can now access the app at: http://localhost:5173/student/sample_student');
    
    // Exit the script
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();