import React, { useState } from 'react';
import { getUrlIcon, extractDomain, validateUrlForOpening, getSafeLinkAttributes } from '../../utils/urlUtils';

/**
 * LinkPreview Component
 * Displays rich previews for URLs in messages
 */
const LinkPreview = ({ 
  url, 
  originalUrl, 
  domain, 
  isSafe, 
  urlType, 
  style = {},
  showPreview = true,
  compact = false 
}) => {
  const [previewError, setPreviewError] = useState(false);
  
  const handleLinkClick = (e) => {
    e.preventDefault();
    
    if (!validateUrlForOpening(url)) {
      alert('This link appears to be unsafe and cannot be opened.');
      return;
    }
    
    // Show confirmation for external links
    const confirmMessage = `You're about to visit an external website:\n\n${domain}\n\nDo you want to continue?`;
    if (window.confirm(confirmMessage)) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const getLinkColor = () => {
    if (!isSafe) return '#e74c3c'; // Red for unsafe
    return '#3498db'; // Blue for safe links
  };

  const getPreviewContent = () => {
    switch (urlType) {
      case 'github':
        return {
          title: 'GitHub Repository',
          description: 'View code, issues, and collaboration on GitHub',
          icon: '🐙'
        };
      case 'codepen':
        return {
          title: 'CodePen',
          description: 'Interactive code playground and demo',
          icon: '📝'
        };
      case 'youtube':
        return {
          title: 'YouTube Video',
          description: 'Watch educational content on YouTube',
          icon: '📺'
        };
      case 'stackoverflow':
        return {
          title: 'Stack Overflow',
          description: 'Programming questions and answers',
          icon: '❓'
        };
      case 'mdn':
        return {
          title: 'MDN Web Docs',
          description: 'Web development documentation',
          icon: '📚'
        };
      case 'image':
        return {
          title: 'Image',
          description: 'View image file',
          icon: '🖼️'
        };
      default:
        return {
          title: domain,
          description: 'External website',
          icon: getUrlIcon(urlType)
        };
    }
  };

  const preview = getPreviewContent();

  if (compact) {
    // Compact link display for inline text
    return (
      <a
        href={url}
        onClick={handleLinkClick}
        style={{
          color: getLinkColor(),
          textDecoration: 'underline',
          cursor: 'pointer',
          fontWeight: '500',
          ...style
        }}
        title={`${preview.icon} ${preview.title} - ${preview.description}`}
        {...getSafeLinkAttributes()}
      >
        {originalUrl}
      </a>
    );
  }

  if (!showPreview) {
    // Simple link without preview
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        ...style
      }}>
        <span style={{ fontSize: '14px' }}>{preview.icon}</span>
        <a
          href={url}
          onClick={handleLinkClick}
          style={{
            color: getLinkColor(),
            textDecoration: 'underline',
            cursor: 'pointer'
          }}
          {...getSafeLinkAttributes()}
        >
          {originalUrl}
        </a>
        {!isSafe && (
          <span 
            style={{ 
              fontSize: '12px', 
              color: '#e74c3c',
              marginLeft: '4px'
            }}
            title="This link may not be safe"
          >
            ⚠️
          </span>
        )}
      </div>
    );
  }

  // Full preview card
  return (
    <div style={{
      border: `2px solid ${getLinkColor()}`,
      borderRadius: '8px',
      padding: '12px',
      margin: '8px 0',
      background: 'rgba(255, 255, 255, 0.9)',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ...style
    }}
    onClick={handleLinkClick}
    onMouseEnter={(e) => {
      e.target.style.transform = 'translateY(-1px)';
      e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
    }}
    onMouseLeave={(e) => {
      e.target.style.transform = 'translateY(0)';
      e.target.style.boxShadow = 'none';
    }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px'
      }}>
        {/* Icon */}
        <div style={{
          fontSize: '24px',
          flexShrink: 0,
          marginTop: '2px'
        }}>
          {preview.icon}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 'bold',
            fontSize: '14px',
            color: '#2c3e50',
            marginBottom: '4px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {preview.title}
          </div>
          
          <div style={{
            fontSize: '12px',
            color: '#7f8c8d',
            marginBottom: '6px',
            lineHeight: '1.3'
          }}>
            {preview.description}
          </div>
          
          <div style={{
            fontSize: '11px',
            color: getLinkColor(),
            fontFamily: 'monospace',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            background: 'rgba(52, 152, 219, 0.1)',
            padding: '2px 6px',
            borderRadius: '4px',
            display: 'inline-block'
          }}>
            {domain}
          </div>

          {!isSafe && (
            <div style={{
              marginTop: '6px',
              fontSize: '11px',
              color: '#e74c3c',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>⚠️</span>
              <span>Caution: This link may not be safe</span>
            </div>
          )}
        </div>

        {/* External link indicator */}
        <div style={{
          fontSize: '12px',
          color: '#95a5a6',
          flexShrink: 0
        }}>
          ↗️
        </div>
      </div>
    </div>
  );
};

/**
 * InlineLink Component
 * For rendering links within message text
 */
export const InlineLink = ({ 
  url, 
  originalUrl, 
  domain, 
  isSafe, 
  urlType,
  style = {} 
}) => {
  const handleClick = (e) => {
    e.preventDefault();
    
    if (!validateUrlForOpening(url)) {
      alert('This link appears to be unsafe and cannot be opened.');
      return;
    }
    
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getLinkColor = () => {
    if (!isSafe) return '#e74c3c';
    return '#3498db';
  };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '2px'
    }}>
      <span style={{ fontSize: '12px' }}>
        {getUrlIcon(urlType)}
      </span>
      <a
        href={url}
        onClick={handleClick}
        style={{
          color: getLinkColor(),
          textDecoration: 'underline',
          cursor: 'pointer',
          fontWeight: '500',
          ...style
        }}
        title={`${domain} - Click to open in new tab`}
        {...getSafeLinkAttributes()}
      >
        {originalUrl}
      </a>
      {!isSafe && (
        <span 
          style={{ 
            fontSize: '10px', 
            color: '#e74c3c' 
          }}
          title="This link may not be safe"
        >
          ⚠️
        </span>
      )}
    </span>
  );
};

export default LinkPreview;
