import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'CodeLearning API Documentation',
            version: '1.0.0',
            description: 'Documentazione completa delle API per la piattaforma CodeLearning',
            contact: {
                name: 'Support',
                email: 'support@codelearning.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Development server'
            }
        ],
        components: {
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        message: {
                            type: 'string',
                            example: 'Errore durante l\'operazione'
                        }
                    }
                },
                Course: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            example: 1
                        },
                        title: {
                            type: 'string',
                            example: 'Corso di JavaScript'
                        },
                        description: {
                            type: 'string',
                            example: 'Un corso completo su JavaScript'
                        },
                        difficulty_level: {
                            type: 'string',
                            enum: ['beginner', 'intermediate', 'advanced'],
                            example: 'intermediate'
                        },
                        duration_hours: {
                            type: 'integer',
                            example: 20
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updated_at: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                Lesson: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            example: 1
                        },
                        course_id: {
                            type: 'integer',
                            example: 1
                        },
                        title: {
                            type: 'string',
                            example: 'Introduzione a JavaScript'
                        },
                        content: {
                            type: 'string',
                            example: 'Contenuto della lezione...'
                        },
                        order_number: {
                            type: 'integer',
                            example: 1
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                User: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            example: 1
                        },
                        name: {
                            type: 'string',
                            example: 'John Doe'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'john@example.com'
                        },
                        role: {
                            type: 'string',
                            enum: ['user', 'admin'],
                            example: 'user'
                        }
                    }
                },
                Comment: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            example: 1
                        },
                        lesson_id: {
                            type: 'integer',
                            example: 1
                        },
                        user_id: {
                            type: 'integer',
                            example: 1
                        },
                        content: {
                            type: 'string',
                            example: 'Ottima lezione!'
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updated_at: {
                            type: 'string',
                            format: 'date-time'
                        },
                        parent_id: {
                            type: 'integer',
                            nullable: true,
                            example: null
                        }
                    }
                }
            },
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [{
            bearerAuth: []
        }]
    },
    apis: ['./src/routes/*.js']
};

export const specs = swaggerJsdoc(options);