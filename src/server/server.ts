
import { Buffer } from 'node:buffer'
import Fastify from 'fastify'
import fs from 'node:fs'
import fsPromise from 'node:fs/promises'
import net from 'node:net'
import nodepath from 'node:path'
import process from 'node:process'
import cors from '@fastify/cors'

import DatabaseQueries from './database-queries'
import Globals from './globals'
import { ExtendedFastifyRequest, ImageUploadingHandlingReport } from './interfaces'
import { ImageUploadingHandlingReportStatus } from './enums'
import JSONifyCookies from './utility/jsonify-cookies'
import UtilsFile from './utility/file'
import UtilsID from './utility/id'

import AlbumNameRouteHandler from './route-handlers/album-name'
import CreateAlbumRouteHandler from './route-handlers/create-album'
import DeleteAlbumRouteHandler from './route-handlers/delete-album'
import DeletePhotoRouteHandler from './route-handlers/delete-photo'
import GetAlbumsListRouteHandler from './route-handlers/albums-list'
import LogInRouteHandler from './route-handlers/log-in'
import PhotosRouteHandler from './route-handlers/photos'
import PhotoRouteHandler from './route-handlers/photo'
import PostPictureRouteHandler from './route-handlers/post-picture'
import SignUpRouteHandler from './route-handlers/sign-up'
import ThumbnailRouteHandler from './route-handlers/thumbnail'

namespace ANSI {
    export let ESC = "\u001b["
    export let BOLD = "1m"
    export let light_blue = "94m"
    export let RESET = `${ANSI.ESC}0m`
}

const SERVER_HOST = process.argv[2]
const SERVER_PORT = parseInt(process.argv[3])
const SERVER_CONFIG = { host: SERVER_HOST, port: SERVER_PORT }


const SERVER = Fastify()
SERVER.register(require('@fastify/formbody'))
SERVER.register(cors, {
    origin: process.env?.NEXTJS_APP_ADDRESS,
    methods: 'GET,HEAD,POST,OPTIONS,DELETE',
    credentials: true
})

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

function DownResolutePhoto(path_to_photo: string): Promise<string> {
    return new Promise( (resolve, reject) => {
        let filename = UtilsFile.GetFilenameFromFilePath(path_to_photo)
        filename = UtilsFile.ReplaceFileExtension(filename, ".webp")
        let path_to_thumbnail_output = nodepath.join(Globals.StorageLocation.ForThumbnails, filename)

        const client = net.createConnection({ port: 3001, host: 'localhost' }, () => {
            client.write(`DOWN-RESOLUTE ${path_to_photo} ${path_to_thumbnail_output}`)
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
        let filepath = nodepath.join(Globals.StorageLocation.ForPhotos, `${unique_photo_id}.${photo_format}`)
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

SERVER.get("/albums", GetAlbumsListRouteHandler)
SERVER.get("/album/name/:albumid", AlbumNameRouteHandler)
SERVER.get("/photos/:albumid", PhotosRouteHandler)
SERVER.get("/photo/:photo_resource", PhotoRouteHandler)
SERVER.get("/thumbnail/:photo_id", ThumbnailRouteHandler)

SERVER.post("/log-in", LogInRouteHandler)
SERVER.post("/sign-up", SignUpRouteHandler)
SERVER.post("/new/album", CreateAlbumRouteHandler)
SERVER.post("/to/album/:id?", PostPictureRouteHandler)

SERVER.delete('/photo/:id', DeletePhotoRouteHandler)
SERVER.delete('/album/:id', DeleteAlbumRouteHandler)

async function Exit(exit_code: number) {
    await Globals.FotoDbClient.end()
    process.exit(exit_code)
}

function OnServerListenCallback(error: Error) {
    if (error) {
        console.log(error)
        Exit(-1)
    }
    let label = `${ANSI.ESC}${ANSI.BOLD}${ANSI.ESC}${ANSI.light_blue}[server]:${ANSI.RESET}`
    console.log(`${label} The development server is now running at http://${SERVER_HOST}:${SERVER_PORT}`)
}

async function main() {
    await Globals.FotoDbClient.connect()
    SERVER.listen(SERVER_CONFIG, OnServerListenCallback)
}

process.on('SIGINT', () => Exit(0))


main()

