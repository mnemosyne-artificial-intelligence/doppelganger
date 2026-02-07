// Simple HTML Formatter (fallback to raw if formatting collapses content)
const formatHTML = (html) => {
    let indent = 0;
    return html.replace(/<(\/?)([a-z0-9]+)([^>]*?)(\/?)>/gi, (match, slash, tag, attrs, selfClose) => {
        if (slash) indent--;
        const result = '  '.repeat(Math.max(0, indent)) + match;
        if (!slash && !selfClose && !['img', 'br', 'hr', 'input', 'link', 'meta'].includes(tag.toLowerCase())) indent++;
        return '\n' + result;
    }).trim();
};

const safeFormatHTML = (html) => {
    if (typeof html !== 'string') return '';
    try {
        const formatted = formatHTML(html);
        if (!formatted) return html;
        if (formatted.length < Math.max(200, Math.floor(html.length * 0.5))) return html;
        return formatted;
    } catch {
        return html;
    }
};

module.exports = { formatHTML, safeFormatHTML };
