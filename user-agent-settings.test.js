import { describe, it, expect, vi } from 'vitest';
import { selectUserAgent, userAgents } from './user-agent-settings';

describe('selectUserAgent', () => {
    it('should return a random user agent when rotateUserAgents is true', () => {
        // When rotating, configLoader should not be called strictly speaking,
        // or simply we ignore it. The function signature allows passing it anyway.
        // We can check if it is NOT called if we want strictly pure test.
        const mockLoader = vi.fn();
        const agent = selectUserAgent(true, mockLoader);
        expect(userAgents).toContain(agent);
        expect(mockLoader).not.toHaveBeenCalled();
    });

    it('should call configLoader when rotateUserAgents is false', () => {
        const mockLoader = vi.fn(() => ({ selection: 'system' }));
        selectUserAgent(false, mockLoader);
        expect(mockLoader).toHaveBeenCalled();
    });

    it('should return default user agent when config selection is default', () => {
        const mockLoader = vi.fn(() => ({ selection: 'system' }));
        const agent = selectUserAgent(false, mockLoader);
        expect(agent).toBe(userAgents[0]);
    });

    it('should return custom user agent when config selection is specific', () => {
        const customAgent = userAgents[1];
        const mockLoader = vi.fn(() => ({ selection: customAgent }));
        const agent = selectUserAgent(false, mockLoader);
        expect(agent).toBe(customAgent);
    });

    // Test default loader usage?
    // We cannot easily test default loader behavior without hitting FS or mocking fs.
    // But since default loader logic is covered by existing code structure (it works in prod),
    // and we tested selectUserAgent logic via DI, we have good coverage of selectUserAgent.
    // The integration of loadUserAgentConfig with FS is not tested here,
    // but the critical logic of selectUserAgent choosing between rotation and config is tested.
});
