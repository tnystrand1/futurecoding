import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../utils/firebase-config';

const XPLeaderboard = ({ currentStudentId, compact = false }) => {
  const [topStudents, setTopStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentStudentRank, setCurrentStudentRank] = useState(null);

  useEffect(() => {
    loadLeaderboard();
  }, [currentStudentId]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      
      // Get top students by totalXP
      const q = query(
        collection(db, 'students'),
        orderBy('totalXP', 'desc'),
        limit(compact ? 3 : 10)
      );
      
      const snapshot = await getDocs(q);
      const students = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter out students with no XP or invalid data
      const validStudents = students.filter(student => 
        student.totalXP && 
        student.totalXP > 0 && 
        student.name &&
        !student.name.includes('sample')
      );
      
      setTopStudents(validStudents);
      
      // Find current student's rank
      const currentStudentIndex = validStudents.findIndex(student => student.id === currentStudentId);
      if (currentStudentIndex !== -1) {
        setCurrentStudentRank(currentStudentIndex + 1);
      } else {
        setCurrentStudentRank(null);
      }
      
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      setTopStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const formatXP = (xp) => {
    if (xp >= 1000) {
      return `${(xp / 1000).toFixed(1)}K`;
    }
    return xp.toString();
  };

  const getPositionEmoji = (position) => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏆';
    }
  };

  const getPositionColor = (position) => {
    switch (position) {
      case 1: return '#FFD700'; // Gold
      case 2: return '#C0C0C0'; // Silver
      case 3: return '#CD7F32'; // Bronze
      default: return '#8B4513'; // Brown
    }
  };

  if (loading) {
    return (
      <div style={{ 
        background: 'linear-gradient(135deg, #FFE5B4 0%, #FFCC8F 100%)',
        border: '3px solid #8B4513',
        borderRadius: '12px',
        padding: compact ? '12px' : '15px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
        textAlign: 'center'
      }}>
        <div style={{
          color: '#8B4513',
          fontSize: '14px',
          fontWeight: 'bold',
          marginBottom: '10px'
        }}>
          🏆 XP Leaderboard
        </div>
        <div style={{ color: '#8B4513', fontSize: '12px' }}>
          Loading rankings...
        </div>
      </div>
    );
  }

  if (topStudents.length === 0) {
    return (
      <div style={{ 
        background: 'linear-gradient(135deg, #FFE5B4 0%, #FFCC8F 100%)',
        border: '3px solid #8B4513',
        borderRadius: '12px',
        padding: compact ? '12px' : '15px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
        textAlign: 'center'
      }}>
        <div style={{
          color: '#8B4513',
          fontSize: '14px',
          fontWeight: 'bold',
          marginBottom: '10px'
        }}>
          🏆 XP Leaderboard
        </div>
        <div style={{ 
          color: '#8B4513', 
          fontSize: '11px', 
          fontStyle: 'italic' 
        }}>
          No active students yet
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #FFE5B4 0%, #FFCC8F 100%)',
      border: '3px solid #8B4513',
      borderRadius: '12px',
      padding: compact ? '12px' : '15px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: compact ? '8px' : '12px'
      }}>
        <div style={{
          color: '#8B4513',
          fontSize: compact ? '13px' : '14px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          🏆 XP Leaderboard
        </div>
        
        <button
          onClick={loadLeaderboard}
          style={{
            background: 'rgba(139, 69, 19, 0.1)',
            border: '1px solid rgba(139, 69, 19, 0.3)',
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '10px',
            color: '#8B4513',
            cursor: 'pointer'
          }}
          title="Refresh rankings"
        >
          🔄
        </button>
      </div>

      {/* Top Students */}
      <div style={{ marginBottom: compact ? '8px' : '12px' }}>
        {topStudents.slice(0, compact ? 3 : 5).map((student, index) => {
          const position = index + 1;
          const isCurrentStudent = student.id === currentStudentId;
          
          return (
            <div
              key={student.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: compact ? '8px' : '10px',
                padding: compact ? '6px 8px' : '8px 10px',
                marginBottom: compact ? '4px' : '6px',
                background: isCurrentStudent 
                  ? 'rgba(52, 152, 219, 0.2)' 
                  : 'rgba(255, 255, 255, 0.4)',
                border: isCurrentStudent 
                  ? '2px solid #3498db' 
                  : '1px solid rgba(139, 69, 19, 0.2)',
                borderRadius: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Position */}
              <div style={{
                width: compact ? '20px' : '24px',
                height: compact ? '20px' : '24px',
                borderRadius: '50%',
                background: position <= 3 ? getPositionColor(position) : '#8B4513',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: compact ? '10px' : '12px',
                fontWeight: 'bold',
                color: position <= 3 ? '#000' : '#fff',
                flexShrink: 0
              }}>
                {position <= 3 ? getPositionEmoji(position) : position}
              </div>

              {/* Avatar */}
              <div style={{
                width: compact ? '24px' : '28px',
                height: compact ? '24px' : '28px',
                borderRadius: '50%',
                background: student.avatar?.color1 ? 
                  `linear-gradient(135deg, ${student.avatar.color1} 0%, ${student.avatar.color2 || student.avatar.color1} 100%)` :
                  'linear-gradient(135deg, #FF8C42 0%, #FF6B1A 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: compact ? '12px' : '14px',
                border: isCurrentStudent ? '2px solid #3498db' : '2px solid #8B4513',
                flexShrink: 0
              }}>
                {student.avatar?.emoji || '👤'}
              </div>

              {/* Student Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: compact ? '11px' : '12px',
                  fontWeight: isCurrentStudent ? 'bold' : '600',
                  color: isCurrentStudent ? '#2980b9' : '#8B4513',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {isCurrentStudent ? 'You' : (student.name || student.id.replace(/_/g, ' '))}
                </div>
                
                {!compact && (
                  <div style={{
                    fontSize: '10px',
                    color: '#8B4513',
                    opacity: 0.8,
                    marginTop: '1px'
                  }}>
                    Level {Math.floor((student.totalXP || 0) / 200) + 1}
                  </div>
                )}
              </div>

              {/* XP */}
              <div style={{
                fontSize: compact ? '11px' : '12px',
                fontWeight: 'bold',
                color: position <= 3 ? getPositionColor(position) : '#8B4513',
                textAlign: 'right',
                flexShrink: 0
              }}>
                {formatXP(student.totalXP || 0)}
                <div style={{
                  fontSize: '9px',
                  fontWeight: 'normal',
                  opacity: 0.8
                }}>
                  XP
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Current Student Rank (if not in top list) */}
      {currentStudentRank && currentStudentRank > (compact ? 3 : 5) && (
        <div style={{
          padding: compact ? '6px 8px' : '8px 10px',
          background: 'rgba(52, 152, 219, 0.1)',
          border: '2px solid #3498db',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: compact ? '10px' : '11px',
            color: '#2980b9',
            fontWeight: 'bold'
          }}>
            Your Rank: #{currentStudentRank}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        fontSize: '9px',
        color: '#8B4513',
        opacity: 0.6,
        marginTop: compact ? '6px' : '8px',
        paddingTop: compact ? '4px' : '6px',
        borderTop: '1px solid rgba(139, 69, 19, 0.2)'
      }}>
        {compact ? 'Top 3 Students' : 'Rankings update in real-time'}
      </div>
    </div>
  );
};

export default XPLeaderboard;
