const pool =require('../db');


exports.createEvent=async(req,res)=>{
  const {title,datetime,location,capacity}=req.body;

  if(!title||!datetime||!location || capacity===undefined)
  {
    return res.status(400).json({
      message:"All fields are  required ."
    });
  }

  if(isNaN(Date.parse(datetime))){
    return res.status(400).json({
      message:"Invalid date format. Use ISO 8601"
    })
  }
  
   if (typeof capacity !== 'number' || capacity <= 0 || capacity > 1000) {
    return res.status(400).json(
      { 
          message: 'Capacity must be a number between 1 and 1000.' 
      }
    );
  }

   try{

      const result = await pool.query(
      `INSERT INTO events (title, datetime, location, capacity)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [title, datetime, location, capacity]
    );

    res.status(201).json({ message: 'Event created successfully.', eventId: result.rows[0].id });
   }
   catch(err){
    console.err('Error creating event:', err.message);
    res.status(500).json(
      { 
      message: 'Internal server error.'
     }
    );
   } 
}

exports.getEvent = async (req, res) => {
  const eventId = req.params.id;

  try {
    const event = await pool.query('SELECT * FROM events WHERE id = $1', [eventId]);
    if (event.rowCount === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const users = await pool.query(
      `SELECT u.id, u.name, u.email
       FROM users u
       JOIN registrations r ON u.id = r.user_id
       WHERE r.event_id = $1`,
      [eventId]
    );

    res.status(200).json({
      ...event.rows[0],
      registeredUsers: users.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not retrieve event.' });
  }
};


exports.registerUser = async (req, res) => {
  const eventId = parseInt(req.params.id);
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ error: 'User ID is required.' });

  try {
    const event = await pool.query('SELECT * FROM events WHERE id = $1', [eventId]);
    if (event.rowCount === 0) return res.status(404).json({ error: 'Event not found.' });

    const now = new Date();
    if (new Date(event.rows[0].datetime) < now) {
      return res.status(400).json({ error: 'Cannot register for past events.' });
    }

    const count = await pool.query('SELECT COUNT(*) FROM registrations WHERE event_id = $1', [eventId]);
    if (parseInt(count.rows[0].count) >= event.rows[0].capacity) {
      return res.status(400).json({ error: 'Event is full.' });
    }

    const duplicate = await pool.query(
      'SELECT * FROM registrations WHERE user_id = $1 AND event_id = $2',
      [userId, eventId]
    );
    if (duplicate.rowCount > 0) {
      return res.status(400).json({ error: 'User already registered.' });
    }

    await pool.query('INSERT INTO registrations (user_id, event_id) VALUES ($1, $2)', [userId, eventId]);
    res.status(200).json({ message: 'Registration successful.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to register.' });
  }
};


exports.cancelRegistration = async (req, res) => {
  const eventId = parseInt(req.params.id);
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ error: 'User ID is required.' });

  try {
    const exists = await pool.query(
      'SELECT * FROM registrations WHERE user_id = $1 AND event_id = $2',
      [userId, eventId]
    );

    if (exists.rowCount === 0) {
      return res.status(400).json({ error: 'User not registered for this event.' });
    }

    await pool.query(
      'DELETE FROM registrations WHERE user_id = $1 AND event_id = $2',
      [userId, eventId]
    );

    res.status(200).json({ message: 'Registration cancelled successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Cancellation failed.' });
  }
};


exports.listUpcomingEvents = async (req, res) => {
  try {
    const now = new Date();
    const result = await pool.query(
      `SELECT * FROM events 
       WHERE datetime > $1 
       ORDER BY datetime ASC, location ASC`,
      [now]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch upcoming events.' });
  }
};


exports.getStats = async (req, res) => {
  const eventId = req.params.id;

  try {
    const event = await pool.query('SELECT capacity FROM events WHERE id = $1', [eventId]);
    if (event.rowCount === 0) return res.status(404).json({ error: 'Event not found.' });

    const registered = await pool.query(
      'SELECT COUNT(*) FROM registrations WHERE event_id = $1',
      [eventId]
    );

    const total = parseInt(registered.rows[0].count);
    const capacity = event.rows[0].capacity;
    const percent = ((total / capacity) * 100).toFixed(2);

    res.json({
      totalRegistrations: total,
      remainingCapacity: capacity - total,
      capacityUsedPercent: `${percent}%`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve stats.' });
  }
};
