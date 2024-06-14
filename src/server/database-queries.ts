
import Globals from "./globals"


// INTERFACES


interface AlbumEntry {
    album_name: string,
    albumid: string
}

// TYPES

type AlbumEntries = AlbumEntry[]



async function QueryAccountInfo(username: string, password: string): Promise<boolean> {
    let query = await Globals.FotoDbClient.query(
        `SELECT EXISTS( SELECT username, password from accounts WHERE username='${username}' AND password='${password}')`
    )
    return Promise.resolve(query.rows[0]?.exists ?? false)
}


async function CheckUsernameIfAlreadyRegistered(username: string): Promise<boolean> {
    let query = await Globals.FotoDbClient.query(
        `SELECT EXISTS( SELECT username FROM accounts WHERE username='${username}')`
    )
    return Promise.resolve(query.rows[0]?.exists ?? true)
}


async function GetUsernameBySessionID(sessionid: string): Promise<string | undefined> {
    let query = await Globals.FotoDbClient.query(
        `SELECT username FROM sessions WHERE sessionid='${sessionid}'`
    )
    return Promise.resolve(query.rows[0]?.username ?? undefined)
}


async function RecordNewAlbum(username: string, albumid: string, album_name: string): Promise<void> {
    await Globals.FotoDbClient.query(
        `INSERT INTO albums (username, albumid, album_name) VALUES ('${username}', '${albumid}', '${album_name}')`
    )
    return Promise.resolve()
}


async function RecordAccount(username: string, password: string) {
    await Globals.FotoDbClient.query(
        `INSERT INTO accounts (username, password) VALUES ('${username}', '${password}')`
    )
}


async function SaveSession(username: string, sessionid: string): Promise<void> {
    await Globals.FotoDbClient.query(`INSERT INTO sessions (username, sessionid) VALUES ('${username}', '${sessionid}')`)
}


async function IsAlbumIdValid(albumid: string): Promise<boolean> {
    let query = await Globals.FotoDbClient.query(`SELECT EXISTS (SELECT albumid FROM albums WHERE albumid='${albumid}')`)
    return query.rows[0]?.exists ?? false
}


async function RecordNewPicture(username: string, albumid: string | undefined, pictureid: string ): Promise<void> {
    albumid = (albumid) ? (`'${albumid}'`) : 'NULL'
    let query = await Globals.FotoDbClient.query(
        `
            INSERT INTO pictures (username, albumid, pictureid) VALUES ('${username}', ${albumid}, '${pictureid}')
        `
    )
    return Promise.resolve()
}


async function GetAlbums(username: string): Promise<AlbumEntries> {
    let query = await Globals.FotoDbClient.query(`SELECT album_name, albumid FROM albums WHERE username='${username}'`)
    return (query.rows as AlbumEntries)
}


async function GetAlbumNameByItsAlbumID(albumid: string): Promise<string> {
    let query = await Globals.FotoDbClient.query(`SELECT album_name FROM albums WHERE albumid='${albumid}'`)
    return (query.rows[0]?.album_name)
}


async function IsSessionIdValid(sessionid: string): Promise<boolean> {
    let query = await Globals.FotoDbClient.query(
        `SELECT EXISTS (SELECT sessionid FROM sessions WHERE sessionid='${sessionid}')`
    )
    return Promise.resolve(query.rows[0]?.exists ?? false)
}


export default {
    QueryAccountInfo,
    CheckUsernameIfAlreadyRegistered,
    GetUsernameBySessionID,
    RecordNewAlbum,
    RecordAccount,
    SaveSession,
    IsAlbumIdValid,
    RecordNewPicture,
    GetAlbums,
    GetAlbumNameByItsAlbumID,
    IsSessionIdValid,
}