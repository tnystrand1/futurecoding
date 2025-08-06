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
import { SKILL_TREE, DEVELOPER_PROFILES } from '../data/skillTreeData';

export const useGameState = (studentId) => {
  const [studentProgress, setStudentProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [achievements, setAchievements] = useState([]);

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
          setStudentProgress(data);
          
          // Only check achievements if this is an actual change, not initial load
          // and avoid infinite loops by not processing achievements here
          // Achievement processing should happen in unlockSkill function instead
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
          // Re-enabling new student creation
          console.log('CREATING NEW STUDENT:', newStudent);
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

      // Save evidence as pending teacher approval
      const newSkills = {
        ...studentProgress.skills,
        [skillId]: {
          unlocked: false, // Not unlocked until teacher approves
          evidenceSubmitted: true,
          evidence: {
            ...evidence,
            status: 'pending',
            submittedAt: new Date().toISOString(),
            skillName: skill.name,
            potentialXP: skill.xpReward
          },
          featuresUnlocked: skill.featuresUnlocked || []
        }
      };

      // Calculate new total XP (only from approved skills)
      const totalXP = Object.values(newSkills)
        .filter(skill => skill.unlocked) // Only count unlocked skills
        .reduce((sum, skill) => sum + (skill.xpEarned || 0), 0);

      // Calculate new level
      const { level } = GameLogic.calculateLevelProgress(totalXP);
      
      // Calculate website power
      const websitePower = GameLogic.calculateWebsitePower(newSkills);

      // RE-ENABLING ONLY unlockSkill writes - this saves evidence
      console.log('UPDATING:', {
        skills: newSkills,
        totalXP: totalXP,
        currentLevel: level,
        websitePower: websitePower
      });
      await updateDoc(doc(db, 'students', studentId), {
        skills: newSkills,
        totalXP: totalXP,
        currentLevel: level,
        websitePower: websitePower,
        lastActivity: serverTimestamp()
      });

      // Don't create timeline events for pending submissions
      // Timeline events will be created when teacher approves

      return { 
        success: true, 
        message: `Evidence submitted for ${skill.name}! Waiting for teacher approval.`,
        isPending: true 
      };
    } catch (error) {
      console.error('Error unlocking skill:', error);
      return { success: false, error: error.message };
    }
  }, [studentId, studentProgress]);

  // Approve evidence (teacher function)
  const approveEvidence = useCallback(async (studentId, skillId, approved, rejectionMessage = '') => {
    try {
      const studentRef = doc(db, 'students', studentId);
      const studentDoc = await getDoc(studentRef);
      
      if (!studentDoc.exists()) {
        return { success: false, error: 'Student not found' };
      }
      
      const studentData = studentDoc.data();
      const skill = studentData.skills?.[skillId];
      
      if (!skill || !skill.evidenceSubmitted || skill.evidence?.status !== 'pending') {
        return { success: false, error: 'No pending evidence found for this skill' };
      }

      const skillInfo = SKILL_TREE[skillId];
      
      if (approved) {
        // Approve: unlock skill and award XP
        const updatedSkills = {
          ...studentData.skills,
          [skillId]: {
            ...skill,
            unlocked: true,
            unlockedAt: new Date().toISOString(),
            xpEarned: skillInfo.xpReward,
            evidence: {
              ...skill.evidence,
              status: 'approved',
              approvedAt: new Date().toISOString()
            }
          }
        };

        // Recalculate total XP including this newly approved skill
        const totalXP = Object.values(updatedSkills)
          .filter(s => s.unlocked)
          .reduce((sum, s) => sum + (s.xpEarned || 0), 0);

        const { level } = GameLogic.calculateLevelProgress(totalXP);
        const websitePower = GameLogic.calculateWebsitePower(updatedSkills);

        await updateDoc(studentRef, {
          skills: updatedSkills,
          totalXP: totalXP,
          currentLevel: level,
          websitePower: websitePower,
          lastActivity: serverTimestamp()
        });

        // Create timeline event for approval
        await addTimelineEvent({
          type: 'skill_unlocked',
          skillId: skillId,
          skillName: skillInfo.name,
          description: `${skillInfo.name} approved and unlocked!`,
          websitePowerGain: 10,
          xpGained: skillInfo.xpReward
        });

        return { success: true, message: `${skillInfo.name} approved and unlocked!` };
      } else {
        // Reject: mark as rejected but keep evidence for review
        const updatedSkills = {
          ...studentData.skills,
          [skillId]: {
            ...skill,
            evidence: {
              ...skill.evidence,
              status: 'rejected',
              rejectedAt: new Date().toISOString(),
              rejectionMessage: rejectionMessage
            }
          }
        };

        await updateDoc(studentRef, {
          skills: updatedSkills,
          lastActivity: serverTimestamp()
        });

        return { success: true, message: `Evidence for ${skillInfo.name} has been rejected. Student can resubmit.` };
      }
    } catch (error) {
      console.error('Error approving evidence:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Adopt a developer profile
  const adoptProfile = useCallback(async (profileId) => {
    if (!studentId || !profileId) return { success: false, error: 'Invalid parameters' };

    try {
      // Re-enabling profile adoption writes - monitoring for loops
      console.log('UPDATING PROFILE:', profileId);
      await updateDoc(doc(db, 'students', studentId), {
        developerProfile: profileId,
        profileAdoptedAt: serverTimestamp()
      });

      // Re-enabling profile adoption timeline events - monitoring for loops
      await addTimelineEvent({
        type: 'profile_achieved',
        profileId: profileId,
        description: `Became ${DEVELOPER_PROFILES[profileId]?.name || profileId}`,
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
      // Re-enabled for skill unlocks - monitoring for loops
      console.log('Adding timeline event:', event);
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
      // EMERGENCY: ALL WRITES DISABLED
      console.log('WOULD CREATE DAILY LOG:', checkInData);
      // await setDoc(doc(db, 'students', studentId, 'dailyLogs', today), {
      //   ...checkInData,
      //   checkIn: serverTimestamp(),
      //   date: today
      // });

      // EMERGENCY: ALL WRITES DISABLED
      console.log('WOULD UPDATE DAILY CHECK-IN XP');
      // await updateDoc(doc(db, 'students', studentId), {
      //   totalXP: (studentProgress.totalXP || 0) + 15,
      //   lastCheckIn: serverTimestamp()
      // });

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
    approveEvidence,
    adoptProfile,
    dailyCheckIn,
    // Computed values
    availableProfiles: GameLogic.getAvailableProfiles(studentProgress.skills),
    levelProgress: GameLogic.calculateLevelProgress(studentProgress.totalXP || 0)
  };
};
