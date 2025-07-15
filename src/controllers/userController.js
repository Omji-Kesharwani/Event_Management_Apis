const pool = require('../db');

exports.createUser = async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id',
      [name, email]
    );
    res.status(201).json({
      userId: result.rows[0].id,
      message: 'User created successfully.'
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email already exists.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create user.' });
  }
};
  