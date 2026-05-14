CREATE DATABASE keycloak;
CREATE DATABASE user_service_db;
CREATE DATABASE lawyerdb;
CREATE DATABASE appointmentdb;
CREATE DATABASE messaging_db;
CREATE DATABASE ai_analysis_db;

\connect ai_analysis_db
CREATE EXTENSION IF NOT EXISTS vector;
