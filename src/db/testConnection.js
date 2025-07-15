const pool = require('./index');

const connectDb = async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully at:', res.rows[0].now);
    return true;
  } catch (err) {
    console.error('❌ Failed to connect to the database:', err.message);
    return false;
  }
};

module.exports = connectDb;