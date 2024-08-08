
import DynamicReactPageManager from './dynamic-react-page-manager'
import pg from 'pg'

/**
 * The path to the file where the Dynamic React Page Manager would store
 * all of its information
*/
const DRPM_WATCHFILE_PATH = 'built/drpm-watch-file.json'


/**
 * This is used to compile react scripts while the server is running
*/
const DynamicReactPageManagerInstance = new DynamicReactPageManager(DRPM_WATCHFILE_PATH, 'built/web/pages/')

const HttpStatusCode = {
    
    // Informational response
    Continue: 100,

    // Successful Response
    Ok: 200,

    // Client Error Responses
    BadRequest: 400,
    Unauthorized: 401,
    NotFound: 404,
    RequestTimeout: 408,
    Conflict: 409,

    // Server Error Responses
    InternalServerError: 500,

}

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
    DynamicReactPageManagerInstance,
    FotoDbClient,
    HttpStatusCode,
    StorageLocation,
}