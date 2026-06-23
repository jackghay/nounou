-- Seed default site settings if they don't already exist
INSERT INTO site_settings (id, whatsapp_number, whatsapp_message, hero_title, hero_subtitle, meta_title, meta_description)
VALUES (
  1, 
  '212600000000', 
  'السلام عليكم، أرغب في طلب تصميم مخصص ✨', 
  'معرض أعمالنا', 
  'كراسات ودفاتر وكتب تعليمية مخصصة بلمسة فنية راقية', 
  'معرض أعمالنا — كراسات وكتب تعليمية مخصصة', 
  'معرض صور لأعمالنا: كراسات، دفاتر يومية، كتب تعليمية، أنشطة التحضيري وأغلفة مخصصة بلمسة فنية راقية.'
)
ON CONFLICT (id) DO NOTHING;

-- Reset the SERIAL sequence to prevent errors on next manual inserts
SELECT setval(pg_get_serial_sequence('site_settings', 'id'), coalesce(max(id), 1)) FROM site_settings;
