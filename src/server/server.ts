
import { Buffer } from 'node:buffer'
import Fastify from 'fastify'
import fs from 'node:fs'
import fsPromise from 'node:fs/promises'

import DatabaseQueries from './database-queries'
import Globals from './globals'
import HtmlTemplatePages from './html/template-pages'
import { ImageUploadingHandlingReport } from './interfaces'
import { ImageUploadingHandlingReportStatus } from './enums'
import JSONifyCookies from './utility/jsonify-cookies'
import UtilsFile from './utility/file'
import UtilsID from './utility/id'

import GetAlbumsListRequestHandler from './route-handlers/albums-list'
import AssetsRouteHandler from './route-handlers/assets'
import CreateAlbumRequestHandler from './route-handlers/create-album'
import FontsHandler from './route-handlers/fonts'
import HomepageRouteHandler from './route-handlers/homepage'
import LogInRequestHandler from './route-handlers/log-in'
import MainPageRequestHandler from './route-handlers/mainpage'
import PostPictureRequestHandler from './route-handlers/post-picture'
import ReactPageScriptHandler from './route-handlers/react-page-scripts'
import SignUpRequestHandler from './route-handlers/sign-up'


// GLOBAL CONST VARIABLES

const SERVER_HOST = 'localhost'
const SERVER_PORT = 3000

const SERVER = Fastify()
SERVER.register(require('@fastify/formbody'))

/**
 * A helper function that takes care of the mechanisms in binding a request.path to
 * a specific file
 */
function BindPathToFile(request_path: string, filepath: string, server) {
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

        let filepath = `built/${UtilsID.GeneratePhotoSessionToken()}.${UtilsFile.DeduceFileExtensionByContentType(request.headers?.["content-type"] ?? "")}`
        let file_write_stream = fs.createWriteStream(filepath)
        
        payload.on('data', function (chunk: Buffer) {
            file_write_stream.write(chunk)
        })

        payload.on('end', function () {
            file_write_stream.close()
            body.status = ImageUploadingHandlingReportStatus.Successful 
            body.filepath = filepath
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

SERVER.get("/fonts/*", FontsHandler)
SERVER.post("/log-in", LogInRequestHandler)
SERVER.post("/sign-up", SignUpRequestHandler)
SERVER.post("/new/album", CreateAlbumRequestHandler)
SERVER.post("/to/album/:id?", PostPictureRequestHandler)

/*
    Serving the album page
*/
SERVER.get("/album/:albumid", async function (request, reply) {
    
    let { albumid } = request.params as any

    if (!albumid) {
        reply.code(Globals.HttpStatusCode.BadRequest).redirect("/home")
        return
    }

    if (!request.headers?.cookie) {        
        reply.code(Globals.HttpStatusCode.Unauthorized).redirect("/")
        return
    }

    let cookies = JSONifyCookies(request.headers.cookie)

    if (!cookies?.sessionid) {
        reply.code(Globals.HttpStatusCode.Unauthorized).redirect("/")
        return
    }

    let is_sessionid_not_valid = !(await DatabaseQueries.IsSessionIdValid(cookies.sessionid))

    if (is_sessionid_not_valid) {
        reply.code(Globals.HttpStatusCode.Unauthorized).redirect("/")
        return
    }

    reply.code(Globals.HttpStatusCode.Ok).type("text/html").send(HtmlTemplatePages.mainpage.data)
    return


})

SERVER.get("/album/name/:albumid", async function (request, reply) {

    let { albumid } = (request.params as any)

    if (!albumid) {
        reply.code(Globals.HttpStatusCode.BadRequest)
        return
    }

    if (!request.headers?.cookie) {
        reply.code(Globals.HttpStatusCode.Unauthorized)
        return
    }

    let cookies = JSONifyCookies(request.headers.cookie)

    if (!cookies.sessionid) {
        reply.code(Globals.HttpStatusCode.Unauthorized)
        return
    }

    let sessionid_is_not_valid = !(await DatabaseQueries.IsSessionIdValid(cookies.sessionid))

    if (sessionid_is_not_valid) {
        reply.code(Globals.HttpStatusCode.Unauthorized)
        return
    }

    let album_name = await DatabaseQueries.GetAlbumNameByItsAlbumID(albumid)
    reply.code(Globals.HttpStatusCode.Ok).type("text/plain").send(album_name)
    return

})

BindPathToFile("/react", "node_modules/react/umd/react.development.js", SERVER)
BindPathToFile("/react-dom", "node_modules/react-dom/umd/react-dom.development.js", SERVER)
BindPathToFile("/react-router-dom", "node_modules/react-router-dom/dist/umd/react-router-dom.development.js", SERVER)
BindPathToFile("/react-router", "node_modules/react-router/dist/umd/react-router.development.js", SERVER)
BindPathToFile("/remix-router", "node_modules/@remix-run/router/dist/router.umd.js", SERVER)
BindPathToFile("/jquery", "node_modules/jquery/dist/jquery.js", SERVER)

function main() {
    SERVER.listen(
    
        /* server options */
        { port: SERVER_PORT, host: SERVER_HOST }, 
    
        /* onListen callback */
        function (error, address) {
            if (error) {
                console.log(error)
                process.exit(-1)
            }
            else {
                Globals.FotoDbClient.connect()
                console.log(`The development server is now running at http://${SERVER_HOST}:${SERVER_PORT}`)
            }
        }
    
    )
}

process.on('SIGINT', async function() {
    await Globals.FotoDbClient.end()
    Globals.DynamicReactPageManagerInstance.Save()
    process.exit(0)
})


main()

