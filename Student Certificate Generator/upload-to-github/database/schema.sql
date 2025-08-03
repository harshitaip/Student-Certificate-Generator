-- Create database
CREATE DATABASE IF NOT EXISTS certificate_generator;
USE certificate_generator;

-- Users table for admin authentication
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'ADMIN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Certificates table
CREATE TABLE IF NOT EXISTS certificates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_name VARCHAR(100) NOT NULL,
    roll_number VARCHAR(50) NOT NULL,
    course_name VARCHAR(200) NOT NULL,
    completion_date DATE NOT NULL,
    certificate_type VARCHAR(50) NOT NULL,
    pdf_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_student_name (student_name),
    INDEX idx_roll_number (roll_number),
    INDEX idx_created_at (created_at)
);

-- Activity logs table for comprehensive audit trail
CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    entity_type VARCHAR(100),
    entity_id BIGINT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_action (action),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_action_timestamp (action, timestamp)
);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, password, role) VALUES 
('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'ADMIN')
ON DUPLICATE KEY UPDATE username = username;
