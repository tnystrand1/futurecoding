import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase-config';

const RetreatUserSelector = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const navigate = useNavigate();

  // Only these students are allowed in the retreat dashboard
  const ALLOWED_STUDENTS = ['tim', 'miles', 'gus', 'sample_student'];

  useEffect(() => {
    loadAllowedStudents();
  }, []);

  const loadAllowedStudents = async () => {
    try {
      const studentsList = [];
      
      for (const studentId of ALLOWED_STUDENTS) {
        try {
          const studentDoc = await getDoc(doc(db, 'students', studentId));
          if (studentDoc.exists()) {
            studentsList.push({
              id: studentDoc.id,
              ...studentDoc.data()
            });
          } else {
            // Create placeholder data for students that don't exist yet
            studentsList.push({
              id: studentId,
              name: studentId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              currentLevel: 1,
              totalXP: 0,
              pin: null,
              avatar: null
            });
          }
        } catch (error) {
          console.error(`Error loading student ${studentId}:`, error);
          // Still add placeholder for missing students
          studentsList.push({
            id: studentId,
            name: studentId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            currentLevel: 1,
            totalXP: 0,
            pin: null,
            avatar: null,
            error: true
          });
        }
      }
      
      setStudents(studentsList);
      setLoading(false);
    } catch (error) {
      console.error('Error loading allowed students:', error);
      setLoading(false);
    }
  };

  const handleStudentSelect = (student) => {
    if (student.pin) {
      setSelectedStudent(student);
      setShowPinPrompt(true);
    } else {
      enterStudent(student.id);
    }
  };

  const enterStudent = (studentId) => {
    navigate(`/retreat/civ/${studentId}`);
  };

  const handlePinSubmit = (pin) => {
    if (pin === selectedStudent.pin) {
      setShowPinPrompt(false);
      enterStudent(selectedStudent.id);
    } else {
      alert('Incorrect PIN');
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#F4E4BC',
        fontFamily: 'serif'
      }}>
        <div>Loading retreat participants...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
      padding: '40px 20px',
      fontFamily: 'serif'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        {/* Header */}
        <div style={{
          color: '#F4E4BC',
          marginBottom: '40px'
        }}>
          <h1 style={{
            fontSize: '48px',
            margin: '0 0 16px 0',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
          }}>
            🏛️ RETREAT DASHBOARD
          </h1>
          <p style={{
            fontSize: '20px',
            opacity: 0.9,
            margin: 0
          }}>
            Choose your profile to access the retreat coding environment
          </p>
        </div>

        {/* Students Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '40px'
        }}>
          {students.map(student => (
            <RetreatStudentCard 
              key={student.id} 
              student={student} 
              onClick={() => handleStudentSelect(student)}
            />
          ))}
        </div>

        {/* Info Card */}
        <div style={{
          background: 'rgba(244, 228, 188, 0.1)',
          border: '2px solid #F4E4BC',
          borderRadius: '12px',
          padding: '20px',
          color: '#F4E4BC',
          fontSize: '14px',
          opacity: 0.8
        }}>
          <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
            🔒 Restricted Access
          </div>
          <div>
            This retreat dashboard provides access to a limited set of student profiles. 
            No new students can be created and teacher functionality is disabled.
          </div>
        </div>
      </div>

      {/* PIN Prompt Modal */}
      {showPinPrompt && selectedStudent && (
        <RetreatPinPromptModal
          student={selectedStudent}
          onClose={() => setShowPinPrompt(false)}
          onSubmit={handlePinSubmit}
        />
      )}
    </div>
  );
};

const RetreatStudentCard = ({ student, onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'linear-gradient(135deg, #F4E4BC 0%, #E6D5A8 100%)',
        border: '3px solid #8B4513',
        borderRadius: '12px',
        padding: '20px',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        transition: 'all 0.3s',
        textAlign: 'center'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
      }}
    >
      {/* Avatar */}
      <div style={{
        width: '80px',
        height: '80px',
        margin: '0 auto 16px auto',
        background: student.avatar?.color1 ? 
          `linear-gradient(135deg, ${student.avatar.color1} 0%, ${student.avatar.color2 || student.avatar.color1} 100%)` :
          'linear-gradient(135deg, #FF8C42 0%, #FF6B1A 100%)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '32px',
        border: '3px solid #8B4513'
      }}>
        {student.avatar?.emoji || '👤'}
      </div>

      {/* Name */}
      <div style={{
        fontSize: '18px',
        fontWeight: 'bold',
        marginBottom: '8px',
        color: '#8B4513'
      }}>
        {student.name || student.id}
      </div>

      {/* Stats */}
      <div style={{
        fontSize: '14px',
        color: '#A0522D',
        marginBottom: '8px'
      }}>
        Level {student.currentLevel || 1} • {student.totalXP || 0} XP
      </div>

      {/* Status indicators */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
        {student.pin && (
          <div style={{
            fontSize: '12px',
            color: '#10b981',
            fontWeight: 'bold'
          }}>
            🔒 PIN Protected
          </div>
        )}
        
        {student.error && (
          <div style={{
            fontSize: '12px',
            color: '#e74c3c',
            fontWeight: 'bold'
          }}>
            ⚠️ Loading Error
          </div>
        )}
      </div>
    </div>
  );
};

const RetreatPinPromptModal = ({ student, onClose, onSubmit }) => {
  const [pin, setPin] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(pin);
    setPin('');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #F4E4BC 0%, #E6D5A8 100%)',
        border: '3px solid #8B4513',
        borderRadius: '12px',
        padding: '32px',
        textAlign: 'center',
        minWidth: '300px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
      }}>
        <h3 style={{
          margin: '0 0 16px 0',
          fontSize: '20px',
          color: '#8B4513'
        }}>
          Enter PIN for {student.name}
        </h3>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            style={{
              width: '120px',
              padding: '16px',
              border: '3px solid #8B4513',
              borderRadius: '8px',
              fontSize: '24px',
              textAlign: 'center',
              marginBottom: '20px',
              background: 'rgba(255, 255, 255, 0.9)'
            }}
            placeholder="••••"
            autoFocus
          />

          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                border: '2px solid #8B4513',
                background: 'transparent',
                color: '#8B4513',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #CD853F 0%, #8B4513 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Enter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RetreatUserSelector;
