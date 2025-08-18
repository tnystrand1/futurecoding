# Messaging System Product Backlog

## Overview
Enhancement backlog for the Future Coding Academy messaging system to improve student communication and collaboration capabilities.

## Current Status
✅ **Completed Features**:
- Basic peer-to-peer messaging between students
- Real-time message delivery with Firestore
- File attachment support (images, code files)
- Code formatting and syntax highlighting
- Message notifications with browser notifications
- Student directory with mutual interests
- Enhanced UI with modern chat interface
- Drag-and-drop file uploads
- Message length limits (2000 characters)

## Product Backlog

### 🔴 **High Priority - Critical Fixes**

#### **MSGR-001: Fix "Invalid Date" Bug**
- **Status**: 🚨 Bug
- **Priority**: P0 (Critical)
- **Description**: Messenger window displays "Invalid Date" in various locations
- **Acceptance Criteria**:
  - [ ] All timestamps display correctly formatted dates
  - [ ] No "Invalid Date" text appears in any part of the messenger
  - [ ] Consistent date formatting across all message components
- **Effort**: 2 story points
- **Technical Notes**: Likely related to timestamp handling in message objects or date formatting functions

### 🟡 **High Priority - User Experience**

#### **MSGR-002: Add Read Receipts**
- **Status**: 📋 New Feature
- **Priority**: P1 (High)
- **Description**: Show when messages have been read by recipients
- **Acceptance Criteria**:
  - [ ] Visual indicator when message is delivered vs read
  - [ ] Timestamp showing when message was read
  - [ ] Bulk read status for multiple messages
  - [ ] Privacy setting to disable read receipts
- **Effort**: 5 story points
- **Technical Notes**: 
  - Requires Firestore schema updates for read timestamps
  - Real-time listeners for read status updates
  - UI components for status indicators

#### **MSGR-003: Archive Conversations**
- **Status**: 📋 New Feature  
- **Priority**: P1 (High)
- **Description**: Allow users to archive conversations to declutter their inbox
- **Acceptance Criteria**:
  - [ ] Archive button in conversation list
  - [ ] Archived conversations moved to separate section
  - [ ] Unarchive functionality
  - [ ] Search includes archived conversations
  - [ ] Archived conversations still receive notifications
- **Effort**: 3 story points
- **Technical Notes**:
  - Add `archived` boolean field to conversation schema
  - Filter logic in conversation lists
  - UI for archived conversation management

### 🟢 **Medium Priority - Collaboration Features**

#### **MSGR-004: Group Messaging for Teams**
- **Status**: 📋 New Feature
- **Priority**: P2 (Medium)
- **Description**: Enable team/group conversations for project collaboration
- **Acceptance Criteria**:
  - [ ] Create group conversations with multiple participants
  - [ ] Add/remove participants from groups
  - [ ] Group name and description
  - [ ] Group admin permissions
  - [ ] Group notifications settings
  - [ ] File sharing within groups
  - [ ] @mention functionality for group members
- **Effort**: 8 story points
- **Technical Notes**:
  - Major schema update for group conversations
  - Participant management system
  - Group permissions and roles
  - Updated UI for group vs individual chats

#### **MSGR-005: URL Support & Hyperlinking**
- **Status**: 📋 New Feature
- **Priority**: P2 (Medium)
- **Description**: Automatically detect and linkify URLs in messages
- **Acceptance Criteria**:
  - [ ] Auto-detect URLs in message text
  - [ ] Convert URLs to clickable links
  - [ ] Link preview for common sites (GitHub, CodePen, etc.)
  - [ ] Safe link validation (prevent malicious URLs)
  - [ ] Option to disable auto-linking
- **Effort**: 4 story points
- **Technical Notes**:
  - URL regex detection and validation
  - Link preview service integration
  - Security considerations for external links
  - Markdown-style link support

### 🔵 **Low Priority - Nice to Have**

#### **MSGR-006: Message Reactions**
- **Status**: 💡 Idea
- **Priority**: P3 (Low)
- **Description**: Add emoji reactions to messages
- **Effort**: 3 story points

#### **MSGR-007: Message Threading**
- **Status**: 💡 Idea
- **Priority**: P3 (Low)
- **Description**: Reply-to-message threading for complex discussions
- **Effort**: 6 story points

#### **MSGR-008: Voice Messages**
- **Status**: 💡 Idea
- **Priority**: P3 (Low)
- **Description**: Record and send audio messages
- **Effort**: 8 story points

#### **MSGR-009: Message Search**
- **Status**: 💡 Idea
- **Priority**: P3 (Low)
- **Description**: Full-text search across all conversations
- **Effort**: 5 story points

#### **MSGR-010: Typing Indicators**
- **Status**: 💡 Idea
- **Priority**: P3 (Low)
- **Description**: Show when someone is typing a message
- **Effort**: 3 story points

## Implementation Phases

### **Phase 1: Bug Fixes & Core UX (Sprint 1)**
- MSGR-001: Fix "Invalid Date" Bug
- MSGR-002: Add Read Receipts

### **Phase 2: Organization Features (Sprint 2)**
- MSGR-003: Archive Conversations
- MSGR-005: URL Support & Hyperlinking

### **Phase 3: Collaboration Enhancement (Sprint 3)**
- MSGR-004: Group Messaging for Teams

### **Phase 4: Polish & Advanced Features (Future)**
- MSGR-006 through MSGR-010 based on user feedback

## Success Metrics
- **User Engagement**: Message volume and active conversations
- **Team Collaboration**: Group message adoption rate
- **User Satisfaction**: Feedback scores and feature usage analytics
- **Bug Resolution**: Zero critical messaging bugs in production

## Technical Considerations

### **Database Schema Updates Needed**:
- Read receipts: `readBy` array with user IDs and timestamps
- Archive: `archived` boolean field on conversations
- Groups: `participants` array, `groupName`, `groupType`, `admins`

### **Security & Privacy**:
- Message encryption considerations
- User privacy controls for read receipts
- Safe URL validation and preview
- Group permission management

### **Performance**:
- Pagination for large conversation lists
- Efficient real-time updates for read status
- Optimized group message delivery

---

**Last Updated**: January 14, 2025  
**Product Owner**: Timothy Nystrand  
**Development Team**: AI Assistant + Timothy  
**Next Review**: After Phase 1 completion
