async function runExtractionScript(page, script, html, url, includeShadowDom = true) {
    if (!script || typeof script !== 'string') return { result: undefined, logs: [] };

    try {
        const result = await page.evaluate(async ({ script, html, url, includeShadowDom }) => {
            const logBuffer = [];
            const consoleProxy = {
                log: (...args) => logBuffer.push(args.join(' ')),
                warn: (...args) => logBuffer.push(args.join(' ')),
                error: (...args) => logBuffer.push(args.join(' '))
            };

            const parser = new DOMParser();
            const doc = parser.parseFromString(html || '', 'text/html');

            const shadowHelpers = (() => {
                const shadowQueryAll = (selector, root = doc) => {
                    const results = [];
                    const walk = (node) => {
                        if (!node) return;
                        if (node.nodeType === 1) {
                            const el = node;
                            if (selector && el.matches && el.matches(selector)) results.push(el);
                            if (el.tagName === 'TEMPLATE' && el.hasAttribute('data-shadowroot')) {
                                walk(el.content);
                            }
                        }
                        if (node.childNodes) {
                            node.childNodes.forEach((child) => walk(child));
                        }
                    };
                    walk(root);
                    return results;
                };

                const shadowText = (root = doc) => {
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

            const $$data = {
                html: () => html || '',
                url: () => url || '',
                window: window,
                document: doc,
                shadowQueryAll: includeShadowDom ? shadowHelpers.shadowQueryAll : undefined,
                shadowText: includeShadowDom ? shadowHelpers.shadowText : undefined
            };

            // Use 'new Function' inside the browser context, which is sandboxed from the server.
            const executor = new Function(
                '$$data',
                'window',
                'document',
                'DOMParser',
                'console',
                `"use strict"; return (async () => { ${script}\n})();`
            );

            try {
                // Mock window to redirect document access to parsed doc
                const mockWindow = new Proxy(window, {
                    get: (target, prop) => {
                        if (prop === 'document') return doc;
                        const val = target[prop];
                        return typeof val === 'function' ? val.bind(target) : val;
                    }
                });

                const res = await executor($$data, mockWindow, doc, DOMParser, consoleProxy);
                return { result: res, logs: logBuffer };
            } catch (err) {
                return { result: undefined, logs: [...logBuffer, `Error: ${err.message}`] };
            }
        }, { script, html, url, includeShadowDom });

        return result;
    } catch (e) {
        return { result: `Extraction script error: ${e.message}`, logs: [] };
    }
}

module.exports = { runExtractionScript };
