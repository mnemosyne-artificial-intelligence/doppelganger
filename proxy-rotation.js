const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const DATA_PROXY_FILE = path.join(__dirname, 'data', 'proxies.json');
const PROXY_FILES = [
    DATA_PROXY_FILE,
    path.join(__dirname, 'proxies.json')
];

const ROTATION_MODES = new Set(['round-robin', 'random']);

let cached = {
    file: null,
    mtimeMs: 0,
    config: { proxies: [], defaultProxyId: null, includeDefaultInRotation: false, rotationMode: 'round-robin' }
};
let rotationIndex = 0;

class Mutex {
    constructor() {
        this.queue = [];
        this.locked = false;
    }

    async acquire() {
        if (this.locked) {
            await new Promise(resolve => this.queue.push(resolve));
        }
        this.locked = true;
    }

    release() {
        if (this.queue.length > 0) {
            const next = this.queue.shift();
            next();
        } else {
            this.locked = false;
        }
    }

    async run(fn) {
        await this.acquire();
        try {
            return await fn();
        } finally {
            this.release();
        }
    }
}

const mutex = new Mutex();

const normalizeServer = (raw) => {
    if (!raw) return '';
    let server = String(raw).trim();
    if (!server) return '';
    if (!server.includes('://')) {
        server = `http://${server}`;
    }
    return server;
};

const createProxyId = (seed) => {
    // SHA-256 is used purely for deterministic, non-secret IDs.
    const hash = crypto.createHash('sha256').update(String(seed)).digest('hex').slice(0, 12);
    return `proxy_${hash}`;
};

const normalizeProxy = (entry) => {
    if (!entry) return null;
    if (typeof entry === 'string') {
        let raw = entry.trim();
        if (!raw) return null;
        if (!raw.includes('://')) {
            raw = `http://${raw}`;
        }
        try {
            const parsed = new URL(raw);
            const server = `${parsed.protocol}//${parsed.host}`;
            const username = parsed.username ? decodeURIComponent(parsed.username) : undefined;
            const password = parsed.password ? decodeURIComponent(parsed.password) : undefined;
            // ID derived from server and username only to avoid hashing passwords
            return {
                id: createProxyId(`${server}|${username || ''}`),
                server,
                username,
                password
            };
        } catch {
            return null;
        }
    }
    if (typeof entry === 'object') {
        const serverRaw = entry.server || entry.url || entry.proxy;
        const server = normalizeServer(serverRaw);
        if (!server) return null;
        const username = entry.username || entry.user;
        const password = entry.password || entry.pass;
        // ID derived from server and username only to avoid hashing passwords
        const id = entry.id || createProxyId(`${server}|${username || ''}`);
        return {
            id,
            server,
            username,
            password,
            label: entry.label
        };
    }
    return null;
};

const normalizeRotationMode = (mode) => {
    if (ROTATION_MODES.has(mode)) return mode;
    return 'round-robin';
};

const loadProxyFile = async (filePath) => {
    try {
        const raw = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            return { proxies: parsed, defaultProxyId: null, includeDefaultInRotation: false, rotationMode: 'round-robin' };
        }
        const proxies = Array.isArray(parsed.proxies) ? parsed.proxies : [];
        const defaultProxyId = parsed.defaultProxyId || null;
        const includeDefaultInRotation = !!parsed.includeDefaultInRotation;
        const rotationMode = normalizeRotationMode(parsed.rotationMode);
        return { proxies, defaultProxyId, includeDefaultInRotation, rotationMode };
    } catch {
        return { proxies: [], defaultProxyId: null, includeDefaultInRotation: false, rotationMode: 'round-robin' };
    }
};

const fileExists = async (filePath) => {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
};

const loadProxyConfig = async () => {
    let filePath = null;
    for (const candidate of PROXY_FILES) {
        if (await fileExists(candidate)) {
            filePath = candidate;
            break;
        }
    }

    if (!filePath) {
        cached = { file: null, mtimeMs: 0, config: { proxies: [], defaultProxyId: null, includeDefaultInRotation: false, rotationMode: 'round-robin' } };
        return cached.config;
    }

    try {
        const stat = await fs.stat(filePath);
        const mtimeMs = stat.mtimeMs || 0;
        if (cached.file === filePath && cached.mtimeMs === mtimeMs) {
            return cached.config;
        }
        const rawConfig = await loadProxyFile(filePath);
        const proxies = rawConfig.proxies.map(normalizeProxy).filter(Boolean);
        const defaultProxyId = rawConfig.defaultProxyId && proxies.some((proxy) => proxy.id === rawConfig.defaultProxyId)
            ? rawConfig.defaultProxyId
            : null;
        const config = {
            proxies,
            defaultProxyId,
            includeDefaultInRotation: !!rawConfig.includeDefaultInRotation,
            rotationMode: normalizeRotationMode(rawConfig.rotationMode)
        };
        cached = { file: filePath, mtimeMs, config };
        return config;
    } catch {
        cached = { file: filePath, mtimeMs: 0, config: { proxies: [], defaultProxyId: null, includeDefaultInRotation: false, rotationMode: 'round-robin' } };
        return cached.config;
    }
};

const saveProxyConfig = async (config) => {
    const target = DATA_PROXY_FILE;
    const payload = {
        defaultProxyId: config.defaultProxyId || null,
        proxies: Array.isArray(config.proxies) ? config.proxies : [],
        includeDefaultInRotation: !!config.includeDefaultInRotation,
        rotationMode: normalizeRotationMode(config.rotationMode)
    };
    await fs.writeFile(target, JSON.stringify(payload, null, 2));
    try {
        const stat = await fs.stat(target);
        cached = { file: target, mtimeMs: stat.mtimeMs || 0, config: payload };
    } catch {
        cached = { file: target, mtimeMs: 0, config: payload };
    }
    return payload;
};

const listProxies = () => mutex.run(async () => {
    const config = await loadProxyConfig();
    const hostEntry = {
        id: 'host',
        server: 'host_ip',
        label: 'Host IP (no proxy)'
    };
    return {
        proxies: [hostEntry, ...(config.proxies || [])],
        defaultProxyId: config.defaultProxyId || 'host',
        includeDefaultInRotation: !!config.includeDefaultInRotation,
        rotationMode: normalizeRotationMode(config.rotationMode)
    };
});

const addProxy = (entry) => mutex.run(async () => {
    const normalized = normalizeProxy(entry);
    if (!normalized) return null;
    const config = await loadProxyConfig();
    const proxies = [...config.proxies, { ...normalized, id: `proxy_${crypto.randomBytes(6).toString('hex')}` }];
    const next = { ...config, proxies };
    return await saveProxyConfig(next);
});

const addProxies = (entries) => mutex.run(async () => {
    if (!Array.isArray(entries)) return null;
    const normalizedEntries = entries.map(normalizeProxy).filter(Boolean);
    if (normalizedEntries.length === 0) return null;
    const config = await loadProxyConfig();
    const existingByServer = new Map(
        config.proxies.map((proxy) => [String(proxy.server || '').toLowerCase(), proxy])
    );
    const seenServers = new Set();
    const updates = [];
    const additions = [];

    normalizedEntries.forEach((proxy) => {
        const serverKey = String(proxy.server || '').toLowerCase();
        if (!serverKey || seenServers.has(serverKey)) return;
        seenServers.add(serverKey);
        const existing = existingByServer.get(serverKey);
        if (existing) {
            updates.push({ ...existing, ...proxy, id: existing.id });
        } else {
            additions.push({ ...proxy, id: `proxy_${crypto.randomBytes(6).toString('hex')}` });
        }
    });

    const merged = config.proxies.map((proxy) => {
        const serverKey = String(proxy.server || '').toLowerCase();
        const replacement = updates.find((item) => String(item.server || '').toLowerCase() === serverKey);
        return replacement || proxy;
    });

    const proxies = [...merged, ...additions];
    const next = { ...config, proxies };
    return await saveProxyConfig(next);
});

const updateProxy = (id, entry) => mutex.run(async () => {
    if (!id) return null;
    const normalized = normalizeProxy(entry);
    if (!normalized) return null;
    const config = await loadProxyConfig();
    const proxies = config.proxies.map((proxy) => {
        if (proxy.id !== id) return proxy;
        return { ...proxy, ...normalized, id };
    });
    if (!proxies.some((proxy) => proxy.id === id)) return null;
    return await saveProxyConfig({ ...config, proxies });
});

const deleteProxy = (id) => mutex.run(async () => {
    if (!id) return null;
    const config = await loadProxyConfig();
    const proxies = config.proxies.filter((proxy) => proxy.id !== id);
    const defaultProxyId = config.defaultProxyId === id ? null : config.defaultProxyId;
    return await saveProxyConfig({ ...config, proxies, defaultProxyId });
});

const setDefaultProxy = (id) => mutex.run(async () => {
    const config = await loadProxyConfig();
    if (!id) {
        return await saveProxyConfig({ ...config, defaultProxyId: null });
    }
    if (!config.proxies.some((proxy) => proxy.id === id)) return null;
    return await saveProxyConfig({ ...config, defaultProxyId: id });
});

const setIncludeDefaultInRotation = (enabled) => mutex.run(async () => {
    const config = await loadProxyConfig();
    return await saveProxyConfig({ ...config, includeDefaultInRotation: !!enabled });
});

const setRotationMode = (mode) => mutex.run(async () => {
    const config = await loadProxyConfig();
    return await saveProxyConfig({ ...config, rotationMode: normalizeRotationMode(mode) });
});

const getNextProxy = (proxies, mode) => {
    if (!proxies.length) return null;
    if (mode === 'random') {
        const index = Math.floor(Math.random() * proxies.length);
        return proxies[index];
    }
    const selected = proxies[rotationIndex % proxies.length];
    rotationIndex += 1;
    return selected;
};

const getProxySelection = (rotateProxies) => mutex.run(async () => {
    const config = await loadProxyConfig();
    const proxies = config.proxies || [];
    const hostEntry = { id: 'host', server: 'host_ip', label: 'Host IP (no proxy)' };
    const pool = [hostEntry, ...proxies];
    const defaultProxy = config.defaultProxyId
        ? proxies.find((proxy) => proxy.id === config.defaultProxyId) || null
        : null;
    const defaultIsHost = !config.defaultProxyId;
    const includeDefaultInRotation = !!config.includeDefaultInRotation;
    const rotationMode = normalizeRotationMode(config.rotationMode);

    if (rotateProxies) {
        let rotationPool = pool;
        if (!includeDefaultInRotation) {
            if (defaultIsHost) {
                rotationPool = pool.filter((proxy) => proxy.id !== 'host');
            } else {
                rotationPool = pool.filter((proxy) => proxy.id !== config.defaultProxyId);
            }
        }
        if (rotationPool.length > 0) {
            const picked = getNextProxy(rotationPool, rotationMode);
            return { proxy: picked && picked.id !== 'host' ? picked : null, mode: 'rotate' };
        }
        if (defaultProxy) return { proxy: defaultProxy, mode: 'default' };
        return { proxy: null, mode: 'host' };
    }

    if (defaultProxy) return { proxy: defaultProxy, mode: 'default' };
    return { proxy: null, mode: 'host' };
});

module.exports = {
    getProxySelection,
    listProxies,
    addProxy,
    addProxies,
    updateProxy,
    deleteProxy,
    setDefaultProxy,
    setIncludeDefaultInRotation,
    setRotationMode
};
