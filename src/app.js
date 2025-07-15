const express = require('express');
const app = express();
require('dotenv').config();

const connectDb = require('./db/testConnection');
const eventRoutes = require('./routes/eventRoutes');

app.use(express.json());
app.use('/api/events', eventRoutes);

const PORT = process.env.PORT || 5000;

connectDb().then((isConnected) => {
  if (isConnected) {
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } else {
    console.error('❌ Server not started. DB connection failed.');
  }
});
