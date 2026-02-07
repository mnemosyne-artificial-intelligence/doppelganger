const { JSDOM } = require('jsdom');
const vm = require('vm');

const runExtractionScript = async (script, html, pageUrl, includeShadowDom) => {
    if (!script || typeof script !== 'string') return { result: undefined, logs: [] };
    try {
        const dom = new JSDOM(html || '');
        const { window } = dom;
        const logBuffer = [];
        const consoleProxy = {
            log: (...args) => logBuffer.push(args.join(' ')),
            warn: (...args) => logBuffer.push(args.join(' ')),
            error: (...args) => logBuffer.push(args.join(' '))
        };
        const shadowHelpers = (() => {
            const shadowQueryAll = (selector, root = window.document) => {
                const results = [];
                const walk = (node) => {
                    if (!node) return;
                    if (node.nodeType === 1) {
                        const el = node;
                        if (selector && el.matches && el.matches(selector)) results.push(el);
                        if (el.tagName === 'TEMPLATE' && el.hasAttribute('data-shadowroot')) {
                            walk(el.content);
                        }
                    } else if (node.nodeType === 11) {
                        // DocumentFragment
                    }
                    if (node.childNodes) {
                        node.childNodes.forEach((child) => walk(child));
                    }
                };
                walk(root);
                return results;
            };

            const shadowText = (root = window.document) => {
                const texts = [];
                const walk = (node) => {
                    if (!node) return;
                    if (node.nodeType === 3) {
                        const text = node.nodeValue ? node.nodeValue.trim() : '';
                        if (text) texts.push(text);
                        return;
                    }
                    if (node.nodeType === 1) {
                        const el = node;
                        if (el.tagName === 'TEMPLATE' && el.hasAttribute('data-shadowroot')) {
                            walk(el.content);
                        }
                    }
                    if (node.childNodes) {
                        node.childNodes.forEach((child) => walk(child));
                    }
                };
                walk(root);
                return texts;
            };

            return { shadowQueryAll, shadowText };
        })();

        // Using vm instead of new Function to sandbox the execution environment more strictly.
        // This mitigates CodeQL alerts related to dynamic evaluation of user scripts.
        const sandbox = {
            window,
            document: window.document,
            DOMParser: window.DOMParser,
            console: consoleProxy,
            $$data: {
                html: () => html || '',
                url: () => pageUrl || '',
                window,
                document: window.document,
                shadowQueryAll: includeShadowDom ? shadowHelpers.shadowQueryAll : undefined,
                shadowText: includeShadowDom ? shadowHelpers.shadowText : undefined
            }
        };

        const context = vm.createContext(sandbox);
        const code = `(async () => { "use strict"; ${script} })()`;

        const result = await vm.runInContext(code, context);
        return { result, logs: logBuffer };
    } catch (e) {
        return { result: `Extraction script error: ${e.message}`, logs: [] };
    }
};

module.exports = { runExtractionScript };
