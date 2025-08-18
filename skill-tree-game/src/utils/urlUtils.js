/**
 * URL utility functions for message processing
 * Handles URL detection, validation, and safe linking
 */

// Comprehensive URL regex that matches various URL formats
const URL_REGEX = /(https?:\/\/(?:[-\w.])+(?::[0-9]+)?(?:\/(?:[\w\/_.])*)?(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?|www\.(?:[-\w.])+(?::[0-9]+)?(?:\/(?:[\w\/_.])*)?(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?)/gi;

// Common educational and development domains that are generally safe
const SAFE_DOMAINS = [
  'github.com',
  'codepen.io',
  'jsfiddle.net',
  'replit.com',
  'glitch.com',
  'codesandbox.io',
  'stackblitz.com',
  'youtube.com',
  'youtu.be',
  'vimeo.com',
  'developer.mozilla.org',
  'w3schools.com',
  'freecodecamp.org',
  'stackoverflow.com',
  'google.com',
  'microsoft.com',
  'apple.com',
  'wikipedia.org',
  'khanacademy.org',
  'coursera.org',
  'edx.org',
  'udemy.com',
  'linkedin.com'
];

// Suspicious URL patterns to flag
const SUSPICIOUS_PATTERNS = [
  /bit\.ly|tinyurl|t\.co|short\.link|goo\.gl/i, // URL shorteners
  /\.tk$|\.ml$|\.ga$|\.cf$/i, // Free domains often used maliciously
  /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/i, // Raw IP addresses
  /[a-z0-9]{20,}\.com/i // Randomly generated domain names
];

/**
 * Detect URLs in text content
 * @param {string} text - Text to search for URLs
 * @returns {Array} Array of URL objects with position and URL info
 */
export const detectUrls = (text) => {
  if (!text || typeof text !== 'string') return [];
  
  const urls = [];
  let match;
  
  // Reset regex lastIndex for global search
  URL_REGEX.lastIndex = 0;
  
  while ((match = URL_REGEX.exec(text)) !== null) {
    const url = match[0];
    const start = match.index;
    const end = start + url.length;
    
    urls.push({
      url: normalizeUrl(url),
      originalUrl: url,
      start,
      end,
      domain: extractDomain(url),
      isSafe: isUrlSafe(url),
      type: getUrlType(url)
    });
  }
  
  return urls;
};

/**
 * Normalize URL by adding protocol if missing
 * @param {string} url - URL to normalize
 * @returns {string} Normalized URL
 */
export const normalizeUrl = (url) => {
  if (!url) return '';
  
  // Add protocol if missing
  if (url.startsWith('www.') || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    return `https://${url.replace(/^(https?:\/\/)?/, '')}`;
  }
  
  return url;
};

/**
 * Extract domain from URL
 * @param {string} url - URL to extract domain from
 * @returns {string} Domain name
 */
export const extractDomain = (url) => {
  try {
    const normalizedUrl = normalizeUrl(url);
    const urlObj = new URL(normalizedUrl);
    return urlObj.hostname.toLowerCase();
  } catch (error) {
    // Fallback for malformed URLs
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/\s?#]+)/i);
    return match ? match[1].toLowerCase() : '';
  }
};

/**
 * Check if URL is considered safe
 * @param {string} url - URL to check
 * @returns {boolean} True if URL appears safe
 */
export const isUrlSafe = (url) => {
  const domain = extractDomain(url);
  
  // Check if domain is in safe list
  if (SAFE_DOMAINS.some(safeDomain => domain.includes(safeDomain))) {
    return true;
  }
  
  // Check for suspicious patterns
  if (SUSPICIOUS_PATTERNS.some(pattern => pattern.test(url))) {
    return false;
  }
  
  // Basic domain validation
  if (!domain || domain.length < 4 || !domain.includes('.')) {
    return false;
  }
  
  return true; // Default to safe for unknown but valid domains
};

/**
 * Determine URL type for icon/preview purposes
 * @param {string} url - URL to categorize
 * @returns {string} URL type
 */
export const getUrlType = (url) => {
  const domain = extractDomain(url);
  const path = url.toLowerCase();
  
  // Code repositories and development tools
  if (domain.includes('github.com')) return 'github';
  if (domain.includes('codepen.io')) return 'codepen';
  if (domain.includes('jsfiddle.net')) return 'jsfiddle';
  if (domain.includes('replit.com')) return 'replit';
  if (domain.includes('glitch.com')) return 'glitch';
  if (domain.includes('codesandbox.io')) return 'codesandbox';
  if (domain.includes('stackblitz.com')) return 'stackblitz';
  
  // Video platforms
  if (domain.includes('youtube.com') || domain.includes('youtu.be')) return 'youtube';
  if (domain.includes('vimeo.com')) return 'vimeo';
  
  // Documentation and learning
  if (domain.includes('developer.mozilla.org')) return 'mdn';
  if (domain.includes('w3schools.com')) return 'w3schools';
  if (domain.includes('stackoverflow.com')) return 'stackoverflow';
  if (domain.includes('freecodecamp.org')) return 'freecodecamp';
  
  // Educational platforms
  if (domain.includes('khanacademy.org')) return 'khanacademy';
  if (domain.includes('coursera.org')) return 'coursera';
  if (domain.includes('edx.org')) return 'edx';
  if (domain.includes('udemy.com')) return 'udemy';
  
  // Image files
  if (path.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i)) return 'image';
  
  // Document files
  if (path.match(/\.(pdf|doc|docx|ppt|pptx)(\?|$)/i)) return 'document';
  
  return 'website';
};

/**
 * Get icon for URL type
 * @param {string} type - URL type
 * @returns {string} Icon emoji
 */
export const getUrlIcon = (type) => {
  const icons = {
    github: '🐙',
    codepen: '📝',
    jsfiddle: '🔧',
    replit: '🚀',
    glitch: '✨',
    codesandbox: '📦',
    stackblitz: '⚡',
    youtube: '📺',
    vimeo: '🎬',
    mdn: '📚',
    w3schools: '🎓',
    stackoverflow: '❓',
    freecodecamp: '🔥',
    khanacademy: '🧠',
    coursera: '🎯',
    edx: '📖',
    udemy: '💡',
    image: '🖼️',
    document: '📄',
    website: '🌐'
  };
  
  return icons[type] || '🔗';
};

/**
 * Convert text with URLs to React elements with clickable links
 * @param {string} text - Text containing URLs
 * @param {Object} linkStyle - CSS styles for links
 * @returns {Array} Array of text and link elements
 */
export const renderTextWithLinks = (text, linkStyle = {}) => {
  if (!text) return [];
  
  const urls = detectUrls(text);
  if (urls.length === 0) return [text];
  
  const elements = [];
  let lastIndex = 0;
  
  urls.forEach((urlInfo, index) => {
    // Add text before URL
    if (urlInfo.start > lastIndex) {
      elements.push(text.slice(lastIndex, urlInfo.start));
    }
    
    // Add clickable link
    elements.push({
      type: 'link',
      key: `link-${index}`,
      url: urlInfo.url,
      originalUrl: urlInfo.originalUrl,
      domain: urlInfo.domain,
      isSafe: urlInfo.isSafe,
      urlType: urlInfo.type,
      icon: getUrlIcon(urlInfo.type),
      style: linkStyle
    });
    
    lastIndex = urlInfo.end;
  });
  
  // Add remaining text
  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }
  
  return elements;
};

/**
 * Generate safe link attributes for external links
 * @returns {Object} Link attributes for security
 */
export const getSafeLinkAttributes = () => ({
  target: '_blank',
  rel: 'noopener noreferrer',
  referrerPolicy: 'no-referrer'
});

/**
 * Validate URL before opening
 * @param {string} url - URL to validate
 * @returns {boolean} True if URL should be allowed to open
 */
export const validateUrlForOpening = (url) => {
  try {
    const urlObj = new URL(normalizeUrl(url));
    
    // Only allow HTTP/HTTPS protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }
    
    // Check domain safety
    return isUrlSafe(url);
  } catch (error) {
    return false;
  }
};
