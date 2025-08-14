import React, { useState } from 'react';

const ConversationList = ({ conversations, currentStudentId, onSelectConversation, onNewMessage }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = conversations.filter(conversation => {
    if (!searchTerm) return true;
    
    // Get the other participant's name
    const otherParticipantId = conversation.participants.find(id => id !== currentStudentId);
    const otherParticipantName = otherParticipantId ? otherParticipantId.replace(/_/g, ' ') : '';
    
    // Search in participant name or last message
    return otherParticipantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (conversation.lastMessage?.text || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getOtherParticipantInfo = (conversation) => {
    const otherParticipantId = conversation.participants.find(id => id !== currentStudentId);
    return {
      id: otherParticipantId,
      name: otherParticipantId ? otherParticipantId.replace(/_/g, ' ') : 'Unknown',
      avatar: { emoji: '👤', color1: '#FF8C42' } // Default avatar
    };
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
        </div>
      </div>

      {/* Conversations List */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        padding: '10px 0'
      }}>
        {filteredConversations.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#8B4513',
            fontSize: '16px'
          }}>
            {conversations.length === 0 ? (
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
        ) : (
          filteredConversations.map((conversation) => {
            const otherParticipant = getOtherParticipantInfo(conversation);
            const lastMessage = conversation.lastMessage;
            const isUnread = lastMessage && lastMessage.senderId !== currentStudentId; // Simplified unread logic
            
            // Extract avatar properties safely to avoid React serialization issues
            // Handle both simple string avatars and complex avatar objects
            const avatarColor1 = (typeof otherParticipant?.avatar === 'object' ? otherParticipant?.avatar?.color1 : null) || '#FF8C42';
            const avatarEmoji = (typeof otherParticipant?.avatar === 'object' ? otherParticipant?.avatar?.emoji : otherParticipant?.avatar) || '👤';
            
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
                      whiteSpace: 'nowrap'
                    }}>
                      {otherParticipant.name}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#8B4513',
                      opacity: 0.6,
                      flexShrink: 0,
                      marginLeft: '10px'
                    }}>
                      {formatTimestamp(lastMessage?.timestamp)}
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

                {/* Unread Indicator */}
                {isUnread && (
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#3b82f6',
                    marginLeft: '10px',
                    flexShrink: 0
                  }} />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConversationList;
