
INSERT INTO accounts VALUES 
    ( 'dummy', 'dummypassword' ),
    ( 'dummy2', 'dummypassword2' );

INSERT INTO sessions (username, sessionid) VALUES 
    ('dummy', 'dummy_sessionid'),
    ('dummy2', 'dummy_sessionid2');

INSERT INTO albums (
    username,
    albumid,
    album_name
) VALUES (
    'dummy',
    'albumid-001-001',
    'My Album'
);

INSERT INTO photos (
    username, photoid, format
) VALUES ( 'dummy', 'photoid-001-001', 'jpeg' );
