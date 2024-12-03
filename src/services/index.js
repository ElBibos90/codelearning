// src/services/index.js
import UserService from './UserService';
import CourseService from './CourseService.js';
import LessonService from './LessonService.js';
import EnrollmentService from './EnrollmentService.js';

export {
    UserService,
    CourseService,
    LessonService,
    EnrollmentService
};

// Configurazione globale per tutti i servizi
export const serviceConfig = {
    defaultCacheDuration: 3600,
    maxRetries: 3,
    retryDelay: 1000,
    enableEvents: true
};