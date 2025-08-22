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
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isPoppedOut, setIsPoppedOut] = useState(false);
  const [popOutWindow, setPopOutWindow] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

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
    if ((!inputMessage.trim() && !uploadedImage) || !conversationId || isLoading) return;

    const userMessage = inputMessage.trim();
    const imageData = uploadedImage;
    setInputMessage('');
    setIsLoading(true);

    // Add user message to UI immediately
    const newUserMessage = {
      id: Date.now().toString(),
      content: userMessage,
      image: imagePreview,
      isUser: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMessage]);

    // Clear image after sending
    handleRemoveImage();

    try {
      const response = await aiService.sendMessage(conversationId, userMessage, selectedPersona, imageData);
      
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

  // Handle image upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image file size must be less than 10MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Data = e.target.result;
        setUploadedImage(base64Data);
        setImagePreview(URL.createObjectURL(file));
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove uploaded image
  const handleRemoveImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle pop-out to new window
  const handlePopOut = () => {
    if (isPoppedOut || popOutWindow) return; // Prevent multiple pop-outs
    
    const newWindow = window.open(
      '',
      'codecritic-popout',
      'width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no'
    );
    
    if (!newWindow) {
      alert('Pop-up blocked! Please allow pop-ups for this site and try again.');
      return;
    }

    // Store window reference and update state
    setPopOutWindow(newWindow);
    setIsPoppedOut(true);

    // Set up the pop-out window content
    newWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>CodeCritic - ${personas[selectedPersona]?.name}</title>
          <meta charset="utf-8">
          <style>
            body { 
              margin: 0; 
              font-family: system-ui, -apple-system, sans-serif;
              background: white;
              overflow: hidden;
            }
            .popout-container { 
              height: 100vh; 
              display: flex; 
              flex-direction: column;
              border: 3px solid ${personas[selectedPersona]?.color || '#9147FF'};
            }
            .popout-header {
              padding: 16px 20px;
              background: ${personas[selectedPersona]?.color || '#9147FF'};
              color: white;
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 1px solid rgba(255,255,255,0.2);
            }
            .popout-messages {
              flex: 1;
              overflow-y: auto;
              padding: 20px;
              background: white;
            }
            .popout-input {
              padding: 20px;
              border-top: 2px solid #f0f0f0;
              background: white;
            }
            .message {
              margin-bottom: 16px;
              padding: 12px 16px;
              border-radius: 12px;
              max-width: 80%;
              word-wrap: break-word;
            }
            .user-message {
              background: #e3f2fd;
              margin-left: auto;
              text-align: right;
            }
            .ai-message {
              background: #f5f5f5;
              margin-right: auto;
            }
            .input-area {
              display: flex;
              gap: 12px;
              align-items: flex-end;
            }
            .message-input {
              flex: 1;
              padding: 12px;
              border: 2px solid #ddd;
              border-radius: 8px;
              resize: vertical;
              min-height: 44px;
              font-family: inherit;
            }
            .send-button {
              padding: 12px 24px;
              background: ${personas[selectedPersona]?.color || '#9147FF'};
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-weight: bold;
            }
            .close-button {
              background: rgba(255,255,255,0.2);
              border: none;
              color: white;
              border-radius: 4px;
              padding: 4px 8px;
              cursor: pointer;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="popout-container">
            <div class="popout-header">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 20px;">${personas[selectedPersona]?.emoji}</span>
                <div>
                  <div style="font-weight: bold; font-size: 14px;">
                    CodeCritic: ${personas[selectedPersona]?.name}
                  </div>
                  <div style="font-size: 12px; opacity: 0.8;">
                    Day ${currentDay}/8 • ${studentData?.name || 'Student'}
                  </div>
                </div>
              </div>
              <button class="close-button" onclick="window.close()" title="Close Window">
                ×
              </button>
            </div>
            <div class="popout-messages" id="messages-container">
              <div style="text-align: center; color: #666; padding: 20px;">
                <p>✨ Welcome to your dedicated CodeCritic window!</p>
                <p>You can now maximize this window for the ultimate coding assistant experience.</p>
              </div>
            </div>
            <div class="popout-input">
              <div class="input-area">
                <textarea 
                  class="message-input" 
                  id="message-input"
                  placeholder="Type your message here..."
                  rows="1"
                ></textarea>
                <button class="send-button" id="send-button">Send</button>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    newWindow.document.close();

    // Set up messaging between windows
    const popoutMessagesContainer = newWindow.document.getElementById('messages-container');
    const popoutMessageInput = newWindow.document.getElementById('message-input');
    const popoutSendButton = newWindow.document.getElementById('send-button');

    // Render existing messages
    const renderMessages = () => {
      popoutMessagesContainer.innerHTML = messages.map(message => `
        <div class="message ${message.isUser ? 'user-message' : 'ai-message'}">
          ${message.content.replace(/\n/g, '<br>')}
        </div>
      `).join('');
      
      // Auto-scroll to bottom
      popoutMessagesContainer.scrollTop = popoutMessagesContainer.scrollHeight;
    };

    // Initial render
    renderMessages();

    // Handle sending messages from pop-out
    const sendMessageFromPopout = async () => {
      const messageText = popoutMessageInput.value.trim();
      if (!messageText || isLoading) return;

      popoutMessageInput.value = '';
      
      // Add user message to both windows
      const userMessage = {
        id: Date.now().toString(),
        content: messageText,
        isUser: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Send message through main window logic
      try {
        setIsLoading(true);
        const response = await aiService.sendMessage(conversationId, messageText, selectedPersona, uploadedImage);
        
        if (response.success) {
          const aiMessage = {
            id: (Date.now() + 1).toString(),
            content: response.message,
            isUser: false,
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, aiMessage]);
        }
      } catch (error) {
        console.error('Error sending message from popout:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Event listeners
    popoutSendButton.addEventListener('click', sendMessageFromPopout);
    popoutMessageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessageFromPopout();
      }
    });

    // Handle window close
    newWindow.addEventListener('beforeunload', () => {
      setIsPoppedOut(false);
      setPopOutWindow(null);
    });

    // Focus the new window and input
    newWindow.focus();
    setTimeout(() => popoutMessageInput.focus(), 100);
  };

  // Sync messages to pop-out window
  useEffect(() => {
    if (isPoppedOut && popOutWindow && !popOutWindow.closed) {
      const popoutMessagesContainer = popOutWindow.document.getElementById('messages-container');
      if (popoutMessagesContainer) {
        popoutMessagesContainer.innerHTML = messages.map(message => `
          <div class="message ${message.isUser ? 'user-message' : 'ai-message'}">
            ${message.content.replace(/\n/g, '<br>')}
          </div>
        `).join('');
        
        // Auto-scroll to bottom
        popoutMessagesContainer.scrollTop = popoutMessagesContainer.scrollHeight;
      }
    }
  }, [messages, isPoppedOut, popOutWindow]);

  // Clean up pop-out window on component unmount
  useEffect(() => {
    return () => {
      if (popOutWindow && !popOutWindow.closed) {
        popOutWindow.close();
      }
    };
  }, [popOutWindow]);

  // Persona Selection Screen
  if (!selectedPersona) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '600px',
        height: '700px',
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

  // Show minimized "pop back in" button when popped out
  if (isPoppedOut) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: personas[selectedPersona]?.color || '#9147FF',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '12px',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        fontWeight: 'bold',
        zIndex: 1000
      }} onClick={() => {
        if (popOutWindow && !popOutWindow.closed) {
          popOutWindow.close();
        }
        setIsPoppedOut(false);
        setPopOutWindow(null);
      }}>
        <span style={{ fontSize: '16px' }}>{personas[selectedPersona]?.emoji}</span>
        Pop Back In
      </div>
    );
  }

  // Chat Interface
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: isMinimized ? '300px' : (isExpanded ? 'min(800px, calc(100vw - 40px))' : 'min(600px, calc(100vw - 40px))'),
      height: isMinimized ? '60px' : (isExpanded ? 'min(900px, calc(100vh - 40px))' : 'min(700px, calc(100vh - 40px))'),
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
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePopOut();
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
                title="Pop Out to New Window"
              >
                🗗
              </button>
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
            </>
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
                    <div>
                      {message.image && (
                        <div style={{ marginBottom: '8px' }}>
                          <img 
                            src={message.image} 
                            alt="User uploaded" 
                            style={{ 
                              maxWidth: '200px', 
                              maxHeight: '200px', 
                              borderRadius: '8px',
                              border: '1px solid #ddd'
                            }} 
                          />
                        </div>
                      )}
                      <div style={{ whiteSpace: 'pre-wrap' }}>
                        {message.content}
                      </div>
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
            {/* Image Preview */}
            {imagePreview && (
              <div style={{
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <img 
                  src={imagePreview} 
                  alt="Upload preview" 
                  style={{ 
                    width: '40px', 
                    height: '40px', 
                    objectFit: 'cover', 
                    borderRadius: '4px' 
                  }} 
                />
                <span style={{ flex: 1, fontSize: '14px', color: '#666' }}>
                  Image ready to send
                </span>
                <button
                  onClick={handleRemoveImage}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#dc3545',
                    cursor: 'pointer',
                    fontSize: '16px',
                    padding: '4px',
                    borderRadius: '4px'
                  }}
                  title="Remove image"
                >
                  ×
                </button>
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-end'
            }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask CodeCritic anything about coding, AI, or your project..."
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 12px',
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
                
                {/* Image Upload Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    bottom: '8px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px',
                    color: personas[selectedPersona]?.color || '#9147FF',
                    padding: '4px',
                    borderRadius: '4px',
                    opacity: isLoading ? 0.5 : 1
                  }}
                  title="Upload image"
                >
                  📷
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </div>
              
              <button
                onClick={handleSendMessage}
                disabled={(!inputMessage.trim() && !uploadedImage) || isLoading}
                style={{
                  padding: '12px 20px',
                  background: personas[selectedPersona]?.color || '#9147FF',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: (inputMessage.trim() || uploadedImage) && !isLoading ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  opacity: (inputMessage.trim() || uploadedImage) && !isLoading ? 1 : 0.5,
                  transition: 'all 0.2s ease'
                }}
              >
                Send
              </button>
            </div>
            
            {/* Privacy Disclaimer */}
            <div style={{
              fontSize: '10px',
              color: '#666',
              textAlign: 'center',
              marginTop: '8px',
              lineHeight: '1.3',
              opacity: 0.8
            }}>
              Conversations may be reviewed by TPZ for program improvement research. To our knowledge, your data is not used to train AI models or retained by the model provider.
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