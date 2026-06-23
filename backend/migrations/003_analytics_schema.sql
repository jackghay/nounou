CREATE TABLE IF NOT EXISTS visitor_analytics (
  id SERIAL PRIMARY KEY,
  referrer_source VARCHAR(100) NOT NULL,
  visit_date DATE DEFAULT CURRENT_DATE NOT NULL,
  click_count INTEGER DEFAULT 1,
  UNIQUE(referrer_source, visit_date)
);
