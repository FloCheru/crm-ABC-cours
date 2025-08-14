/**
 * Service de logging conditionnel pour le backend
 * Affiche les logs selon l'environnement
 */

class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    this.isTest = process.env.NODE_ENV === 'test';
  }

  formatMessage(level, message, ...args) {
    if (this.isTest && level !== 'ERROR') return; // Silence en test sauf erreurs
    
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level}] ${message}`;
    
    switch (level) {
      case 'DEBUG':
        if (this.isDevelopment) console.log(formattedMessage, ...args);
        break;
      case 'INFO':
        console.info(formattedMessage, ...args);
        break;
      case 'WARN':
        console.warn(formattedMessage, ...args);
        break;
      case 'ERROR':
        console.error(formattedMessage, ...args);
        break;
    }
  }

  debug(message, ...args) {
    this.formatMessage('DEBUG', message, ...args);
  }

  info(message, ...args) {
    this.formatMessage('INFO', message, ...args);
  }

  warn(message, ...args) {
    this.formatMessage('WARN', message, ...args);
  }

  error(message, ...args) {
    this.formatMessage('ERROR', message, ...args);
  }

  // Méthode de compatibilité avec console.log existant
  log(message, ...args) {
    this.debug(message, ...args);
  }
}

module.exports = new Logger();