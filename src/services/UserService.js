// src/services/UserService.js
import BaseService from './BaseService.js';
import { userModel } from '../models/userModel.js';
import DatabaseError from '../utils/errors/DatabaseError.js';
import ValidationError from '../utils/errors/ValidationError.js';
import AuthError from '../utils/errors/AuthError.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth.js';

class UserService extends BaseService {
    constructor() {
        super(userModel);
    }

    validate(data) {
        const errors = [];
        
        if (data.email && !data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            errors.push({
                field: 'email',
                message: 'Invalid email format'
            });
        }

        if (data.password && data.password.length < 8) {
            errors.push({
                field: 'password',
                message: 'Password must be at least 8 characters long'
            });
        }

        if (errors.length > 0) {
            throw new ValidationError('Validation failed', errors);
        }
    }

    async login(email, password) {
        try {
            const user = await this.model.findByEmail(email);
            if (!user) {
                throw new AuthError('Invalid credentials');
            }

            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                throw new AuthError('Invalid credentials');
            }

            // Update last login
            await this.update(user.id, {
                last_login: new Date()
            });

            const token = generateToken(user);

            return {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                token
            };
        } catch (error) {
            if (error instanceof AuthError) {
                throw error;
            }
            throw new DatabaseError(error);
        }
    }

    async register(userData) {
        try {
            this.validate(userData);

            const existingUser = await this.model.findByEmail(userData.email);
            if (existingUser) {
                throw new ValidationError('Registration failed', [{
                    field: 'email',
                    message: 'Email already registered'
                }]);
            }

            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const user = await this.create({
                ...userData,
                password: hashedPassword,
                role: 'user'
            });

            const token = generateToken(user);

            return {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                token
            };
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            throw new DatabaseError(error);
        }
    }

    async getFullProfile(userId) {
        try {
            const user = await this.findById(userId);
            if (!user) {
                throw new ValidationError('User not found');
            }

            return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                created_at: user.created_at,
                last_login: user.last_login
            };
        } catch (error) {
            throw new DatabaseError(error);
        }
    }

    async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await this.model.findById(userId);
            if (!user) {
                throw new ValidationError('User not found');
            }
    
            // Prima otteniamo la password hash corrente
            const currentPasswordHash = await this.model.getPasswordHash(userId);
            if (!currentPasswordHash) {
                throw new ValidationError('User not found');
            }
    
            const isValidPassword = await bcrypt.compare(currentPassword, currentPasswordHash);
            if (!isValidPassword) {
                throw new AuthError('Current password is incorrect');
            }
    
            // Hash della nuova password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            
            // Aggiorna la password
            await this.model.updatePassword(userId, hashedPassword);
    
            return true;
        } catch (error) {
            if (error instanceof AuthError || error instanceof ValidationError) {
                throw error;
            }
            throw new DatabaseError(error);
        }
    }

    async getAllUsers() {
        try {
            return await this.model.findAll();
        } catch (error) {
            throw new DatabaseError(error);
        }
    }
    async updateProfile(userId, profileData) {
        try {
            // Valida i campi consentiti per l'aggiornamento del profilo
            const allowedFields = ['name', 'email'];
            const filteredData = Object.keys(profileData)
                .filter(key => allowedFields.includes(key))
                .reduce((obj, key) => {
                    obj[key] = profileData[key];
                    return obj;
                }, {});

            if (Object.keys(filteredData).length === 0) {
                throw new ValidationError('No valid fields to update');
            }

            const updatedUser = await this.update(userId, filteredData);
            if (!updatedUser) {
                throw new ValidationError('User not found');
            }

            return updatedUser;
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            throw new DatabaseError(error);
        }
    }

    async updatePreferences(userId, preferences) {
        try {
            const { theme, language, notification_email } = preferences;

            // Valida le preferenze
            if (theme && !['light', 'dark'].includes(theme)) {
                throw new ValidationError('Invalid theme');
            }

            if (language && !['it', 'en'].includes(language)) {
                throw new ValidationError('Invalid language');
            }

            return await this.model.updatePreferences(userId, {
                theme,
                language,
                notification_email
            });
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            throw new DatabaseError(error);
        }
    }

    async updateUserRole(userId, role) {
        try {
            if (!['user', 'admin'].includes(role)) {
                throw new ValidationError('Invalid role');
            }

            const user = await this.update(userId, { role });
            if (!user) {
                throw new ValidationError('User not found');
            }

            return user;
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            throw new DatabaseError(error);
        }
    }
}

export default new UserService();