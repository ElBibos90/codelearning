// src/utils/pagination.js
export const DEFAULT_PAGE_SIZE = 10;

export const encodeCursor = (value) => {
    return Buffer.from(JSON.stringify(value)).toString('base64');
};

export const decodeCursor = (cursor) => {
    if (!cursor) return null;
    return JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
};

export const getPaginationParams = (cursor, limit = DEFAULT_PAGE_SIZE) => {
    const decodedCursor = decodeCursor(cursor);
    return {
        limit: Math.min(parseInt(limit) || DEFAULT_PAGE_SIZE, 100),
        cursor: decodedCursor
    };
};