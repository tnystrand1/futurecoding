import React from 'react';
import { formatBubbleTimestamp, formatMessageTimestamp } from '../../utils/dateUtils';

/**
 * ReadReceipts Component
 * Displays delivery and read status indicators for messages
 */
const ReadReceipts = ({ 
  message, 
  isOwnMessage, 
  showTimestamp = true, 
  compact = false 
}) => {
  // Only show read receipts for own messages
  if (!isOwnMessage) return null;

  const getStatusIcon = () => {
    if (message.isRead && message.readAt) {
      return {
        icon: '✓✓',
        color: '#4CAF50', // Green for read
        status: 'Read',
        timestamp: message.readAt
      };
    } else if (message.deliveredAt) {
      return {
        icon: '✓',
        color: '#9E9E9E', // Gray for delivered but not read
        status: 'Delivered',
        timestamp: message.deliveredAt
      };
    } else {
      return {
        icon: '⏳',
        color: '#FF9800', // Orange for sending
        status: 'Sending',
        timestamp: null
      };
    }
  };

  const status = getStatusIcon();

  if (compact) {
    // Compact mode - just the icon
    return (
      <span 
        style={{
          color: status.color,
          fontSize: '12px',
          marginLeft: '4px'
        }}
        title={`${status.status}${status.timestamp ? ` at ${formatBubbleTimestamp(status.timestamp)}` : ''}`}
      >
        {status.icon}
      </span>
    );
  }

  // Full mode with timestamp
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '10px',
      color: status.color,
      marginTop: '2px'
    }}>
      <span style={{ fontSize: '12px' }}>
        {status.icon}
      </span>
      
      {showTimestamp && (
        <span style={{ opacity: 0.8 }}>
          {status.status}
          {status.timestamp && ` ${formatBubbleTimestamp(status.timestamp)}`}
        </span>
      )}
    </div>
  );
};

/**
 * ConversationReadStatus Component
 * Shows overall read status for a conversation
 */
export const ConversationReadStatus = ({ 
  readStatus, 
  compact = true 
}) => {
  if (!readStatus) return null;

  const { totalSent, delivered, read, readPercentage, lastReadAt } = readStatus;

  if (totalSent === 0) return null;

  const getStatusColor = () => {
    if (readPercentage >= 80) return '#4CAF50'; // Green
    if (readPercentage >= 50) return '#FF9800'; // Orange
    return '#9E9E9E'; // Gray
  };

  if (compact) {
    return (
      <div style={{
        fontSize: '10px',
        color: getStatusColor(),
        display: 'flex',
        alignItems: 'center',
        gap: '2px'
      }}>
        <span>✓✓</span>
        <span>{read}/{totalSent}</span>
      </div>
    );
  }

  return (
    <div style={{
      padding: '8px 12px',
      background: 'rgba(0, 0, 0, 0.05)',
      borderRadius: '8px',
      fontSize: '11px',
      color: '#666'
    }}>
      <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>
        Message Status
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <span>
          📤 Sent: {totalSent}
        </span>
        <span style={{ color: '#9E9E9E' }}>
          ✓ Delivered: {delivered}
        </span>
        <span style={{ color: getStatusColor() }}>
          ✓✓ Read: {read} ({readPercentage}%)
        </span>
      </div>
      {lastReadAt && (
        <div style={{ 
          marginTop: '4px', 
          fontSize: '10px', 
          opacity: 0.7 
        }}>
          Last read: {formatMessageTimestamp(lastReadAt)}
        </div>
      )}
    </div>
  );
};

/**
 * ReadReceiptSettings Component
 * Allows users to toggle read receipt privacy
 */
export const ReadReceiptSettings = ({ 
  enabled, 
  onToggle, 
  style = {} 
}) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 0',
      ...style
    }}>
      <input
        type="checkbox"
        id="read-receipts-toggle"
        checked={enabled}
        onChange={(e) => onToggle(e.target.checked)}
        style={{ margin: 0 }}
      />
      <label 
        htmlFor="read-receipts-toggle"
        style={{
          fontSize: '14px',
          color: '#333',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        Send read receipts
      </label>
      <span style={{
        fontSize: '12px',
        color: '#666',
        marginLeft: '4px'
      }}>
        (Let others know when you've read their messages)
      </span>
    </div>
  );
};

export default ReadReceipts;
