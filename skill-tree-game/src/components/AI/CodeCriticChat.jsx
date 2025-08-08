import React, { useState, useEffect, useRef } from 'react';
import { aiService } from '../../services/aiService';
import MessageFormatter from './MessageFormatter';

const CodeCriticChat = ({ studentId, studentData, onClose }) => {
  const [conversationId, setConversationId] = useState(null);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [showDaySelector, setShowDaySelector] = useState(false);
  const [currentDay, setCurrentDay] = useState(1);
  const messagesEndRef = useRef(null);

  // Persona definitions with visual styling
  const personas = {
    'jaylen-brown': {
      name: 'Jaylen Brown',
      emoji: '🏀',
      description: 'Thoughtful, strategic mentor focused on community impact',
      color: '#2E8B57', // Sea green
      greeting: "What's good! I'm here to help you build something that matters for your community. What vision are we bringing to life today?"
    },
    'ice-spice': {
      name: 'Ice Spice',
      emoji: '🧊',
      description: 'Confident, cool coding partner with iconic energy',
      color: '#FF6B6B', // Coral red
      greeting: "Hey! Ready to make some magic happen with code? Let's get this project looking absolutely fire! 🔥"
    },
    'mrbeast': {
      name: 'MrBeast',
      emoji: '💥',
      description: 'High-energy, challenge-driven coding champion',
      color: '#FFD93D', // Bright yellow
      greeting: "YO! Welcome to the most EPIC coding session ever! We're about to build something INSANE! What challenge are we conquering today?!"
    },
    'valkyrae': {
      name: 'Valkyrae',
      emoji: '🎮',
      description: 'Supportive gaming teammate in co-op coding mode',
      color: '#9147FF', // Twitch purple
      greeting: "Hey teammate! Ready for some co-op coding? We're gonna crush this project together! What are we building today? 🎯"
    },
    'neil-degrasse-tyson': {
      name: 'Neil deGrasse Tyson',
      emoji: '🌟',
      description: 'Curious scientist exploring the universe of code',
      color: '#4169E1', // Royal blue
      greeting: "Greetings, young programmer! The universe of code awaits us. Let's explore the elegant principles that make technology possible. What cosmic project shall we embark upon?"
    }
  };

  // Load existing conversation with full persistence
  useEffect(() => {
    const loadConversation = async () => {
      if (!studentId) return;
      
      setIsLoadingHistory(true);
      try {
        // Check for existing active conversation
        const activeConversation = await aiService.getActiveConversation(studentId);
        if (activeConversation) {
          setConversationId(activeConversation.id);
          setSelectedPersona(activeConversation.persona);
          
          // Load conversation history
          const history = await aiService.getConversationHistory(activeConversation.id);
          setMessages(history);
          
          console.log(`📱 Continuing conversation with ${activeConversation.personaName} (${history.length} messages)`);
        } else {
          console.log('📱 No existing conversation found - will show persona selection');
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadConversation();
  }, [studentId]);

  // Initialize student memory with actual student data
  useEffect(() => {
    const initializeStudentMemory = async () => {
      if (!studentId || !studentData) return;
      
      try {
        // Get or create student memory
        const memory = await aiService.getStudentMemory(studentId);
        
        // Update with actual student name if not set
        if (!memory.student_name && studentData.name) {
          await aiService.updateStudentMemory(studentId, {
            student_name: studentData.name
          });
          console.log(`👤 Initialized memory for ${studentData.name}`);
        }
        
        // Update current day from memory
        setCurrentDay(memory.current_day || 1);
      } catch (error) {
        console.error('Error initializing student memory:', error);
      }
    };

    initializeStudentMemory();
  }, [studentId, studentData]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close day selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDaySelector && !event.target.closest('[data-day-selector]')) {
        setShowDaySelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDaySelector]);

  // Handle chat reset
  const handleChatReset = async (newPersona = null, newDay = null) => {
    setIsLoading(true);
    try {
      await aiService.resetChat(studentId, newPersona, newDay || currentDay);
      
      // Clear current conversation state
      setConversationId(null);
      setSelectedPersona(null);
      setMessages([]);
      
      // Update day if provided
      if (newDay) {
        setCurrentDay(newDay);
      }
      
      console.log(`🔄 Chat reset. Day: ${newDay || currentDay}, Persona: ${newPersona || 'None'}`);
    } catch (error) {
      console.error('Error resetting chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle day selection
  const handleDaySelect = async (day) => {
    setCurrentDay(day);
    setShowDaySelector(false);
    await aiService.updateStudentMemory(studentId, { 
      current_day: day,
      last_action: `Started Day ${day}`
    });
    
    // Update current conversation day instead of resetting
    if (conversationId) {
      await aiService.updateConversationDay(conversationId, day);
      
      // Add a system message to indicate day change
      const dayChangeMessage = `📅 Switched to Day ${day} context. The AI now has access to Day ${day} course materials and activities.`;
      setMessages(prev => [...prev, {
        id: Date.now(),
        content: dayChangeMessage,
        isUser: false,
        timestamp: new Date(),
        isSystemMessage: true
      }]);
    }
  };

  // Handle persona selection
  const handlePersonaSelect = async (personaKey) => {
    setSelectedPersona(personaKey);
    setIsLoading(true);

    try {
      // Check if there's already an active conversation with this persona
      const existingConversation = await aiService.getActiveConversation(studentId);
      let currentConversationId;
      
      if (existingConversation && existingConversation.persona === personaKey) {
        // Continue existing conversation with same persona
        currentConversationId = existingConversation.id;
        console.log(`💬 Continuing existing conversation with ${personas[personaKey].name}`);
        
        // Load conversation history instead of starting fresh
        const history = await aiService.getConversationHistory(currentConversationId);
        setMessages(history);
      } else {
        // Create new conversation (first time with this persona or switching persona)
        if (existingConversation) {
          // End the previous conversation
          await aiService.endConversation(existingConversation.id);
          console.log(`🔄 Switching from ${existingConversation.personaName} to ${personas[personaKey].name}`);
        }
        
        currentConversationId = await aiService.createConversation(studentId, personaKey, currentDay);
        console.log(`✨ Starting new conversation with ${personas[personaKey].name}`);
        
        // Send greeting message for new conversations only
        const greeting = personas[personaKey].greeting;
        setMessages([{
          id: 'greeting',
          content: greeting,
          isUser: false,
          timestamp: new Date()
        }]);
        
        await aiService.saveMessage(currentConversationId, greeting, false);
      }
      
      setConversationId(currentConversationId);
    } catch (error) {
      console.error('Error selecting persona:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !conversationId || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message to UI immediately
    const newUserMessage = {
      id: Date.now().toString(),
      content: userMessage,
      isUser: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      const response = await aiService.sendMessage(conversationId, userMessage, selectedPersona);
      
      if (response.success) {
        // Add AI response to UI
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          content: response.message,
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        console.error('AI response error:', response.error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Persona Selection Screen
  if (!selectedPersona) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '400px',
        height: '500px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ 
            color: 'white', 
            margin: 0, 
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            🤖 Choose Your CodeCritic Persona
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* Persona Options */}
        <div style={{
          flex: 1,
          padding: '20px',
          overflowY: 'auto'
        }}>
          {Object.entries(personas).map(([key, persona]) => (
            <div
              key={key}
              onClick={() => handlePersonaSelect(key)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: '1px solid rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.2)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.1)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '24px', marginRight: '12px' }}>
                  {persona.emoji}
                </span>
                <h4 style={{
                  color: 'white',
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>
                  {persona.name}
                </h4>
              </div>
              <p style={{
                color: 'rgba(255,255,255,0.8)',
                margin: 0,
                fontSize: '14px',
                lineHeight: '1.4'
              }}>
                {persona.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Chat Interface
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: isMinimized ? '300px' : (isExpanded ? 'min(600px, calc(100vw - 40px))' : 'min(400px, calc(100vw - 40px))'),
      height: isMinimized ? '60px' : (isExpanded ? 'min(700px, calc(100vh - 40px))' : 'min(600px, calc(100vh - 40px))'),
      maxWidth: 'calc(100vw - 40px)',
      maxHeight: 'calc(100vh - 40px)',
      background: 'white',
      borderRadius: '20px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      border: `3px solid ${personas[selectedPersona]?.color || '#9147FF'}`,
      transition: 'all 0.3s ease'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        background: personas[selectedPersona]?.color || '#9147FF',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'pointer'
      }} onClick={() => setIsMinimized(!isMinimized)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>
            {personas[selectedPersona]?.emoji}
          </span>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
              CodeCritic: {personas[selectedPersona]?.name}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              Day {currentDay}/8 • {studentData?.name || 'Student'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {!isMinimized && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDaySelector(!showDaySelector);
                }}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
                title="Select Course Day"
              >
                📅
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleChatReset();
                }}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
                title="Reset Chat (Preserves Memory)"
              >
                🔄
              </button>
            </>
          )}
          {/* Always show expand/collapse and minimize controls */}
          {!isMinimized && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                borderRadius: '4px',
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              title={isExpanded ? 'Contract' : 'Expand'}
            >
              {isExpanded ? '⇲' : '⇱'}
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              borderRadius: '4px',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? '▲' : '▼'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              borderRadius: '4px',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
            title="Close"
          >
            ×
          </button>
        </div>
      </div>

      {/* Day Selector Dropdown */}
      {!isMinimized && showDaySelector && (
        <div data-day-selector style={{
          position: 'absolute',
          top: '60px',
          right: '20px',
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 1001,
          padding: '8px'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
            Select Course Day:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(day => (
              <button
                key={day}
                onClick={() => handleDaySelect(day)}
                style={{
                  padding: '8px 12px',
                  border: day === currentDay ? '2px solid #9147FF' : '1px solid #ddd',
                  borderRadius: '4px',
                  background: day === currentDay ? '#9147FF' : 'white',
                  color: day === currentDay ? 'white' : '#333',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: day === currentDay ? 'bold' : 'normal'
                }}
              >
                Day {day}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Area */}
      {!isMinimized && (
        <>
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            background: '#f8f9fa'
          }}>
            {isLoadingHistory ? (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  border: '3px solid #e3e3e3',
                  borderTop: `3px solid ${personas[selectedPersona]?.color || '#9147FF'}`,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <div style={{ 
                  color: '#666', 
                  fontSize: '14px',
                  textAlign: 'center'
                }}>
                  Loading your conversation history...
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                color: '#666',
                fontSize: '14px',
                textAlign: 'center'
              }}>
                Start a conversation with {personas[selectedPersona]?.name}! 🚀
              </div>
            ) : (
              messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent: message.isSystemMessage ? 'center' : (message.isUser ? 'flex-end' : 'flex-start'),
                  marginBottom: '16px'
                }}
              >
                <div
                  style={{
                    maxWidth: message.isSystemMessage ? '90%' : '85%',
                    padding: message.isSystemMessage ? '8px 12px' : (message.isUser ? '12px 16px' : '8px'),
                    borderRadius: message.isSystemMessage ? '8px' : '18px',
                    background: message.isSystemMessage 
                      ? '#f0f8ff'
                      : (message.isUser 
                        ? (personas[selectedPersona]?.color || '#9147FF')
                        : 'white'),
                    color: message.isSystemMessage 
                      ? '#666'
                      : (message.isUser ? 'white' : '#333'),
                    boxShadow: message.isSystemMessage 
                      ? '0 1px 4px rgba(0,0,0,0.05)'
                      : '0 2px 8px rgba(0,0,0,0.1)',
                    fontSize: message.isSystemMessage ? '12px' : '14px',
                    lineHeight: '1.4',
                    fontStyle: message.isSystemMessage ? 'italic' : 'normal',
                    border: message.isSystemMessage ? '1px solid #e0e8f0' : 'none'
                  }}
                >
                  {message.isUser || message.isSystemMessage ? (
                    <div style={{ whiteSpace: 'pre-wrap' }}>
                      {message.content}
                    </div>
                  ) : (
                    <MessageFormatter
                      content={message.content}
                      isUser={message.isUser}
                      personaColor={personas[selectedPersona]?.color || '#9147FF'}
                    />
                  )}
                </div>
              </div>
            )))}
            {isLoading && (
              <div style={{
                display: 'flex',
                justifyContent: 'flex-start',
                marginBottom: '16px'
              }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '18px',
                  background: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  fontSize: '14px'
                }}>
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center'
                  }}>
                    <span style={{ color: '#666' }}>CodeCritic is thinking</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        background: personas[selectedPersona]?.color || '#9147FF',
                        borderRadius: '50%',
                        animation: 'bounce 1.4s ease-in-out infinite both',
                        animationDelay: '0s'
                      }}></div>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        background: personas[selectedPersona]?.color || '#9147FF',
                        borderRadius: '50%',
                        animation: 'bounce 1.4s ease-in-out infinite both',
                        animationDelay: '0.16s'
                      }}></div>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        background: personas[selectedPersona]?.color || '#9147FF',
                        borderRadius: '50%',
                        animation: 'bounce 1.4s ease-in-out infinite both',
                        animationDelay: '0.32s'
                      }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* CSS for animations */}
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>

          {/* Input Area */}
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid #e9ecef',
            background: 'white'
          }}>
            <div style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-end'
            }}>
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask CodeCritic anything about coding, AI, or your project..."
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '2px solid #e9ecef',
                  borderRadius: '12px',
                  resize: 'none',
                  fontSize: '14px',
                  minHeight: '44px',
                  maxHeight: '120px',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                style={{
                  padding: '12px 20px',
                  background: personas[selectedPersona]?.color || '#9147FF',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: inputMessage.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  opacity: inputMessage.trim() && !isLoading ? 1 : 0.5,
                  transition: 'all 0.2s ease'
                }}
              >
                Send
              </button>
            </div>
          </div>
        </>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes bounce {
            0%, 80%, 100% {
              transform: scale(0);
            }
            40% {
              transform: scale(1);
            }
          }
        `}
      </style>
    </div>
  );
};

export default CodeCriticChat;