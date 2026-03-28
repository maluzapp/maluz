INSERT INTO public.branding_settings (key, value, category) VALUES
  ('logo_height_landing_hero', '96', 'sizes'),
  ('logo_height_landing_footer', '64', 'sizes'),
  ('logo_height_login', '256', 'sizes'),
  ('logo_height_nav', '32', 'sizes'),
  ('logo_height_index', '64', 'sizes'),
  ('symbol_height_landing_hero', '96', 'sizes'),
  ('symbol_height_index', '64', 'sizes'),
  ('symbol_height_login', '128', 'sizes')
ON CONFLICT DO NOTHING;