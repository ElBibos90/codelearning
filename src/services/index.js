// src/services/index.js
import UserService from './UserService';

export {
    UserService
};

// Configurazione globale per tutti i servizi
export const serviceConfig = {
    defaultCacheDuration: 3600,
    maxRetries: 3,
    retryDelay: 1000,
    enableEvents: true
};