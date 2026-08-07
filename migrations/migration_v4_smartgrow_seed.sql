-- SmartGrow Products Seed Migration
INSERT INTO smartgrow_products (name, provider, category, expected_return_min, expected_return_max, risk_level, lock_period_months, min_investment, is_active)
VALUES 
  ('CIC Money Market Fund', 'CIC Group', 'Money Market', 11.5, 13.0, 'Low Risk', 1, 1000, true),
  ('Cytonn High Yield Fund', 'Cytonn Investments', 'High Yield', 14.0, 16.5, 'Medium Risk', 3, 5000, true),
  ('ICEA LION Bond Fund', 'ICEA LION', 'Bonds', 12.0, 14.2, 'Low-Medium Risk', 6, 10000, true),
  ('NSE 20 Index Fund', 'Genghis Capital', 'Equity', 15.0, 22.0, 'High Risk', 12, 2000, true)
ON CONFLICT DO NOTHING;
