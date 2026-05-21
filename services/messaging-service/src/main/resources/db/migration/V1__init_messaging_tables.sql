-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY,

        client_id VARCHAR(255) NOT NULL,
        lawyer_id VARCHAR(255) NOT NULL,

        appointment_id BIGINT NULL,
        document_id UUID NULL,

        enabled BOOLEAN NOT NULL DEFAULT TRUE,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- Prevent duplicate conversations per appointment
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_conversation
    ON conversations (client_id, lawyer_id, appointment_id);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY,

    conversation_id UUID NOT NULL,
    sender_id VARCHAR(255) NOT NULL,

    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'TEXT',

    is_read BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_conversation
    FOREIGN KEY (conversation_id)
    REFERENCES conversations(id)
    ON DELETE CASCADE
    );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation
    ON messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender
    ON messages(sender_id);