const { test, describe, it } = require('node:test');
const assert = require('node:assert');
const { buildBlockMap } = require('./agent.js');

describe('buildBlockMap', () => {
    it('should return empty maps for an empty list', () => {
        const list = [];
        const result = buildBlockMap(list);
        assert.deepStrictEqual(result.startToEnd, {});
        assert.deepStrictEqual(result.startToElse, {});
        assert.deepStrictEqual(result.elseToEnd, {});
        assert.deepStrictEqual(result.endToStart, {});
    });

    it('should handle simple if block', () => {
        const list = [
            { type: 'if', id: 1 },
            { type: 'log', id: 2 },
            { type: 'end', id: 3 }
        ];
        const result = buildBlockMap(list);

        // startToEnd: 0 -> 2
        // endToStart: 2 -> 0
        assert.deepStrictEqual(result.startToEnd, { '0': 2 });
        assert.deepStrictEqual(result.endToStart, { '2': 0 });
        assert.deepStrictEqual(result.startToElse, {});
        assert.deepStrictEqual(result.elseToEnd, {});
    });

    it('should handle if-else block', () => {
        const list = [
            { type: 'if', id: 1 },     // 0
            { type: 'log', id: 2 },    // 1
            { type: 'else', id: 3 },   // 2
            { type: 'log', id: 4 },    // 3
            { type: 'end', id: 5 }     // 4
        ];
        const result = buildBlockMap(list);

        // startToEnd: 0 -> 4
        // startToElse: 0 -> 2
        // elseToEnd: 2 -> 4
        // endToStart: 4 -> 0

        assert.deepStrictEqual(result.startToEnd, { '0': 4 });
        assert.deepStrictEqual(result.startToElse, { '0': 2 });
        assert.deepStrictEqual(result.elseToEnd, { '2': 4 });
        assert.deepStrictEqual(result.endToStart, { '4': 0 });
    });

    it('should handle while block', () => {
        const list = [
            { type: 'while', id: 1 },
            { type: 'log', id: 2 },
            { type: 'end', id: 3 }
        ];
        const result = buildBlockMap(list);

        assert.deepStrictEqual(result.startToEnd, { '0': 2 });
        assert.deepStrictEqual(result.endToStart, { '2': 0 });
    });

    it('should handle repeat block', () => {
        const list = [
            { type: 'repeat', id: 1 },
            { type: 'log', id: 2 },
            { type: 'end', id: 3 }
        ];
        const result = buildBlockMap(list);

        assert.deepStrictEqual(result.startToEnd, { '0': 2 });
        assert.deepStrictEqual(result.endToStart, { '2': 0 });
    });

    it('should handle foreach block', () => {
        const list = [
            { type: 'foreach', id: 1 },
            { type: 'log', id: 2 },
            { type: 'end', id: 3 }
        ];
        const result = buildBlockMap(list);

        assert.deepStrictEqual(result.startToEnd, { '0': 2 });
        assert.deepStrictEqual(result.endToStart, { '2': 0 });
    });

    it('should handle nested blocks', () => {
        const list = [
            { type: 'repeat', id: 1 },   // 0
            { type: 'log', id: 2 },      // 1
            { type: 'if', id: 3 },       // 2
            { type: 'log', id: 4 },      // 3
            { type: 'end', id: 5 },      // 4 (ends if at 2)
            { type: 'log', id: 6 },      // 5
            { type: 'end', id: 7 }       // 6 (ends repeat at 0)
        ];
        const result = buildBlockMap(list);

        assert.strictEqual(result.startToEnd['2'], 4);
        assert.strictEqual(result.endToStart['4'], 2);

        assert.strictEqual(result.startToEnd['0'], 6);
        assert.strictEqual(result.endToStart['6'], 0);
    });

    it('should handle on_error block', () => {
        const list = [
            { type: 'on_error', id: 1 },
            { type: 'log', id: 2 },
            { type: 'end', id: 3 }
        ];
        const result = buildBlockMap(list);

        assert.deepStrictEqual(result.startToEnd, { '0': 2 });
        assert.deepStrictEqual(result.endToStart, { '2': 0 });
    });

    it('should handle nested if-else inside repeat', () => {
        const list = [
            { type: 'repeat', id: 1 },   // 0
            { type: 'if', id: 2 },       // 1
            { type: 'else', id: 3 },     // 2
            { type: 'end', id: 4 },      // 3 (ends if at 1)
            { type: 'end', id: 5 }       // 4 (ends repeat at 0)
        ];
        const result = buildBlockMap(list);

        assert.strictEqual(result.startToEnd['1'], 3);
        assert.strictEqual(result.startToElse['1'], 2);
        assert.strictEqual(result.elseToEnd['2'], 3);

        assert.strictEqual(result.startToEnd['0'], 4);
        assert.strictEqual(result.endToStart['4'], 0);
    });

    it('should ignore end without start (stack underflow)', () => {
        const list = [
            { type: 'end', id: 1 }
        ];
        const result = buildBlockMap(list);

        assert.deepStrictEqual(result.startToEnd, {});
        assert.deepStrictEqual(result.endToStart, {});
    });

    it('should ignore start without end (stack overflow / unclosed block)', () => {
        const list = [
            { type: 'if', id: 1 }
        ];
        const result = buildBlockMap(list);

        assert.deepStrictEqual(result.startToEnd, {});
        assert.deepStrictEqual(result.endToStart, {});
    });

    it('should handle multiple else in one if (only first else should count as main else?)', () => {
        // The implementation:
        // if (action.type === 'else') {
        //     for (let i = stack.length - 1; i >= 0; i -= 1) {
        //         const entry = stack[i];
        //         if (entry.type === 'if' && startToElse[entry.idx] === undefined) {
        //             startToElse[entry.idx] = idx;
        //             break;
        //         }
        //     }
        //     return;
        // }
        // It seems it links the first 'else' encountered to the 'if'. Subsequent 'else's are ignored for 'startToElse' linking for that 'if'.

        const list = [
            { type: 'if', id: 1 },     // 0
            { type: 'else', id: 2 },   // 1 (should link to 0)
            { type: 'else', id: 3 },   // 2 (should be ignored or handled? Logic says it won't link because startToElse[0] is defined)
            { type: 'end', id: 4 }     // 3
        ];

        const result = buildBlockMap(list);

        assert.strictEqual(result.startToElse['0'], 1);
        assert.strictEqual(result.elseToEnd['1'], 3);
        // The second else (idx 2) is not linked in elseToEnd because it's not in startToElse
        assert.strictEqual(result.elseToEnd['2'], undefined);
    });
});
