/**
 * Robust HTML sanitizer for user-generated rich content.
 *
 * Allowlist-based: parses with DOMParser, keeps only safe inline/basic
 * block elements, strips event handlers and javascript:/data:/vbscript:
 * URIs, and unwraps everything else (keeping text content).
 *
 * NOTE: if a full rich-text editor is re-enabled, swap this for a
 * battle-tested library such as DOMPurify.
 */
const ALLOWED = ['B', 'STRONG', 'I', 'EM', 'U', 'S', 'UL', 'OL', 'LI', 'P', 'BR', 'BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4', 'A'];

const DANGEROUS_SCHEMES = /^\s*(javascript|data|vbscript):/i;

export function sanitizeHTML(input = '') {
  if (!input) return '';
  const doc = new DOMParser().parseFromString(String(input), 'text/html');
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT);
  const elements = [];
  while (walker.nextNode()) elements.push(walker.currentNode);
  // Process leaves first so unwrapping keeps content.
  elements.reverse().forEach((el) => {
    if (!ALLOWED.includes(el.tagName)) {
      el.replaceWith(...el.childNodes);
      return;
    }
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim();
      if (name.startsWith('on')) { el.removeAttribute(attr.name); continue; }
      if ((name === 'href' || name === 'src' || name === 'xlink:href') && DANGEROUS_SCHEMES.test(value)) {
        el.removeAttribute(attr.name);
      }
    }
    if (el.tagName === 'A' && !el.getAttribute('href')) el.replaceWith(...el.childNodes);
  });
  return doc.body.innerHTML;
}
