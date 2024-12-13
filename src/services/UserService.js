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
            console.log('\n=== LOGIN ATTEMPT ===');
            console.log('Login attempt for email:', email);
            
            const user = await this.model.findByEmail(email);
            console.log('User found in database:', user ? 'Yes' : 'No');
            
            if (!user) {
                console.log('Authentication failed: User not found');
                throw new AuthError('Invalid credentials');
            }

            console.log('\nPassword Verification:');
            console.log('Provided password:', password);
            console.log('Stored hash in DB:', user.password);
            
            // Verifica che l'hash sia nel formato corretto di bcrypt
            const isValidHash = /^\$2[ayb]\$[0-9]{2}\$[A-Za-z0-9./]{53}$/.test(user.password);
            console.log('Hash format is valid:', isValidHash);
            
            const isValidPassword = await bcrypt.compare(password, user.password);
            console.log('bcrypt.compare() result:', isValidPassword);

            if (!isValidPassword) {
                console.log('Authentication failed: Invalid password');
                throw new AuthError('Invalid credentials');
            }

            console.log('Authentication successful');

            // Update last login
            await this.update(user.id, {
                last_login: new Date()
            });

            const token = generateToken(user);
            console.log('Token generated successfully');
            console.log('=== END LOGIN ATTEMPT ===\n');

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
            console.error('Login error:', error);
            if (error instanceof AuthError) {
                throw error;
            }
            throw new DatabaseError(error);
        }
    }

    async register(userData) {
        try {
            console.log('\n=== REGISTRATION ATTEMPT ===');
            console.log('Registration data received:', {
                ...userData,
                password: userData.password ? '[REDACTED]' : undefined
            });

            this.validate(userData);
            console.log('Validation passed');

            const existingUser = await this.model.findByEmail(userData.email);
            if (existingUser) {
                console.log('Registration failed: Email already exists');
                throw new ValidationError('Registration failed', [{
                    field: 'email',
                    message: 'Email already registered'
                }]);
            }

            console.log('\nPassword Hashing:');
            console.log('Original password length:', userData.password.length);
            
            // Genera il salt separatamente per il debug
            const salt = await bcrypt.genSalt(10);
            console.log('Generated salt:', salt);
            
            const hashedPassword = await bcrypt.hash(userData.password, salt);
            console.log('Generated hash:', hashedPassword);
            
            // Verifica immediata dell'hash
            const verifyHash = await bcrypt.compare(userData.password, hashedPassword);
            console.log('Immediate hash verification:', verifyHash);

            const user = await this.create({
                ...userData,
                password: hashedPassword,
                role: 'user'
            });
            console.log('User created in database');

            // Verifica che la password sia stata salvata correttamente
            const savedUser = await this.model.findById(user.id);
            console.log('Saved hash matches generated hash:', savedUser.password === hashedPassword);

            const token = generateToken(user);
            console.log('Token generated successfully');
            console.log('=== END REGISTRATION ATTEMPT ===\n');

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
            console.error('Registration error:', error);
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