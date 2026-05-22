-- Phase 2: baseline seed for categories and site settings
PRAGMA foreign_keys = ON;

INSERT OR REPLACE INTO categories (
  id,
  slug,
  label_ar,
  sort_order,
  is_active,
  created_at,
  updated_at
) VALUES
  ('notebooks', 'notebooks', 'كراسات', 10, 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('planners', 'planners', 'دفاتر يومية', 20, 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('books', 'books', 'كتب تعليمية', 30, 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('preschool', 'preschool', 'أنشطة التحضيري', 40, 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('covers', 'covers', 'أغلفة مخصصة', 50, 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');

INSERT OR REPLACE INTO site_settings (
  id,
  whatsapp_number,
  whatsapp_message,
  hero_title,
  hero_subtitle,
  meta_title,
  meta_description,
  created_at,
  updated_at
) VALUES (
  'default',
  '212600000000',
  'السلام عليكم، أرغب في طلب تصميم مخصص ✨',
  'معرض أعمالنا',
  'كراسات ودفاتر وكتب تعليمية مخصصة بلمسة فنية راقية',
  'معرض أعمالنا — كراسات وكتب تعليمية مخصصة',
  'معرض صور لأعمالنا: كراسات، دفاتر يومية، كتب تعليمية، أنشطة التحضيري وأغلفة مخصصة بلمسة فنية راقية.',
  '2026-01-01T00:00:00.000Z',
  '2026-01-01T00:00:00.000Z'
);
