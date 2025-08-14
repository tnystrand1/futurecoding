import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase-config';
import { aiService } from '../../services/aiService';

const DailyReflections = ({ studentId }) => {
  const [reflections, setReflections] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  const [currentDay, setCurrentDay] = useState(1);
  const [formData, setFormData] = useState({
    learned: '',
    wantToLearn: '',
    feeling: '',
    favoriteMoment: '',
    leastFavorite: '',
    partnerExperience: '',
    careerTakeaway: '',
    careerInterests: '',
    clientTeamFeeling: '',
    challenges: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing reflections on component mount
  useEffect(() => {
    loadReflections();
  }, [studentId]);

  // Load current day from student memory
  useEffect(() => {
    const loadCurrentDay = async () => {
      if (!studentId) return;
      
      try {
        const memory = await aiService.getStudentMemory(studentId);
        setCurrentDay(memory.current_day || 1);
      } catch (error) {
        console.error('Error loading current day:', error);
      }
    };
    
    loadCurrentDay();
  }, [studentId]);

  // Define question sets for different day types
  const getQuestionsForDay = (dayNumber) => {
    if (dayNumber === 2) {
      return [
        { key: 'learned', label: 'What have you learned so far in this class?' },
        { key: 'wantToLearn', label: 'What would you like to learn or make next in this class?' },
        { key: 'feeling', label: 'How have you been feeling in this class?' }
      ];
    } else if (dayNumber === 3) {
      return [
        { key: 'favoriteMoment', label: 'What was your favorite moment of class today? Why?' },
        { key: 'leastFavorite', label: 'Were there any least favorite moments of class?' },
        { key: 'partnerExperience', label: 'How was your experience coding with a partner today?' }
      ];
    } else if (dayNumber === 4) {
      return [
        { key: 'careerTakeaway', label: 'What is your biggest takeaway from our career panel today?' },
        { key: 'careerInterests', label: 'What kind of careers are you most interested in? Why?' },
        { key: 'clientTeamFeeling', label: 'How are you feeling about your client project team?' }
      ];
    } else {
      // Default questions for days 5+
      return [
        { key: 'learned', label: 'What did you learn in class today?' },
        { key: 'challenges', label: 'What challenges did you face today?' },
        { key: 'feeling', label: 'How are you feeling about your progress?' }
      ];
    }
  };

  const getPlaceholderForQuestion = (key) => {
    const placeholders = {
      learned: 'Reflect on the skills, concepts, or insights you\'ve gained...',
      wantToLearn: 'Share your goals, interests, or projects you\'d like to explore...',
      feeling: 'Express your emotions, challenges, or what excites you...',
      favoriteMoment: 'Describe your favorite moment and explain what made it special...',
      leastFavorite: 'Share any challenging or difficult moments and what made them tough...',
      partnerExperience: 'Reflect on working with your partner - what went well, what was challenging...',
      careerTakeaway: 'Share the most important insight or lesson from the career panel discussion...',
      careerInterests: 'Describe the careers that excite you and explain what draws you to them...',
      clientTeamFeeling: 'Reflect on your team dynamics, collaboration, and project progress...',
      challenges: 'Describe any obstacles you encountered and how you approached them...'
    };
    return placeholders[key] || 'Share your thoughts...';
  };

  const loadReflections = async () => {
    if (!studentId) return;
    
    try {
      const reflectionDoc = await getDoc(doc(db, 'reflections', studentId));
      if (reflectionDoc.exists()) {
        setReflections(reflectionDoc.data().dailyReflections || {});
      }
    } catch (error) {
      console.error('Error loading reflections:', error);
    }
  };

  const saveReflection = async (dayNumber, reflectionData) => {
    if (!studentId) return;
    
    setIsSubmitting(true);
    try {
      const updatedReflections = {
        ...reflections,
        [dayNumber]: {
          ...reflectionData,
          submittedAt: new Date().toISOString(),
          dayNumber
        }
      };

      await setDoc(doc(db, 'reflections', studentId), {
        studentId,
        dailyReflections: updatedReflections,
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      setReflections(updatedReflections);
      setSelectedDay(null);
      setFormData({ learned: '', wantToLearn: '', feeling: '', favoriteMoment: '', leastFavorite: '', partnerExperience: '', careerTakeaway: '', careerInterests: '', clientTeamFeeling: '', challenges: '' });
    } catch (error) {
      console.error('Error saving reflection:', error);
      alert('Failed to save reflection. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const questions = getQuestionsForDay(selectedDay);
    const isValid = questions.every(q => formData[q.key] && formData[q.key].trim());
    
    if (!selectedDay || !isValid) {
      alert('Please fill in all fields before submitting.');
      return;
    }
    saveReflection(selectedDay, formData);
  };

  const openReflectionForm = (dayNumber) => {
    const existingReflection = reflections[dayNumber];
    const questions = getQuestionsForDay(dayNumber);
    
    const newFormData = {
      learned: '',
      wantToLearn: '',
      feeling: '',
      favoriteMoment: '',
      leastFavorite: '',
      partnerExperience: '',
      careerTakeaway: '',
      careerInterests: '',
      clientTeamFeeling: '',
      challenges: ''
    };
    
    if (existingReflection) {
      questions.forEach(q => {
        newFormData[q.key] = existingReflection[q.key] || '';
      });
    }
    
    setFormData(newFormData);
    setSelectedDay(dayNumber);
  };

  const isCardUnlocked = (dayNumber) => {
    // Day 2, Day 3, and Day 4 are always unlocked for reflections
    // Future days (5+) unlock based on current day in AI system
    if (dayNumber <= 4) {
      return dayNumber >= 2; // Days 2, 3, and 4 are always unlocked
    }
    // Days 5+ require current day to be at least that day
    return dayNumber <= currentDay;
  };

  const isCardCompleted = (dayNumber) => {
    const reflection = reflections[dayNumber];
    if (!reflection) return false;
    
    const questions = getQuestionsForDay(dayNumber);
    return questions.every(q => reflection[q.key] && reflection[q.key].trim());
  };

  const getCardStatus = (dayNumber) => {
    if (!isCardUnlocked(dayNumber)) return 'locked';
    if (isCardCompleted(dayNumber)) return 'completed';
    return 'available';
  };

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #FFE4B5 0%, #DEB887 100%)',
      border: '3px solid #8B4513',
      borderRadius: '12px',
      padding: '15px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
    }}>
      <h4 style={{ 
        color: '#8B4513', 
        margin: '0 0 15px', 
        fontSize: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontWeight: 'bold'
      }}>
        📝 Daily Reflections
      </h4>
      
      <div style={{ 
        color: '#8B4513', 
        fontSize: '12px', 
        marginBottom: '15px',
        opacity: 0.8
      }}>
        Reflect on your learning journey
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[2, 3, 4, 5, 6, 7, 8].map(dayNumber => {
          const status = getCardStatus(dayNumber);
          return (
            <div 
              key={dayNumber}
              onClick={() => isCardUnlocked(dayNumber) ? openReflectionForm(dayNumber) : null}
              style={{
                background: status === 'completed' 
                  ? 'rgba(76, 175, 80, 0.2)'
                  : status === 'available'
                  ? 'rgba(255, 152, 0, 0.2)'
                  : 'rgba(158, 158, 158, 0.1)',
                border: `2px solid ${
                  status === 'completed' ? '#4CAF50' : 
                  status === 'available' ? '#FF9800' : '#9E9E9E'
                }`,
                borderRadius: '8px',
                padding: '10px',
                cursor: isCardUnlocked(dayNumber) ? 'pointer' : 'not-allowed',
                opacity: status === 'locked' ? 0.6 : 1,
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => {
                if (isCardUnlocked(dayNumber)) {
                  e.target.style.transform = 'scale(1.02)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '4px'
              }}>
                <div style={{ 
                  color: '#8B4513', 
                  fontSize: '13px', 
                  fontWeight: 'bold'
                }}>
                  Day {dayNumber}
                </div>
                <div style={{ fontSize: '14px' }}>
                  {status === 'locked' && '🔒'}
                  {status === 'completed' && '✅'}
                  {status === 'available' && '📝'}
                </div>
              </div>
              
              <div style={{ 
                color: '#8B4513', 
                fontSize: '11px',
                lineHeight: '1.3'
              }}>
                {status === 'locked' && 'Unlocks later in your journey'}
                {status === 'available' && 'Ready for reflection'}
                {status === 'completed' && (
                  <div>
                    <div style={{ marginBottom: '2px' }}>
                      <strong>Learned:</strong> {reflections[dayNumber]?.learned?.substring(0, 30)}...
                    </div>
                    <div style={{ fontSize: '10px', opacity: 0.7 }}>
                      Completed: {new Date(reflections[dayNumber]?.submittedAt).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reflection Form Modal */}
      {selectedDay && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }} onClick={() => setSelectedDay(null)}>
          <div style={{
            background: 'linear-gradient(135deg, #F4E4BC 0%, #E6D5A8 100%)',
            border: '3px solid #8B4513',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            color: '#8B4513',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 20px 15px',
              borderBottom: '2px solid #8B4513'
            }}>
              <h2 style={{ margin: 0, color: '#8B4513', fontSize: '20px' }}>
                Day {selectedDay} Reflection
              </h2>
              <button 
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#8B4513',
                  padding: '5px',
                  borderRadius: '4px',
                  lineHeight: 1
                }}
                onClick={() => setSelectedDay(null)}
                onMouseEnter={(e) => e.target.style.background = 'rgba(139, 69, 19, 0.1)'}
                onMouseLeave={(e) => e.target.style.background = 'none'}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
              {/* Dynamic form rendering for all days */}
              {getQuestionsForDay(selectedDay).map(question => (
                <div key={question.key} style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    color: '#8B4513',
                    fontSize: '14px'
                  }}>
                    {question.label}
                  </label>
                  <textarea
                    value={formData[question.key] || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, [question.key]: e.target.value }))}
                    placeholder={getPlaceholderForQuestion(question.key)}
                    rows={4}
                    required
                    style={{
                      width: '100%',
                      border: '2px solid #8B4513',
                      borderRadius: '6px',
                      padding: '12px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      background: 'rgba(255, 255, 255, 0.8)'
                    }}
                  />
                </div>
              ))}

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '25px',
                paddingTop: '15px',
                borderTop: '2px solid #8B4513'
              }}>
                <button 
                  type="button" 
                  onClick={() => setSelectedDay(null)}
                  style={{
                    background: 'rgba(139, 69, 19, 0.1)',
                    color: '#8B4513',
                    border: '2px solid #8B4513',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(139, 69, 19, 0.2)'}
                  onMouseLeave={(e) => e.target.style.background = 'rgba(139, 69, 19, 0.1)'}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  style={{
                    background: isSubmitting ? 'rgba(139, 69, 19, 0.5)' : 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting) {
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                  }}
                >
                  {isSubmitting ? 'Saving...' : 'Save Reflection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyReflections;
