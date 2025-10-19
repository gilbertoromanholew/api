// Sistema de armazenamento de logs de acesso em memória
class AccessLogger {
    constructor() {
        this.logs = [];
        this.maxLogs = 5000; // Manter últimos 5000 logs (aumentado para comportar todos os acessos)
    }

    // Adicionar novo log
    addLog(logData) {
        const log = {
            id: Date.now() + Math.random(), // ID único
            ...logData,
            timestamp: new Date().toISOString(),
            timestamp_unix: Date.now()
        };

        this.logs.unshift(log); // Adiciona no início

        // Manter apenas os últimos maxLogs
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(0, this.maxLogs);
        }

        return log;
    }

    // Obter todos os logs
    getAllLogs() {
        return this.logs;
    }

    // Obter logs com filtros
    getFilteredLogs(filters = {}) {
        let filtered = [...this.logs];

        if (filters.ip) {
            filtered = filtered.filter(log => log.ip_detected === filters.ip);
        }

        if (filters.authorized !== undefined) {
            filtered = filtered.filter(log => log.is_authorized === filters.authorized);
        }

        if (filters.limit) {
            filtered = filtered.slice(0, filters.limit);
        }

        return filtered;
    }

    // Estatísticas por IP (otimizado - O(n) em vez de O(n²))
    getIPStats() {
        const stats = new Map();

        // Uma única passada pelos logs - O(n)
        for (const log of this.logs) {
            const ip = log.ip_detected;
            
            if (!stats.has(ip)) {
                stats.set(ip, {
                    ip: ip,
                    total_attempts: 0,
                    authorized: 0,
                    denied: 0,
                    first_seen: log.timestamp,
                    last_seen: log.timestamp,
                    countries: new Set(),
                    browsers: new Set(),
                    platforms: new Set(),
                    urls_accessed: []
                });
            }

            const ipStats = stats.get(ip);
            ipStats.total_attempts++;
            ipStats.last_seen = log.timestamp;
            
            if (log.is_authorized) {
                ipStats.authorized++;
            } else {
                ipStats.denied++;
            }

            if (log.country) ipStats.countries.add(log.country);
            if (log.browser) ipStats.browsers.add(log.browser);
            if (log.platform) ipStats.platforms.add(log.platform);
            if (log.url) ipStats.urls_accessed.push(log.url);
        }

        // Converter Sets para Arrays e Map para Array
        const result = Array.from(stats.values()).map(stat => ({
            ...stat,
            countries: Array.from(stat.countries),
            browsers: Array.from(stat.browsers),
            platforms: Array.from(stat.platforms)
        }));

        // Ordenar por total de tentativas (decrescente)
        return result.sort((a, b) => b.total_attempts - a.total_attempts);
    }

    // Estatísticas gerais
    getGeneralStats() {
        const totalLogs = this.logs.length;
        const authorized = this.logs.filter(log => log.is_authorized).length;
        const denied = this.logs.filter(log => !log.is_authorized).length;
        const uniqueIPs = new Set(this.logs.map(log => log.ip_detected)).size;

        const browsers = {};
        const platforms = {};
        const countries = {};
        const endpoints = {};  // ← ADICIONADO

        this.logs.forEach(log => {
            if (log.browser) {
                browsers[log.browser] = (browsers[log.browser] || 0) + 1;
            }
            if (log.platform) {
                platforms[log.platform] = (platforms[log.platform] || 0) + 1;
            }
            if (log.country) {
                countries[log.country] = (countries[log.country] || 0) + 1;
            }
            if (log.url) {  // ← ADICIONADO
                endpoints[log.url] = (endpoints[log.url] || 0) + 1;
            }
        });

        return {
            total_requests: totalLogs,
            authorized_requests: authorized,
            denied_requests: denied,
            unique_ips: uniqueIPs,
            authorization_rate: totalLogs > 0 ? ((authorized / totalLogs) * 100).toFixed(2) + '%' : '0%',
            top_browsers: browsers,
            top_platforms: platforms,
            top_countries: countries,
            top_endpoints: endpoints,  // ← ADICIONADO
            last_updated: new Date().toISOString()
        };
    }

    // Limpar logs antigos (opcional)
    clearOldLogs(olderThanHours = 24) {
        const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
        this.logs = this.logs.filter(log => log.timestamp_unix > cutoffTime);
    }

    // Limpar todos os logs
    clearAllLogs() {
        this.logs = [];
    }
}

// Instância global do logger
export const accessLogger = new AccessLogger();
