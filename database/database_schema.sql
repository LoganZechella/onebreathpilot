-- SQL for creating patients table

CREATE TABLE IF NOT EXISTS Patients (
    PatientID VARCHAR(255) PRIMARY KEY
);


-- SQL for creating samples table

CREATE TABLE IF NOT EXISTS Samples (
    SampleID SERIAL PRIMARY KEY,
    PatientID VARCHAR(255) REFERENCES Patients(PatientID),
    ChipID VARCHAR(255),
    CollectionLocation VARCHAR(255),
    Status VARCHAR(255),
    StatusTimestamps JSONB,
    EstimatedPickupTime TIMESTAMP
);


-- SQL for creating users table

CREATE TABLE IF NOT EXISTS Users (
    UserID SERIAL PRIMARY KEY,
    Username VARCHAR(255) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    Role VARCHAR(255) NOT NULL
);


-- SQL for creating shipping table

CREATE TABLE IF NOT EXISTS Shipping (
    ShippingID SERIAL PRIMARY KEY,
    SampleID INT REFERENCES Samples(SampleID),
    UPSTrackingNumber VARCHAR(255),
    ShippingLabel TEXT
);


