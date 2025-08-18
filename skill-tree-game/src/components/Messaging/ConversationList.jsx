import React, { useState } from 'react';
import { formatConversationTimestamp } from '../../utils/dateUtils';
import enhancedMessagingService from '../../services/enhancedMessagingService';
import GroupCreator from './GroupCreator';

const ConversationList = ({ conversations, currentStudentId, onSelectConversation, onNewMessage, onConversationUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [archivedConversations, setArchivedConversations] = useState([]);
  const [showGroupCreator, setShowGroupCreator] = useState(false);

  const filteredConversations = conversations.filter(conversation => {
    if (!searchTerm) return true;
    
    if (conversation.isGroup) {
      // For group conversations, search in group name or last message
      return (conversation.groupName || 'Group Chat').toLowerCase().includes(searchTerm.toLowerCase()) ||
             (conversation.lastMessage?.text || '').toLowerCase().includes(searchTerm.toLowerCase());
    } else {
      // For direct conversations, search in participant name or last message
      const otherParticipantId = conversation.participants.find(id => id !== currentStudentId);
      const otherParticipantName = otherParticipantId ? otherParticipantId.replace(/_/g, ' ') : '';
      
      return otherParticipantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             (conversation.lastMessage?.text || '').toLowerCase().includes(searchTerm.toLowerCase());
    }
  });

  // Archive conversation function
  const handleArchiveConversation = async (conversationId, e) => {
    e.stopPropagation(); // Prevent conversation selection
    
    try {
      const success = await enhancedMessagingService.archiveConversation(conversationId, currentStudentId);
      if (success && onConversationUpdate) {
        onConversationUpdate(); // Refresh conversation list
      }
    } catch (error) {
      console.error('Error archiving conversation:', error);
      alert('Failed to archive conversation. Please try again.');
    }
  };

  // Unarchive conversation function
  const handleUnarchiveConversation = async (conversationId, e) => {
    e.stopPropagation(); // Prevent conversation selection
    
    try {
      const success = await enhancedMessagingService.unarchiveConversation(conversationId, currentStudentId);
      if (success) {
        // Refresh archived conversations
        loadArchivedConversations();
        if (onConversationUpdate) {
          onConversationUpdate(); // Refresh main conversation list
        }
      }
    } catch (error) {
      console.error('Error unarchiving conversation:', error);
      alert('Failed to unarchive conversation. Please try again.');
    }
  };

  // Load archived conversations
  const loadArchivedConversations = async () => {
    try {
      const archived = await enhancedMessagingService.getArchivedConversations(currentStudentId);
      setArchivedConversations(archived);
    } catch (error) {
      console.error('Error loading archived conversations:', error);
    }
  };

  // Load archived conversations when showing archived
  React.useEffect(() => {
    if (showArchived) {
      loadArchivedConversations();
    }
  }, [showArchived, currentStudentId]);

  const getConversationInfo = (conversation) => {
    if (conversation.isGroup) {
      return {
        id: conversation.id,
        name: conversation.groupName || 'Group Chat',
        avatar: { emoji: '🏆', color1: '#3498db' },
        isGroup: true,
        participantCount: conversation.participants.length
      };
    } else {
      const otherParticipantId = conversation.participants.find(id => id !== currentStudentId);
      return {
        id: otherParticipantId,
        name: otherParticipantId ? otherParticipantId.replace(/_/g, ' ') : 'Unknown',
        avatar: { emoji: '👤', color1: '#FF8C42' },
        isGroup: false
      };
    }
  };

  const handleGroupCreated = (group) => {
    setShowGroupCreator(false);
    if (onConversationUpdate) {
      onConversationUpdate(); // Refresh conversation list
    }
    if (onSelectConversation) {
      onSelectConversation(group); // Open the new group
    }
  };

  const truncateMessage = (text, maxLength = 50) => {
    if (!text) return 'No messages yet';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      background: '#F4E4BC'
    }}>
      {/* Search and New Message */}
      <div style={{ 
        padding: '20px',
        borderBottom: '1px solid #8B4513'
      }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: '10px',
              border: '2px solid #8B4513',
              borderRadius: '6px',
              fontSize: '14px',
              background: 'rgba(255, 255, 255, 0.8)'
            }}
          />
          <button
            onClick={onNewMessage}
            style={{
              background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 15px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
            }}
          >
            ✉️ New
          </button>
          <button
            onClick={() => setShowGroupCreator(true)}
            style={{
              background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 15px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
            }}
          >
            🏆 Team
          </button>
        </div>
        
        {/* Archive Toggle */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowArchived(false)}
            style={{
              background: !showArchived ? '#8B4513' : 'transparent',
              color: !showArchived ? 'white' : '#8B4513',
              border: '1px solid #8B4513',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            📥 Inbox
          </button>
          <button
            onClick={() => setShowArchived(true)}
            style={{
              background: showArchived ? '#8B4513' : 'transparent',
              color: showArchived ? 'white' : '#8B4513',
              border: '1px solid #8B4513',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            📦 Archived ({archivedConversations.length})
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        padding: '10px 0'
      }}>
        {(() => {
          const conversationsToShow = showArchived ? archivedConversations : filteredConversations;
          const filteredArchived = showArchived 
            ? archivedConversations.filter(conversation => {
                if (!searchTerm) return true;
                const otherParticipantId = conversation.participants.find(id => id !== currentStudentId);
                const otherParticipantName = otherParticipantId ? otherParticipantId.replace(/_/g, ' ') : '';
                return otherParticipantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (conversation.lastMessage?.text || '').toLowerCase().includes(searchTerm.toLowerCase());
              })
            : filteredConversations;
          
          if (filteredArchived.length === 0) {
            return (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#8B4513',
                fontSize: '16px'
              }}>
                {showArchived ? (
                  <div>
                    <div style={{ fontSize: '48px', marginBottom: '15px' }}>📦</div>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>No archived conversations</div>
                    <div style={{ fontSize: '14px', opacity: 0.7 }}>
                      Archive conversations to keep your inbox organized
                    </div>
                  </div>
                ) : conversations.length === 0 ? (
                  <div>
                    <div style={{ fontSize: '48px', marginBottom: '15px' }}>💬</div>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>No conversations yet</div>
                    <div style={{ fontSize: '14px', opacity: 0.7 }}>
                      Start a conversation with a classmate!
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔍</div>
                    <div>No conversations match your search</div>
                  </div>
                )}
              </div>
            );
          }
          
          return filteredArchived.map((conversation) => {
            const conversationInfo = getConversationInfo(conversation);
            const lastMessage = conversation.lastMessage;
            const isUnread = lastMessage && lastMessage.senderId !== currentStudentId; // Simplified unread logic
            
            // Extract avatar properties safely to avoid React serialization issues
            const avatarColor1 = conversationInfo.avatar?.color1 || '#FF8C42';
            const avatarEmoji = conversationInfo.avatar?.emoji || '👤';
            
            return (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '15px 20px',
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(139, 69, 19, 0.1)',
                  background: isUnread ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(139, 69, 19, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = isUnread ? 'rgba(59, 130, 246, 0.05)' : 'transparent';
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${avatarColor1} 0%, #FF6B1A 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  marginRight: '15px',
                  border: '2px solid #8B4513',
                  flexShrink: 0
                }}>
                  {avatarEmoji}
                </div>

                {/* Conversation Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <div style={{
                      fontWeight: isUnread ? 'bold' : 'normal',
                      fontSize: '16px',
                      color: '#8B4513',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span>{conversationInfo.name}</span>
                      {conversationInfo.isGroup && (
                        <span style={{
                          fontSize: '12px',
                          background: 'rgba(52, 152, 219, 0.2)',
                          color: '#2980b9',
                          padding: '2px 6px',
                          borderRadius: '10px',
                          fontWeight: 'bold'
                        }}>
                          {conversationInfo.participantCount}
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#8B4513',
                      opacity: 0.6,
                      flexShrink: 0,
                      marginLeft: '10px'
                    }}>
                      {formatConversationTimestamp(lastMessage?.timestamp)}
                    </div>
                  </div>
                  
                  <div style={{
                    fontSize: '14px',
                    color: '#8B4513',
                    opacity: 0.7,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontWeight: isUnread ? '600' : 'normal'
                  }}>
                    {lastMessage?.senderId === currentStudentId ? 'You: ' : ''}
                    {truncateMessage(lastMessage?.text)}
                  </div>
                </div>

                {/* Archive/Unarchive Button */}
                <button
                  onClick={showArchived ? 
                    (e) => handleUnarchiveConversation(conversation.id, e) :
                    (e) => handleArchiveConversation(conversation.id, e)
                  }
                  style={{
                    background: 'rgba(139, 69, 19, 0.1)',
                    color: '#8B4513',
                    border: '1px solid rgba(139, 69, 19, 0.3)',
                    borderRadius: '4px',
                    padding: '4px 6px',
                    fontSize: '10px',
                    cursor: 'pointer',
                    marginLeft: '8px',
                    flexShrink: 0
                  }}
                  title={showArchived ? 'Unarchive conversation' : 'Archive conversation'}
                >
                  {showArchived ? '📤' : '📦'}
                </button>

                {/* Unread Indicator */}
                {isUnread && !showArchived && (
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#3b82f6',
                    marginLeft: '6px',
                    flexShrink: 0
                  }} />
                )}
              </div>
            );
          });
        })()}
      </div>

      {/* Group Creator Modal */}
      {showGroupCreator && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }}>
            <GroupCreator
              currentStudentId={currentStudentId}
              onGroupCreated={handleGroupCreated}
              onCancel={() => setShowGroupCreator(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationList;
