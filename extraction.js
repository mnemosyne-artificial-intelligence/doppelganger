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

        // Sandbox environment for the script.
        // We expose common globals that are expected in a browser-like environment.
        const sandbox = {
            window,
            document: window.document,
            DOMParser: window.DOMParser,
            console: consoleProxy,
            setTimeout: window.setTimeout.bind(window),
            clearTimeout: window.clearTimeout.bind(window),
            setInterval: window.setInterval.bind(window),
            clearInterval: window.clearInterval.bind(window),
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

        // Wrap the user script in an async IIFE to support top-level await.
        // We use vm.compileFunction to create a function bound to the sandbox context.
        const wrapper = `return (async () => { "use strict"; ${script} })()`;

        try {
            const compiled = vm.compileFunction(wrapper, [], {
                parsingContext: context,
                filename: 'extraction_script.js'
            });

            const executionPromise = compiled();

            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Script execution timed out')), 30000);
            });

            const result = await Promise.race([executionPromise, timeoutPromise]);
            return { result, logs: logBuffer };
        } catch (execError) {
             return { result: `Extraction script execution error: ${execError.message}`, logs: logBuffer };
        }

    } catch (e) {
        return { result: `Extraction script error: ${e.message}`, logs: [] };
    }
};

module.exports = { runExtractionScript };
