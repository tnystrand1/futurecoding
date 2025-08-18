import React, { useState, useEffect } from 'react';
import enhancedMessagingService from '../../services/enhancedMessagingService';

const GroupCreator = ({ 
  currentStudentId, 
  onGroupCreated, 
  onCancel,
  suggestedParticipants = [] 
}) => {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []); // Only run once on mount

  useEffect(() => {
    // Pre-select suggested participants if provided
    if (suggestedParticipants.length > 0) {
      setSelectedParticipants(suggestedParticipants);
    }
  }, [suggestedParticipants]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const students = await enhancedMessagingService.getStudentDirectory(currentStudentId);
      setAvailableStudents(students);
    } catch (error) {
      console.error('❌ Error loading students in GroupCreator:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = availableStudents.filter(student => 
    !searchTerm || 
    (student.name && student.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    student.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleParticipant = (studentId) => {
    setSelectedParticipants(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert('Please enter a group name');
      return;
    }

    if (selectedParticipants.length < 2) {
      alert('Please select at least 2 other participants for the group');
      return;
    }

    try {
      setCreating(true);
      const group = await enhancedMessagingService.createGroupConversation(
        currentStudentId,
        selectedParticipants,
        groupName.trim(),
        groupDescription.trim()
      );
      
      if (onGroupCreated) {
        onGroupCreated(group);
      }
    } catch (error) {
      console.error('Error creating group:', error);
      alert(`Failed to create group: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  const getParticipantName = (participantId) => {
    const student = availableStudents.find(s => s.id === participantId);
    return student ? student.name : participantId.replace(/_/g, ' ');
  };

  const getParticipantAvatar = (participantId) => {
    const student = availableStudents.find(s => s.id === participantId);
    return student?.avatar || '👤';
  };

  return (
    <div style={{
      padding: '20px',
      maxHeight: '80vh',
      overflowY: 'auto',
      background: 'white'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        paddingBottom: '12px',
        borderBottom: '2px solid #8B4513'
      }}>
        <h2 style={{
          margin: 0,
          color: '#8B4513',
          fontSize: '20px',
          fontWeight: 'bold'
        }}>
          🏆 Create Team Group
        </h2>
        
        <button
          onClick={onCancel}
          style={{
            background: 'rgba(139, 69, 19, 0.1)',
            color: '#8B4513',
            border: '1px solid rgba(139, 69, 19, 0.3)',
            borderRadius: '6px',
            padding: '6px 12px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ✕ Cancel
        </button>
      </div>

      {/* Group Details */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#8B4513',
            marginBottom: '6px'
          }}>
            Group Name *
          </label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="e.g., Project Team Alpha, HTML Squad..."
            style={{
              width: '100%',
              padding: '10px',
              border: '2px solid #8B4513',
              borderRadius: '6px',
              fontSize: '14px',
              background: 'rgba(255, 255, 255, 0.9)'
            }}
            maxLength={50}
          />
          <div style={{
            fontSize: '11px',
            color: '#666',
            marginTop: '4px'
          }}>
            {groupName.length}/50 characters
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#8B4513',
            marginBottom: '6px'
          }}>
            Description (Optional)
          </label>
          <textarea
            value={groupDescription}
            onChange={(e) => setGroupDescription(e.target.value)}
            placeholder="What's this group for? Describe your project or collaboration goals..."
            style={{
              width: '100%',
              minHeight: '60px',
              padding: '10px',
              border: '2px solid #8B4513',
              borderRadius: '6px',
              fontSize: '14px',
              background: 'rgba(255, 255, 255, 0.9)',
              resize: 'vertical'
            }}
            maxLength={200}
          />
          <div style={{
            fontSize: '11px',
            color: '#666',
            marginTop: '4px'
          }}>
            {groupDescription.length}/200 characters
          </div>
        </div>
      </div>

      {/* Selected Participants Preview */}
      {selectedParticipants.length > 0 && (
        <div style={{
          marginBottom: '20px',
          padding: '12px',
          background: 'rgba(52, 152, 219, 0.1)',
          border: '1px solid rgba(52, 152, 219, 0.3)',
          borderRadius: '8px'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#3498db',
            marginBottom: '8px'
          }}>
            👥 Selected Team Members ({selectedParticipants.length})
          </div>
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            {selectedParticipants.map(participantId => (
              <div
                key={participantId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(52, 152, 219, 0.15)',
                  padding: '4px 8px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  color: '#2980b9'
                }}
              >
                <span>{getParticipantAvatar(participantId)}</span>
                <span>{getParticipantName(participantId)}</span>
                <button
                  onClick={() => toggleParticipant(participantId)}
                  style={{
                    background: 'rgba(231, 76, 60, 0.8)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    fontSize: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student Search */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#8B4513',
          marginBottom: '6px'
        }}>
          Add Team Members (select at least 2)
        </label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search for classmates..."
          style={{
            width: '100%',
            padding: '10px',
            border: '2px solid #8B4513',
            borderRadius: '6px',
            fontSize: '14px',
            background: 'rgba(255, 255, 255, 0.9)'
          }}
        />
      </div>

      {/* Available Students */}
      <div style={{
        maxHeight: '300px',
        overflowY: 'auto',
        border: '1px solid rgba(139, 69, 19, 0.2)',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        {loading ? (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: '#8B4513'
          }}>
            Loading classmates...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: '#8B4513'
          }}>
            {searchTerm ? 'No classmates match your search' : 'No classmates available'}
          </div>
        ) : (
          filteredStudents.map(student => {
            const isSelected = selectedParticipants.includes(student.id);
            
            return (
              <div
                key={student.id}
                onClick={() => toggleParticipant(student.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderBottom: '1px solid rgba(139, 69, 19, 0.1)',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(52, 152, 219, 0.1)' : 'transparent',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.target.style.background = 'rgba(139, 69, 19, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = isSelected ? 'rgba(52, 152, 219, 0.1)' : 'transparent';
                }}
              >
                {/* Checkbox */}
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  border: `2px solid ${isSelected ? '#3498db' : '#8B4513'}`,
                  background: isSelected ? '#3498db' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  color: 'white'
                }}>
                  {isSelected && '✓'}
                </div>

                {/* Avatar */}
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FF8C42 0%, #FF6B1A 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  border: '2px solid #8B4513'
                }}>
                  {typeof student.avatar === 'object' ? student.avatar?.emoji || '👤' : student.avatar || '👤'}
                </div>

                {/* Student Info */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 'bold',
                    fontSize: '14px',
                    color: '#8B4513'
                  }}>
                    {student.name || student.id.replace(/_/g, ' ')}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#666',
                    opacity: 0.8
                  }}>
                    {student.online ? '🟢 Online' : '🔴 Offline'}
                  </div>
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                  <div style={{
                    color: '#3498db',
                    fontSize: '16px'
                  }}>
                    ✓
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'center'
      }}>
        <button
          onClick={handleCreateGroup}
          disabled={!groupName.trim() || selectedParticipants.length < 2 || creating}
          style={{
            flex: 1,
            background: (!groupName.trim() || selectedParticipants.length < 2 || creating) 
              ? 'rgba(139, 69, 19, 0.3)' 
              : 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 20px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: (!groupName.trim() || selectedParticipants.length < 2 || creating) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {creating ? (
            <>
              <span>⏳</span>
              <span>Creating Team...</span>
            </>
          ) : (
            <>
              <span>🏆</span>
              <span>Create Team Group</span>
            </>
          )}
        </button>

        <div style={{
          fontSize: '12px',
          color: '#666',
          textAlign: 'center'
        }}>
          Total members: {selectedParticipants.length + 1}
          <br />
          (including you)
        </div>
      </div>

      {/* Requirements Notice */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: 'rgba(241, 196, 15, 0.1)',
        border: '1px solid rgba(241, 196, 15, 0.3)',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#f39c12'
      }}>
        💡 <strong>Team Requirements:</strong>
        <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
          <li>Groups need at least 3 total members (you + 2 others)</li>
          <li>You'll be the team admin and can add more members later</li>
          <li>All team members can share code, files, and collaborate together</li>
        </ul>
      </div>
    </div>
  );
};

export default GroupCreator;
