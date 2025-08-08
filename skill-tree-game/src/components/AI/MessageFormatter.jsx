import React, { useState } from 'react';

const MessageFormatter = ({ content, isUser, personaColor }) => {
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Copy to clipboard function
  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Parse message content to identify code blocks and format them
  const parseMessage = (text) => {
    if (!text) return [];

    // Split by code blocks (```...``` pattern)
    const parts = text.split(/(```[\s\S]*?```)/g);
    const elements = [];

    parts.forEach((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        // This is a code block
        const codeContent = part.slice(3, -3).trim();
        const lines = codeContent.split('\n');
        const language = lines[0] && lines[0].match(/^[a-z]+$/i) ? lines[0] : '';
        const code = language ? lines.slice(1).join('\n') : codeContent;

        elements.push({
          type: 'code',
          content: code,
          language: language.toLowerCase(),
          index
        });
      } else if (part.trim()) {
        // Check for numbered lists
        const listPattern = /^\d+\.\s/;
        const bulletPattern = /^[-*]\s/;
        const lines = part.split('\n');
        let currentParagraph = [];
        let currentList = [];
        let listType = null;

        lines.forEach((line, lineIndex) => {
          const trimmedLine = line.trim();
          
          if (listPattern.test(trimmedLine)) {
            // Start or continue numbered list
            if (currentParagraph.length > 0) {
              elements.push({
                type: 'paragraph',
                content: parseInlineFormatting(currentParagraph.join('\n')),
                index: `${index}-para-${lineIndex}`
              });
              currentParagraph = [];
            }
            if (listType !== 'numbered') {
              if (currentList.length > 0) {
                elements.push({
                  type: 'list',
                  listType: listType,
                  items: currentList,
                  index: `${index}-list-${lineIndex}`
                });
              }
              currentList = [];
              listType = 'numbered';
            }
            currentList.push(trimmedLine.replace(/^\d+\.\s/, ''));
          } else if (bulletPattern.test(trimmedLine)) {
            // Start or continue bullet list
            if (currentParagraph.length > 0) {
              elements.push({
                type: 'paragraph',
                content: parseInlineFormatting(currentParagraph.join('\n')),
                index: `${index}-para-${lineIndex}`
              });
              currentParagraph = [];
            }
            if (listType !== 'bullet') {
              if (currentList.length > 0) {
                elements.push({
                  type: 'list',
                  listType: listType,
                  items: currentList,
                  index: `${index}-list-${lineIndex}`
                });
              }
              currentList = [];
              listType = 'bullet';
            }
            currentList.push(trimmedLine.replace(/^[-*]\s/, ''));
          } else if (trimmedLine) {
            // Regular text
            if (currentList.length > 0) {
              elements.push({
                type: 'list',
                listType: listType,
                items: currentList,
                index: `${index}-list-${lineIndex}`
              });
              currentList = [];
              listType = null;
            }
            currentParagraph.push(line);
          } else if (currentParagraph.length > 0) {
            // Empty line - end current paragraph
            elements.push({
              type: 'paragraph',
              content: parseInlineFormatting(currentParagraph.join('\n')),
              index: `${index}-para-${lineIndex}`
            });
            currentParagraph = [];
          }
        });

        // Handle remaining content
        if (currentList.length > 0) {
          elements.push({
            type: 'list',
            listType: listType,
            items: currentList,
            index: `${index}-list-final`
          });
        }
        if (currentParagraph.length > 0) {
          elements.push({
            type: 'paragraph',
            content: parseInlineFormatting(currentParagraph.join('\n')),
            index: `${index}-para-final`
          });
        }
      }
    });

    return elements;
  };

  // Parse inline formatting (bold, italic, inline code)
  const parseInlineFormatting = (text) => {
    const inlineParts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
    const inlineElements = [];

    inlineParts.forEach((inlinePart, inlineIndex) => {
      if (inlinePart.startsWith('`') && inlinePart.endsWith('`')) {
        inlineElements.push({
          type: 'inline-code',
          content: inlinePart.slice(1, -1),
          index: inlineIndex
        });
      } else if (inlinePart.startsWith('**') && inlinePart.endsWith('**')) {
        inlineElements.push({
          type: 'bold',
          content: inlinePart.slice(2, -2),
          index: inlineIndex
        });
      } else if (inlinePart.startsWith('*') && inlinePart.endsWith('*')) {
        inlineElements.push({
          type: 'italic',
          content: inlinePart.slice(1, -1),
          index: inlineIndex
        });
      } else if (inlinePart.trim()) {
        inlineElements.push({
          type: 'text',
          content: inlinePart,
          index: inlineIndex
        });
      }
    });

    return inlineElements;
  };

  // Get syntax highlighting class based on language
  const getSyntaxClass = (language) => {
    const languageMap = {
      'html': 'language-html',
      'css': 'language-css',
      'javascript': 'language-javascript',
      'js': 'language-javascript',
      'jsx': 'language-jsx',
      'python': 'language-python',
      'json': 'language-json',
      'bash': 'language-bash',
      'shell': 'language-bash'
    };
    return languageMap[language] || 'language-text';
  };

  // Decode HTML entities
  const decodeHTMLEntities = (str) => {
    if (!str) return str;
    const txt = document.createElement('textarea');
    txt.innerHTML = str;
    return txt.value;
  };

  // Simple syntax highlighting for common web languages
  const highlightCode = (code, language) => {
    if (!code) return code;

    // First decode any HTML entities
    let decoded = decodeHTMLEntities(code);
    
    // Escape HTML for safe rendering, then add highlighting
    let highlighted = decoded
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');

    if (language === 'html' || language === 'jsx') {
      // HTML/JSX tags
      highlighted = highlighted.replace(/(&lt;[^&]*&gt;)/g, '<span style="color: #e74c3c;">$1</span>');
      // Attributes
      highlighted = highlighted.replace(/(\w+)=/g, '<span style="color: #f39c12;">$1</span>=');
      // Strings
      highlighted = highlighted.replace(/(&quot;[^&]*&quot;|&#x27;[^&]*&#x27;)/g, '<span style="color: #27ae60;">$1</span>');
    } else if (language === 'css') {
      // CSS properties
      highlighted = highlighted.replace(/([a-z-]+):/g, '<span style="color: #3498db;">$1</span>:');
      // CSS values
      highlighted = highlighted.replace(/:\s*([^;]+);/g, ': <span style="color: #27ae60;">$1</span>;');
      // Selectors
      highlighted = highlighted.replace(/^([.#]?[a-zA-Z][a-zA-Z0-9-_]*)\s*{/gm, '<span style="color: #e74c3c;">$1</span> {');
    } else if (language === 'javascript' || language === 'js') {
      // Keywords
      highlighted = highlighted.replace(/\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await)\b/g, '<span style="color: #9b59b6;">$1</span>');
      // Strings
      highlighted = highlighted.replace(/(&quot;[^&]*&quot;|&#x27;[^&]*&#x27;|`[^`]*`)/g, '<span style="color: #27ae60;">$1</span>');
      // Numbers
      highlighted = highlighted.replace(/\b(\d+)\b/g, '<span style="color: #f39c12;">$1</span>');
    }

    return highlighted;
  };

  const parsedContent = parseMessage(content);

  return (
    <div style={{ width: '100%' }}>
      {parsedContent.map((element) => {
        if (element.type === 'code') {
          return (
            <div
              key={element.index}
              style={{
                background: '#2c3e50',
                borderRadius: '8px',
                margin: '12px 0',
                overflow: 'hidden',
                border: '1px solid #34495e'
              }}
            >
              {/* Code block header */}
              <div style={{
                background: '#34495e',
                padding: '8px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
                color: '#bdc3c7'
              }}>
                <span style={{ fontFamily: 'monospace' }}>
                  {element.language || 'code'}
                </span>
                <button
                  onClick={() => copyToClipboard(decodeHTMLEntities(element.content), element.index)}
                  style={{
                    background: copiedIndex === element.index ? '#27ae60' : '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (copiedIndex !== element.index) {
                      e.target.style.background = '#2980b9';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (copiedIndex !== element.index) {
                      e.target.style.background = '#3498db';
                    }
                  }}
                >
                  {copiedIndex === element.index ? (
                    <>
                      <span>✓</span>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <span>📋</span>
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              
              {/* Code content */}
              <div style={{
                padding: '16px',
                color: '#ecf0f1',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: '13px',
                lineHeight: '1.5',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                background: '#2c3e50'
              }}>
                <div
                  dangerouslySetInnerHTML={{
                    __html: highlightCode(element.content, element.language)
                  }}
                />
              </div>
            </div>
          );
        } else if (element.type === 'paragraph') {
          return (
            <div key={element.index} style={{ margin: '8px 0' }}>
              {element.content.map((inlineElement) => {
                if (inlineElement.type === 'inline-code') {
                  return (
                    <span
                      key={inlineElement.index}
                      style={{
                        background: '#f8f9fa',
                        color: '#e74c3c',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                        fontSize: '13px',
                        border: '1px solid #e9ecef'
                      }}
                    >
                      {inlineElement.content}
                    </span>
                  );
                } else if (inlineElement.type === 'bold') {
                  return (
                    <strong key={inlineElement.index} style={{ fontWeight: 'bold' }}>
                      {inlineElement.content}
                    </strong>
                  );
                } else if (inlineElement.type === 'italic') {
                  return (
                    <em key={inlineElement.index} style={{ fontStyle: 'italic' }}>
                      {inlineElement.content}
                    </em>
                  );
                } else {
                  return (
                    <span key={inlineElement.index}>
                      {inlineElement.content}
                    </span>
                  );
                }
              })}
            </div>
          );
        } else if (element.type === 'list') {
          return (
            <div key={element.index} style={{ margin: '8px 0' }}>
              {element.listType === 'numbered' ? (
                <ol style={{ 
                  marginLeft: '20px', 
                  paddingLeft: '0',
                  listStyleType: 'decimal'
                }}>
                  {element.items.map((item, itemIndex) => (
                    <li key={itemIndex} style={{ 
                      marginBottom: '4px',
                      lineHeight: '1.4'
                    }}>
                      {item}
                    </li>
                  ))}
                </ol>
              ) : (
                <ul style={{ 
                  marginLeft: '20px', 
                  paddingLeft: '0',
                  listStyleType: 'disc'
                }}>
                  {element.items.map((item, itemIndex) => (
                    <li key={itemIndex} style={{ 
                      marginBottom: '4px',
                      lineHeight: '1.4'
                    }}>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

export default MessageFormatter;