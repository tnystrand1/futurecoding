import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  setDoc,
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../utils/firebase-config';

class EnhancedMessagingService {
  constructor() {
    this.conversationsRef = collection(db, 'conversations');
    this.messagesRef = collection(db, 'messages');
    this.studentsRef = collection(db, 'students');
    this.messagingStatsRef = collection(db, 'messagingStats');
  }

  // Send a message with enhanced attachment support
  async sendMessage(conversationId, senderId, receiverId, text, attachments = []) {
    try {
      // Determine message type and process attachments
      const hasText = text && text.trim();
      const hasAttachments = attachments && attachments.length > 0;
      
      let messageType = 'text';
      const processedAttachments = [];
      
      if (hasAttachments) {
        const imageAttachments = attachments.filter(att => att.type === 'image');
        const codeAttachments = attachments.filter(att => att.type === 'code');
        
        if (imageAttachments.length > 0 && codeAttachments.length > 0) {
          messageType = 'mixed_media';
        } else if (imageAttachments.length > 0) {
          messageType = hasText ? 'mixed' : 'image';
        } else if (codeAttachments.length > 0) {
          messageType = hasText ? 'code_mixed' : 'code';
        }
        
        // Process all attachments - ensure all values are serializable
        attachments.forEach(attachment => {
          try {
            if (attachment.type === 'image') {
              // Ensure all fields are primitive types for Firestore
              const processedAttachment = {
                id: String(attachment.id || `img_${Date.now()}_${Math.floor(Math.random() * 1000)}`),
                type: 'image',
                name: String(attachment.name || 'image.png').slice(0, 255), // Limit name length
                size: Math.max(0, Number(attachment.size) || 0), // Ensure positive number
                dataUrl: String(attachment.dataUrl || '').slice(0, 10000000) // Limit dataUrl size (10MB)
              };
              
              // Additional validation for dataUrl format
              if (processedAttachment.dataUrl && !processedAttachment.dataUrl.startsWith('data:')) {
                console.warn('Invalid dataUrl format, skipping attachment:', processedAttachment.name);
                return; // Skip this attachment
              }
              
              // Remove any undefined, null, or invalid values
              Object.keys(processedAttachment).forEach(key => {
                const value = processedAttachment[key];
                if (value === undefined || value === null || 
                    (typeof value === 'number' && isNaN(value)) ||
                    (typeof value === 'string' && value.length === 0 && key !== 'dataUrl')) {
                  delete processedAttachment[key];
                }
              });
              
              processedAttachments.push(processedAttachment);
            } else if (attachment.type === 'code') {
              const processedAttachment = {
                id: String(attachment.id || `code_${Date.now()}_${Math.floor(Math.random() * 1000)}`),
                type: 'code',
                name: String(attachment.name || 'code.txt').slice(0, 255), // Limit name length
                size: Math.max(0, Number(attachment.size) || 0), // Ensure positive number
                content: String(attachment.content || '').slice(0, 1000000), // Limit content size (1MB)
                language: String(attachment.language || 'text').slice(0, 50) // Limit language length
              };
              
              // Remove any undefined, null, or invalid values
              Object.keys(processedAttachment).forEach(key => {
                const value = processedAttachment[key];
                if (value === undefined || value === null || 
                    (typeof value === 'number' && isNaN(value)) ||
                    (typeof value === 'string' && value.length === 0 && key !== 'content')) {
                  delete processedAttachment[key];
                }
              });
              
              processedAttachments.push(processedAttachment);
            }
          } catch (attachmentError) {
            console.error('Error processing attachment:', attachmentError, attachment);
            // Skip this attachment and continue with others
          }
        });
      }

      // Create message document - ensure all fields are Firestore-serializable
      const messageData = {
        conversationId: String(conversationId),
        senderId: String(senderId),
        receiverId: String(receiverId),
        text: String(hasText ? text.trim() : ''),
        timestamp: serverTimestamp(),
        messageType: String(messageType),
        isRead: false,
        readAt: null,
        deliveredAt: serverTimestamp(), // Message is delivered when created
        competencyTags: this.analyzeMessageForCompetencyTags(text, processedAttachments) || []
      };

      // Only add attachments field if we have attachments
      if (processedAttachments.length > 0) {
        messageData.attachments = processedAttachments;
      }

      // Clean up any undefined values that might cause serialization issues
      Object.keys(messageData).forEach(key => {
        if (messageData[key] === undefined) {
          delete messageData[key];
        }
      });

      // Debug logging before attempting to save
      console.log('Attempting to save message with data:', {
        conversationId: messageData.conversationId,
        messageType: messageData.messageType,
        hasAttachments: !!messageData.attachments,
        attachmentCount: messageData.attachments?.length || 0,
        attachmentTypes: messageData.attachments?.map(att => ({ type: att.type, hasDataUrl: !!att.dataUrl })) || []
      });

      const messageRef = await addDoc(this.messagesRef, messageData);

      // Update conversation with last message
      const conversationDoc = await getDoc(doc(this.conversationsRef, conversationId));
      const currentMessageCount = conversationDoc.data()?.messageCount || 0;
      
      // Create last message preview
      let lastMessageText = this.createMessagePreview(text, processedAttachments, messageType);

      await updateDoc(doc(this.conversationsRef, conversationId), {
        lastMessage: {
          text: lastMessageText,
          senderId,
          timestamp: serverTimestamp(),
          messageType
        },
        messageCount: currentMessageCount + 1
      });

      // Update messaging stats for sender
      await this.updateMessagingStats(senderId, 'message_sent');

      return {
        success: true,
        messageId: messageRef.id,
        messageType,
        attachmentCount: processedAttachments.length
      };
    } catch (error) {
      console.error('Error sending message:', error);
      console.error('Failed message data:', {
        conversationId,
        senderId,
        receiverId,
        textLength: text?.length || 0,
        attachmentCount: processedAttachments?.length || 0,
        attachmentData: processedAttachments?.map(att => ({
          type: att.type,
          id: att.id,
          name: att.name,
          size: att.size,
          hasDataUrl: att.type === 'image' ? !!att.dataUrl : undefined,
          dataUrlLength: att.type === 'image' ? att.dataUrl?.length : undefined
        }))
      });
      
      // If it's a serialization error, try sending without attachments as fallback
      if (error.message?.includes('nested entity') && processedAttachments.length > 0) {
        console.warn('Attempting to send message without attachments as fallback...');
        try {
          const fallbackMessageData = {
            conversationId: String(conversationId),
            senderId: String(senderId),
            receiverId: String(receiverId),
            text: String(hasText ? text.trim() + ' [Attachments failed to send]' : '[Attachments failed to send]'),
            timestamp: serverTimestamp(),
            messageType: 'text',
            isRead: false,
            readAt: null,
            deliveredAt: serverTimestamp(),
            competencyTags: []
          };
          
          const fallbackRef = await addDoc(this.messagesRef, fallbackMessageData);
          console.log('Fallback message sent successfully');
          
          return {
            success: true,
            messageId: fallbackRef.id,
            messageType: 'text',
            attachmentCount: 0,
            warning: 'Message sent but attachments failed to upload'
          };
        } catch (fallbackError) {
          console.error('Fallback message also failed:', fallbackError);
        }
      }
      
      throw error;
    }
  }

  // Create appropriate message preview for conversation list
  createMessagePreview(text, attachments, messageType) {
    const imageCount = attachments.filter(att => att.type === 'image').length;
    const codeCount = attachments.filter(att => att.type === 'code').length;
    
    let preview = '';
    
    if (text && text.trim()) {
      preview = text.trim().substring(0, 50);
      if (text.trim().length > 50) preview += '...';
    }
    
    const attachmentIcons = [];
    if (imageCount > 0) {
      attachmentIcons.push(`📷${imageCount > 1 ? imageCount : ''}`);
    }
    if (codeCount > 0) {
      attachmentIcons.push(`💻${codeCount > 1 ? codeCount : ''}`);
    }
    
    if (attachmentIcons.length > 0) {
      if (preview) {
        return `${preview} ${attachmentIcons.join(' ')}`;
      } else {
        return attachmentIcons.join(' ');
      }
    }
    
    return preview || 'Message';
  }

  // Enhanced competency analysis including code attachments
  analyzeMessageForCompetencyTags(text, attachments = []) {
    const tags = [];
    const content = text ? text.toLowerCase() : '';
    
    // Text-based analysis
    if (content.includes('help') || content.includes('stuck') || content.includes('error')) {
      tags.push('help-seeking');
    }
    if (content.includes('figured out') || content.includes('solution') || content.includes('fixed')) {
      tags.push('problem-solving');
    }
    if (content.includes('work together') || content.includes('collaborate') || content.includes('pair')) {
      tags.push('collaboration');
    }
    if (content.includes('completed') || content.includes('finished') || content.includes('done')) {
      tags.push('progress-sharing');
    }
    
    // Code-based analysis
    const codeAttachments = attachments.filter(att => att.type === 'code');
    if (codeAttachments.length > 0) {
      tags.push('code-sharing');
      
      codeAttachments.forEach(codeFile => {
        const codeContent = codeFile.content ? codeFile.content.toLowerCase() : '';
        const language = codeFile.language || '';
        
        // Language-specific tags
        if (language === 'html' || codeContent.includes('<div') || codeContent.includes('<html')) {
          tags.push('html-development');
        }
        if (language === 'css' || codeContent.includes('margin:') || codeContent.includes('color:')) {
          tags.push('css-styling');
        }
        if (language === 'javascript' || codeContent.includes('function') || codeContent.includes('const ')) {
          tags.push('javascript-programming');
        }
        
        // Complexity indicators
        if (codeContent.includes('function') || codeContent.includes('class') || codeContent.includes('=>')) {
          tags.push('advanced-programming');
        }
        if (codeContent.includes('error') || codeContent.includes('debug') || codeContent.includes('console.log')) {
          tags.push('debugging');
        }
      });
    }
    
    // Text code analysis
    if (content.includes('```') || content.includes('function') || content.includes('<div')) {
      tags.push('inline-code-sharing');
    }
    
    return [...new Set(tags)]; // Remove duplicates
  }

  // Update existing methods to handle new attachment structure
  async getConversationMessages(conversationId, limitCount = 50) {
    try {
      const q = query(
        this.messagesRef,
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'asc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      throw error;
    }
  }

  // Create a new conversation
  async createConversation(participant1Id, participant2Id) {
    try {
      // Check if conversation already exists
      const existingConversation = await this.getExistingConversation(participant1Id, participant2Id);
      if (existingConversation) {
        return existingConversation;
      }

      const conversationData = {
        participants: [participant1Id, participant2Id],
        createdAt: serverTimestamp(),
        lastMessage: {
          text: '',
          senderId: '',
          timestamp: serverTimestamp()
        },
        messageCount: 0,
        archived: {}, // Object to track archive status per participant: { userId: true/false }
        type: 'direct', // 'direct' or 'group'
        isGroup: false
      };

      const conversationRef = await addDoc(this.conversationsRef, conversationData);
      return {
        id: conversationRef.id,
        ...conversationData
      };
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  // Check for existing conversation between two participants
  async getExistingConversation(participant1Id, participant2Id) {
    try {
      const q = query(
        this.conversationsRef,
        where('participants', 'array-contains', participant1Id)
      );
      
      const snapshot = await getDocs(q);
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        if (data.participants.includes(participant2Id)) {
          return {
            id: doc.id,
            ...data
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error checking existing conversation:', error);
      return null;
    }
  }

  // Get student conversations with fallback logic (excludes archived by default)
  async getStudentConversations(studentId, includeArchived = false) {
    try {
      // Try indexed query first
      const q = query(
        this.conversationsRef,
        where('participants', 'array-contains', studentId),
        orderBy('lastMessage.timestamp', 'desc')
      );
      
      const snapshot = await getDocs(q);
      let conversations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter out archived conversations unless specifically requested
      if (!includeArchived) {
        conversations = conversations.filter(conv => 
          !conv.archived || conv.archived[studentId] !== true
        );
      }

      // Additional validation: ensure student is actually a current participant
      // This prevents showing conversations where the student was removed but data is inconsistent
      conversations = conversations.filter(conv => {
        // For direct conversations, ensure student is one of exactly 2 participants
        if (!conv.isGroup) {
          return conv.participants && conv.participants.length === 2 && conv.participants.includes(studentId);
        }
        
        // For group conversations, ensure student is still in participants array
        // and the conversation is active
        return conv.participants && 
               conv.participants.includes(studentId) && 
               conv.participants.length >= 2; // Groups need at least 2 people
      });

      return conversations;
    } catch (error) {
      console.warn('Indexed query failed, using fallback:', error);
      
      // Fallback: get all conversations and filter client-side
      const allConversationsSnapshot = await getDocs(this.conversationsRef);
      let conversations = allConversationsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(conv => {
          // Basic participant check
          if (!conv.participants || !conv.participants.includes(studentId)) {
            return false;
          }
          
          // Additional validation: ensure student is actually a current participant
          if (!conv.isGroup) {
            return conv.participants.length === 2;
          } else {
            return conv.participants.length >= 2;
          }
        })
        .sort((a, b) => {
          const aTime = a.lastMessage?.timestamp?.toDate?.() || new Date(0);
          const bTime = b.lastMessage?.timestamp?.toDate?.() || new Date(0);
          return bTime - aTime;
        });

      // Filter out archived conversations unless specifically requested
      if (!includeArchived) {
        conversations = conversations.filter(conv => 
          !conv.archived || conv.archived[studentId] !== true
        );
      }
      
      return conversations;
    }
  }

  // Mark messages as read with timestamp
  async markMessagesAsRead(conversationId, userId) {
    try {
      const q = query(
        this.messagesRef,
        where('conversationId', '==', conversationId),
        where('receiverId', '==', userId),
        where('isRead', '==', false)
      );
      
      const snapshot = await getDocs(q);
      const readTimestamp = serverTimestamp();
      
      const updatePromises = snapshot.docs.map(doc => 
        updateDoc(doc.ref, { 
          isRead: true,
          readAt: readTimestamp
        })
      );
      
      await Promise.all(updatePromises);
      return snapshot.docs.length;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return 0;
    }
  }

  // Mark a specific message as read
  async markMessageAsRead(messageId, userId) {
    try {
      const messageRef = doc(this.messagesRef, messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (messageDoc.exists()) {
        const messageData = messageDoc.data();
        
        // Only mark as read if the user is the receiver and it's not already read
        if (messageData.receiverId === userId && !messageData.isRead) {
          await updateDoc(messageRef, {
            isRead: true,
            readAt: serverTimestamp()
          });
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  }

  // Get read receipt status for a message
  async getMessageReadStatus(messageId) {
    try {
      const messageRef = doc(this.messagesRef, messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (messageDoc.exists()) {
        const data = messageDoc.data();
        return {
          delivered: !!data.deliveredAt,
          deliveredAt: data.deliveredAt,
          read: !!data.isRead,
          readAt: data.readAt
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting message read status:', error);
      return null;
    }
  }

  // Get conversation read status summary
  async getConversationReadStatus(conversationId, userId) {
    try {
      // Try the indexed query first
      const q = query(
        this.messagesRef,
        where('conversationId', '==', conversationId),
        where('senderId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(20) // Check last 20 messages for performance
      );
      
      const snapshot = await getDocs(q);
      const messages = snapshot.docs.map(doc => doc.data());
      
      const totalSent = messages.length;
      const readMessages = messages.filter(msg => msg.isRead).length;
      const deliveredMessages = messages.filter(msg => msg.deliveredAt).length;
      const lastReadMessage = messages.find(msg => msg.isRead);
      
      return {
        totalSent,
        delivered: deliveredMessages,
        read: readMessages,
        lastReadAt: lastReadMessage?.readAt || null,
        readPercentage: totalSent > 0 ? Math.round((readMessages / totalSent) * 100) : 0
      };
    } catch (error) {
      console.error('Error getting conversation read status:', error);
      
      // Fallback: Just return basic status without detailed query
      try {
        const fallbackQ = query(
          this.messagesRef,
          where('conversationId', '==', conversationId),
          limit(20)
        );
        
        const fallbackSnapshot = await getDocs(fallbackQ);
        const userMessages = fallbackSnapshot.docs
          .map(doc => doc.data())
          .filter(msg => msg.senderId === userId);
        
        const totalSent = userMessages.length;
        const readMessages = userMessages.filter(msg => msg.isRead).length;
        
        return {
          totalSent,
          delivered: totalSent, // Assume delivered if sent
          read: readMessages,
          lastReadAt: null,
          readPercentage: totalSent > 0 ? Math.round((readMessages / totalSent) * 100) : 0
        };
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        // Return default status
        return {
          totalSent: 0,
          delivered: 0,
          read: 0,
          lastReadAt: null,
          readPercentage: 0
        };
      }
    }
  }

  // Archive a conversation for a specific user
  async archiveConversation(conversationId, userId) {
    try {
      const conversationRef = doc(this.conversationsRef, conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (conversationDoc.exists()) {
        const currentData = conversationDoc.data();
        const updatedArchived = {
          ...currentData.archived,
          [userId]: true
        };
        
        await updateDoc(conversationRef, {
          archived: updatedArchived
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error archiving conversation:', error);
      return false;
    }
  }

  // Unarchive a conversation for a specific user
  async unarchiveConversation(conversationId, userId) {
    try {
      const conversationRef = doc(this.conversationsRef, conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (conversationDoc.exists()) {
        const currentData = conversationDoc.data();
        const updatedArchived = {
          ...currentData.archived,
          [userId]: false
        };
        
        await updateDoc(conversationRef, {
          archived: updatedArchived
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error unarchiving conversation:', error);
      return false;
    }
  }

  // Get archived conversations for a user
  async getArchivedConversations(studentId) {
    try {
      const q = query(
        this.conversationsRef,
        where('participants', 'array-contains', studentId)
      );
      
      const snapshot = await getDocs(q);
      const archivedConversations = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(conv => conv.archived && conv.archived[studentId] === true)
        .sort((a, b) => {
          const aTime = a.lastMessage?.timestamp?.toDate?.() || new Date(0);
          const bTime = b.lastMessage?.timestamp?.toDate?.() || new Date(0);
          return bTime - aTime;
        });
      
      return archivedConversations;
    } catch (error) {
      console.error('Error getting archived conversations:', error);
      return [];
    }
  }

  // Create a group conversation
  async createGroupConversation(creatorId, participantIds, groupName, groupDescription = '') {
    try {
      // Ensure creator is included in participants
      const allParticipants = [...new Set([creatorId, ...participantIds])];
      
      if (allParticipants.length < 3) {
        throw new Error('Group conversations must have at least 3 participants');
      }

      const groupData = {
        participants: allParticipants,
        createdAt: serverTimestamp(),
        lastMessage: {
          text: '',
          senderId: '',
          timestamp: serverTimestamp()
        },
        messageCount: 0,
        archived: {},
        type: 'group',
        isGroup: true,
        groupName: groupName || `Group Chat`,
        groupDescription,
        createdBy: creatorId,
        admins: [creatorId], // Creator starts as admin
        groupSettings: {
          allowParticipantInvites: true,
          allowNameChange: true,
          allowDescriptionChange: true
        }
      };

      const conversationRef = await addDoc(this.conversationsRef, groupData);
      
      // Send a system message about group creation
      await this.sendSystemMessage(conversationRef.id, `${creatorId} created the group "${groupName}"`);
      
      return {
        id: conversationRef.id,
        ...groupData
      };
    } catch (error) {
      console.error('Error creating group conversation:', error);
      throw error;
    }
  }

  // Add participants to a group
  async addParticipantsToGroup(conversationId, participantIds, addedBy) {
    try {
      const conversationRef = doc(this.conversationsRef, conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (!conversationDoc.exists()) {
        throw new Error('Group conversation not found');
      }

      const conversationData = conversationDoc.data();
      
      if (!conversationData.isGroup) {
        throw new Error('Cannot add participants to a direct conversation');
      }

      // Check if user has permission to add participants
      if (!conversationData.admins.includes(addedBy) && !conversationData.groupSettings.allowParticipantInvites) {
        throw new Error('You do not have permission to add participants');
      }

      // Filter out participants that are already in the group
      const newParticipants = participantIds.filter(id => !conversationData.participants.includes(id));
      
      if (newParticipants.length === 0) {
        return { success: true, added: 0 };
      }

      const updatedParticipants = [...conversationData.participants, ...newParticipants];
      
      await updateDoc(conversationRef, {
        participants: updatedParticipants
      });

      // Send system message about new participants
      for (const participantId of newParticipants) {
        await this.sendSystemMessage(conversationId, `${addedBy} added ${participantId} to the group`);
      }

      return { success: true, added: newParticipants.length };
    } catch (error) {
      console.error('Error adding participants to group:', error);
      throw error;
    }
  }

  // Remove participant from group
  async removeParticipantFromGroup(conversationId, participantId, removedBy) {
    try {
      const conversationRef = doc(this.conversationsRef, conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (!conversationDoc.exists()) {
        throw new Error('Group conversation not found');
      }

      const conversationData = conversationDoc.data();
      
      if (!conversationData.isGroup) {
        throw new Error('Cannot remove participants from a direct conversation');
      }

      // Check permissions (admins can remove anyone, users can remove themselves)
      if (!conversationData.admins.includes(removedBy) && removedBy !== participantId) {
        throw new Error('You do not have permission to remove this participant');
      }

      const updatedParticipants = conversationData.participants.filter(id => id !== participantId);
      const updatedAdmins = conversationData.admins.filter(id => id !== participantId);
      
      // If removing the last admin, promote someone else
      if (updatedAdmins.length === 0 && updatedParticipants.length > 0) {
        updatedAdmins.push(updatedParticipants[0]);
      }

      await updateDoc(conversationRef, {
        participants: updatedParticipants,
        admins: updatedAdmins
      });

      // Send system message
      const action = removedBy === participantId ? 'left' : 'was removed from';
      await this.sendSystemMessage(conversationId, `${participantId} ${action} the group`);

      return { success: true };
    } catch (error) {
      console.error('Error removing participant from group:', error);
      throw error;
    }
  }

  // Update group settings
  async updateGroupSettings(conversationId, updates, updatedBy) {
    try {
      const conversationRef = doc(this.conversationsRef, conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (!conversationDoc.exists()) {
        throw new Error('Group conversation not found');
      }

      const conversationData = conversationDoc.data();
      
      if (!conversationData.isGroup) {
        throw new Error('Cannot update settings for a direct conversation');
      }

      // Check admin permissions for sensitive operations
      const isAdmin = conversationData.admins.includes(updatedBy);
      
      if ((updates.groupName && !conversationData.groupSettings.allowNameChange && !isAdmin) ||
          (updates.groupDescription && !conversationData.groupSettings.allowDescriptionChange && !isAdmin)) {
        throw new Error('You do not have permission to update these settings');
      }

      const updateData = {};
      
      if (updates.groupName !== undefined) {
        updateData.groupName = updates.groupName;
      }
      
      if (updates.groupDescription !== undefined) {
        updateData.groupDescription = updates.groupDescription;
      }
      
      if (updates.groupSettings && isAdmin) {
        updateData.groupSettings = {
          ...conversationData.groupSettings,
          ...updates.groupSettings
        };
      }

      await updateDoc(conversationRef, updateData);

      // Send system message for name changes
      if (updates.groupName) {
        await this.sendSystemMessage(conversationId, `${updatedBy} changed the group name to "${updates.groupName}"`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating group settings:', error);
      throw error;
    }
  }

  // Send system message
  async sendSystemMessage(conversationId, text) {
    try {
      const messageData = {
        conversationId,
        senderId: 'system',
        receiverId: '', // System messages don't have specific receivers
        text,
        timestamp: serverTimestamp(),
        messageType: 'system',
        isRead: false,
        readAt: null,
        deliveredAt: serverTimestamp(),
        competencyTags: []
      };

      await addDoc(this.messagesRef, messageData);
    } catch (error) {
      console.error('Error sending system message:', error);
    }
  }

  // Get group conversations for a user
  async getGroupConversations(studentId) {
    try {
      const q = query(
        this.conversationsRef,
        where('participants', 'array-contains', studentId),
        where('isGroup', '==', true),
        orderBy('lastMessage.timestamp', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.warn('Indexed group query failed, using fallback:', error);
      
      // Fallback: get all conversations and filter client-side
      const allConversationsSnapshot = await getDocs(this.conversationsRef);
      const groupConversations = allConversationsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(conv => conv.participants.includes(studentId) && conv.isGroup)
        .sort((a, b) => {
          const aTime = a.lastMessage?.timestamp?.toDate?.() || new Date(0);
          const bTime = b.lastMessage?.timestamp?.toDate?.() || new Date(0);
          return bTime - aTime;
        });
      
      return groupConversations;
    }
  }

  // Get student directory
  async getStudentDirectory(excludeStudentId = null) {
    try {
      const snapshot = await getDocs(this.studentsRef);
      let students = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter out the current student
      if (excludeStudentId) {
        students = students.filter(student => student.id !== excludeStudentId);
      }

      // If no students found, add sample students for testing
      if (students.length === 0) {
        students = [
          { id: 'sample_student_1', name: 'Alex Chen', avatar: '👨‍💻', online: true },
          { id: 'sample_student_2', name: 'Maya Rodriguez', avatar: '👩‍🎨', online: false },
          { id: 'sample_student_3', name: 'Jordan Kim', avatar: '👨‍🔬', online: true },
          { id: 'sample_student_4', name: 'Sam Taylor', avatar: '👩‍💻', online: true }
        ].filter(student => student.id !== excludeStudentId);
      }

      return students;
    } catch (error) {
      console.error('Error getting student directory:', error);
      return [];
    }
  }

  // Get unread message count
  async getUnreadCount(userId) {
    try {
      const q = query(
        this.messagesRef,
        where('receiverId', '==', userId),
        where('isRead', '==', false)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Listen to conversation messages with real-time updates
  listenToConversationMessages(conversationId, callback, limitCount = 50) {
    try {
      const q = query(
        this.messagesRef,
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'asc'),
        limit(limitCount)
      );
      
      return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(messages);
      });
    } catch (error) {
      console.error('Error listening to conversation messages:', error);
      return () => {}; // Return empty unsubscribe function
    }
  }

  // Listen to student conversations with real-time updates
  listenToStudentConversations(studentId, callback) {
    try {
      const q = query(
        this.conversationsRef,
        where('participants', 'array-contains', studentId),
        orderBy('lastMessage.timestamp', 'desc')
      );
      
      return onSnapshot(q, (snapshot) => {
        const conversations = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(conversations);
      }, (error) => {
        console.warn('Real-time query failed, using fallback:', error);
        
        // Fallback listener
        const unsubscribe = onSnapshot(this.conversationsRef, (snapshot) => {
          const conversations = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(conv => conv.participants.includes(studentId))
            .sort((a, b) => {
              const aTime = a.lastMessage?.timestamp?.toDate?.() || new Date(0);
              const bTime = b.lastMessage?.timestamp?.toDate?.() || new Date(0);
              return bTime - aTime;
            });
          callback(conversations);
        });
        
        return unsubscribe;
      });
    } catch (error) {
      console.error('Error listening to student conversations:', error);
      return () => {}; // Return empty unsubscribe function
    }
  }

  // Update messaging statistics
  async updateMessagingStats(studentId, action) {
    try {
      const statsDocRef = doc(this.messagingStatsRef, studentId);
      const statsDoc = await getDoc(statsDocRef);
      
      if (statsDoc.exists()) {
        const currentStats = statsDoc.data();
        const updates = {
          lastActive: serverTimestamp()
        };
        
        switch (action) {
          case 'message_sent':
            updates.messagesSent = (currentStats.messagesSent || 0) + 1;
            updates.totalInteractions = (currentStats.totalInteractions || 0) + 1;
            break;
          case 'message_received':
            updates.messagesReceived = (currentStats.messagesReceived || 0) + 1;
            break;
          case 'conversation_started':
            updates.conversationsStarted = (currentStats.conversationsStarted || 0) + 1;
            break;
        }
        
        await updateDoc(statsDocRef, updates);
      } else {
        // Create new stats document
        const newStats = {
          studentId,
          messagesSent: action === 'message_sent' ? 1 : 0,
          messagesReceived: action === 'message_received' ? 1 : 0,
          conversationsStarted: action === 'conversation_started' ? 1 : 0,
          totalInteractions: action === 'message_sent' ? 1 : 0,
          lastActive: serverTimestamp(),
          createdAt: serverTimestamp()
        };
        
        await setDoc(statsDocRef, newStats);
      }
    } catch (error) {
      console.error('Error updating messaging stats:', error);
    }
  }

  // Get student directory for group creation
  async getStudentDirectory(excludeStudentId = null) {
    try {
      const snapshot = await getDocs(this.studentsRef);
      let students = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter out the current student
      if (excludeStudentId) {
        students = students.filter(student => student.id !== excludeStudentId);
      }

      // If no students found, add sample students for testing
      if (students.length === 0) {
        students = [
          { id: 'sample_student_1', name: 'Alex Chen', avatar: '👨‍💻', online: true },
          { id: 'sample_student_2', name: 'Maya Rodriguez', avatar: '👩‍🎨', online: false },
          { id: 'sample_student_3', name: 'Jordan Kim', avatar: '👨‍🔬', online: true },
          { id: 'sample_student_4', name: 'Sam Taylor', avatar: '👩‍💻', online: true }
        ].filter(student => student.id !== excludeStudentId);
      }

      return students;
    } catch (error) {
      console.error('❌ Error getting student directory:', error);
      return [];
    }
  }
}

export default new EnhancedMessagingService();
