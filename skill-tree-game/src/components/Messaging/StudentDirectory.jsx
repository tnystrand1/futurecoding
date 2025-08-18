import React, { useState, useEffect } from 'react';
import messagingService from '../../services/messagingService';

const StudentDirectory = ({ currentStudentId, onStartConversation, onBack }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all'); // 'all', 'online', 'available'

  useEffect(() => {
    loadStudents();
  }, [currentStudentId]);

  const loadStudents = async () => {
    try {
      const studentList = await messagingService.getStudentDirectory(currentStudentId);
      setStudents(studentList);
    } catch (error) {
      console.error('Error loading student directory:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    // Search filter
    if (searchTerm && !student.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Status filter
    if (filterBy === 'online' && !student.isOnline) {
      return false;
    }

    // For 'available' filter, we could check if they're not in Do Not Disturb mode
    // For now, we'll just use the online status
    if (filterBy === 'available' && !student.isOnline) {
      return false;
    }

    return true;
  });

  const getStudentStatusIcon = (student) => {
    if (student.isOnline) {
      return { icon: '🟢', text: 'Online' };
    }
    return { icon: '⚫', text: 'Offline' };
  };

  const getMutualSkillsCount = (student) => {
    // Get current student's skills from localStorage or mock data
    const currentStudentSkills = getCurrentStudentSkills();
    const otherStudentSkills = getStudentSkills(student.id);
    
    if (!currentStudentSkills || !otherStudentSkills) {
      return 0; // No data available
    }
    
    // Count mutual unlocked skills
    const mutualUnlockedSkills = currentStudentSkills.filter(skill => 
      otherStudentSkills.includes(skill)
    ).length;
    
    // Count mutual competency areas (high scores in same competencies)
    const mutualCompetencies = getMutualCompetencies(currentStudentId, student.id);
    
    // Total mutual interests = shared skills + shared competency strengths
    return Math.min(mutualUnlockedSkills + mutualCompetencies, 10); // Cap at 10
  };

  const getMutualInterestsDetails = (student) => {
    const currentStudentSkills = getCurrentStudentSkills();
    const otherStudentSkills = getStudentSkills(student.id);
    
    if (!currentStudentSkills || !otherStudentSkills) {
      return { skills: [], competencies: [], description: 'No shared data available' };
    }
    
    // Get shared skills
    const sharedSkills = currentStudentSkills.filter(skill => 
      otherStudentSkills.includes(skill)
    );
    
    // Get shared competencies
    const student1Competencies = getStudentCompetencies(currentStudentId);
    const student2Competencies = getStudentCompetencies(student.id);
    const sharedCompetencies = [];
    
    if (student1Competencies && student2Competencies) {
      const competencyAreas = ['Communication', 'Continuous Learning', 'STEAM Interest', 'Critical Thinking'];
      competencyAreas.forEach(competency => {
        const score1 = student1Competencies[competency] || 0;
        const score2 = student2Competencies[competency] || 0;
        if (score1 > 60 && score2 > 60) {
          sharedCompetencies.push(competency);
        }
      });
    }
    
    // Create description
    let description = '';
    if (sharedSkills.length > 0) {
      description += `Shared skills: ${sharedSkills.join(', ')}`;
    }
    if (sharedCompetencies.length > 0) {
      if (description) description += ' | ';
      description += `Strong in: ${sharedCompetencies.join(', ')}`;
    }
    if (!description) {
      description = 'Different learning paths - great for sharing perspectives!';
    }
    
    return {
      skills: sharedSkills,
      competencies: sharedCompetencies,
      description
    };
  };

  const getCurrentStudentSkills = () => {
    try {
      // Try to get from localStorage first
      const savedProgress = localStorage.getItem(`student_${currentStudentId}_progress`);
      if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        return Object.keys(progress.skills || {}).filter(skillId => 
          progress.skills[skillId]?.unlocked
        );
      }
      
      // Fallback: mock some skills based on student ID for demonstration
      const mockSkills = {
        'sample_student': ['html_basics', 'css_fundamentals', 'code_implementation'],
        'sample_student_1': ['html_basics', 'css_fundamentals', 'javascript_intro'],
        'sample_student_2': ['css_fundamentals', 'code_implementation', 'advanced_css'],
        'sample_student_3': ['html_basics', 'javascript_intro', 'image_generation'],
        'sample_student_4': ['code_implementation', 'advanced_css', 'image_embedding']
      };
      
      return mockSkills[currentStudentId] || ['html_basics'];
    } catch (error) {
      console.warn('Error getting current student skills:', error);
      return ['html_basics']; // Safe fallback
    }
  };

  const getStudentSkills = (studentId) => {
    try {
      // Try to get from localStorage first
      const savedProgress = localStorage.getItem(`student_${studentId}_progress`);
      if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        return Object.keys(progress.skills || {}).filter(skillId => 
          progress.skills[skillId]?.unlocked
        );
      }
      
      // Fallback: mock skills for sample students
      const mockSkills = {
        'sample_student': ['html_basics', 'css_fundamentals', 'code_implementation'],
        'sample_student_1': ['html_basics', 'css_fundamentals', 'javascript_intro'],
        'sample_student_2': ['css_fundamentals', 'code_implementation', 'advanced_css'],
        'sample_student_3': ['html_basics', 'javascript_intro', 'image_generation'],
        'sample_student_4': ['code_implementation', 'advanced_css', 'image_embedding']
      };
      
      return mockSkills[studentId] || ['html_basics'];
    } catch (error) {
      console.warn('Error getting student skills for', studentId, error);
      return ['html_basics']; // Safe fallback
    }
  };

  const getMutualCompetencies = (studentId1, studentId2) => {
    try {
      // Get competency data from localStorage or calculate from skills
      const student1Competencies = getStudentCompetencies(studentId1);
      const student2Competencies = getStudentCompetencies(studentId2);
      
      if (!student1Competencies || !student2Competencies) {
        return 0;
      }
      
      // Count competencies where both students have high scores (>60%)
      let mutualHighCompetencies = 0;
      const competencyAreas = ['Communication', 'Continuous Learning', 'STEAM Interest', 'Critical Thinking'];
      
      competencyAreas.forEach(competency => {
        const score1 = student1Competencies[competency] || 0;
        const score2 = student2Competencies[competency] || 0;
        if (score1 > 60 && score2 > 60) {
          mutualHighCompetencies++;
        }
      });
      
      return mutualHighCompetencies;
    } catch (error) {
      console.warn('Error calculating mutual competencies:', error);
      return 0;
    }
  };

  const getStudentCompetencies = (studentId) => {
    try {
      // Try localStorage first
      const savedProgress = localStorage.getItem(`student_${studentId}_progress`);
      if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        // Calculate competencies from skills (simplified)
        const skills = progress.skills || {};
        const competencies = {
          'Communication': 0,
          'Continuous Learning': 0,
          'STEAM Interest': 0,
          'Critical Thinking': 0
        };
        
        // Simple competency calculation based on skills
        Object.keys(skills).forEach(skillId => {
          if (skills[skillId]?.unlocked) {
            // Each skill contributes to competencies (simplified mapping)
            competencies['Communication'] += 25;
            competencies['Continuous Learning'] += 20;
            competencies['STEAM Interest'] += 30;
            competencies['Critical Thinking'] += 25;
          }
        });
        
        return competencies;
      }
      
      // Mock competency data for sample students
      const mockCompetencies = {
        'sample_student': { 'Communication': 75, 'Continuous Learning': 80, 'STEAM Interest': 70, 'Critical Thinking': 65 },
        'sample_student_1': { 'Communication': 85, 'Continuous Learning': 60, 'STEAM Interest': 90, 'Critical Thinking': 70 },
        'sample_student_2': { 'Communication': 60, 'Continuous Learning': 95, 'STEAM Interest': 75, 'Critical Thinking': 80 },
        'sample_student_3': { 'Communication': 90, 'Continuous Learning': 70, 'STEAM Interest': 85, 'Critical Thinking': 60 },
        'sample_student_4': { 'Communication': 70, 'Continuous Learning': 85, 'STEAM Interest': 95, 'Critical Thinking': 75 }
      };
      
      return mockCompetencies[studentId] || { 'Communication': 50, 'Continuous Learning': 50, 'STEAM Interest': 50, 'Critical Thinking': 50 };
    } catch (error) {
      console.warn('Error getting competencies for', studentId, error);
      return { 'Communication': 50, 'Continuous Learning': 50, 'STEAM Interest': 50, 'Critical Thinking': 50 };
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        background: '#F4E4BC',
        color: '#8B4513',
        fontSize: '16px'
      }}>
        Loading classmates...
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#F4E4BC'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #8B4513'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          marginBottom: '15px'
        }}>
          <button
            onClick={onBack}
            style={{
              background: 'rgba(139, 69, 19, 0.1)',
              color: '#8B4513',
              border: '1px solid #8B4513',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ← Back
          </button>
          
          <h3 style={{
            margin: 0,
            color: '#8B4513',
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            Start a Conversation
          </h3>
        </div>

        {/* Search and Filters */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search classmates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '10px',
              border: '2px solid #8B4513',
              borderRadius: '6px',
              fontSize: '14px',
              background: 'rgba(255, 255, 255, 0.8)'
            }}
          />
          
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            style={{
              padding: '10px',
              border: '2px solid #8B4513',
              borderRadius: '6px',
              fontSize: '14px',
              background: 'rgba(255, 255, 255, 0.8)',
              color: '#8B4513'
            }}
          >
            <option value="all">All Students</option>
            <option value="online">Online Now</option>
            <option value="available">Available to Chat</option>
          </select>
        </div>
      </div>

      {/* Students List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px 0'
      }}>
        {filteredStudents.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#8B4513',
            fontSize: '16px'
          }}>
            {students.length === 0 ? (
              <div>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>👥</div>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>No classmates found</div>
                <div style={{ fontSize: '14px', opacity: 0.7 }}>
                  Other students will appear here once they join conversations
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔍</div>
                <div>No students match your search or filter</div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: '0 20px' }}>
            {filteredStudents.map((student) => {
              const status = getStudentStatusIcon(student);
              const mutualSkills = getMutualSkillsCount(student);
              const mutualInterestsDetails = getMutualInterestsDetails(student);
              
              // Extract avatar properties safely to avoid React serialization issues
              // Handle both simple string avatars and complex avatar objects
              const avatarColor1 = (typeof student.avatar === 'object' ? student.avatar?.color1 : null) || '#FF8C42';
              const avatarEmoji = (typeof student.avatar === 'object' ? student.avatar?.emoji : student.avatar) || '👤';
              
              return (
                <div
                  key={student.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '15px 20px',
                    marginBottom: '10px',
                    background: 'rgba(255, 255, 255, 0.6)',
                    border: '1px solid rgba(139, 69, 19, 0.2)',
                    borderRadius: '12px',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.6)';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    position: 'relative',
                    marginRight: '15px'
                  }}>
                    <div style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${avatarColor1} 0%, #FF6B1A 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      border: '3px solid #8B4513'
                    }}>
                      {avatarEmoji}
                    </div>
                    
                    {/* Status indicator */}
                    <div style={{
                      position: 'absolute',
                      bottom: '2px',
                      right: '2px',
                      fontSize: '12px',
                      background: 'white',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #8B4513'
                    }}>
                      {status.icon}
                    </div>
                  </div>

                  {/* Student Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: 'bold',
                      fontSize: '16px',
                      color: '#8B4513',
                      marginBottom: '4px'
                    }}>
                      {student.name}
                    </div>
                    
                    <div style={{
                      fontSize: '12px',
                      color: '#8B4513',
                      opacity: 0.7,
                      marginBottom: '6px'
                    }}>
                      {status.text}
                    </div>

                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      fontSize: '11px',
                      color: '#8B4513',
                      opacity: 0.8
                    }}>
                      <span 
                        title={mutualInterestsDetails.description}
                        style={{ cursor: 'help' }}
                      >
                        🎯 {mutualSkills} {mutualSkills === 1 ? 'shared interest' : 'shared interests'}
                      </span>
                      <span>💬 Available to chat</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartConversation(student.id, student);
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 16px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.2)';
                      }}
                    >
                      💬 Message
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tips */}
      <div style={{
        padding: '15px 20px',
        borderTop: '1px solid rgba(139, 69, 19, 0.2)',
        background: 'rgba(139, 69, 19, 0.02)'
      }}>
        <div style={{
          fontSize: '12px',
          color: '#8B4513',
          opacity: 0.7,
          textAlign: 'center',
          lineHeight: '1.4'
        }}>
          💡 Great conversation starters: Ask for help, offer to collaborate, share what you're working on, or give feedback!
        </div>
      </div>
    </div>
  );
};

export default StudentDirectory;
