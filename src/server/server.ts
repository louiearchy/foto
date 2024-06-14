
import { Buffer } from 'node:buffer'
import Fastify from 'fastify'
import fs from 'node:fs'
import fsPromise from 'node:fs/promises'
import { v4 as uuidv4 } from 'uuid'

import DatabaseQueries from './database-queries'
import Globals from './globals'
import HtmlTemplatePages from './html/template-pages'
import JSONifyCookies from './utility/jsonify-cookies'
import UtilsFile from './utility/file'

import AssetsRouteHandler from './route-handlers/assets'
import CreateAlbumRequestHandler from './route-handlers/create-album'
import FontsHandler from './route-handlers/fonts'
import HomepageRouteHandler from './route-handlers/homepage'
import LogInRequestHandler from './route-handlers/log-in'
import ReactPageScriptHandler from './route-handlers/react-page-scripts'
import SignUpRequestHandler from './route-handlers/sign-up'

// ENUMS

enum ImageUploadingHandlingReportStatus {
    MissingAuthorization,
    Successful
}


// INTERFACES

interface ImageUploadingHandlingReport {
    status?: ImageUploadingHandlingReportStatus,
    filepath?: string
}


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

        let filepath = `built/${GeneratePhotoSessionToken()}.${UtilsFile.DeduceFileExtensionByContentType(request.headers?.["content-type"] ?? "")}`
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

SERVER.get("/fonts/*", FontsHandler)
SERVER.post("/log-in", LogInRequestHandler)
SERVER.post("/sign-up", SignUpRequestHandler)
SERVER.post("/new/album", CreateAlbumRequestHandler)

function GeneratePhotoSessionToken(): string {
    return uuidv4()
}

/**
 * The handler for clients posting a picture
 */
SERVER.post("/to/album/:id?", async (request, reply) => {
    let body = (request.body as ImageUploadingHandlingReport)
    if (body?.status == ImageUploadingHandlingReportStatus.MissingAuthorization) {
        reply.code(Globals.HttpStatusCode.Unauthorized)
        return
    }
    if (body.status == ImageUploadingHandlingReportStatus.Successful) {
        let cookies = JSONifyCookies(request.headers.cookie)
        let username = await DatabaseQueries.GetUsernameBySessionID(cookies?.sessionid)
        await DatabaseQueries.RecordNewPicture(username, (request.params as any)?.id, body.filepath)
        reply.code(Globals.HttpStatusCode.Ok)
        return
    }

})

SERVER.get("/albums", async function (request, reply) {
    if (request.headers?.cookie) {
        let cookies = JSONifyCookies(request.headers.cookie)
        if (cookies?.sessionid) {
            let is_sessionid_valid = await DatabaseQueries.IsSessionIdValid(cookies.sessionid)
            if (!is_sessionid_valid) {
                reply.code(Globals.HttpStatusCode.Unauthorized)
                return
            }
            /* if the sessionid is valid */
            let username = await DatabaseQueries.GetUsernameBySessionID(cookies.sessionid)
            let albums = await DatabaseQueries.GetAlbums(username)
            reply.code(Globals.HttpStatusCode.Ok).send(albums).type("application/json")
            return
        }
        else /* if there is no sessionid */ {
            reply.code(Globals.HttpStatusCode.Unauthorized)
            return
        }
    }
    else /* if there is no cookie */ {
        reply.code(Globals.HttpStatusCode.Unauthorized)
    }
})

SERVER.get("/home", async function (request, reply) {
    if (request.headers?.cookie) {
        let cookies = JSONifyCookies(request.headers.cookie)
        if (cookies?.sessionid) {
            let is_sessionid_valid = await DatabaseQueries.IsSessionIdValid(cookies.sessionid)
            if (!is_sessionid_valid) {
                reply.redirect("/")
                return
            }
            reply.code(Globals.HttpStatusCode.Ok).type("text/html").send(HtmlTemplatePages.mainpage.data)  
        }
        else /* if no sessionid is given */ {
            reply.redirect("/")
            return
        }
    }
})

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

