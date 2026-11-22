-- PostgreSQL (hosted)
CREATE TABLE IF NOT EXISTS records (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 3 AND 80),
  category TEXT NOT NULL CHECK (length(category) BETWEEN 2 AND 40),
  description TEXT NOT NULL CHECK (length(description) BETWEEN 5 AND 300),
  status TEXT NOT NULL CHECK (status IN ('Pending', 'In progress', 'Completed'))
);
