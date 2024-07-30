
import { Buffer } from 'node:buffer'
import Fastify from 'fastify'
import fs from 'node:fs'
import fsPromise from 'node:fs/promises'
import net from 'node:net'

import DatabaseQueries from './database-queries'
import Globals from './globals'
import { ExtendedFastifyRequest, ImageUploadingHandlingReport } from './interfaces'
import { ImageUploadingHandlingReportStatus } from './enums'
import JSONifyCookies from './utility/jsonify-cookies'
import UtilsFile from './utility/file'
import UtilsID from './utility/id'

import AlbumNameRouteHandler from './route-handlers/album-name'
import AssetsRouteHandler from './route-handlers/assets'
import CreateAlbumRouteHandler from './route-handlers/create-album'
import DeletePhotoRouteHandler from './route-handlers/delete-photo'
import GetAlbumsListRouteHandler from './route-handlers/albums-list'
import HomepageRouteHandler from './route-handlers/homepage'
import LogInRouteHandler from './route-handlers/log-in'
import MainPageRouteHandler from './route-handlers/mainpage'
import PhotosRouteHandler from './route-handlers/photos'
import PhotoRouteHandler from './route-handlers/photo'
import PostPictureRouteHandler from './route-handlers/post-picture'
import ReactPageScriptHandler from './route-handlers/react-page-scripts'
import SignUpRouteHandler from './route-handlers/sign-up'
import SpecificAlbumPageRouteHandler from './route-handlers/specific-album-page'
import ThumbnailRouteHandler from './route-handlers/thumbnail'


const SERVER_HOST = 'localhost'
const SERVER_PORT = 3000
const SERVER_CONFIG = { host: SERVER_HOST, port: SERVER_PORT }

const SERVER = Fastify()
SERVER.register(require('@fastify/formbody'))

SERVER.addHook('onRequest', (request: ExtendedFastifyRequest, reply, done) => {

    let cookies: any = {}

    if (request.headers?.cookie)
        cookies = JSONifyCookies(request.headers?.cookie)

    /// We are adding a cookies property to every request object as
    /// Fastify do not support in-built parsing of cookies into much more
    /// programming-friendly format
    Object.defineProperty(request, 'cookies', {
        value: cookies,
        enumerable: true,
        writable: false
    })

    /// We are adding a IsNotOnSession function to every request object
    /// for simplicity of checking if the client doesn't have a valid session id
    Object.defineProperty(request, 'IsNotOnSession', {
        value: async function(): Promise<boolean> {

            let with_sessionid_cookie = cookies?.sessionid
            if (!with_sessionid_cookie)
                return Promise.resolve(true)

            let is_sessionid_valid = await DatabaseQueries.IsSessionIdValid(cookies.sessionid)
            if (!is_sessionid_valid)
                return Promise.resolve(true)

            return Promise.resolve(false)
        }
    })

    /// We are adding a IsNotOnSession function to every request object
    /// for simplicity of checking if the client have a valid session id
    Object.defineProperty(request, 'IsOnSession', {
        value: async () => !(await request.IsNotOnSession())
    })

    done()
})

/**
 * A helper function that takes care of the mechanisms in binding a request.path to
 * a specific file
 */
function LinkPathToFile(request_path: string, filepath: string, server) {
    server.get(request_path, async (_, reply) => {
        let file_exists = await UtilsFile.IsFileExisting(filepath)
        if (file_exists) {
            let fileData = await fsPromise.readFile(filepath)
            let file_mime_type = UtilsFile.DeduceMimeTypeByFileExtension(filepath)
            if (file_mime_type) {
                reply.type(file_mime_type)
            }
            reply.code(Globals.HttpStatusCode.Ok).send(fileData)
        }
        else /* if the file does not exist */ {
            reply.code(Globals.HttpStatusCode.NotFound)
        }
    })
}

function ReplaceFileExtension(filepath: string, to_file_extension: string): string {
    let splitted_filepath_by_dot = filepath.split(".")
    let returning_replaced_file_extension_filepath = ""
    for (let i = 0; i < splitted_filepath_by_dot.length; i++) {
        let is_at_the_end = (i == (splitted_filepath_by_dot.length - 1))
        if (is_at_the_end) {
            returning_replaced_file_extension_filepath += to_file_extension
        } else {
            returning_replaced_file_extension_filepath += splitted_filepath_by_dot[i]
        }
    }
    return returning_replaced_file_extension_filepath
}

function DownResolutePhoto(path_to_photo: string): Promise<string> {
    return new Promise( (resolve, reject) => {
        let path_to_output_photo = path_to_photo.replace("built/", "built/images/thumbnails/")
        path_to_output_photo = ReplaceFileExtension(path_to_output_photo, ".webp")

        const client = net.createConnection({ port: 3001, host: 'localhost' }, () => {
            client.write(`DOWN-RESOLUTE ${path_to_photo} ${path_to_output_photo}`)
        })
        client.on('data', function(data) {
            let message = data.toString('utf-8')
            client.end()
            resolve(message)
        })
        client.on('end', () => resolve(''))
    })
}

// For file upload, closely related to /to/album/:id? POST request handler
SERVER.addContentTypeParser(['image/jpeg', 'image/png', 'image/webp'], function (request: ExtendedFastifyRequest, payload, done) {
    if (/\/to\/album\//.test(request.url)) {
        
        let body: ImageUploadingHandlingReport = {}

        if (!(request.cookies?.sessionid)) {
            body.status = ImageUploadingHandlingReportStatus.MissingAuthorization
            done(null, body)
            return
        }

        let unique_photo_id = UtilsID.GeneratePhotoSessionToken()
        let photo_format = UtilsFile.DeduceFileExtensionByContentType(request.headers?.["content-type"] ?? "")
        let filepath = `built/${unique_photo_id}.${photo_format}`
        let file_write_stream = fs.createWriteStream(filepath)
        
        payload.on('data', function (chunk: Buffer) {
            file_write_stream.write(chunk)
        })

        payload.on('end', async function () {
            file_write_stream.close()
            body.status = ImageUploadingHandlingReportStatus.Successful 
            body.photo_id = unique_photo_id
            body.photo_format = photo_format
            await DownResolutePhoto(filepath)
            done(null, body)
            return
        })

    }
})

SERVER.get("/", HomepageRouteHandler)
SERVER.get("/log-in", HomepageRouteHandler)
SERVER.get("/sign-up", HomepageRouteHandler)
SERVER.get("/pages/*", ReactPageScriptHandler)
SERVER.get("/assets/*", AssetsRouteHandler)
SERVER.get("/albums", GetAlbumsListRouteHandler)
SERVER.get("/home", MainPageRouteHandler)
SERVER.get("/album/:albumid", SpecificAlbumPageRouteHandler)
SERVER.get("/album/name/:albumid", AlbumNameRouteHandler)
SERVER.get("/photos/:albumid", PhotosRouteHandler)
SERVER.get("/photo/:photo_resource", PhotoRouteHandler)
SERVER.get("/thumbnail/:photo_id", ThumbnailRouteHandler)

SERVER.post("/log-in", LogInRouteHandler)
SERVER.post("/sign-up", SignUpRouteHandler)
SERVER.post("/new/album", CreateAlbumRouteHandler)
SERVER.post("/to/album/:id?", PostPictureRouteHandler)

SERVER.delete('/photo/:id', DeletePhotoRouteHandler)

LinkPathToFile("/react", "node_modules/react/umd/react.development.js", SERVER)
LinkPathToFile("/react-dom", "node_modules/react-dom/umd/react-dom.development.js", SERVER)
LinkPathToFile("/react-router-dom", "node_modules/react-router-dom/dist/umd/react-router-dom.development.js", SERVER)
LinkPathToFile("/react-router", "node_modules/react-router/dist/umd/react-router.development.js", SERVER)
LinkPathToFile("/remix-router", "node_modules/@remix-run/router/dist/router.umd.js", SERVER)
LinkPathToFile("/jquery", "node_modules/jquery/dist/jquery.js", SERVER)

async function Exit(exit_code: number) {
    await Globals.FotoDbClient.end()
    Globals.DynamicReactPageManagerInstance.Save()
    process.exit(exit_code)
}

function OnServerListenCallback(error: Error) {
    if (error) {
        console.log(error)
        Exit(-1)
    }
    console.log(`The development server is now running at http://${SERVER_HOST}:${SERVER_PORT}`)
}

async function main() {
    await Globals.FotoDbClient.connect()
    SERVER.listen(SERVER_CONFIG, OnServerListenCallback)
}

process.on('SIGINT', () => Exit(0))


main()

