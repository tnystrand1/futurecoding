import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../utils/firebase-config';
import PixelAvatarCreator from '../Shared/PixelAvatarCreator';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';

const UserSelector = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const navigate = useNavigate();
  const flags = useFeatureFlags();

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const studentsSnapshot = await getDocs(collection(db, 'students'));
      const studentsList = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(studentsList);
      setLoading(false);
    } catch (error) {
      console.error('Error loading students:', error);
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
    const dashboardType = flags.useModernDashboard ? 'modern' : 'civ';
    navigate(`/${dashboardType}/${studentId}`);
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
        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'serif'
      }}>
        <div>Loading students...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
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
          color: 'white',
          marginBottom: '40px'
        }}>
          <h1 style={{
            fontSize: '48px',
            margin: '0 0 16px 0',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
          }}>
            🏛️ FUTURE CODING ACADEMY
          </h1>
          <p style={{
            fontSize: '20px',
            opacity: 0.9,
            margin: 0
          }}>
            Choose your student profile to continue your coding journey
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
            <StudentCard 
              key={student.id} 
              student={student} 
              onClick={() => handleStudentSelect(student)}
            />
          ))}
        </div>

        {/* Create New Student Button */}
        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              padding: '16px 32px',
              fontSize: '18px',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              transition: 'transform 0.2s',
              fontFamily: 'serif',
              fontWeight: 'bold'
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            ➕ Create New Student
          </button>

          <a
            href="/teacher"
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              textDecoration: 'none',
              padding: '12px 20px',
              fontSize: '14px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.3)',
              transition: 'all 0.2s',
              fontFamily: 'serif'
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.3)';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.2)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            👩‍🏫 Teacher View
          </a>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateStudentModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={(studentId) => {
            setShowCreateModal(false);
            loadStudents();
            enterStudent(studentId);
          }}
        />
      )}

      {/* PIN Prompt Modal */}
      {showPinPrompt && selectedStudent && (
        <PinPromptModal
          student={selectedStudent}
          onClose={() => setShowPinPrompt(false)}
          onSubmit={handlePinSubmit}
        />
      )}
    </div>
  );
};

const StudentCard = ({ student, onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        transition: 'all 0.3s',
        textAlign: 'center'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
      }}
    >
      {/* Avatar */}
      <div style={{
        width: '80px',
        height: '80px',
        margin: '0 auto 16px auto',
        background: student.avatar || 'linear-gradient(135deg, #f59e0b, #d97706)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '32px'
      }}>
        {student.avatar ? (
          <PixelAvatar data={student.avatar} size={80} />
        ) : (
          '👤'
        )}
      </div>

      {/* Name */}
      <div style={{
        fontSize: '18px',
        fontWeight: 'bold',
        marginBottom: '8px',
        color: '#1f2937'
      }}>
        {student.name || student.id}
      </div>

      {/* Stats */}
      <div style={{
        fontSize: '14px',
        color: '#6b7280',
        marginBottom: '8px'
      }}>
        Level {student.currentLevel || 1} • {student.totalXP || 0} XP
      </div>

      {/* Protection indicator */}
      {student.pin && (
        <div style={{
          fontSize: '12px',
          color: '#10b981',
          fontWeight: 'bold'
        }}>
          🔒 PIN Protected
        </div>
      )}
    </div>
  );
};

const CreateStudentModal = ({ onClose, onSuccess }) => {
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [pin, setPin] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      alert('Please enter a username');
      return;
    }

    setCreating(true);
    try {
      const studentId = username.toLowerCase().replace(/[^a-z0-9]/g, '_');
      
      const newStudent = {
        name: username.trim(),
        avatar: avatar,
        pin: pin || null,
        // Teacher-friendly info for classroom management
        adminInfo: {
          createdAt: new Date().toISOString(),
          lastLogin: null,
          pinForTeacher: pin || 'No PIN set', // Clear label for teachers
          studentName: username.trim()
        },
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

      await setDoc(doc(db, 'students', studentId), newStudent);
      onSuccess(studentId);
    } catch (error) {
      console.error('Error creating student:', error);
      alert('Error creating student. Please try again.');
    } finally {
      setCreating(false);
    }
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
        background: 'white',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h2 style={{
          margin: '0 0 24px 0',
          fontSize: '24px',
          textAlign: 'center',
          color: '#1f2937'
        }}>
          Create New Student
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#374151'
            }}>
              Username:
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px'
              }}
              placeholder="Enter your name"
              disabled={creating}
            />
          </div>

          {/* Avatar Creator */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#374151'
            }}>
              Create Your Avatar:
            </label>
            <PixelAvatarCreator 
              onAvatarChange={setAvatar}
              initialAvatar={avatar}
            />
          </div>

          {/* PIN (Optional) */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#374151'
            }}>
              PIN (Optional - 4 digits for protection):
            </label>
            <input
              type="text"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              style={{
                width: '120px',
                padding: '12px',
                border: '2px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                textAlign: 'center'
              }}
              placeholder="1234"
              disabled={creating}
            />
          </div>

          {/* Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              style={{
                padding: '12px 24px',
                border: '2px solid #d1d5db',
                background: 'white',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              style={{
                padding: '12px 24px',
                background: creating ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: creating ? 'default' : 'pointer'
              }}
            >
              {creating ? 'Creating...' : 'Create Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PinPromptModal = ({ student, onClose, onSubmit }) => {
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
        background: 'white',
        borderRadius: '12px',
        padding: '32px',
        textAlign: 'center',
        minWidth: '300px'
      }}>
        <h3 style={{
          margin: '0 0 16px 0',
          fontSize: '20px',
          color: '#1f2937'
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
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '24px',
              textAlign: 'center',
              marginBottom: '20px'
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
                border: '2px solid #d1d5db',
                background: 'white',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '12px 24px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
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

// Simple pixel avatar display component
const PixelAvatar = ({ data, size = 80 }) => {
  if (!data) return null;
  
  // This would render the pixel avatar - simplified for now
  return (
    <div style={{
      width: size,
      height: size,
      background: `linear-gradient(45deg, ${data.color1 || '#3b82f6'}, ${data.color2 || '#1e40af'})`,
      borderRadius: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.4,
      color: 'white'
    }}>
      {data.emoji || '🎮'}
    </div>
  );
};

export default UserSelector;