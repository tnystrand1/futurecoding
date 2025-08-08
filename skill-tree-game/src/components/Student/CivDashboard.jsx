import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { SKILL_TREE } from '../../data/skillTreeData';
import DocumentModal from '../Documentation/DocumentModal';
import AchievementToast from '../Shared/AchievementToast';
import LoadingSpinner from '../Shared/LoadingSpinner';
import CodeCriticChat from '../AI/CodeCriticChat';
import { useGameState } from '../../hooks/useGameState';
import { GameLogic } from '../../utils/gameLogic';
import '../../styles/civilization.css';

const CivDashboard = () => {
  const { studentId } = useParams();
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showAchievement, setShowAchievement] = useState(null);
  const [showAIChat, setShowAIChat] = useState(false);
  
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
    const skillData = studentProgress.skills?.[skill.id];
    
    // Pass both skill definition and current student data for this skill
    const enrichedSkill = {
      ...skill,
      studentData: skillData // This includes evidence, status, etc.
    };
    
    setSelectedSkill(enrichedSkill);
    setShowDocumentModal(true);
  };

  const handleDocumentSubmit = async (skillId, evidence) => {
    const result = await unlockSkill(skillId, evidence);
    if (result.success) {
      setShowDocumentModal(false);
      if (result.isPending) {
        alert(result.message); // Show pending approval message
      } else {
        // Show success message for immediate unlocks (if any)
        alert(result.message || 'Skill unlocked successfully!');
      }
    } else {
      alert(`Error submitting evidence: ${result.error}`);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="error">Error: {error}</div>;

  const studentName = studentProgress.name || studentId.replace(/_/g, ' ');
  const unlockedSkillsCount = Object.values(studentProgress.skills || {})
    .filter(skill => skill.unlocked).length;

  // Helper functions for skill state
  const isSkillUnlocked = (skillId) => {
    return studentProgress.skills?.[skillId]?.unlocked || false;
  };

  const isSkillPending = (skillId) => {
    return studentProgress.skills?.[skillId]?.evidenceSubmitted && 
           studentProgress.skills?.[skillId]?.evidence?.status === 'pending';
  };

  const isSkillRejected = (skillId) => {
    return studentProgress.skills?.[skillId]?.evidence?.status === 'rejected';
  };
  
  const isSkillAvailable = (skill) => {
    if (skill.tier === 1) return true;
    return skill.prerequisites.every(prereq => isSkillUnlocked(prereq));
  };

  const getSkillsByTier = (tier) => {
    return Object.values(SKILL_TREE).filter(skill => skill.tier === tier);
  };

  const getNextRecommendedSkills = () => {
    const availableSkills = Object.values(SKILL_TREE)
      .filter(skill => !isSkillUnlocked(skill.id) && isSkillAvailable(skill))
      .slice(0, 3);
    return availableSkills;
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
      fontFamily: 'serif'
    }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
        padding: '20px 0',
        textAlign: 'center',
        borderBottom: '4px solid #654321'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '15px',
          color: '#F4E4BC',
          fontSize: '28px',
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
        }}>
                      🏛️ FUTURE CODING ACADEMY
        </div>
        <div style={{ 
          color: '#F4E4BC', 
          fontSize: '16px', 
          marginTop: '8px',
          opacity: 0.9
        }}>
          Master the Arts of AI-Powered Web Development
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        padding: '20px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Left Sidebar - Student Info */}
        <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Student Card */}
          <div style={{ 
            background: 'linear-gradient(135deg, #F4E4BC 0%, #E6D5A8 100%)',
            border: '3px solid #8B4513',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
          }}>
            <div style={{ 
              width: '60px',
              height: '60px',
              background: studentProgress.avatar?.color1 ? 
                `linear-gradient(135deg, ${studentProgress.avatar.color1} 0%, ${studentProgress.avatar.color2 || studentProgress.avatar.color1} 100%)` :
                'linear-gradient(135deg, #FF8C42 0%, #FF6B1A 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 15px',
              fontSize: '24px',
              border: '3px solid #8B4513'
            }}>
              {studentProgress.avatar?.emoji || '👤'}
            </div>
            <h3 style={{ 
              color: '#8B4513', 
              margin: '0 0 10px', 
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              {studentProgress.name || studentId?.replace(/_/g, ' ') || 'Student'}
            </h3>
            <div style={{ 
              background: '#CD853F',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 'bold',
              display: 'inline-block',
              marginBottom: '15px'
            }}>
              Developing
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '15px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#8B4513', fontSize: '12px' }}>⭐ Level</div>
                <div style={{ color: '#8B4513', fontSize: '20px', fontWeight: 'bold' }}>
                  {levelProgress?.level || 2}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#8B4513', fontSize: '12px' }}>⚡ Power</div>
                <div style={{ color: '#8B4513', fontSize: '20px', fontWeight: 'bold' }}>
                  {studentProgress.websitePower || 15}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '15px' }}>
              <div style={{ color: '#8B4513', fontSize: '12px', marginBottom: '5px' }}>
                Experience Progress
              </div>
              <div style={{ 
                background: '#8B4513',
                height: '8px',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  background: 'linear-gradient(90deg, #FFD700 0%, #FF8C42 100%)',
                  height: '100%',
                  width: `${GameLogic.calculateLevelProgress(studentProgress.totalXP || 0).progress}%`,
                  borderRadius: '4px'
                }} />
              </div>
              <div style={{ 
                color: '#8B4513', 
                fontSize: '11px', 
                textAlign: 'center',
                marginTop: '3px'
              }}>
                {GameLogic.calculateLevelProgress(studentProgress.totalXP || 0).xpInCurrentLevel} / {GameLogic.calculateLevelProgress(studentProgress.totalXP || 0).xpNeededForNext} XP
              </div>
            </div>

            <div style={{ marginTop: '15px' }}>
              <div style={{ color: '#8B4513', fontSize: '12px', marginBottom: '5px' }}>
                🏆 Skills Unlocked
              </div>
              <div style={{ color: '#8B4513', fontSize: '18px', fontWeight: 'bold' }}>
                {unlockedSkillsCount}
              </div>
            </div>

            {/* AI Chat Button */}
            <button
              onClick={() => setShowAIChat(true)}
              style={{
                marginTop: '15px',
                width: '100%',
                background: 'linear-gradient(135deg, #9147FF 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
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
                e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
              }}
            >
              🤖 Chat with CodeCritic
            </button>
          </div>

          {/* Competency Profile */}
          <div style={{ 
            background: 'linear-gradient(135deg, #E6E6FA 0%, #D8BFD8 100%)',
            border: '3px solid #8B4513',
            borderRadius: '12px',
            padding: '15px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
          }}>
            <h4 style={{ 
              color: '#4B0082', 
              margin: '0 0 15px', 
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📊 Competency Profile
            </h4>
            
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px' }}>🔧</span>
                <span style={{ color: '#4B0082', fontSize: '12px' }}>STEAM Interest</span>
                <span style={{ color: '#4B0082', fontSize: '12px', fontWeight: 'bold' }}>{competencies.steamInterest}</span>
              </div>
              <div style={{ 
                background: '#4B0082',
                height: '4px',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  background: '#9370DB',
                  height: '100%',
                  width: `${(parseFloat(competencies.steamInterest) / 5.0) * 100}%`
                }} />
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px' }}>💬</span>
                <span style={{ color: '#4B0082', fontSize: '12px' }}>Communication</span>
                <span style={{ color: '#4B0082', fontSize: '12px', fontWeight: 'bold' }}>{competencies.communication}</span>
              </div>
              <div style={{ 
                background: '#4B0082',
                height: '4px',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  background: '#9370DB',
                  height: '100%',
                  width: `${(parseFloat(competencies.communication) / 5.0) * 100}%`
                }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px' }}>🌱</span>
                <span style={{ color: '#4B0082', fontSize: '12px' }}>Continuous Learning</span>
                <span style={{ color: '#4B0082', fontSize: '12px', fontWeight: 'bold' }}>{competencies.continuousLearning}</span>
              </div>
              <div style={{ 
                background: '#4B0082',
                height: '4px',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  background: '#9370DB',
                  height: '100%',
                  width: `${(parseFloat(competencies.continuousLearning) / 5.0) * 100}%`
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* Center - Main Skill Tree */}
        <div style={{ flex: 1 }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #F4E4BC 0%, #E6D5A8 100%)',
            border: '3px solid #8B4513',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ 
                color: '#8B4513', 
                margin: '0',
                fontSize: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                ☀️ Web Development Technologies
              </h2>
            </div>
            
            <div style={{ 
              color: '#8B4513', 
              fontSize: '14px', 
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              Master the skills to build amazing websites with AI
            </div>

            {/* Tier-based Skill Layout */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Foundations (Tier 1) */}
              <div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  marginBottom: '15px'
                }}>
                  <span style={{ 
                    background: '#4CAF50',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    ⭕ Foundations (Tier 1)
                  </span>
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(4, 1fr)', 
                  gap: '15px' 
                }}>
                  {getSkillsByTier(1).map(skill => (
                    <div
                      key={skill.id}
                      onClick={() => handleSkillClick(skill)}
                      style={{
                        background: isSkillUnlocked(skill.id) 
                          ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
                          : isSkillAvailable(skill) 
                          ? 'linear-gradient(135deg, #FF9800 0%, #f57c00 100%)'
                          : 'linear-gradient(135deg, #9E9E9E 0%, #757575 100%)',
                        border: '2px solid #8B4513',
                        borderRadius: '8px',
                        padding: '15px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        transition: 'transform 0.2s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}
                      onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    >
                      <div style={{ fontSize: '20px', marginBottom: '8px' }}>
                        {skill.id === 'cultural_mapping' ? '🎨' :
                         skill.id === 'client_discovery' ? '🤝' :
                         skill.id === 'descriptive_prompting' ? '💬' :
                         skill.id === 'code_implementation' ? '⚡' : '📚'}
                      </div>
                      <div style={{ marginBottom: '5px' }}>{skill.name}</div>
                      <div style={{ 
                        background: 'rgba(0,0,0,0.2)',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        fontSize: '10px'
                      }}>
                        Tier 1
                      </div>
                      <div style={{ 
                        fontSize: '10px', 
                        marginTop: '5px',
                        color: isSkillRejected(skill.id) ? '#e74c3c' : 'inherit',
                        fontWeight: isSkillRejected(skill.id) ? 'bold' : 'normal'
                      }}>
                        {isSkillUnlocked(skill.id) ? 'unlocked' : 
                         isSkillPending(skill.id) ? 'pending approval' :
                         isSkillRejected(skill.id) ? 'rejected - click to see why' :
                         isSkillAvailable(skill) ? 'developing' : 'locked'}
                      </div>
                      <div style={{ fontSize: '10px', marginTop: '2px' }}>
                        +{skill.xpReward || 50} XP
                      </div>
                      {isSkillUnlocked(skill.id) && (
                        <div style={{ 
                          position: 'absolute',
                          top: '5px',
                          right: '5px',
                          background: '#2E7D32',
                          borderRadius: '50%',
                          width: '16px',
                          height: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px'
                        }}>
                          ✓
                        </div>
                      )}
                      {!isSkillUnlocked(skill.id) && isSkillAvailable(skill) && (
                        <div style={{ 
                          position: 'absolute',
                          top: '5px',
                          right: '5px',
                          background: '#F57C00',
                          borderRadius: '50%',
                          width: '16px',
                          height: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px'
                        }}>
                          📤
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Intermediate (Tier 2) */}
              <div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  marginBottom: '15px'
                }}>
                  <span style={{ 
                    background: '#FF9800',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    ⭕ Intermediate (Tier 2)
                  </span>
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(4, 1fr)', 
                  gap: '15px' 
                }}>
                  {getSkillsByTier(2).map(skill => (
                    <div
                      key={skill.id}
                      onClick={() => handleSkillClick(skill)}
                      style={{
                        background: isSkillUnlocked(skill.id) 
                          ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
                          : isSkillAvailable(skill) 
                          ? 'linear-gradient(135deg, #FF9800 0%, #f57c00 100%)'
                          : 'linear-gradient(135deg, #9E9E9E 0%, #757575 100%)',
                        border: '2px solid #8B4513',
                        borderRadius: '8px',
                        padding: '15px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        position: 'relative',
                        transition: 'transform 0.2s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}
                      onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    >
                      <div style={{ fontSize: '20px', marginBottom: '8px' }}>🔒</div>
                      <div style={{ marginBottom: '5px' }}>{skill.name}</div>
                      <div style={{ 
                        background: 'rgba(0,0,0,0.2)',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        fontSize: '10px'
                      }}>
                        Tier 2
                      </div>
                      <div style={{ 
                        fontSize: '10px', 
                        marginTop: '5px',
                        color: isSkillRejected(skill.id) ? '#e74c3c' : 'inherit',
                        fontWeight: isSkillRejected(skill.id) ? 'bold' : 'normal'
                      }}>
                        {isSkillUnlocked(skill.id) ? 'unlocked' : 
                         isSkillPending(skill.id) ? 'pending approval' :
                         isSkillRejected(skill.id) ? 'rejected - click to see why' :
                         isSkillAvailable(skill) ? 'developing' : 'locked'}
                      </div>
                      <div style={{ fontSize: '10px', marginTop: '2px' }}>
                        +{skill.xpReward || 100} XP
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advanced (Tier 3) */}
              <div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  marginBottom: '15px'
                }}>
                  <span style={{ 
                    background: '#F44336',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    ⭕ Advanced (Tier 3)
                  </span>
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(4, 1fr)', 
                  gap: '15px' 
                }}>
                  {getSkillsByTier(3).map(skill => (
                    <div
                      key={skill.id}
                      onClick={() => handleSkillClick(skill)}
                      style={{
                        background: 'linear-gradient(135deg, #9E9E9E 0%, #757575 100%)',
                        border: '2px solid #8B4513',
                        borderRadius: '8px',
                        padding: '15px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        transition: 'transform 0.2s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}
                      onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    >
                      <div style={{ fontSize: '20px', marginBottom: '8px' }}>🔒</div>
                      <div style={{ marginBottom: '5px' }}>{skill.name}</div>
                      <div style={{ 
                        background: 'rgba(0,0,0,0.2)',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        fontSize: '10px'
                      }}>
                        Tier 3
                      </div>
                      <div style={{ fontSize: '10px', marginTop: '5px' }}>locked</div>
                      <div style={{ fontSize: '10px', marginTop: '2px' }}>
                        +{skill.xpReward || 150} XP
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Web Development Advisor */}
          <div style={{ 
            background: 'linear-gradient(135deg, #E1BEE7 0%, #CE93D8 100%)',
            border: '3px solid #8B4513',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
          }}>
            <div style={{ 
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 15px',
              fontSize: '24px',
              border: '3px solid #8B4513'
            }}>
              💡
            </div>
            <h3 style={{ 
              color: '#4A148C', 
              margin: '0 0 15px', 
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              Web Development Advisor
            </h3>
            
            <div style={{ 
              background: 'rgba(255,255,255,0.3)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '15px'
            }}>
              <div style={{ 
                color: '#4A148C', 
                fontSize: '14px', 
                fontWeight: 'bold',
                marginBottom: '5px'
              }}>
                {(studentProgress.name || studentId?.replace(/_/g, ' ') || 'Student')}'s Digital Realm
              </div>
              <div style={{ color: '#4A148C', fontSize: '12px', lineHeight: '1.4' }}>
                Website Power: {studentProgress.websitePower || 0}<br/>
                Unlocked Skills: {Object.values(studentProgress.skills || {}).filter(skill => skill.unlocked).length}<br/>
                Development Stage: {studentProgress.currentLevel > 3 ? 'Advanced' : studentProgress.currentLevel > 1 ? 'Intermediate' : 'Novice'}
              </div>
            </div>

            <div>
              <div style={{ 
                color: '#4A148C', 
                fontSize: '14px', 
                fontWeight: 'bold',
                marginBottom: '8px'
              }}>
                Experience Progress
              </div>
              <div style={{ 
                background: '#4A148C',
                height: '8px',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  background: 'linear-gradient(90deg, #E1BEE7 0%, #CE93D8 100%)',
                  height: '100%',
                  width: `${GameLogic.calculateLevelProgress(studentProgress.totalXP || 0).progress}%`
                }} />
              </div>
              <div style={{ 
                color: '#4A148C', 
                fontSize: '11px', 
                textAlign: 'center',
                marginTop: '3px'
              }}>
                {GameLogic.calculateLevelProgress(studentProgress.totalXP || 0).xpInCurrentLevel} / {GameLogic.calculateLevelProgress(studentProgress.totalXP || 0).xpNeededForNext}
              </div>
            </div>
          </div>

          {/* Recommended Next Steps */}
          <div style={{ 
            background: 'linear-gradient(135deg, #C8E6C9 0%, #A5D6A7 100%)',
            border: '3px solid #8B4513',
            borderRadius: '12px',
            padding: '15px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
          }}>
            <h4 style={{ 
              color: '#1B5E20', 
              margin: '0 0 15px', 
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🎯 Recommended Next Steps
            </h4>
            
            {getNextRecommendedSkills().map((skill, index) => (
              <div 
                key={skill.id}
                onClick={() => handleSkillClick(skill)}
                style={{ 
                  background: 'rgba(255,255,255,0.5)',
                  border: '2px solid #4CAF50',
                  borderRadius: '8px',
                  padding: '10px',
                  marginBottom: '10px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                <div style={{ 
                  color: '#1B5E20', 
                  fontSize: '13px', 
                  fontWeight: 'bold',
                  marginBottom: '4px'
                }}>
                  {skill.name}
                </div>
                <div style={{ 
                  color: '#2E7D32', 
                  fontSize: '11px',
                  marginBottom: '4px'
                }}>
                  Tier {skill.tier}
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between'
                }}>
                  <span style={{ fontSize: '10px', color: '#1B5E20' }}>
                    {index === 0 ? '→' : index === 1 ? '→' : '→'}
                  </span>
                </div>
              </div>
            ))}

            {getNextRecommendedSkills().length === 0 && (
              <div style={{ 
                color: '#1B5E20', 
                fontSize: '12px', 
                textAlign: 'center',
                fontStyle: 'italic'
              }}>
                Complete more skills to unlock recommendations
              </div>
            )}
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

      {showAIChat && (
        <CodeCriticChat
          studentId={studentId || 'sample_student'}
          studentData={studentProgress}
          onClose={() => setShowAIChat(false)}
        />
      )}
    </div>
  );
};

export default CivDashboard;