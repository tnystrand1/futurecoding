import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { SKILL_TREE } from '../../data/skillTreeData';
import DocumentModal from '../Documentation/DocumentModal';
import AchievementToast from '../Shared/AchievementToast';
import LoadingSpinner from '../Shared/LoadingSpinner';
import CodeCriticChat from '../AI/CodeCriticChat';
import DailyReflections from './DailyReflections';
import PinManager from '../Shared/PinManager';
import EnhancedMessageCenter from '../Messaging/EnhancedMessageCenter';
import MessageNotifications from '../Messaging/MessageNotifications';
import { useGameState } from '../../hooks/useGameState';
import { GameLogic } from '../../utils/gameLogic';
import '../../styles/civilization.css';

const CivDashboard = () => {
  const { studentId } = useParams();
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showAchievement, setShowAchievement] = useState(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showPinManager, setShowPinManager] = useState(false);
  const [pinMessage, setPinMessage] = useState('');
  const [showMessageCenter, setShowMessageCenter] = useState(false);
  
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

  // Calculate dynamic competency scores
  const competencies = GameLogic.calculateCompetencies(studentProgress.skills || {});

  const handleSkillClick = (skill) => {
    if (isSkillAvailable(skill)) {
      setSelectedSkill(skill);
      setShowDocumentModal(true);
    }
  };

  // Enhanced messaging notification handler
  const handleOpenMessageFromNotification = (conversationId, otherParticipant) => {
    setShowMessageCenter(true);
    // The EnhancedMessageCenter will handle opening the specific conversation
  };

  const isSkillUnlocked = (skillId) => {
    return studentProgress.skills && studentProgress.skills[skillId]?.unlocked;
  };

  const isSkillAvailable = (skill) => {
    return true; // All skills are available as requested
  };

  const getSkillStatus = (skill) => {
    if (isSkillUnlocked(skill.id)) {
      return { 
        color: '#27ae60', 
        icon: '✅', 
        text: 'Completed', 
        bgColor: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
      };
    }
    return { 
      color: '#3498db', 
      icon: '🚀', 
      text: 'Available', 
      bgColor: 'linear-gradient(135deg, #FF9800 0%, #f57c00 100%)'
    };
  };

  const getSkillCardStyle = (skill) => {
    const status = getSkillStatus(skill);
    let background = status.bgColor;

    // Update tier-specific colors as requested
    if (skill.tier === 2) {
      background = isSkillUnlocked(skill.id) 
        ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
        : 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)'; // Blue for Tier 2
    } else if (skill.tier === 3) {
      background = 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)'; // Purple for Tier 3
    }

    return {
      background,
      border: '3px solid #8B4513',
      borderRadius: '12px',
      padding: '15px',
      margin: '10px 0',
      cursor: 'pointer',
      boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
      color: 'white',
      fontWeight: 'bold',
      transition: 'all 0.3s ease',
      position: 'relative',
      minHeight: '100px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    };
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div style={{ color: '#e74c3c', textAlign: 'center', padding: '20px' }}>Error: {error}</div>;

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Georgia, serif',
      backgroundColor: '#F4E4BC',
      minHeight: '100vh',
      backgroundImage: `
        radial-gradient(circle at 20% 20%, rgba(139, 69, 19, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(160, 82, 45, 0.1) 0%, transparent 50%),
        linear-gradient(45deg, transparent 30%, rgba(139, 69, 19, 0.03) 70%)
      `
    }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '2fr 1fr', 
        gap: '20px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Main Content Area */}
        <div>
          {/* Header */}
          <div style={{ 
            background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
            padding: '20px',
            borderRadius: '15px',
            marginBottom: '20px',
            color: 'white',
            textAlign: 'center',
            boxShadow: '0 6px 12px rgba(0,0,0,0.3)'
          }}>
            <h1 style={{ margin: '0 0 10px 0', fontSize: '2.2em' }}>🏛️ Future Coding Academy</h1>
            <p style={{ margin: '0', fontSize: '1.1em', opacity: 0.9 }}>
              Welcome, Scholar {studentId || 'sample_student'}! Master the digital arts and build the future.
            </p>
          </div>

          {/* Progress Overview */}
          <div style={{
            background: 'linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%)',
            border: '3px solid #8B4513',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ color: '#8B4513', marginBottom: '15px' }}>📊 Academy Progress</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
              <div style={{ textAlign: 'center', padding: '10px', background: 'white', borderRadius: '8px', border: '2px solid #8B4513' }}>
                <div style={{ fontSize: '1.5em', color: '#3498db' }}>⚡</div>
                <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#8B4513' }}>{studentProgress.xp || 0}</div>
                <div style={{ fontSize: '0.9em', color: '#666' }}>XP Earned</div>
              </div>
              <div style={{ textAlign: 'center', padding: '10px', background: 'white', borderRadius: '8px', border: '2px solid #8B4513' }}>
                <div style={{ fontSize: '1.5em', color: '#e74c3c' }}>🔥</div>
                <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#8B4513' }}>{studentProgress.power || 0}</div>
                <div style={{ fontSize: '0.9em', color: '#666' }}>Power Level</div>
              </div>
              <div style={{ textAlign: 'center', padding: '10px', background: 'white', borderRadius: '8px', border: '2px solid #8B4513' }}>
                <div style={{ fontSize: '1.5em', color: '#f39c12' }}>🏆</div>
                <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#8B4513' }}>{studentProgress.level || 1}</div>
                <div style={{ fontSize: '0.9em', color: '#666' }}>Academy Level</div>
              </div>
              <div style={{ textAlign: 'center', padding: '10px', background: 'white', borderRadius: '8px', border: '2px solid #8B4513' }}>
                <div style={{ fontSize: '1.5em', color: '#27ae60' }}>✅</div>
                <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#8B4513' }}>
                  {Object.values(studentProgress.skills || {}).filter(skill => skill.unlocked).length}
                </div>
                <div style={{ fontSize: '0.9em', color: '#666' }}>Skills Mastered</div>
              </div>
            </div>
          </div>

          {/* Skills Grid */}
          <div style={{
            background: 'linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%)',
            border: '3px solid #8B4513',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ color: '#8B4513', marginBottom: '20px' }}>🎯 Skill Mastery Path</h2>
            
            {/* Tier 1 Skills */}
            <div style={{ marginBottom: '25px' }}>
              <h3 style={{ color: '#8B4513', marginBottom: '15px', borderBottom: '2px solid #8B4513', paddingBottom: '5px' }}>
                🥉 Foundation Tier (Tier 1)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                {Object.values(SKILL_TREE).filter(skill => skill.tier === 1).map(skill => {
                  const status = getSkillStatus(skill);
                  return (
                    <div
                      key={skill.id}
                      style={getSkillCardStyle(skill)}
                      onClick={() => handleSkillClick(skill)}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-5px)';
                        e.target.style.boxShadow = '0 8px 16px rgba(0,0,0,0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <h4 style={{ margin: '0', fontSize: '1.1em' }}>{skill.name}</h4>
                          <span style={{ fontSize: '1.2em' }}>{status.icon}</span>
                        </div>
                        <p style={{ margin: '0 0 10px 0', fontSize: '0.9em', opacity: 0.9, lineHeight: '1.3' }}>
                          {skill.description}
                        </p>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85em' }}>
                        <span>💪 {skill.competency}</span>
                        <span>⚡ +{skill.xpReward} XP</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tier 2 Skills */}
            <div style={{ marginBottom: '25px' }}>
              <h3 style={{ color: '#8B4513', marginBottom: '15px', borderBottom: '2px solid #8B4513', paddingBottom: '5px' }}>
                🥈 Intermediate Tier (Tier 2)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                {Object.values(SKILL_TREE).filter(skill => skill.tier === 2).map(skill => {
                  const status = getSkillStatus(skill);
                  return (
                    <div
                      key={skill.id}
                      style={getSkillCardStyle(skill)}
                      onClick={() => handleSkillClick(skill)}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-5px)';
                        e.target.style.boxShadow = '0 8px 16px rgba(0,0,0,0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <h4 style={{ margin: '0', fontSize: '1.1em' }}>{skill.name}</h4>
                          <span style={{ fontSize: '1.2em' }}>{status.icon}</span>
                        </div>
                        <p style={{ margin: '0 0 10px 0', fontSize: '0.9em', opacity: 0.9, lineHeight: '1.3' }}>
                          {skill.description}
                        </p>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85em' }}>
                        <span>💪 {skill.competency}</span>
                        <span>⚡ +{skill.xpReward} XP</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tier 3 Skills */}
            <div>
              <h3 style={{ color: '#8B4513', marginBottom: '15px', borderBottom: '2px solid #8B4513', paddingBottom: '5px' }}>
                🥇 Advanced Tier (Tier 3)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                {Object.values(SKILL_TREE).filter(skill => skill.tier === 3).map(skill => {
                  const status = getSkillStatus(skill);
                  return (
                    <div
                      key={skill.id}
                      style={getSkillCardStyle(skill)}
                      onClick={() => handleSkillClick(skill)}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-5px)';
                        e.target.style.boxShadow = '0 8px 16px rgba(0,0,0,0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <h4 style={{ margin: '0', fontSize: '1.1em' }}>{skill.name}</h4>
                          <span style={{ fontSize: '1.2em' }}>{status.icon}</span>
                        </div>
                        <p style={{ margin: '0 0 10px 0', fontSize: '0.9em', opacity: 0.9, lineHeight: '1.3' }}>
                          {skill.description}
                        </p>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85em' }}>
                        <span>💪 {skill.competency}</span>
                        <span>⚡ +{skill.xpReward} XP</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* AI Assistant */}
          <div style={{
            background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
            border: '3px solid #8B4513',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            color: 'white',
            textAlign: 'center',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
          }}>
            <div style={{ fontSize: '2em', marginBottom: '10px' }}>🤖</div>
            <h3 style={{ margin: '0 0 10px 0' }}>Web Development Advisor</h3>
            <p style={{ margin: '0 0 15px 0', fontSize: '0.9em', opacity: 0.9 }}>
              Get personalized coding help and guidance from your AI mentor.
            </p>
            <button
              onClick={() => setShowAIChat(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                padding: '10px 20px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.9em',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              💬 Chat with AI
            </button>
          </div>

          {/* Competency Profile */}
          <div style={{
            background: 'linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%)',
            border: '3px solid #8B4513',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ color: '#8B4513', marginBottom: '15px' }}>🎯 Competency Profile</h3>
            {Object.entries(competencies).map(([competency, score]) => (
              <div key={competency} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '0.9em', fontWeight: 'bold', color: '#8B4513' }}>{competency}</span>
                  <span style={{ fontSize: '0.9em', color: '#666' }}>{score}%</span>
                </div>
                <div style={{
                  background: '#E9ECEF',
                  borderRadius: '10px',
                  height: '8px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    background: score >= 70 ? '#27ae60' : score >= 40 ? '#f39c12' : '#e74c3c',
                    width: `${score}%`,
                    height: '100%',
                    borderRadius: '10px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* Powered by Claude Card */}
          <div style={{ 
            background: 'linear-gradient(135deg, #F0F8FF 0%, #E6F3FF 100%)',
            border: '3px solid #8B4513',
            borderRadius: '12px',
            padding: '15px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '8px',
              color: '#1E40AF', 
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              <span style={{ fontSize: '16px' }}>🤖</span>
              Powered by Claude 4 Sonnet
            </div>
            <div style={{ 
              color: '#1E40AF', 
              fontSize: '11px',
              marginTop: '4px',
              opacity: 0.8
            }}>
              Advanced AI for competency analysis
            </div>
          </div>

          {/* Enhanced Messaging Section */}
          <div style={{
            background: 'linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%)',
            border: '3px solid #8B4513',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ color: '#8B4513', marginBottom: '15px' }}>💬 Collaboration Hub</h3>
            <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '15px' }}>
              Connect with classmates, share code, and collaborate on projects.
            </p>
            
            <button
              onClick={() => setShowMessageCenter(true)}
              style={{
                marginTop: '10px',
                width: '100%',
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 3px 6px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 3px 6px rgba(0,0,0,0.2)';
              }}
            >
              💻 Enhanced Messages
              <span style={{ 
                background: 'rgba(255, 255, 255, 0.2)', 
                borderRadius: '12px', 
                padding: '2px 6px', 
                fontSize: '10px' 
              }}>
                NEW
              </span>
            </button>

            <div style={{
              marginTop: '12px',
              fontSize: '11px',
              color: '#666',
              textAlign: 'center',
              padding: '8px',
              background: 'rgba(52, 152, 219, 0.1)',
              borderRadius: '6px'
            }}>
              ✨ Now with code sharing, file uploads, and smart formatting!
            </div>
          </div>

          {/* PIN Management */}
          <div style={{
            background: 'linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%)',
            border: '3px solid #8B4513',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ color: '#8B4513', marginBottom: '15px' }}>🔐 Account Security</h3>
            <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '15px' }}>
              Manage your PIN to keep your progress safe.
            </p>
            
            <button
              onClick={() => setShowPinManager(true)}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 3px 6px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 3px 6px rgba(0,0,0,0.2)';
              }}
            >
              🔑 Manage PIN
            </button>
            
            {pinMessage && (
              <div style={{
                marginTop: '10px',
                padding: '8px',
                borderRadius: '6px',
                background: pinMessage.includes('success') ? '#d4edda' : '#f8d7da',
                color: pinMessage.includes('success') ? '#155724' : '#721c24',
                fontSize: '0.85em',
                textAlign: 'center'
              }}>
                {pinMessage}
              </div>
            )}
          </div>

          {/* Recommended Next Steps */}
          <div style={{
            background: 'linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%)',
            border: '3px solid #8B4513',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ color: '#8B4513', marginBottom: '15px' }}>🚀 Recommended Next Steps</h3>
            <div style={{ fontSize: '0.9em', lineHeight: '1.6', color: '#333' }}>
              {Object.values(SKILL_TREE)
                .filter(skill => !isSkillUnlocked(skill.id) && isSkillAvailable(skill))
                .slice(0, 3)
                .map((skill, index) => (
                  <div 
                    key={skill.id}
                    style={{ 
                      marginBottom: '10px',
                      padding: '10px',
                      background: 'white',
                      borderRadius: '8px',
                      border: '1px solid #dee2e6',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleSkillClick(skill)}
                  >
                    <strong style={{ color: '#8B4513' }}>
                      {index + 1}. {skill.name}
                    </strong>
                    <div style={{ fontSize: '0.85em', color: '#666', marginTop: '5px' }}>
                      +{skill.xpReward} XP • {skill.competency}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Daily Reflections */}
          <DailyReflections studentId={studentId || 'sample_student'} />
        </div>
      </div>

      {/* Modals and Overlays */}
      {showDocumentModal && selectedSkill && (
        <DocumentModal
          skill={selectedSkill}
          studentId={studentId || 'sample_student'}
          onClose={() => {
            setShowDocumentModal(false);
            setSelectedSkill(null);
          }}
          onSubmitEvidence={(skillId) => {
            unlockSkill(skillId);
            setShowDocumentModal(false);
            setSelectedSkill(null);
          }}
        />
      )}

      {showAchievement && (
        <AchievementToast
          achievement={showAchievement}
          onClose={() => setShowAchievement(null)}
        />
      )}

      {showAIChat && (
        <CodeCriticChat
          studentId={studentId || 'sample_student'}
          onClose={() => setShowAIChat(false)}
        />
      )}

      {showPinManager && (
        <PinManager
          studentId={studentId || 'sample_student'}
          onClose={() => setShowPinManager(false)}
          onMessage={setPinMessage}
        />
      )}

      {/* Enhanced Message Center */}
      {showMessageCenter && (
        <EnhancedMessageCenter
          studentId={studentId || 'sample_student'}
          onClose={() => setShowMessageCenter(false)}
        />
      )}

      {/* Message Notifications - show even when MessageCenter is closed */}
      {!showMessageCenter && (
        <MessageNotifications
          studentId={studentId || 'sample_student'}
          onOpenMessage={handleOpenMessageFromNotification}
        />
      )}
    </div>
  );
};

export default CivDashboard;
