
import { PhotoEntry } from "./interfaces"
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

async function GetTruePathOfPicture(photoid: string): Promise<string> {
    let query = await Globals.FotoDbClient.query(`SELECT format FROM photos WHERE photoid='${photoid}'`)
    let format = query.rows[0].format
    return `built/${photoid}.${format}`
}

async function RecordNewPicture( username: string, album_id: string | undefined, photoid: string, format: string ): Promise<void> {
    album_id ??= 'NULL'
    let query = await Globals.FotoDbClient.query(
        `
            INSERT INTO photos ( username, albumid, photoid, format ) VALUES ( '${username}', '${album_id}', '${photoid}', '${format}')
        `
    )
    return Promise.resolve()
}


async function GetAlbums(username: string): Promise<AlbumEntries> {
    let query = await Globals.FotoDbClient.query(
        `SELECT album_name, albumid FROM albums WHERE username='${username}' AND is_deleted = false`
    )
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

async function GetPhotosOfAlbum(username: string, albumid: string): Promise<PhotoEntry[]> {
    let query = await Globals.FotoDbClient.query(
        `SELECT photoid, format FROM photos WHERE username='${username}' AND albumid='${albumid}'`
    )
    return Promise.resolve(query.rows as PhotoEntry[])
}

async function GetAllPhotos(username: string) {
    let query = await Globals.FotoDbClient.query(
        `SELECT photoid, format FROM photos WHERE username='${username}'`
    )
    return Promise.resolve(query.rows)
}

async function CheckPhotoResourceOwnership(username: string, photoid: string): Promise<boolean> {
    let query = await Globals.FotoDbClient.query(
        `SELECT EXISTS (SELECT * FROM photos WHERE username='${username}' AND photoid='${photoid}')`
    )
    return Promise.resolve(query.rows[0]?.exists ?? false)
}

async function CheckAlbumOwnership(username: string, albumid: string): Promise<boolean> {
    let query = await Globals.FotoDbClient.query(
        `SELECT EXISTS (SELECT * FROM albums WHERE username='${username}' AND albumid='${albumid}')`
    )
    return Promise.resolve(query.rows[0]?.exists ?? false)
}

async function DeleteAlbum(username: string, albumid: string): Promise<void> {
   await Globals.FotoDbClient.query(
        `UPDATE albums SET is_deleted = true WHERE albumid = '${albumid}' AND username = '${username}'`
   ) 
   return Promise.resolve()
}

async function DeletePhotosFromAlbum(username: string, albumid: string): Promise<void> {
    await Globals.FotoDbClient.query(
        `DELETE FROM photos WHERE username = '${username}' AND albumid = '${albumid}'`
    )
    return Promise.resolve()
}

async function DeletePhoto(username: string, photoid: string): Promise<void> {
    await Globals.FotoDbClient.query(
        `DELETE FROM photos WHERE username='${username}' AND photoid='${photoid}'`
    )
    return Promise.resolve()
}

async function GetPhotoFilename(username: string, photoid: string): Promise<string> {
    let query = await Globals.FotoDbClient.query(
        `SELECT photoid, format FROM photos WHERE username='${username}' AND photoid='${photoid}'`
    )
    let photo_filename = `${query.rows[0].photoid}.${query.rows[0].format}`
    return Promise.resolve(photo_filename)
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
    GetPhotosOfAlbum,
    CheckPhotoResourceOwnership,
    GetAllPhotos,
    DeletePhoto,
    GetPhotoFilename,
    GetTruePathOfPicture,
    CheckAlbumOwnership,
    DeleteAlbum,
    DeletePhotosFromAlbum
}