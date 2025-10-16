// Sistema de armazenamento de logs de acesso em memória
class AccessLogger {
    constructor() {
        this.logs = [];
        this.maxLogs = 1000; // Manter últimos 1000 logs
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

    // Estatísticas por IP
    getIPStats() {
        const stats = {};

        this.logs.forEach(log => {
            const ip = log.ip_detected;
            
            if (!stats[ip]) {
                stats[ip] = {
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
                };
            }

            stats[ip].total_attempts++;
            stats[ip].last_seen = log.timestamp;
            
            if (log.is_authorized) {
                stats[ip].authorized++;
            } else {
                stats[ip].denied++;
            }

            if (log.country) stats[ip].countries.add(log.country);
            if (log.browser) stats[ip].browsers.add(log.browser);
            if (log.platform) stats[ip].platforms.add(log.platform);
            if (log.url) stats[ip].urls_accessed.push(log.url);
        });

        // Converter Sets para Arrays
        Object.keys(stats).forEach(ip => {
            stats[ip].countries = Array.from(stats[ip].countries);
            stats[ip].browsers = Array.from(stats[ip].browsers);
            stats[ip].platforms = Array.from(stats[ip].platforms);
        });

        return Object.values(stats).sort((a, b) => b.total_attempts - a.total_attempts);
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
