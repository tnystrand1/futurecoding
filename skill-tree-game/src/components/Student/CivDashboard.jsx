import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CivSkillTree from '../Game/CivSkillTree';
import DocumentModal from '../Documentation/DocumentModal';
import AchievementToast from '../Shared/AchievementToast';
import LoadingSpinner from '../Shared/LoadingSpinner';
import { useGameState } from '../../hooks/useGameState';
import '../../styles/civilization.css';

const CivDashboard = () => {
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
  if (error) return <div className="error">Error: {error}</div>;

  const studentName = studentProgress.name || studentId.replace(/_/g, ' ');
  const unlockedSkillsCount = Object.values(studentProgress.skills || {})
    .filter(skill => skill.unlocked).length;

  return (
    <div className="civ-dashboard">
      <header className="civ-header">
        <h1 className="civ-title">
          {studentName.toUpperCase()}'S DEVELOPMENT RESEARCH
        </h1>
      </header>
      
      <div className="civ-main-content">
        <div className="civ-tech-tree">
          <div className="civ-tree-header">
            <h2 className="civ-tree-title">Web Development Technologies</h2>
            <div className="civ-tree-stats">
              <div className="civ-stat">
                <span>Level: </span>
                <strong>{levelProgress?.level || 1}</strong>
              </div>
              <div className="civ-stat">
                <span>Knowledge: </span>
                <strong>{studentProgress.totalXP || 0} XP</strong>
              </div>
              <div className="civ-stat">
                <span>Website Power: </span>
                <strong>{studentProgress.websitePower || 0}</strong>
              </div>
            </div>
          </div>
          
          <CivSkillTree 
            studentId={studentId} 
            studentProgress={studentProgress} 
            onSkillClick={handleSkillClick} 
          />
        </div>
        
        <div className="civ-advisor-panel">
          <div className="civ-advisor-avatar">
            🧙‍♂️
          </div>
          
          <div className="civ-advisor-content">
            <h3 className="civ-advisor-title">Web Development Advisor</h3>
            
            <div className="civ-website-preview">
              <div className="civ-website-title">{studentName}'s Digital Realm</div>
              <div className="civ-website-stats">
                Website Power: {studentProgress.websitePower || 0}<br/>
                Unlocked Skills: {unlockedSkillsCount}<br/>
                Development Stage: {levelProgress?.level > 3 ? 'Advanced' : levelProgress?.level > 1 ? 'Intermediate' : 'Novice'}
              </div>
            </div>
            
            <div className="civ-progress-section">
              <div className="civ-progress-title">Experience Progress</div>
              <div className="civ-xp-bar">
                <div 
                  className="civ-xp-fill" 
                  style={{ width: `${levelProgress?.progress || 0}%` }}
                />
                <div className="civ-xp-text">
                  {studentProgress.totalXP || 0} XP
                </div>
              </div>
            </div>

            <div className="civ-progress-section">
              <div className="civ-progress-title">Research Guide</div>
              <div style={{ 
                background: 'rgba(244, 228, 188, 0.9)', 
                border: '2px solid #8B4513',
                borderRadius: '8px',
                padding: '10px',
                color: '#2d1810',
                fontSize: '11px',
                lineHeight: '1.3',
                textAlign: 'left',
                marginBottom: '15px'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Legend:</div>
                <div>🟡 Available to Research</div>
                <div>🟢 Researched</div>
                <div>🔒 Requires Prerequisites</div>
                <div style={{ marginTop: '6px', fontSize: '10px', opacity: 0.8 }}>
                  Arrows show prerequisite relationships
                </div>
              </div>
            </div>

            <div className="civ-progress-section">
              <div className="civ-progress-title">Advisor's Counsel</div>
              <div style={{ 
                background: 'rgba(244, 228, 188, 0.9)', 
                border: '2px solid #8B4513',
                borderRadius: '8px',
                padding: '12px',
                color: '#2d1810',
                fontSize: '12px',
                lineHeight: '1.4',
                textAlign: 'left'
              }}>
                {unlockedSkillsCount === 0 && (
                  <span>
                    📜 Begin your journey by mastering the foundational arts. 
                    I recommend starting with <strong>Cultural Asset Mapping</strong> 
                    to understand how your unique perspective shapes design.
                  </span>
                )}
                {unlockedSkillsCount > 0 && unlockedSkillsCount < 4 && (
                  <span>
                    ⚡ Excellent progress! Continue building your foundation. 
                    Consider exploring <strong>Client Discovery</strong> to 
                    understand the needs of those you serve.
                  </span>
                )}
                {unlockedSkillsCount >= 4 && (
                  <span>
                    🎯 Your foundational knowledge grows strong! You are ready 
                    to advance to Tier 2 technologies. The path to mastery 
                    awaits in <strong>Project Scoping</strong> and beyond.
                  </span>
                )}
              </div>
            </div>
          </div>
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

export default CivDashboard;