-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table to extend auth.users
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    interests JSONB,
    avatar TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    log_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create startups table
CREATE TABLE startups (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    startup_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_users table
CREATE TABLE admin_users (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create reviews table
CREATE TABLE reviews (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id TEXT UNIQUE NOT NULL,
    startup_id UUID NOT NULL,
    user_id UUID NOT NULL,
    description TEXT,
    images JSONB,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (startup_id) REFERENCES startups(uuid) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create waste_request table
CREATE TABLE waste_request (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    waste_id TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    location TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_on TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create logs table
CREATE TABLE logs (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    log_id TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    log TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create events table
CREATE TABLE events (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id TEXT UNIQUE NOT NULL,
    admin_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (admin_id) REFERENCES admin_users(uuid) ON DELETE CASCADE
);

-- Create user_event junction table (many-to-many relationship)
CREATE TABLE user_event (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    event_id UUID NOT NULL,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(uuid) ON DELETE CASCADE,
    UNIQUE(user_id, event_id)
);

-- Add foreign key constraint for user_profiles.log_id (self-referencing to logs table)
ALTER TABLE user_profiles 
ADD CONSTRAINT fk_user_profiles_log_id 
FOREIGN KEY (log_id) REFERENCES logs(uuid) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_is_admin ON user_profiles(is_admin);
CREATE INDEX idx_startups_startup_id ON startups(startup_id);
CREATE INDEX idx_admin_users_admin_id ON admin_users(admin_id);
CREATE INDEX idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX idx_reviews_startup_id ON reviews(startup_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_waste_request_user_id ON waste_request(user_id);
CREATE INDEX idx_waste_request_is_completed ON waste_request(is_completed);
CREATE INDEX idx_logs_user_id ON logs(user_id);
CREATE INDEX idx_logs_log_id ON logs(log_id);
CREATE INDEX idx_events_admin_id ON events(admin_id);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_user_event_user_id ON user_event(user_id);
CREATE INDEX idx_user_event_event_id ON user_event(event_id);

-- Enable Row Level Security (RLS) - Supabase best practice
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_request ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_event ENABLE ROW LEVEL SECURITY;

-- =============================================
-- TRIGGER FUNCTIONS
-- =============================================

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to create user profile when auth.users record is created
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, user_id, name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'user_id', 'user_' || substr(NEW.id::text, 1, 8)),
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, 'Unknown User')
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to generate unique IDs for various tables
CREATE OR REPLACE FUNCTION generate_startup_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.startup_id IS NULL OR NEW.startup_id = '' THEN
        NEW.startup_id := 'startup_' || substr(NEW.uuid::text, 1, 8);
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION generate_review_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.review_id IS NULL OR NEW.review_id = '' THEN
        NEW.review_id := 'review_' || substr(NEW.uuid::text, 1, 8);
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION generate_waste_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.waste_id IS NULL OR NEW.waste_id = '' THEN
        NEW.waste_id := 'waste_' || substr(NEW.uuid::text, 1, 8);
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION generate_log_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.log_id IS NULL OR NEW.log_id = '' THEN
        NEW.log_id := 'log_' || substr(NEW.uuid::text, 1, 8);
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION generate_event_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.event_id IS NULL OR NEW.event_id = '' THEN
        NEW.event_id := 'event_' || substr(NEW.uuid::text, 1, 8);
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION generate_admin_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.admin_id IS NULL OR NEW.admin_id = '' THEN
        NEW.admin_id := 'admin_' || substr(NEW.uuid::text, 1, 8);
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to auto-complete waste requests after 30 days
CREATE OR REPLACE FUNCTION check_waste_request_expiry()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_completed = FALSE AND NEW.requested_at < NOW() - INTERVAL '30 days' THEN
        NEW.is_completed := TRUE;
        NEW.completed_on := NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to validate event dates
CREATE OR REPLACE FUNCTION validate_event_dates()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.start_time >= NEW.end_time THEN
        RAISE EXCEPTION 'Event start time must be before end time';
    END IF;
    
    IF NEW.expires_at IS NOT NULL AND NEW.expires_at < NOW() THEN
        RAISE EXCEPTION 'Event expiry date cannot be in the past';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to create activity log entries
CREATE OR REPLACE FUNCTION create_activity_log()
RETURNS TRIGGER AS $$
DECLARE
    log_title TEXT;
    log_content TEXT;
BEGIN
    -- Determine log content based on table and operation
    CASE TG_TABLE_NAME
        WHEN 'reviews' THEN
            log_title := 'Review Activity';
            IF TG_OP = 'INSERT' THEN
                log_content := 'Created new review for startup: ' || NEW.startup_id;
            ELSIF TG_OP = 'UPDATE' THEN
                log_content := 'Updated review: ' || NEW.review_id;
            END IF;
        WHEN 'waste_request' THEN
            log_title := 'Waste Request Activity';
            IF TG_OP = 'INSERT' THEN
                log_content := 'Created new waste request at: ' || COALESCE(NEW.location, 'Unknown location');
            ELSIF TG_OP = 'UPDATE' AND NEW.is_completed AND NOT OLD.is_completed THEN
                log_content := 'Completed waste request: ' || NEW.waste_id;
            END IF;
        WHEN 'user_event' THEN
            log_title := 'Event Registration';
            IF TG_OP = 'INSERT' THEN
                log_content := 'Registered for event: ' || (SELECT title FROM events WHERE uuid = NEW.event_id);
            END IF;
        ELSE
            RETURN COALESCE(NEW, OLD);
    END CASE;
    
    -- Insert log entry if we have content
    IF log_content IS NOT NULL THEN
        INSERT INTO logs (user_id, title, log)
        VALUES (
            CASE TG_TABLE_NAME
                WHEN 'user_event' THEN NEW.user_id
                ELSE NEW.user_id
            END,
            log_title,
            log_content
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- =============================================
-- CREATE TRIGGERS
-- =============================================

-- Updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_startups_updated_at BEFORE UPDATE ON startups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_waste_request_updated_at BEFORE UPDATE ON waste_request FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_logs_updated_at BEFORE UPDATE ON logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_event_updated_at BEFORE UPDATE ON user_event FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate ID triggers
CREATE TRIGGER generate_startup_id_trigger BEFORE INSERT ON startups FOR EACH ROW EXECUTE FUNCTION generate_startup_id();
CREATE TRIGGER generate_review_id_trigger BEFORE INSERT ON reviews FOR EACH ROW EXECUTE FUNCTION generate_review_id();
CREATE TRIGGER generate_waste_id_trigger BEFORE INSERT ON waste_request FOR EACH ROW EXECUTE FUNCTION generate_waste_id();
CREATE TRIGGER generate_log_id_trigger BEFORE INSERT ON logs FOR EACH ROW EXECUTE FUNCTION generate_log_id();
CREATE TRIGGER generate_event_id_trigger BEFORE INSERT ON events FOR EACH ROW EXECUTE FUNCTION generate_event_id();
CREATE TRIGGER generate_admin_id_trigger BEFORE INSERT ON admin_users FOR EACH ROW EXECUTE FUNCTION generate_admin_id();

-- User profile creation trigger on auth.users
CREATE TRIGGER create_user_profile_trigger 
AFTER INSERT ON auth.users 
FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Validation triggers
CREATE TRIGGER validate_event_dates_trigger BEFORE INSERT OR UPDATE ON events FOR EACH ROW EXECUTE FUNCTION validate_event_dates();
CREATE TRIGGER check_waste_request_expiry_trigger BEFORE UPDATE ON waste_request FOR EACH ROW EXECUTE FUNCTION check_waste_request_expiry();

-- Activity logging triggers
CREATE TRIGGER log_review_activity AFTER INSERT OR UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION create_activity_log();
CREATE TRIGGER log_waste_request_activity AFTER INSERT OR UPDATE ON waste_request FOR EACH ROW EXECUTE FUNCTION create_activity_log();
CREATE TRIGGER log_event_registration AFTER INSERT ON user_event FOR EACH ROW EXECUTE FUNCTION create_activity_log();

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON user_profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Startups policies (public read)
CREATE POLICY "Anyone can view startups" ON startups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage startups" ON startups FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Admin users policies
CREATE POLICY "Admins can view admin users" ON admin_users FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Super admins can manage admin users" ON admin_users FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users au JOIN user_profiles up ON au.user_id = up.id 
            WHERE up.id = auth.uid() AND au.role = 'super_admin')
);

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON reviews FOR DELETE USING (auth.uid() = user_id);

-- Waste request policies
CREATE POLICY "Users can view own waste requests" ON waste_request FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create waste requests" ON waste_request FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own waste requests" ON waste_request FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all waste requests" ON waste_request FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admins can update waste requests" ON waste_request FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Logs policies
CREATE POLICY "Users can view own logs" ON logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create logs" ON logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all logs" ON logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Events policies
CREATE POLICY "Anyone can view events" ON events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage events" ON events FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

-- User event policies
CREATE POLICY "Users can view own event registrations" ON user_event FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can register for events" ON user_event FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unregister from events" ON user_event FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all registrations" ON user_event FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
);

-- =============================================
-- USEFUL VIEWS
-- =============================================

-- Create a view for complete user information
CREATE OR REPLACE VIEW complete_users AS
SELECT 
    au.id,
    au.email,
    au.created_at as auth_created_at,
    up.user_id,
    up.name,
    up.interests,
    up.avatar,
    up.is_admin,
    up.created_at as profile_created_at,
    up.updated_at as profile_updated_at
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id;

-- Create a view for startup reviews with user info
CREATE OR REPLACE VIEW startup_reviews AS
SELECT 
    r.uuid,
    r.review_id,
    r.description,
    r.images,
    r.rating,
    r.created_at,
    s.name as startup_name,
    s.startup_id,
    up.name as reviewer_name,
    up.user_id as reviewer_user_id
FROM reviews r
JOIN startups s ON r.startup_id = s.uuid
JOIN user_profiles up ON r.user_id = up.id;

-- Create a view for event registrations
CREATE OR REPLACE VIEW event_registrations AS
SELECT 
    e.uuid as event_uuid,
    e.event_id,
    e.title,
    e.description,
    e.location,
    e.start_time,
    e.end_time,
    COUNT(ue.user_id) as registration_count,
    array_agg(up.name) as registered_users
FROM events e
LEFT JOIN user_event ue ON e.uuid = ue.event_id
LEFT JOIN user_profiles up ON ue.user_id = up.id
GROUP BY e.uuid, e.event_id, e.title, e.description, e.location, e.start_time, e.end_time;

-- Grant necessary permissions for views
GRANT SELECT ON complete_users TO authenticated;
GRANT SELECT ON startup_reviews TO authenticated;
GRANT SELECT ON event_registrations TO authenticated;