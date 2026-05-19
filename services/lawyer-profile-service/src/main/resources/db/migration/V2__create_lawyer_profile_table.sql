CREATE TABLE IF NOT EXISTS lawyers (

    id BIGSERIAL PRIMARY KEY,

    user_id UUID UNIQUE NOT NULL,

    bar_registration_number VARCHAR(255) UNIQUE NOT NULL,

    years_of_experience INTEGER NOT NULL,

    bio TEXT,

    consultation_fee DECIMAL(10,2) NOT NULL,

    location VARCHAR(255),

    is_available BOOLEAN NOT NULL DEFAULT TRUE,

    total_rating INTEGER DEFAULT 0,

    review_count INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );