

CREATE TABLE IF NOT EXISTS accounts (
    username varchar(255) NOT NULL,
    password varchar(255) NOT NULL,
    PRIMARY KEY (username)
);


CREATE TABLE IF NOT EXISTS sessions (
    username varchar(255) NOT NULL,
    sessionid varchar(255) NOT NULL,
    PRIMARY KEY (sessionid)
);


CREATE TABLE IF NOT EXISTS photos (
    username varchar(255) NOT NULL,
    albumid varchar(255) NULL,
    photoid varchar(255) NOT NULL,
    format varchar(255) NOT NULL,
    PRIMARY KEY (photoid)
);


CREATE TABLE IF NOT EXISTS albums (
    username varchar(255) NOT NULL,
    albumid varchar(255) NOT NULL,
    album_name varchar(255) NOT NULL,
    PRIMARY KEY (albumid)
);