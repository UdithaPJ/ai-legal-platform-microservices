CREATE TABLE IF NOT EXISTS lawyer_specializations (

    lawyer_id BIGINT NOT NULL,

    specialization VARCHAR(100) NOT NULL,

    PRIMARY KEY (lawyer_id, specialization),

    CONSTRAINT fk_lawyer_specializations
    FOREIGN KEY (lawyer_id)
    REFERENCES lawyers(id)
    ON DELETE CASCADE
);