import AppError from './AppError.js';

class DatabaseError extends AppError {
    constructor(message, pgError = null) {
        const errorData = DatabaseError.parsePostgresError(pgError);
        super(
            message || errorData.message,
            500,
            errorData.code,
            { originalError: errorData }
        );
        this.name = 'DatabaseError';
        this.pgError = pgError;
    }

    static parsePostgresError(pgError) {
        if (!pgError) {
            return {
                code: 'DB_ERROR',
                message: 'Errore database generico'
            };
        }

        // Mappa degli errori PostgreSQL più comuni
        const errorMap = {
            '23505': { // unique_violation
                code: 'UNIQUE_VIOLATION',
                message: 'Violazione vincolo di unicità'
            },
            '23503': { // foreign_key_violation
                code: 'FOREIGN_KEY_VIOLATION',
                message: 'Violazione chiave esterna'
            },
            '23502': { // not_null_violation
                code: 'NOT_NULL_VIOLATION',
                message: 'Violazione vincolo not null'
            },
            '42P01': { // undefined_table
                code: 'TABLE_NOT_FOUND',
                message: 'Tabella non trovata'
            },
            '42703': { // undefined_column
                code: 'COLUMN_NOT_FOUND',
                message: 'Colonna non trovata'
            },
            '57014': { // query_canceled
                code: 'QUERY_CANCELED',
                message: 'Query annullata per timeout'
            },
            '08006': { // connection_failure
                code: 'CONNECTION_FAILURE',
                message: 'Errore di connessione al database'
            },
            '08001': { // sqlclient_unable_to_establish_sqlconnection
                code: 'CONNECTION_ERROR',
                message: 'Impossibile stabilire connessione al database'
            }
        };

        const errorInfo = errorMap[pgError.code] || {
            code: 'DB_ERROR',
            message: pgError.message || 'Errore database non specificato'
        };

        return {
            ...errorInfo,
            detail: pgError.detail,
            hint: pgError.hint,
            position: pgError.position,
            internalQuery: pgError.internalQuery,
            where: pgError.where,
            schema: pgError.schema,
            table: pgError.table,
            column: pgError.column,
            dataType: pgError.dataType,
            constraint: pgError.constraint
        };
    }

    static isUniqueViolation(error) {
        return error instanceof DatabaseError && error.pgError?.code === '23505';
    }

    static isForeignKeyViolation(error) {
        return error instanceof DatabaseError && error.pgError?.code === '23503';
    }

    static isConnectionError(error) {
        return error instanceof DatabaseError && 
               ['08006', '08001'].includes(error.pgError?.code);
    }

    static fromPgError(pgError) {
        return new DatabaseError(null, pgError);
    }

    toJSON() {
        const json = super.toJSON();
        if (process.env.NODE_ENV === 'development') {
            json.error.pgError = this.pgError;
        }
        return json;
    }
}

export default DatabaseError;