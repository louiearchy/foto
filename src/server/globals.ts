
import pg from 'pg'
import { HttpStatusCode } from './universal'

const FOTODB_CONNECTION_CONFIG = {
    host: '127.0.0.1',
    port: 5432,
    database: 'fotodb'
}
const FotoDbClient = new pg.Client(FOTODB_CONNECTION_CONFIG)

const StorageLocation = {
    ForPhotos: 'built/data/photos',
    ForThumbnails: 'built/data/thumbnails'
}

export default {
    FotoDbClient,
    HttpStatusCode,
    StorageLocation,
}