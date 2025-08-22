import React, { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase-config';
import EvidenceUploader from '../Documentation/EvidenceUploader';
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
    sprintBoardPhoto: '',
    clientWebsiteScreenshot: '',
    roleAndSuccess: '',
    challenges: '',
    // Day 7 fields
    clientProcess: '',
    teamwork: '',
    // Day 8 fields
    steamInterestRating: '',
    steamInterestExplanation: '',
    belongingRating: '',
    belongingExplanation: '',
    communicationRating: '',
    communicationExplanation: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationResults, setValidationResults] = useState({});
  const [validatingFields, setValidatingFields] = useState({});

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

  // Cleanup validation timeouts on unmount
  useEffect(() => {
    return () => {
      if (window.validationTimeouts) {
        Object.values(window.validationTimeouts).forEach(timeoutId => {
          if (timeoutId) clearTimeout(timeoutId);
        });
        window.validationTimeouts = {};
      }
    };
  }, []);

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
    } else if (dayNumber === 5) {
      return [
        { key: 'sprintBoardPhoto', label: 'Photo of sprint board', type: 'image' },
        { key: 'clientWebsiteScreenshot', label: 'Screenshot of client website RIGHT NOW', type: 'image' },
        { key: 'roleAndSuccess', label: 'What was your role today and how successful were you at it?' }
      ];
    } else if (dayNumber === 6) {
      return [
        { key: 'clientFeedback', label: 'What feedback did you receive from your client today? Was it helpful? What are your next steps?' },
        { key: 'clientWebsiteProgress', label: 'Upload a screenshot of your client website right now', type: 'image', optional: true },
        { key: 'aiToolsUsage', label: 'Have you been using other AI tools other than the built in chat bot? If so, tell us why and how.' }
      ];
    } else if (dayNumber === 7) {
      return [
        { key: 'clientProcess', label: 'Reflect on the process of building a website for a client? Was it challenging to understand their needs? Are you proud of your work?' },
        { key: 'teamwork', label: 'Tell us about your teamwork with your client team. Did you use your scrum roles? Did everyone contribute?' }
      ];
    } else if (dayNumber === 8) {
      return [
        { 
          key: 'steamInterestRating', 
          label: 'STEAM Interest',
          description: 'Exploration of one\'s identity through STEAM, both in and out of class',
          type: 'rating'
        },
        { 
          key: 'belongingRating', 
          label: 'Sense of Belonging',
          description: 'Feeling connected to a learning community or professional setting, and accepted and valued by peers and adults in it',
          type: 'rating'
        },
        { 
          key: 'communicationRating', 
          label: 'Communication',
          description: 'Ability to clearly exchange information with others in various settings and for various purposes',
          type: 'rating'
        }
      ];
    } else {
      // Default questions for days 9+
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
      sprintBoardPhoto: 'Upload a photo of your team\'s sprint board...',
      clientWebsiteScreenshot: 'Upload a screenshot of your client\'s current website...',
      roleAndSuccess: 'Describe your specific role today and evaluate how well you performed it...',
      clientFeedback: 'Share the feedback you received from your client. Was it helpful? What specific next steps will you take based on this feedback?...',
      clientWebsiteProgress: 'Upload a screenshot of your client website right now...',
      aiToolsUsage: 'Describe any AI tools you\'ve been using (ChatGPT, Claude, Copilot, etc.) and explain why you chose them and how they helped you...',
      challenges: 'Describe any obstacles you encountered and how you approached them...',
      // Day 7 placeholders
      clientProcess: 'Reflect on building a website for a real client. What was challenging about understanding their needs? What are you proud of in your work?...',
      teamwork: 'Describe your teamwork experience with your client team. How did you use scrum roles? Did everyone contribute equally? What worked well and what could be improved?...',
      // Day 8 placeholders (rating explanations)
      steamInterestExplanation: 'Explain why you gave yourself this rating for STEAM Interest...',
      belongingExplanation: 'Explain why you gave yourself this rating for Sense of Belonging...',
      communicationExplanation: 'Explain why you gave yourself this rating for Communication...'
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

  const getCharacterCount = (text) => {
    return text.trim().length;
  };

  const validateDay8ExplanationLength = (text) => {
    return getCharacterCount(text) >= 150;
  };

  // Debounced AI validation for Day 8 explanations
  const debouncedValidation = useCallback((fieldKey, text, competencyType) => {
    // Clear existing timeout for this field
    if (window.validationTimeouts && window.validationTimeouts[fieldKey]) {
      clearTimeout(window.validationTimeouts[fieldKey]);
    }
    
    // Initialize timeouts object if it doesn't exist
    if (!window.validationTimeouts) {
      window.validationTimeouts = {};
    }
    
    // Set validation as loading
    setValidatingFields(prev => ({ ...prev, [fieldKey]: true }));
    
    // Clear previous validation result
    setValidationResults(prev => ({ ...prev, [fieldKey]: null }));
    
    // Only validate if text meets minimum length and is Day 8 explanation
    if (selectedDay === 8 && fieldKey.includes('Explanation') && validateDay8ExplanationLength(text)) {
      window.validationTimeouts[fieldKey] = setTimeout(async () => {
        try {
          const questions = getQuestionsForDay(8);
          const question = questions.find(q => q.key + 'Explanation' === fieldKey);
          
          if (question) {
            const validation = await aiService.validateAnswer(
              `Rate your ${question.label} and explain why you gave yourself this rating.`,
              text,
              question.label
            );
            
            setValidationResults(prev => ({ ...prev, [fieldKey]: validation }));
          }
        } catch (error) {
          console.error('Validation error:', error);
          setValidationResults(prev => ({ 
            ...prev, 
            [fieldKey]: { 
              success: false, 
              isValid: true, 
              feedback: 'Validation unavailable',
              error: error.message 
            } 
          }));
        } finally {
          setValidatingFields(prev => ({ ...prev, [fieldKey]: false }));
        }
      }, 2000); // 2 second delay
    } else {
      // Clear validation state for non-qualifying fields
      setValidatingFields(prev => ({ ...prev, [fieldKey]: false }));
    }
  }, [selectedDay]);

  // Get validation status for a field
  const getValidationStatus = (fieldKey) => {
    if (validatingFields[fieldKey]) return 'validating';
    const result = validationResults[fieldKey];
    if (!result) return 'none';
    if (result.isValid) return 'valid'; // Accept both success and fallback validation
    if (result.success === false && result.isValid === false) return 'error'; // Only show error if explicitly failed
    return 'invalid';
  };

  // Check if form can be submitted (for Day 8)
  const canSubmitDay8Form = () => {
    if (selectedDay !== 8) return true;
    
    const explanationFields = ['steamInterestRatingExplanation', 'belongingRatingExplanation', 'communicationRatingExplanation'];
    
    const canSubmit = explanationFields.every(field => {
      const text = formData[field] || '';
      
      // Must meet character requirement
      if (!validateDay8ExplanationLength(text)) {

        return false;
      }
      
      // Must not be validating
      if (validatingFields[field]) {

        return false;
      }
      
      // Must have validation result (successful or fallback)
      const validationResult = validationResults[field];
      if (!validationResult) {

        return false;
      }
      
      // Must pass AI validation (or fallback validation)
      if (!validationResult.isValid) {

        return false;
      }
      

      return true;
    });
    
    return canSubmit;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const questions = getQuestionsForDay(selectedDay);
    const isValid = questions.every(q => {
      // Skip validation for optional fields
      if (q.optional) return true;
      return formData[q.key] && formData[q.key].trim();
    });
    
    // Additional validation for Day 8 explanation fields
    if (selectedDay === 8) {
      const explanationFields = ['steamInterestRatingExplanation', 'belongingRatingExplanation', 'communicationRatingExplanation'];
      const explanationErrors = [];
      const aiValidationErrors = [];
      const pendingValidations = [];
      const missingValidations = [];
      

      
      explanationFields.forEach(field => {
        const text = formData[field] || '';
        
        // Check character count
        if (!validateDay8ExplanationLength(text)) {
          const fieldName = field.replace('Explanation', '').replace(/([A-Z])/g, ' $1').toLowerCase();
          explanationErrors.push(`${fieldName} explanation`);
          return; // Skip AI validation if character count not met
        }
        
        // Check if validation is still pending
        if (validatingFields[field]) {
          const fieldName = field.replace('Explanation', '').replace(/([A-Z])/g, ' $1').toLowerCase();
          pendingValidations.push(`${fieldName} explanation`);
          return;
        }
        
        // Check if we have AI validation results
        const validationResult = validationResults[field];
        if (!validationResult) {
          const fieldName = field.replace('Explanation', '').replace(/([A-Z])/g, ' $1').toLowerCase();
          missingValidations.push(`${fieldName} explanation`);
          return;
        }
        
        // Check AI validation quality (accept fallback validation)
        if (!validationResult.isValid) {
          const fieldName = field.replace('Explanation', '').replace(/([A-Z])/g, ' $1').toLowerCase();
          aiValidationErrors.push(`${fieldName} explanation`);
        }
      });
      
      if (explanationErrors.length > 0) {
        alert(`Please provide at least 150 characters for the following explanation(s): ${explanationErrors.join(', ')}`);
        return;
      }
      
      if (pendingValidations.length > 0) {
        alert(`Please wait for AI validation to complete for: ${pendingValidations.join(', ')}`);
        return;
      }
      
      if (missingValidations.length > 0) {
        alert(`AI validation is required for: ${missingValidations.join(', ')}. Please wait a moment after typing for validation to complete.`);
        return;
      }
      
      if (aiValidationErrors.length > 0) {
        alert(`Please revise the following explanation(s) to better address the question (check AI feedback above): ${aiValidationErrors.join(', ')}`);
        return;
      }
    }
    
    if (!selectedDay || !isValid) {
      alert('Please fill in all required fields before submitting.');
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
      sprintBoardPhoto: '',
      clientWebsiteScreenshot: '',
      roleAndSuccess: '',
      clientFeedback: '',
      clientWebsiteProgress: '',
      aiToolsUsage: '',
      challenges: '',
      // Day 7 fields
      clientProcess: '',
      teamwork: '',
      // Day 8 fields
      steamInterestRating: '',
      steamInterestExplanation: '',
      belongingRating: '',
      belongingExplanation: '',
      communicationRating: '',
      communicationExplanation: ''
    };
    
    if (existingReflection) {
      questions.forEach(q => {
        newFormData[q.key] = existingReflection[q.key] || '';
        // For Day 8 rating questions, also load the explanation field
        if (dayNumber === 8 && q.type === 'rating') {
          newFormData[q.key + 'Explanation'] = existingReflection[q.key + 'Explanation'] || '';
        }
      });
    }
    
    setFormData(newFormData);
    setSelectedDay(dayNumber);
  };

  const isCardUnlocked = (dayNumber) => {
    // Days 2-8 are always unlocked for reflections
    // Future days (9+) unlock based on current day in AI system
    if (dayNumber <= 8) {
      return dayNumber >= 2; // Days 2, 3, 4, 5, 6, 7, and 8 are always unlocked
    }
    // Days 9+ require current day to be at least that day
    return dayNumber <= currentDay;
  };

  const isCardCompleted = (dayNumber) => {
    const reflection = reflections[dayNumber];
    if (!reflection) return false;
    
    const questions = getQuestionsForDay(dayNumber);
    const basicValidation = questions.every(q => {
      // Skip validation for optional fields
      if (q.optional) return true;
      return reflection[q.key] && reflection[q.key].trim();
    });
    
    // Additional validation for Day 8 explanation fields
    if (dayNumber === 8) {
      const explanationFields = ['steamInterestRatingExplanation', 'belongingRatingExplanation', 'communicationRatingExplanation'];
      const explanationValidation = explanationFields.every(field => {
        const text = reflection[field] || '';
        const hasMinLength = validateDay8ExplanationLength(text);
        
        // For saved reflections, we assume they were validated at submission time
        // For current editing session, check AI validation if available
        if (selectedDay === dayNumber) {
          const validationResult = validationResults[field];
          const aiValid = validationResult && validationResult.isValid; // Accept both success and fallback
          return hasMinLength && aiValid;
        } else {
          // For previously saved reflections, just check length
          return hasMinLength;
        }
      });
      return basicValidation && explanationValidation;
    }
    
    return basicValidation;
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
                  {question.type === 'image' ? (
                    <EvidenceUploader
                      evidenceType="screenshot"
                      uniqueId={question.key}
                      onUpload={(url) => setFormData(prev => ({ ...prev, [question.key]: url }))}
                      currentValue={formData[question.key]}
                    />
                  ) : question.type === 'rating' ? (
                    <div>
                      {/* Competency Definition */}
                      <div style={{
                        background: 'rgba(139, 69, 19, 0.05)',
                        border: '1px solid #8B4513',
                        borderRadius: '6px',
                        padding: '12px',
                        marginBottom: '12px',
                        fontSize: '13px',
                        color: '#8B4513'
                      }}>
                        <strong>Definition:</strong> {question.description}
                      </div>
                      
                      {/* Rating Dropdown */}
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{
                          display: 'block',
                          fontWeight: 'bold',
                          marginBottom: '6px',
                          color: '#8B4513',
                          fontSize: '13px'
                        }}>
                          Rate your current level:
                        </label>
                        <select
                          value={formData[question.key] || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, [question.key]: e.target.value }))}
                          required
                          style={{
                            width: '100%',
                            border: '2px solid #8B4513',
                            borderRadius: '6px',
                            padding: '12px',
                            fontSize: '14px',
                            fontFamily: 'inherit',
                            background: 'rgba(255, 255, 255, 0.8)'
                          }}
                        >
                          <option value="">Select your level...</option>
                          <option value="emerging">🌱 Emerging - I'm just beginning to develop this competency</option>
                          <option value="developing">🔄 Developing - I'm actively working on this and making progress</option>
                          <option value="proficient">⭐ Proficient - I feel confident and capable in this area</option>
                        </select>
                      </div>
                      
                      {/* Explanation Textarea */}
                      <div>
                        <label style={{
                          display: 'block',
                          fontWeight: 'bold',
                          marginBottom: '6px',
                          color: '#8B4513',
                          fontSize: '13px'
                        }}>
                          Explain why you gave yourself this rating: {selectedDay === 8 && <span style={{ color: '#e74c3c', fontSize: '12px' }}>(minimum 150 characters)</span>}
                        </label>
                        {selectedDay === 8 && (
                          <div style={{
                            fontSize: '11px',
                            color: '#8B4513',
                            opacity: 0.8,
                            marginBottom: '6px',
                            lineHeight: '1.3',
                            background: 'rgba(139, 69, 19, 0.05)',
                            padding: '6px 8px',
                            borderRadius: '4px'
                          }}>
                            💡 <strong>AI Quality Check:</strong> Your answer will be reviewed to ensure it specifically addresses the question about this competency with genuine reflection and examples.
                          </div>
                        )}
                        <textarea
                          value={formData[question.key + 'Explanation'] || ''}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            const fieldKey = question.key + 'Explanation';
                            setFormData(prev => ({ ...prev, [fieldKey]: newValue }));
                            
                            // Trigger AI validation for Day 8 explanations
                            if (selectedDay === 8) {
                              debouncedValidation(fieldKey, newValue, question.label);
                            }
                          }}
                          placeholder={getPlaceholderForQuestion(question.key + 'Explanation')}
                          rows={4}
                          required
                          style={{
                            width: '100%',
                            border: (() => {
                              if (selectedDay !== 8) return '2px solid #8B4513';
                              
                              const fieldKey = question.key + 'Explanation';
                              const text = formData[fieldKey] || '';
                              const status = getValidationStatus(fieldKey);
                              
                              if (!validateDay8ExplanationLength(text)) return '2px solid #e74c3c';
                              if (status === 'validating') return '2px solid #3498db';
                              if (status === 'valid') return '2px solid #27ae60';
                              if (status === 'invalid') return '2px solid #e67e22';
                              
                              return '2px solid #8B4513';
                            })(),
                            borderRadius: '6px',
                            padding: '12px',
                            fontSize: '14px',
                            fontFamily: 'inherit',
                            resize: 'vertical',
                            background: 'rgba(255, 255, 255, 0.8)'
                          }}
                        />
                        {selectedDay === 8 && (
                          <div>
                            {/* Character count */}
                            <div style={{
                              marginTop: '4px',
                              fontSize: '12px',
                              color: validateDay8ExplanationLength(formData[question.key + 'Explanation'] || '') ? '#27ae60' : '#e74c3c',
                              fontWeight: 'bold'
                            }}>
                              {getCharacterCount(formData[question.key + 'Explanation'] || '')}/150 characters
                              {!validateDay8ExplanationLength(formData[question.key + 'Explanation'] || '') && 
                                ` (${150 - getCharacterCount(formData[question.key + 'Explanation'] || '')} more needed)`
                              }
                            </div>
                            
                            {/* AI Validation Feedback */}
                            {(() => {
                              const fieldKey = question.key + 'Explanation';
                              const status = getValidationStatus(fieldKey);
                              const result = validationResults[fieldKey];
                              
                              if (status === 'validating') {
                                return (
                                  <div style={{
                                    marginTop: '6px',
                                    fontSize: '12px',
                                    color: '#3498db',
                                    fontStyle: 'italic',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                  }}>
                                    <span>🤖</span>
                                    <span>AI is reviewing your answer...</span>
                                  </div>
                                );
                              }
                              
                              if (status === 'valid' && result) {
                                return (
                                  <div style={{
                                    marginTop: '6px',
                                    fontSize: '12px',
                                    color: '#27ae60',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                  }}>
                                    <span>✅</span>
                                    <span>{result.feedback}</span>
                                  </div>
                                );
                              }
                              
                              if (status === 'invalid' && result) {
                                return (
                                  <div>
                                    <div style={{
                                      marginTop: '6px',
                                      fontSize: '12px',
                                      color: '#e67e22',
                                      fontWeight: 'bold',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px'
                                    }}>
                                      <span>💡</span>
                                      <span>{result.feedback}</span>
                                    </div>
                                    {result.suggestion && (
                                      <div style={{
                                        marginTop: '3px',
                                        fontSize: '11px',
                                        color: '#e67e22',
                                        fontStyle: 'italic',
                                        paddingLeft: '20px'
                                      }}>
                                        {result.suggestion}
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                              
                              return null;
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
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
                  )}
                </div>
              ))}

              {/* Submission Status Message for Day 8 */}
              {selectedDay === 8 && !canSubmitDay8Form() && (
                <div style={{
                  marginTop: '20px',
                  padding: '12px',
                  background: 'rgba(52, 152, 219, 0.1)',
                  border: '1px solid rgba(52, 152, 219, 0.3)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#2980b9'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    🤖 AI Quality Check Required
                  </div>
                  <div>
                    Complete all explanations with at least 150 characters and wait for AI validation to confirm your answers address the questions adequately.
                  </div>
                </div>
              )}

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
                  disabled={isSubmitting || !canSubmitDay8Form()}
                  style={{
                    background: (isSubmitting || !canSubmitDay8Form()) 
                      ? 'rgba(139, 69, 19, 0.5)' 
                      : 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: (isSubmitting || !canSubmitDay8Form()) ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    opacity: !canSubmitDay8Form() ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting && canSubmitDay8Form()) {
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                  }}
                >
                  {isSubmitting ? 'Saving...' : 
                   !canSubmitDay8Form() && selectedDay === 8 ? '🤖 AI Validation Required' :
                   'Save Reflection'}
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
