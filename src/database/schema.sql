CREATE DATABASE IF NOT EXISTS news_tracker;
USE news_tracker;

CREATE TABLE IF NOT EXISTS feed_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  link VARCHAR(512) NOT NULL,
  pub_date DATETIME NOT NULL,
  source_name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  guid VARCHAR(512),
  is_notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notified_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_guid ON feed_items(guid);
CREATE INDEX IF NOT EXISTS idx_link ON feed_items(link);
CREATE INDEX IF NOT EXISTS idx_is_notified ON feed_items(is_notified);
