import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase-config';

const DailyReflectionsViewer = () => {
  const [students, setStudents] = useState([]);
  const [reflections, setReflections] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedReflection, setSelectedReflection] = useState(null);
  const [studentsWithReflections, setStudentsWithReflections] = useState([]);

  useEffect(() => {
    loadStudentsAndReflections();
  }, []);

  // Update filtered students when students or reflections change
  useEffect(() => {
    console.log('🔄 Recalculating filtered students...');
    const filtered = students.filter(student => {
      const hasReflections = reflections[student.id] && Object.keys(reflections[student.id]).length > 0;
      console.log(`🔍 Filtering student ${student.id}:`, {
        student: student,
        hasReflections,
        reflectionKeys: reflections[student.id] ? Object.keys(reflections[student.id]) : 'none',
        reflectionData: reflections[student.id]
      });
      return hasReflections;
    });
    
    console.log('✅ Final filtered students with reflections:', filtered);
    setStudentsWithReflections(filtered);
  }, [students, reflections]);

  // Define question sets for different day types (same as student side)
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
    } else {
      // Default questions for days 6+
      return [
        { key: 'learned', label: 'What did you learn in class today?' },
        { key: 'challenges', label: 'What challenges did you face today?' },
        { key: 'feeling', label: 'How are you feeling about your progress?' }
      ];
    }
  };

  const loadStudentsAndReflections = async () => {
    try {
      setLoading(true);
      
      // Load students
      const studentsSnapshot = await getDocs(collection(db, 'students'));
      const studentsData = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('📚 Students loaded:', studentsData);
      setStudents(studentsData);

      // Load reflections for all students
      const reflectionsData = {};
      for (const student of studentsData) {
        try {
          const reflectionDoc = await getDoc(doc(db, 'reflections', student.id));
          if (reflectionDoc.exists()) {
            const data = reflectionDoc.data();
            if (data.dailyReflections && Object.keys(data.dailyReflections).length > 0) {
              console.log(`📊 Loading reflections for ${student.id}:`, data.dailyReflections);
              reflectionsData[student.id] = data.dailyReflections;
            } else {
              console.log(`⚠️ No reflections found for student ${student.id}:`, data);
            }
          }
        } catch (error) {
          console.warn(`Could not load reflections for student ${student.id}:`, error);
        }
      }
      console.log('🎯 Final reflections data loaded:', reflectionsData);
      setReflections(reflectionsData);
    } catch (error) {
      console.error('Error loading reflections:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student?.name || student?.displayName || student?.email || studentId;
  };

  const getReflectionCount = (studentId) => {
    const studentReflections = reflections[studentId];
    return studentReflections ? Object.keys(studentReflections).length : 0;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        color: '#666'
      }}>
        Loading daily reflections...
      </div>
    );
  }



  if (studentsWithReflections.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px',
        color: '#666'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
        <h3>No Daily Reflections Yet</h3>
        <p>Students haven't submitted any daily reflections yet.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <h2 style={{ color: '#333', margin: 0 }}>📝 Daily Reflections</h2>
        <button
          onClick={loadStudentsAndReflections}
          style={{
            background: '#7c3aed',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {!selectedStudent && (
        <div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px'
          }}>
            {studentsWithReflections.map(student => (
              <div
                key={student.id}
                onClick={() => setSelectedStudent(student.id)}
                style={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#7c3aed';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: student.avatar?.color1 ? 
                      `linear-gradient(135deg, ${student.avatar.color1} 0%, ${student.avatar.color2 || student.avatar.color1} 100%)` :
                      'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px'
                  }}>
                    {student.avatar?.emoji || '👤'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#333' }}>
                      {getStudentName(student.id)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {getReflectionCount(student.id)} reflection{getReflectionCount(student.id) !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                
                <div style={{ fontSize: '14px', color: '#666' }}>
                  Latest reflections from days:{' '}
                  {Object.keys(reflections[student.id] || {})
                    .map(day => reflections[student.id][day].dayNumber)
                    .sort((a, b) => a - b)
                    .join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedStudent && (
        <div>
          <button
            onClick={() => {
              setSelectedStudent(null);
              setSelectedReflection(null);
            }}
            style={{
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: 'pointer',
              marginBottom: '20px'
            }}
          >
            ← Back to Students
          </button>

          <h3 style={{ color: '#333', marginBottom: '20px' }}>
            {getStudentName(selectedStudent)}'s Daily Reflections
          </h3>

          {!selectedReflection && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px'
            }}>
              {Object.entries(reflections[selectedStudent] || {}).map(([dayKey, reflection]) => (
                <div
                  key={dayKey}
                  onClick={() => setSelectedReflection(reflection)}
                  style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#7c3aed';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <h4 style={{ margin: 0, color: '#333' }}>Day {reflection.dayNumber}</h4>
                    <span style={{ fontSize: '20px' }}>📝</span>
                  </div>
                  
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                    {(() => {
                      const questions = getQuestionsForDay(reflection.dayNumber);
                      const firstQuestion = questions[0];
                      const content = reflection[firstQuestion.key];
                      return (
                        <>
                          <strong>{firstQuestion.label}</strong>
                          <div style={{ marginTop: '4px' }}>
                            {content ? content.substring(0, 100) + '...' : 'No response'}
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <div style={{ fontSize: '12px', color: '#999' }}>
                    Submitted: {formatDate(reflection.submittedAt)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedReflection && (
            <div>
              <button
                onClick={() => setSelectedReflection(null)}
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  marginBottom: '20px'
                }}
              >
                ← Back to Reflections
              </button>

              <div style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '24px',
                maxWidth: '800px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <h3 style={{ margin: 0, color: '#333' }}>
                    Day {selectedReflection.dayNumber} Reflection
                  </h3>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    {formatDate(selectedReflection.submittedAt)}
                  </div>
                </div>

                {getQuestionsForDay(selectedReflection.dayNumber).map((question, index) => (
                  <div key={question.key} style={{ marginBottom: index === getQuestionsForDay(selectedReflection.dayNumber).length - 1 ? '0' : '24px' }}>
                    <h4 style={{ color: '#7c3aed', marginBottom: '8px' }}>
                      {question.label}
                    </h4>
                    <div style={{
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      padding: '16px',
                      lineHeight: '1.6',
                      color: '#374151'
                    }}>
                      {selectedReflection[question.key] || 'No response provided'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DailyReflectionsViewer;
