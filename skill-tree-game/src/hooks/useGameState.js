import { useState, useEffect, useCallback } from 'react';
import { db } from '../utils/firebase-config';
import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  setDoc, 
  getDoc,
  collection,
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { GameLogic } from '../utils/gameLogic';
import { SKILL_TREE } from '../data/skillTreeData';

export const useGameState = (studentId) => {
  const [studentProgress, setStudentProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [previousProgress, setPreviousProgress] = useState({});

  // Initialize or fetch student data
  useEffect(() => {
    if (!studentId) {
      setError('No student ID provided');
      setLoading(false);
      return;
    }

    const studentRef = doc(db, 'students', studentId);

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      studentRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPreviousProgress(studentProgress); // Save previous state for achievement checking
          setStudentProgress(data);
          
          // Check for new achievements
          const newAchievements = GameLogic.checkAchievements(data, studentProgress);
          if (newAchievements.length > 0) {
            setAchievements(newAchievements);
            // Award achievement XP
            const achievementXP = newAchievements.reduce((sum, a) => sum + a.xpReward, 0);
            if (achievementXP > 0) {
              await updateDoc(studentRef, {
                totalXP: (data.totalXP || 0) + achievementXP,
                achievements: [...(data.achievements || []), ...newAchievements.map(a => a.id)]
              });
            }
          }
        } else {
          // Create new student document if it doesn't exist
          const newStudent = {
            name: studentId.replace(/_/g, ' '),
            joinedAt: serverTimestamp(),
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
          };
          await setDoc(studentRef, newStudent);
          setStudentProgress(newStudent);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching student data:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [studentId]);

  // Unlock a skill
  const unlockSkill = useCallback(async (skillId, evidence) => {
    if (!studentId || !skillId) return { success: false, error: 'Invalid parameters' };

    try {
      const skill = SKILL_TREE[skillId];
      if (!skill) return { success: false, error: 'Skill not found' };

      // Update skills
      const newSkills = {
        ...studentProgress.skills,
        [skillId]: {
          unlocked: true,
          unlockedAt: serverTimestamp(),
          evidence: evidence,
          xpEarned: skill.xpReward,
          featuresUnlocked: skill.featuresUnlocked || []
        }
      };

      // Calculate new total XP
      const totalXP = Object.values(newSkills)
        .reduce((sum, skill) => sum + (skill.xpEarned || 0), 0) + (studentProgress.totalXP || 0);

      // Calculate new level
      const { level } = GameLogic.calculateLevelProgress(totalXP);
      
      // Calculate website power
      const websitePower = GameLogic.calculateWebsitePower(newSkills);

      // Update student document
      await updateDoc(doc(db, 'students', studentId), {
        skills: newSkills,
        totalXP: totalXP,
        currentLevel: level,
        websitePower: websitePower,
        lastActivity: serverTimestamp()
      });

      // Add to timeline
      await addTimelineEvent({
        type: 'skill_unlocked',
        skillId: skillId,
        skillName: skill.name,
        description: `Unlocked ${skill.name}`,
        websitePowerGain: 10,
        xpGained: skill.xpReward
      });

      return { success: true };
    } catch (error) {
      console.error('Error unlocking skill:', error);
      return { success: false, error: error.message };
    }
  }, [studentId, studentProgress]);

  // Adopt a developer profile
  const adoptProfile = useCallback(async (profileId) => {
    if (!studentId || !profileId) return { success: false, error: 'Invalid parameters' };

    try {
      await updateDoc(doc(db, 'students', studentId), {
        developerProfile: profileId,
        profileAdoptedAt: serverTimestamp()
      });

      await addTimelineEvent({
        type: 'profile_achieved',
        profileId: profileId,
        description: `Became ${DEVELOPER_PROFILES[profileId].name}`,
        websitePowerGain: 50
      });

      return { success: true };
    } catch (error) {
      console.error('Error adopting profile:', error);
      return { success: false, error: error.message };
    }
  }, [studentId]);

  // Add timeline event
  const addTimelineEvent = useCallback(async (event) => {
    if (!studentId) return;

    try {
      await addDoc(collection(db, 'students', studentId, 'timeline'), {
        ...event,
        timestamp: serverTimestamp(),
        studentId: studentId
      });
    } catch (error) {
      console.error('Error adding timeline event:', error);
    }
  }, [studentId]);

  // Daily check-in
  const dailyCheckIn = useCallback(async (checkInData) => {
    if (!studentId) return { success: false, error: 'No student ID' };

    try {
      const today = new Date().toISOString().split('T')[0];
      await setDoc(doc(db, 'students', studentId, 'dailyLogs', today), {
        ...checkInData,
        checkIn: serverTimestamp(),
        date: today
      });

      // Award daily check-in XP
      await updateDoc(doc(db, 'students', studentId), {
        totalXP: (studentProgress.totalXP || 0) + 15,
        lastCheckIn: serverTimestamp()
      });

      return { success: true, xpEarned: 15 };
    } catch (error) {
      console.error('Error with daily check-in:', error);
      return { success: false, error: error.message };
    }
  }, [studentId, studentProgress]);

  return {
    studentProgress,
    loading,
    error,
    achievements,
    unlockSkill,
    adoptProfile,
    dailyCheckIn,
    // Computed values
    availableProfiles: GameLogic.getAvailableProfiles(studentProgress.skills),
    levelProgress: GameLogic.calculateLevelProgress(studentProgress.totalXP || 0)
  };
};
