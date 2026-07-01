CREATE DATABASE keycloak;
CREATE DATABASE user_service_db;
CREATE DATABASE lawyerdb;
CREATE DATABASE appointmentdb;
CREATE DATABASE messaging_db;
CREATE DATABASE ai_analysis_db;
CREATE DATABASE video_session_db;
CREATE DATABASE review_db;
CREATE DATABASE document_db;

\connect ai_analysis_db
CREATE EXTENSION IF NOT EXISTS vector;
