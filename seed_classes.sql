-- SEED CLASSES (Nursery to Class 12 without sections)

INSERT INTO public.classes (class_name, section) VALUES
('Nursery', '-'),
('LKG', '-'),
('UKG', '-'),
('Class 1', '-'),
('Class 2', '-'),
('Class 3', '-'),
('Class 4', '-'),
('Class 5', '-'),
('Class 6', '-'),
('Class 7', '-'),
('Class 8', '-'),
('Class 9', '-'),
('Class 10', '-'),
('Class 11 (Science)', '-'),
('Class 11 (Commerce)', '-'),
('Class 11 (Arts)', '-'),
('Class 12 (Science)', '-'),
('Class 12 (Commerce)', '-'),
('Class 12 (Arts)', '-')
ON CONFLICT DO NOTHING;
