

CREATE TABLE IF NOT EXISTS accounts (
    username varchar(10) NOT NULL,
    password varchar(30) NOT NULL,
    PRIMARY KEY (username),
    CONSTRAINT valid_username_length 
        CHECK(LENGTH(username) >= 4),
    CONSTRAINT valid_password_length 
        CHECK(LENGTH(password) >= 4)
);


CREATE TABLE IF NOT EXISTS sessions (
    username varchar(10) NOT NULL REFERENCES accounts(username),
    sessionid varchar(255) NOT NULL,
    PRIMARY KEY (sessionid)
);


CREATE TABLE IF NOT EXISTS photos (
    username varchar(10) NOT NULL REFERENCES accounts(username),
    albumid varchar(255) NULL,
    photoid varchar(255) NOT NULL,
    format varchar(255) NOT NULL,
    PRIMARY KEY (photoid)
);


CREATE TABLE IF NOT EXISTS albums (
    username varchar(10) NOT NULL REFERENCES accounts(username),
    albumid varchar(255) NOT NULL,
    album_name varchar(255) NOT NULL,
    PRIMARY KEY (albumid)
);