// src/utils/sanitize.js
import sanitizeHtml from 'sanitize-html';

export const sanitizeContent = (dirtyHtml) => {
    if (!dirtyHtml) return '';
    
    return sanitizeHtml(dirtyHtml, {
        allowedTags: [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'p', 'br', 'hr',
            'ul', 'ol', 'li',
            'strong', 'em', 'code', 'pre',
            'blockquote', 'a', 'img',
            'table', 'thead', 'tbody', 'tr', 'th', 'td'
        ],
        allowedAttributes: {
            'a': ['href', 'target', 'rel'],
            'img': ['src', 'alt'],
            'code': ['class'],
            '*': ['class']
        },
        selfClosing: ['img', 'br', 'hr'],
        allowedClasses: {
            'code': ['language-*', 'hljs'],
            'pre': ['language-*']
        }
    });
};