import React, { useState } from 'react';
import enhancedMessagingService from '../../services/enhancedMessagingService';

const GroupHeader = ({ 
  conversation, 
  currentStudentId, 
  participantInfo = {}, 
  onBack,
  onGroupUpdated 
}) => {
  const [showManagement, setShowManagement] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [newGroupName, setNewGroupName] = useState(conversation.groupName || '');
  const [newGroupDescription, setNewGroupDescription] = useState(conversation.groupDescription || '');
  const [loading, setLoading] = useState(false);

  const isAdmin = conversation.admins?.includes(currentStudentId);
  const participants = conversation.participants || [];
  const canManageGroup = isAdmin || conversation.groupSettings?.allowParticipantInvites;

  const handleUpdateGroupName = async () => {
    if (!newGroupName.trim() || newGroupName === conversation.groupName) {
      setEditingName(false);
      setNewGroupName(conversation.groupName || '');
      return;
    }

    try {
      setLoading(true);
      await enhancedMessagingService.updateGroupSettings(
        conversation.id,
        { groupName: newGroupName.trim() },
        currentStudentId
      );
      
      setEditingName(false);
      if (onGroupUpdated) {
        onGroupUpdated();
      }
    } catch (error) {
      console.error('Error updating group name:', error);
      alert(`Failed to update group name: ${error.message}`);
      setNewGroupName(conversation.groupName || '');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDescription = async () => {
    if (newGroupDescription === conversation.groupDescription) {
      setEditingDescription(false);
      return;
    }

    try {
      setLoading(true);
      await enhancedMessagingService.updateGroupSettings(
        conversation.id,
        { groupDescription: newGroupDescription.trim() },
        currentStudentId
      );
      
      setEditingDescription(false);
      if (onGroupUpdated) {
        onGroupUpdated();
      }
    } catch (error) {
      console.error('Error updating group description:', error);
      alert(`Failed to update description: ${error.message}`);
      setNewGroupDescription(conversation.groupDescription || '');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    const confirmMessage = `Are you sure you want to leave "${conversation.groupName}"?\n\nYou won't be able to see new messages unless someone adds you back.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        setLoading(true);
        await enhancedMessagingService.removeParticipantFromGroup(
          conversation.id,
          currentStudentId,
          currentStudentId
        );
        
        // Go back to conversation list
        if (onBack) {
          onBack();
        }
      } catch (error) {
        console.error('Error leaving group:', error);
        alert(`Failed to leave group: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const getParticipantName = (participantId) => {
    if (participantId === currentStudentId) return 'You';
    return participantInfo[participantId]?.name || participantId.replace(/_/g, ' ');
  };

  const getParticipantAvatar = (participantId) => {
    return participantInfo[participantId]?.avatar || '👤';
  };

  const formatParticipantCount = () => {
    const count = participants.length;
    return `${count} member${count !== 1 ? 's' : ''}`;
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.1) 0%, rgba(160, 82, 45, 0.1) 100%)',
      borderBottom: '2px solid #8B4513',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      {/* Main Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px 20px'
      }}>
        {/* Back Button */}
        <button
          onClick={onBack}
          style={{
            background: 'rgba(139, 69, 19, 0.1)',
            color: '#8B4513',
            border: '1px solid rgba(139, 69, 19, 0.3)',
            borderRadius: '6px',
            padding: '6px 8px',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          ← Back
        </button>

        {/* Group Avatar */}
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          border: '3px solid #8B4513',
          color: 'white',
          fontWeight: 'bold'
        }}>
          🏆
        </div>

        {/* Group Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {editingName ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onBlur={handleUpdateGroupName}
                onKeyPress={(e) => e.key === 'Enter' && handleUpdateGroupName()}
                style={{
                  background: 'white',
                  border: '2px solid #3498db',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#8B4513',
                  minWidth: 0,
                  flex: 1
                }}
                autoFocus
                maxLength={50}
                disabled={loading}
              />
              <button
                onClick={handleUpdateGroupName}
                disabled={loading}
                style={{
                  background: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                ✓
              </button>
            </div>
          ) : (
            <div
              onClick={() => (isAdmin || conversation.groupSettings?.allowNameChange) && setEditingName(true)}
              style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#8B4513',
                cursor: (isAdmin || conversation.groupSettings?.allowNameChange) ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{conversation.groupName || 'Group Chat'}</span>
              {(isAdmin || conversation.groupSettings?.allowNameChange) && (
                <span style={{ fontSize: '14px', opacity: 0.6 }}>✏️</span>
              )}
            </div>
          )}
          
          <div style={{
            fontSize: '14px',
            color: '#666',
            marginTop: '2px'
          }}>
            {formatParticipantCount()} • Group Chat
            {isAdmin && (
              <span style={{
                marginLeft: '8px',
                background: 'rgba(52, 152, 219, 0.2)',
                color: '#2980b9',
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 'bold'
              }}>
                ADMIN
              </span>
            )}
          </div>
        </div>

        {/* Group Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowManagement(!showManagement)}
            style={{
              background: 'rgba(52, 152, 219, 0.1)',
              color: '#3498db',
              border: '1px solid rgba(52, 152, 219, 0.3)',
              borderRadius: '6px',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>⚙️</span>
            <span>Manage</span>
          </button>
        </div>
      </div>

      {/* Group Description */}
      {(conversation.groupDescription || editingDescription) && (
        <div style={{
          padding: '0 20px 12px 88px', // Align with group name
          fontSize: '14px',
          color: '#666',
          borderBottom: showManagement ? '1px solid rgba(139, 69, 19, 0.2)' : 'none'
        }}>
          {editingDescription ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <textarea
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                onBlur={handleUpdateDescription}
                placeholder="Add a group description..."
                style={{
                  background: 'white',
                  border: '2px solid #3498db',
                  borderRadius: '4px',
                  padding: '6px 8px',
                  fontSize: '14px',
                  color: '#666',
                  minWidth: 0,
                  flex: 1,
                  minHeight: '40px',
                  resize: 'vertical'
                }}
                autoFocus
                maxLength={200}
                disabled={loading}
              />
              <button
                onClick={handleUpdateDescription}
                disabled={loading}
                style={{
                  background: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 8px',
                  fontSize: '12px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                ✓
              </button>
            </div>
          ) : (
            <div
              onClick={() => (isAdmin || conversation.groupSettings?.allowDescriptionChange) && setEditingDescription(true)}
              style={{
                cursor: (isAdmin || conversation.groupSettings?.allowDescriptionChange) ? 'pointer' : 'default',
                padding: '4px 0'
              }}
            >
              {conversation.groupDescription ? (
                <>
                  {conversation.groupDescription}
                  {(isAdmin || conversation.groupSettings?.allowDescriptionChange) && (
                    <span style={{ marginLeft: '6px', opacity: 0.6 }}>✏️</span>
                  )}
                </>
              ) : (isAdmin || conversation.groupSettings?.allowDescriptionChange) ? (
                <span style={{ fontStyle: 'italic', opacity: 0.7 }}>
                  Click to add description ✏️
                </span>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* Group Management Panel */}
      {showManagement && (
        <div style={{
          padding: '16px 20px',
          background: 'rgba(255, 255, 255, 0.5)',
          borderTop: '1px solid rgba(139, 69, 19, 0.2)'
        }}>
          {/* Participants List */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#8B4513',
              marginBottom: '8px'
            }}>
              👥 Team Members ({participants.length})
            </div>
            
            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              maxHeight: '120px',
              overflowY: 'auto'
            }}>
              {participants.map(participantId => {
                const isCurrentUser = participantId === currentStudentId;
                const isParticipantAdmin = conversation.admins?.includes(participantId);
                
                return (
                  <div
                    key={participantId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: isCurrentUser ? 'rgba(52, 152, 219, 0.15)' : 'rgba(139, 69, 19, 0.1)',
                      padding: '6px 10px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      color: isCurrentUser ? '#2980b9' : '#8B4513',
                      border: `1px solid ${isCurrentUser ? 'rgba(52, 152, 219, 0.3)' : 'rgba(139, 69, 19, 0.2)'}`
                    }}
                  >
                    <span>{getParticipantAvatar(participantId)}</span>
                    <span>{getParticipantName(participantId)}</span>
                    {isParticipantAdmin && (
                      <span style={{
                        background: 'rgba(52, 152, 219, 0.8)',
                        color: 'white',
                        padding: '1px 4px',
                        borderRadius: '6px',
                        fontSize: '9px',
                        fontWeight: 'bold'
                      }}>
                        ADMIN
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Group Actions */}
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            {canManageGroup && (
              <button
                style={{
                  background: 'rgba(52, 152, 219, 0.1)',
                  color: '#3498db',
                  border: '1px solid rgba(52, 152, 219, 0.3)',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onClick={() => alert('Add participants feature coming soon!')}
              >
                <span>➕</span>
                <span>Add Members</span>
              </button>
            )}

            <button
              onClick={handleLeaveGroup}
              disabled={loading}
              style={{
                background: 'rgba(231, 76, 60, 0.1)',
                color: '#e74c3c',
                border: '1px solid rgba(231, 76, 60, 0.3)',
                borderRadius: '6px',
                padding: '6px 12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>🚪</span>
              <span>Leave Group</span>
            </button>

            <div style={{
              fontSize: '11px',
              color: '#666',
              marginLeft: 'auto'
            }}>
              Created by {getParticipantName(conversation.createdBy)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupHeader;
