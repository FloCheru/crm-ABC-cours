const fs = require('fs');
const path = require('path');

class AutoLogger {
  constructor() {
    this.logFile = path.join(__dirname, '../logs/server.log');
    this.ensureLogDir();
  }
  
  ensureLogDir() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }
  
  log(level, message, forceSync = false) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;
    
    // Console (comme avant)
    console.log(logEntry.trim());
    
    // Fichier (pour Agent Test)
    if (forceSync || process.env.NODE_ENV === 'test') {
      // Écriture synchrone pour les tests
      fs.appendFileSync(this.logFile, logEntry);
    } else {
      // Écriture asynchrone normale
      fs.appendFile(this.logFile, logEntry, () => {});
    }
  }
  
  // Garder seulement les 1000 dernières lignes
  rotateLogs() {
    if (fs.existsSync(this.logFile)) {
      const lines = fs.readFileSync(this.logFile, 'utf8').split('\n');
      if (lines.length > 1000) {
        const recentLines = lines.slice(-1000);
        fs.writeFileSync(this.logFile, recentLines.join('\n'));
      }
    }
  }
  
  getRecentLogs(lines = 50) {
    if (!fs.existsSync(this.logFile)) return [];
    const content = fs.readFileSync(this.logFile, 'utf8');
    return content.split('\n').slice(-lines).filter(line => line.trim());
  }
  
  // Méthodes de commodité
  info(message, forceSync = false) {
    this.log('INFO', message, forceSync);
  }
  
  error(message, forceSync = false) {
    this.log('ERROR', message, forceSync);
  }
  
  warn(message, forceSync = false) {
    this.log('WARN', message, forceSync);
  }
  
  debug(message, forceSync = false) {
    this.log('DEBUG', message, forceSync);
  }
}

module.exports = new AutoLogger();