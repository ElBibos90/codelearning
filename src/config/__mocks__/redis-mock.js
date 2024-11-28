// src/config/__mocks__/redis-mock.js
class RedisMock {
    constructor() {
        this.data = new Map();
        this.isOpen = true;
        this.listeners = new Map();
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
        return this;
    }

    emit(event, ...args) {
        const callbacks = this.listeners.get(event) || [];
        callbacks.forEach(callback => callback(...args));
        return this;
    }

    async connect() {
        this.isOpen = true;
        return true;
    }

    async disconnect() {
        this.isOpen = false;
        return true;
    }

    async quit() {
        this.isOpen = false;
        return true;
    }

    async set(key, value, options = {}) {
        if (options.EX) {
            setTimeout(() => {
                this.data.delete(key);
            }, options.EX * 1000);
        }
        this.data.set(key, value);
        return 'OK';
    }

    async get(key) {
        return this.data.get(key);
    }

    async incr(key) {
        const value = (parseInt(this.data.get(key)) || 0) + 1;
        this.data.set(key, value.toString());
        return value;
    }

    async decr(key) {
        const value = (parseInt(this.data.get(key)) || 0) - 1;
        this.data.set(key, value.toString());
        return value;
    }

    async del(key) {
        this.data.delete(key);
        return 1;
    }

    async flushAll() {
        this.data.clear();
        return 'OK';
    }

    async expire(key, seconds) {
        if (this.data.has(key)) {
            setTimeout(() => {
                this.data.delete(key);
            }, seconds * 1000);
            return 1;
        }
        return 0;
    }
}

export const createClient = () => new RedisMock();