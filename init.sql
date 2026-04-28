-- ============================================================
-- AVENA DATABASE INITIALIZATION
-- Run this script in your PostgreSQL database
-- ============================================================

-- Drop tables if they exist (for clean install)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS event_registrations CASCADE;
DROP TABLE IF EXISTS event_images CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS service_reviews CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS product_reviews CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS subcategory_links CASCADE;
DROP TABLE IF EXISTS subcategory_groups CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS password_resets CASCADE;
DROP TABLE IF EXISTS email_verifications CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS universities CASCADE;

-- ============================================================
-- UNIVERSITIES
-- ============================================================
CREATE TABLE universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  domain VARCHAR(100) UNIQUE NOT NULL,
  short VARCHAR(20),
  location VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  student_id VARCHAR(50) NOT NULL,
  university_id UUID REFERENCES universities(id),
  program VARCHAR(100),
  year INTEGER DEFAULT 1,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  role VARCHAR(20) DEFAULT 'student',
  email_verified BOOLEAN DEFAULT false,
  two_factor_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SESSIONS (JWT blacklist / refresh tokens)
-- ============================================================
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PASSWORD RESETS
-- ============================================================
CREATE TABLE password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EMAIL VERIFICATIONS
-- ============================================================
CREATE TABLE email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CATEGORIES (Mega menu)
-- ============================================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(50) UNIQUE NOT NULL,
  label VARCHAR(100) NOT NULL,
  emoji VARCHAR(10),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SUBCATEGORY GROUPS
-- ============================================================
CREATE TABLE subcategory_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_key VARCHAR(50) REFERENCES categories(key),
  title VARCHAR(100) NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- ============================================================
-- SUBCATEGORY LINKS
-- ============================================================
CREATE TABLE subcategory_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES subcategory_groups(id) ON DELETE CASCADE,
  label VARCHAR(100) NOT NULL,
  href VARCHAR(255) DEFAULT '#',
  image_url TEXT,
  sort_order INTEGER DEFAULT 0
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(100),
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'GHS',
  moq INTEGER DEFAULT 1,
  stock INTEGER DEFAULT 1,
  condition VARCHAR(20) DEFAULT 'new',
  seller_id UUID REFERENCES users(id),
  rating DECIMAL(3,2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  cover_image TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRODUCT IMAGES
-- ============================================================
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- ============================================================
-- PRODUCT REVIEWS
-- ============================================================
CREATE TABLE product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SERVICES
-- ============================================================
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(100),
  provider_id UUID REFERENCES users(id),
  price DECIMAL(10,2) NOT NULL,
  price_type VARCHAR(20) DEFAULT 'fixed',
  currency VARCHAR(10) DEFAULT 'GHS',
  delivery_days INTEGER,
  rating DECIMAL(3,2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  cover_image TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SERVICE IMAGES
-- ============================================================
CREATE TABLE service_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- ============================================================
-- SERVICE REVIEWS
-- ============================================================
CREATE TABLE service_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EVENTS
-- ============================================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  organizer_id UUID REFERENCES users(id),
  date DATE NOT NULL,
  time TIME,
  end_time TIME,
  location VARCHAR(300),
  is_paid BOOLEAN DEFAULT false,
  price DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'GHS',
  capacity INTEGER,
  registered_count INTEGER DEFAULT 0,
  cover_image TEXT,
  tags TEXT[],
  status VARCHAR(20) DEFAULT 'upcoming',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EVENT IMAGES
-- ============================================================
CREATE TABLE event_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- ============================================================
-- EVENT REGISTRATIONS
-- ============================================================
CREATE TABLE event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- ============================================================
-- MESSAGES (Chat)
-- ============================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID,
  sender_id UUID REFERENCES users(id),
  receiver_id UUID REFERENCES users(id),
  subject VARCHAR(200),
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  context_type VARCHAR(20),
  context_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_student_id ON users(student_id);
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_services_provider_id ON services(provider_id);
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at);

-- ============================================================
-- INSERT MOCK DATA (Universities)
-- ============================================================
INSERT INTO universities (name, domain, short, location) VALUES
('Ashesi University', 'acity.edu.gh', 'ACity', 'Berekuso, Eastern Region'),
('University of Ghana', 'ug.edu.gh', 'UG', 'Legon, Accra'),
('KNUST', 'knust.edu.gh', 'KNUST', 'Kumasi, Ashanti Region'),
('Central University', 'central.edu.gh', 'CU', 'Accra'),
('Accra Technical University', 'atu.edu.gh', 'ATU', 'Accra'),
('Ghana Communication Technology University', 'gctu.edu.gh', 'GCTU', 'Accra'),
('University of Professional Studies', 'upsa.edu.gh', 'UPSA', 'Accra'),
('Methodist University Ghana', 'methodistugha.edu.gh', 'MUG', 'Accra');

-- ============================================================
-- INSERT MOCK DATA (Categories - Mega Menu)
-- ============================================================
INSERT INTO categories (key, label, emoji, sort_order) VALUES
('school', 'School Features', '🎓', 1),
('electronics', 'Electronics', '💻', 2),
('furniture', 'Furniture', '🪑', 3),
('food', 'Food & Collation', '🍱', 4),
('dress', 'Dress', '👗', 5),
('sport', 'Sport Equipment', '⚽', 6),
('beauty', 'Beauty', '💄', 7);

-- School subcategories
INSERT INTO subcategory_groups (category_key, title, sort_order) VALUES
('school', 'Fournitures', 1),
('school', 'Sacs & Transport', 2),
('school', 'Livres & Docs', 3),
('school', 'Impression', 4);

-- Electronics subcategories
INSERT INTO subcategory_groups (category_key, title, sort_order) VALUES
('electronics', 'Ordinateurs', 1),
('electronics', 'Audio', 2),
('electronics', 'Téléphones', 3),
('electronics', 'Câbles & Adaptateurs', 4);

-- Furniture subcategories
INSERT INTO subcategory_groups (category_key, title, sort_order) VALUES
('furniture', 'Bureau', 1),
('furniture', 'Chambre', 2),
('furniture', 'Rangement', 3),
('furniture', 'Déco', 4);

-- Food subcategories
INSERT INTO subcategory_groups (category_key, title, sort_order) VALUES
('food', 'Snacks', 1),
('food', 'Boissons', 2),
('food', 'Repas rapides', 3),
('food', 'Cuisine dorm', 4);

-- Dress subcategories
INSERT INTO subcategory_groups (category_key, title, sort_order) VALUES
('dress', 'Femmes', 1),
('dress', 'Hommes', 2),
('dress', 'Chaussures', 3),
('dress', 'Accessoires', 4);

-- Sport subcategories
INSERT INTO subcategory_groups (category_key, title, sort_order) VALUES
('sport', 'Sports collectifs', 1),
('sport', 'Fitness', 2),
('sport', 'Running', 3),
('sport', 'Natation', 4);

-- Beauty subcategories
INSERT INTO subcategory_groups (category_key, title, sort_order) VALUES
('beauty', 'Soin du visage', 1),
('beauty', 'Maquillage', 2),
('beauty', 'Cheveux', 3),
('beauty', 'Corps & Parfums', 4);

-- ============================================================
-- INSERT LINKS (example for School)
-- ============================================================
WITH group_ids AS (
  SELECT id, title FROM subcategory_groups
)
INSERT INTO subcategory_links (group_id, label, href, sort_order)
SELECT id, 'Cahiers & Classeurs', '#', 1 FROM subcategory_groups WHERE title = 'Fournitures'
UNION ALL
SELECT id, 'Stylos & Crayons', '#', 2 FROM subcategory_groups WHERE title = 'Fournitures'
UNION ALL
SELECT id, 'Calculatrices', '#', 3 FROM subcategory_groups WHERE title = 'Fournitures';

-- ============================================================
-- CREATE A DEFAULT ADMIN USER (password: admin123)
-- Password will be hashed by the application
-- ============================================================
-- INSERT INTO users (first_name, last_name, email, student_id, university_id, password_hash, role, email_verified)
-- VALUES ('Admin', 'Avena', 'admin@avenagh.com', 'ADMIN001', (SELECT id FROM universities LIMIT 1), '$2a$10$...', 'admin', true);

COMMIT;