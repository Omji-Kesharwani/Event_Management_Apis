
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL
);


CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  datetime TIMESTAMP NOT NULL,
  location TEXT NOT NULL,
  capacity INT NOT NULL CHECK (capacity > 0 AND capacity <= 1000)
);


CREATE TABLE IF NOT EXISTS registrations (
  user_id INT REFERENCES users(id),
  event_id INT REFERENCES events(id),
  PRIMARY KEY (user_id, event_id)
);
