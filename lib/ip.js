const normalizeIp = (raw) => {
    if (!raw) return '';
    let ip = String(raw).split(',')[0].trim();
    if (ip.startsWith('::ffff:')) ip = ip.slice(7);
    if (ip.startsWith('[') && ip.endsWith(']')) ip = ip.slice(1, -1);
    if (ip.includes('%')) ip = ip.split('%')[0];
    return ip;
};

module.exports = { normalizeIp };
