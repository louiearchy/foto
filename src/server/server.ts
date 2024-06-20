
import { Buffer } from 'node:buffer'
import Fastify from 'fastify'
import fs from 'node:fs'
import fsPromise from 'node:fs/promises'

import Globals from './globals'
import { ImageUploadingHandlingReport } from './interfaces'
import { ImageUploadingHandlingReportStatus } from './enums'
import JSONifyCookies from './utility/jsonify-cookies'
import UtilsFile from './utility/file'
import UtilsID from './utility/id'

import AlbumNameRouteHandler from './route-handlers/album-name'
import AssetsRouteHandler from './route-handlers/assets'
import CreateAlbumRequestHandler from './route-handlers/create-album'
import FontsHandler from './route-handlers/fonts'
import GetAlbumsListRequestHandler from './route-handlers/albums-list'
import HomepageRouteHandler from './route-handlers/homepage'
import LogInRequestHandler from './route-handlers/log-in'
import MainPageRequestHandler from './route-handlers/mainpage'
import PhotosRequestHandler from './route-handlers/photos'
import PhotoRequestHandler from './route-handlers/photo'
import PostPictureRequestHandler from './route-handlers/post-picture'
import ReactPageScriptHandler from './route-handlers/react-page-scripts'
import SignUpRequestHandler from './route-handlers/sign-up'
import SpecificAlbumPageHandler from './route-handlers/specific-album-page'


const SERVER_HOST = 'localhost'
const SERVER_PORT = 3000
const SERVER_CONFIG = { host: SERVER_HOST, port: SERVER_PORT }

const SERVER = Fastify()
SERVER.register(require('@fastify/formbody'))

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

// For file upload, closely related to /to/album/:id? POST request handler
SERVER.addContentTypeParser(['image/jpeg', 'image/png', 'image/webp'], function (request, payload, done) {
    if (/\/to\/album\//.test(request.url)) {
        
        let missing_cookies = request.headers?.cookie === undefined
        let body: ImageUploadingHandlingReport = {}
        
        if (missing_cookies) {
            body.status = ImageUploadingHandlingReportStatus.MissingAuthorization
            done(null, body)
            return
        }

        let cookies = JSONifyCookies(request.headers.cookie)

        if (!(cookies?.sessionid)) {
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

        payload.on('end', function () {
            file_write_stream.close()
            body.status = ImageUploadingHandlingReportStatus.Successful 
            body.photo_id = unique_photo_id
            body.photo_format = photo_format
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
SERVER.get("/albums", GetAlbumsListRequestHandler)
SERVER.get("/home", MainPageRequestHandler)
SERVER.get("/album/:albumid", SpecificAlbumPageHandler)
SERVER.get("/album/name/:albumid", AlbumNameRouteHandler)
SERVER.get("/photos/:albumid", PhotosRequestHandler)
SERVER.get("/photo/:photo_resource", PhotoRequestHandler)

SERVER.get("/fonts/*", FontsHandler)
SERVER.post("/log-in", LogInRequestHandler)
SERVER.post("/sign-up", SignUpRequestHandler)
SERVER.post("/new/album", CreateAlbumRequestHandler)
SERVER.post("/to/album/:id?", PostPictureRequestHandler)

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

