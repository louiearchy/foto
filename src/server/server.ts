
import { Buffer } from 'node:buffer'
import Fastify from 'fastify'
import fs from 'node:fs'
import fsPromise from 'node:fs/promises'
import path from 'node:path'
import { v4 as uuidv4 } from 'uuid'

import DatabaseQueries from './database-queries'
import Globals from './globals'
import HtmlTemplatePages from './html/template-pages'
import JSONifyCookies from './utility/jsonify-cookies'
import UtilsFile from './utility/file'

import HomepageRouteHandler from './route-handlers/homepage'
import ReactPageScriptHandler from './route-handlers/react-page-scripts'

// ENUMS

enum ImageUploadingHandlingReportStatus {
    MissingAuthorization,
    Successful
}


// INTERFACES

interface AccountSubmissionInfo {
    username?: string,
    password?: string
}

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

SERVER.get("/", HomepageRouteHandler)
SERVER.get("/log-in", HomepageRouteHandler)
SERVER.get("/sign-up", HomepageRouteHandler)
SERVER.get("/pages/*", ReactPageScriptHandler)

SERVER.get("/assets/*", async (request, reply) => {
    let true_path_to_the_asset_file = request.url.replace("/assets/", "src/web/")
    let asset_file_exists = await UtilsFile.IsFileExisting(true_path_to_the_asset_file)
    if (asset_file_exists) {
        let asset_file_mime_type = UtilsFile.DeduceMimeTypeByFileExtension(true_path_to_the_asset_file)
        if (asset_file_mime_type) {
            reply.type(asset_file_mime_type)
        }
        let asset_file = await fsPromise.readFile(true_path_to_the_asset_file)
        reply.send(asset_file)
    }
    else {
        reply.code(Globals.HttpStatusCode.NotFound)
    }
})

SERVER.get("/fonts/*", async (request, reply) => {
    let true_path_to_font_resource_file = path.join("built/web/", request.url)
    let font_resource_file_exists = await UtilsFile.IsFileExisting(true_path_to_font_resource_file)
    if (font_resource_file_exists) {
        let mime_type = UtilsFile.DeduceMimeTypeByFileExtension(true_path_to_font_resource_file)
        if (mime_type) {
            reply.type(mime_type)
        }
        let font_resource_file = await fsPromise.readFile(true_path_to_font_resource_file)
        reply.send(font_resource_file)
    }
    else /* if the font resource does not exists */ {
        reply.code(Globals.HttpStatusCode.NotFound)
    }
})

function GenerateSessionID(): string {
    return uuidv4()
}

function GenerateAlbumId(): string {
    return uuidv4()
}

function GeneratePictureId(): string {
    return uuidv4()
}

SERVER.post("/log-in", async (request, reply) => {
    
    let account_submission_info = (request.body as AccountSubmissionInfo)

    let username_credential_is_missing = !(account_submission_info?.username)
    let password_credential_is_missing = !(account_submission_info?.password)
    
    if (username_credential_is_missing || password_credential_is_missing) {
        return reply.code(Globals.HttpStatusCode.BadRequest).send('MISSING ACCOUNT INFO')
    }

    /* if account info is submitted completely */

    let username = account_submission_info.username
    let password = account_submission_info.password
    const account_exists = await DatabaseQueries.QueryAccountInfo(username, password)

    if (account_exists) {
        let session_id = GenerateSessionID()
        await DatabaseQueries.SaveSession(username, session_id)
        let set_cookie_value = `sessionid=${session_id}`
        return reply.header('set-cookie', set_cookie_value).send(Globals.HttpStatusCode.Ok)
    }

    else /* if the account does not exists */ {
        reply.code(Globals.HttpStatusCode.NotFound)
    }
        
})

SERVER.post("/sign-up", async (request, reply) => {

    let account_submission_info = (request.body as AccountSubmissionInfo)

    let username_credential_is_missing = !(account_submission_info?.username)
    let password_credential_is_missing = !(account_submission_info?.password)
    
    if (username_credential_is_missing || password_credential_is_missing) {
        return reply.code(Globals.HttpStatusCode.BadRequest).send('MISSING ACCOUNT INFO')
    }

    /* if account info is submitted completely */

    let username = account_submission_info.username
    let password = account_submission_info.password

    const username_exists = await DatabaseQueries.CheckUsernameIfAlreadyRegistered(username)
    
    if (username_exists) {
        return reply.code(Globals.HttpStatusCode.BadRequest).send('USERNAME ALREADY EXISTS')
    }

    DatabaseQueries.RecordAccount(username, password)

    let session_id = GenerateSessionID()
    DatabaseQueries.SaveSession(username, session_id)

    return reply.header('set-cookie', `sessionid=${session_id}`).code(Globals.HttpStatusCode.Ok)
    
})

/**
 * The handler for clients creating a new album
 */
SERVER.post("/new/album", async (request, reply) => {
    let clientHasCookie = request.headers?.cookie ?? false
    if (clientHasCookie) {
        let cookies = JSONifyCookies(request.headers.cookie)
        let withSessionId = cookies?.sessionid
        if (withSessionId) {
            if (await DatabaseQueries.IsSessionIdValid(cookies.sessionid)) {
                let isWithContentType = typeof request.headers?.["content-type"] === 'string'
                let isWithContentLength = request.headers?.["content-length"] !== undefined
                if (isWithContentLength && isWithContentType) {
                    let contentType = request.headers["content-type"].toLowerCase()
                    if (contentType == "text/plain") {
                        let album_name = (request.body as string)
                        let username = await DatabaseQueries.GetUsernameBySessionID(cookies.sessionid)
                        let albumid = GenerateAlbumId()
                        await DatabaseQueries.RecordNewAlbum(username, albumid, album_name)
                        reply.code(Globals.HttpStatusCode.Ok).send(albumid).type("text/plain")
                        return
                    }
                    else /* if the content type is not text/plain */ {
                        reply.code(Globals.HttpStatusCode.BadRequest)
                        return
                    }
                }
                else /* if the request did not give the content-length and content-type */ {
                    reply.code(Globals.HttpStatusCode.BadRequest)
                    return
                }
            }
            else /* if the session id is not valid */ {
                reply.code(Globals.HttpStatusCode.BadRequest)
                return
            }
        }
        else /* without session id */ {
            reply.code(Globals.HttpStatusCode.Unauthorized)
            return
        }
    }
})

function GeneratePhotoSessionToken(): string {
    return uuidv4()
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

