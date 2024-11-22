// src/services/donationService.js
import { pool } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export const donationService = {
  // Salva una nuova donazione (supporta sia Ko-fi che donazioni locali)
  async saveDonation(donationData) {
    const {
      email,
      amount,
      currency = 'EUR',
      message = '',
      from_name,
      is_test = false
    } = donationData;

    const query = `
      INSERT INTO donations (
        transaction_id, 
        email, 
        amount, 
        currency, 
        message, 
        from_name, 
        timestamp,
        is_test
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *
    `;

    // Genera un ID transazione locale per i test
    const transaction_id = `TEST_${uuidv4()}`;
    
    const values = [
      transaction_id,
      email,
      amount,
      currency,
      message,
      from_name,
      new Date(),
      is_test
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  // Ottiene tutte le donazioni con filtro opzionale per test
  async getAllDonations(options = {}) {
    const {
      limit = 10, 
      offset = 0,
      includeTest = false,
      sortBy = 'timestamp',
      sortOrder = 'DESC'
    } = options;

    const query = `
      SELECT * FROM donations 
      WHERE ($1 = true OR is_test = false)
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $2 OFFSET $3
    `;
    
    const { rows } = await pool.query(query, [includeTest, limit, offset]);
    return rows;
  },

  // Ottiene le statistiche delle donazioni
  async getDonationStats(includeTest = false) {
    const query = `
      SELECT 
        COUNT(*) as total_donations,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount,
        MIN(timestamp) as first_donation,
        MAX(timestamp) as last_donation,
        COUNT(CASE WHEN is_test THEN 1 END) as test_donations_count
      FROM donations
      WHERE ($1 = true OR is_test = false)
    `;
    
    const { rows } = await pool.query(query, [includeTest]);
    return rows[0];
  }
};