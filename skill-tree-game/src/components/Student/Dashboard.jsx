import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import SkillTree from '../Game/SkillTree';
import WebsitePreview from './WebsitePreview';
import DocumentModal from '../Documentation/DocumentModal';
import AchievementToast from '../Shared/AchievementToast';
import LoadingSpinner from '../Shared/LoadingSpinner';
import { useGameState } from '../../hooks/useGameState';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const { studentId } = useParams();
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showAchievement, setShowAchievement] = useState(null);
  
  const {
    studentProgress,
    loading,
    error,
    achievements,
    unlockSkill,
    levelProgress
  } = useGameState(studentId || 'sample_student');

  // Show achievements when they appear
  useEffect(() => {
    if (achievements.length > 0) {
      achievements.forEach((achievement, index) => {
        setTimeout(() => {
          setShowAchievement(achievement);
          setTimeout(() => setShowAchievement(null), 4000);
        }, index * 1000);
      });
    }
  }, [achievements]);

  const handleSkillClick = (skill) => {
    setSelectedSkill(skill);
    setShowDocumentModal(true);
  };

  const handleDocumentSubmit = async (skillId, evidence) => {
    const result = await unlockSkill(skillId, evidence);
    if (result.success) {
      setShowDocumentModal(false);
      // Show success message or animation
    } else {
      alert(`Error unlocking skill: ${result.error}`);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className={styles.error}>Error: {error}</div>;

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1 className="pixel-text">
          {studentProgress.name}'s Web Dev Journey
        </h1>
        <div className={styles.levelInfo}>
          <span>Level {levelProgress?.level || 1}</span>
          <div className={styles.xpBar}>
            <div 
              className={styles.xpFill} 
              style={{ width: `${levelProgress?.progress || 0}%` }}
            />
          </div>
          <span>{studentProgress.totalXP || 0} XP</span>
        </div>
      </header>
      
      <div className={styles.mainContent}>
        <div className={styles.skillTreeSection}>
          <SkillTree 
            studentId={studentId} 
            studentProgress={studentProgress} 
            onSkillClick={handleSkillClick} 
          />
        </div>
        
        <div className={styles.previewSection}>
          <WebsitePreview studentProgress={studentProgress} />
        </div>
      </div>

      {showDocumentModal && selectedSkill && (
        <DocumentModal
          skill={selectedSkill}
          onSubmit={handleDocumentSubmit}
          onClose={() => setShowDocumentModal(false)}
        />
      )}

      {showAchievement && (
        <AchievementToast achievement={showAchievement} />
      )}
    </div>
  );
};

export default Dashboard;
