
import { Buffer } from 'node:buffer'
import Fastify from 'fastify'
import fs from 'node:fs'
import fsPromise from 'node:fs/promises'
import path from 'node:path'
import { v4 as uuidv4 } from 'uuid'

import DatabaseQueries from './database-queries'
import DynamicReactPageManager from './dynamic-react-page-manager'
import HTMLPage from './dynamic-html'


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
const HTML_TEMPLATE_PAGES = {
    homepage: new HTMLPage(),
    mainpage: new HTMLPage()
}

const SERVER = Fastify()
SERVER.register(require('@fastify/formbody'))

/**
 * The path to the file where the Dynamic React Page Manager would store
 * all of its information
*/
const DRPM_WATCHFILE_PATH = 'built/drpm-watch-file.json'


/**
 * This is used to compile react scripts while the server is running
*/
const DYNAMIC_REACT_PAGE_MANAGER = new DynamicReactPageManager(DRPM_WATCHFILE_PATH, 'built/web/pages/')

const HTTPSTATUSCODE = {
    Continue: 100,
    Ok: 200,
    NotFound: 404,
    InternalServerError: 500,
    BadRequest: 400,
    Unauthorized: 401,
    RequestTimeout: 408,
    Conflict: 409
}


// Utility functions 

async function IsFileExisting(filepath: string): Promise<boolean> {
    try {
        await fsPromise.access(filepath, fsPromise.constants.R_OK | fsPromise.constants.F_OK)
        return Promise.resolve(true)
    } catch {
        return Promise.resolve(false)
    }
}

function DeduceMimeTypeByFileExtension(filepath: string): string | undefined {
    let file_extension = filepath.split('.').reverse()[0]
    switch (file_extension.toLowerCase()) {
        case "js":
            return "text/javascript"
        case "css":
            return "text/css"
        case "otf":
            return "font/otf"
        case "ttf":
            return "font/ttf"
        case "svg":
            return "image/svg+xml"
        default:
            return undefined
    }
}

function DeduceFileExtensionByContentType(content_type: string): string {
    switch (content_type.toLowerCase()) {
        case "image/jpg":
        case "image/png":
        case "image/webp":
            return content_type.toLowerCase().split("/")[1]
        default:
            return "unknown"
    }
}

/**
 * A helper function that takes care of the mechanisms in binding a request.path to
 * a specific file
 */
function BindPathToFile(request_path: string, filepath: string, server) {
    server.get(request_path, async (_, reply) => {
        let file_exists = await IsFileExisting(filepath)
        if (file_exists) {
            let fileData = await fsPromise.readFile(filepath)
            let file_mime_type = DeduceMimeTypeByFileExtension(filepath)
            if (file_mime_type) {
                reply.type(file_mime_type)
            }
            reply.code(HTTPSTATUSCODE.Ok).send(fileData)
        }
        else /* if the file does not exist */ {
            reply.code(HTTPSTATUSCODE.NotFound)
        }
    })
}

function JSONifyCookies(cookies: string): any {

    let cookies_are_many = cookies.indexOf(";") > 0
    let returning_json_object = {}
    let cookie_list: string[] = []

    if (cookies_are_many) {
        cookie_list = cookies.split(";")
    }
    else {
        cookie_list.push(cookies)
    }

    cookie_list.map( (current_cookie) => {
        let cookie_has_separator = current_cookie.indexOf("=") > 0
        if (cookie_has_separator) {
            let splitted_cookie_by_separator = current_cookie.split("=")
            let cookie_key = splitted_cookie_by_separator[0]
            let cookie_value = splitted_cookie_by_separator[1]
            if (cookie_key.length > 0 && cookie_value.length > 0) {
                Object.defineProperty(returning_json_object, cookie_key, {
                    value: cookie_value,
                    enumerable: true
                })
            }
        }
    })

    return returning_json_object
}

SERVER.get("/", async (request, reply) => { 

    let client_has_cookie = typeof request.headers?.cookie === "string"
    if (client_has_cookie) {
        let cookies = JSONifyCookies(request.headers.cookie)
        if (cookies?.sessionid) {
            if (await DatabaseQueries.IsSessionIdValid(cookies.sessionid)) {
                reply.redirect("/home")
                return
            }
        }
    }

    reply.type("text/html").send(HTML_TEMPLATE_PAGES.homepage.data) 
})

SERVER.get("/log-in", async (request, reply) => { 
    
    let client_has_cookie = typeof request.headers?.cookie === "string"
    if (client_has_cookie) {
        let cookies = JSONifyCookies(request.headers.cookie)
        if (cookies?.sessionid) {
            if (await DatabaseQueries.IsSessionIdValid(cookies.sessionid)) {
                reply.redirect("/home")
                return
            }
        }
    }

    reply.type("text/html").send(HTML_TEMPLATE_PAGES.homepage.data) 
})

SERVER.get("/sign-up", async (request, reply) => {
    
    let client_has_cookie = typeof request.headers?.cookie === "string"
    if (client_has_cookie) {
        let cookies = JSONifyCookies(request.headers.cookie)
        if (cookies?.sessionid) {
            if (await DatabaseQueries.IsSessionIdValid(cookies.sessionid)) {
                reply.redirect("/home")
                return
            }
        }
    }
    reply.type("text/html").send(HTML_TEMPLATE_PAGES.homepage.data) 
})

SERVER.get("/pages/*", async (request, reply) => {
    /**
     * isWithoutJsFileExtension is to detect whether the request has js file extension on it,
     * because whenever we use import other components or scripts such as in the react pages
     * we omit the `.js` which in this case without this, the server would fail to find the 
     * equivalent file for the request
     */
    let react_path_has_js_file_extension = request.url.lastIndexOf(".js") == -1
    let react_page_script_filename = (react_path_has_js_file_extension) ? request.url.replace('.js', '.tsx') : request.url + '.tsx'
    let true_path_to_react_page_script = path.join("src/web/", react_page_script_filename)

    let react_page_script_exists = await IsFileExisting(true_path_to_react_page_script)
    if (react_page_script_exists) {
        let react_page_script = await DYNAMIC_REACT_PAGE_MANAGER.GetPage(true_path_to_react_page_script)
        if (react_page_script) {
            reply.code(HTTPSTATUSCODE.Ok).type("text/javascript").send(react_page_script)
        }
        else /* if compilation error occurs */ {
            reply.code(HTTPSTATUSCODE.InternalServerError)
        }
    }
})

SERVER.get("/assets/*", async (request, reply) => {
    let true_path_to_the_asset_file = request.url.replace("/assets/", "src/web/")
    let asset_file_exists = await IsFileExisting(true_path_to_the_asset_file)
    if (asset_file_exists) {
        let asset_file_mime_type = DeduceMimeTypeByFileExtension(true_path_to_the_asset_file)
        if (asset_file_mime_type) {
            reply.type(asset_file_mime_type)
        }
        let asset_file = await fsPromise.readFile(true_path_to_the_asset_file)
        reply.send(asset_file)
    }
    else {
        reply.code(HTTPSTATUSCODE.NotFound)
    }
})

SERVER.get("/fonts/*", async (request, reply) => {
    let true_path_to_font_resource_file = path.join("built/web/", request.url)
    let font_resource_file_exists = await IsFileExisting(true_path_to_font_resource_file)
    if (font_resource_file_exists) {
        let mime_type = DeduceMimeTypeByFileExtension(true_path_to_font_resource_file)
        if (mime_type) {
            reply.type(mime_type)
        }
        let font_resource_file = await fsPromise.readFile(true_path_to_font_resource_file)
        reply.send(font_resource_file)
    }
    else /* if the font resource does not exists */ {
        reply.code(HTTPSTATUSCODE.NotFound)
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
        return reply.code(HTTPSTATUSCODE.BadRequest).send('MISSING ACCOUNT INFO')
    }

    /* if account info is submitted completely */

    let username = account_submission_info.username
    let password = account_submission_info.password
    const account_exists = await DatabaseQueries.QueryAccountInfo(username, password)

    if (account_exists) {
        let session_id = GenerateSessionID()
        await DatabaseQueries.SaveSession(username, session_id)
        let set_cookie_value = `sessionid=${session_id}`
        return reply.header('set-cookie', set_cookie_value).send(HTTPSTATUSCODE.Ok)
    }

    else /* if the account does not exists */ {
        reply.code(HTTPSTATUSCODE.NotFound)
    }
        
})

SERVER.post("/sign-up", async (request, reply) => {

    let account_submission_info = (request.body as AccountSubmissionInfo)

    let username_credential_is_missing = !(account_submission_info?.username)
    let password_credential_is_missing = !(account_submission_info?.password)
    
    if (username_credential_is_missing || password_credential_is_missing) {
        return reply.code(HTTPSTATUSCODE.BadRequest).send('MISSING ACCOUNT INFO')
    }

    /* if account info is submitted completely */

    let username = account_submission_info.username
    let password = account_submission_info.password

    const username_exists = await DatabaseQueries.CheckUsernameIfAlreadyRegistered(username)
    
    if (username_exists) {
        return reply.code(HTTPSTATUSCODE.BadRequest).send('USERNAME ALREADY EXISTS')
    }

    DatabaseQueries.RecordAccount(username, password)

    let session_id = GenerateSessionID()
    DatabaseQueries.SaveSession(username, session_id)

    return reply.header('set-cookie', `sessionid=${session_id}`).code(HTTPSTATUSCODE.Ok)
    
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
                        reply.code(HTTPSTATUSCODE.Ok).send(albumid).type("text/plain")
                        return
                    }
                    else /* if the content type is not text/plain */ {
                        reply.code(HTTPSTATUSCODE.BadRequest)
                        return
                    }
                }
                else /* if the request did not give the content-length and content-type */ {
                    reply.code(HTTPSTATUSCODE.BadRequest)
                    return
                }
            }
            else /* if the session id is not valid */ {
                reply.code(HTTPSTATUSCODE.BadRequest)
                return
            }
        }
        else /* without session id */ {
            reply.code(HTTPSTATUSCODE.Unauthorized)
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

        let filepath = `built/${GeneratePhotoSessionToken()}.${DeduceFileExtensionByContentType(request.headers?.["content-type"] ?? "")}`
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
        reply.code(HTTPSTATUSCODE.Unauthorized)
        return
    }
    if (body.status == ImageUploadingHandlingReportStatus.Successful) {
        let cookies = JSONifyCookies(request.headers.cookie)
        let username = await DatabaseQueries.GetUsernameBySessionID(cookies?.sessionid)
        await DatabaseQueries.RecordNewPicture(username, (request.params as any)?.id, body.filepath)
        reply.code(HTTPSTATUSCODE.Ok)
        return
    }

})

SERVER.get("/albums", async function (request, reply) {
    if (request.headers?.cookie) {
        let cookies = JSONifyCookies(request.headers.cookie)
        if (cookies?.sessionid) {
            let is_sessionid_valid = await DatabaseQueries.IsSessionIdValid(cookies.sessionid)
            if (!is_sessionid_valid) {
                reply.code(HTTPSTATUSCODE.Unauthorized)
                return
            }
            /* if the sessionid is valid */
            let username = await DatabaseQueries.GetUsernameBySessionID(cookies.sessionid)
            let albums = await DatabaseQueries.GetAlbums(username)
            reply.code(HTTPSTATUSCODE.Ok).send(albums).type("application/json")
            return
        }
        else /* if there is no sessionid */ {
            reply.code(HTTPSTATUSCODE.Unauthorized)
            return
        }
    }
    else /* if there is no cookie */ {
        reply.code(HTTPSTATUSCODE.Unauthorized)
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
            reply.code(HTTPSTATUSCODE.Ok).type("text/html").send(HTML_TEMPLATE_PAGES.mainpage.data)  
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
        reply.code(HTTPSTATUSCODE.BadRequest).redirect("/home")
        return
    }

    if (!request.headers?.cookie) {        
        reply.code(HTTPSTATUSCODE.Unauthorized).redirect("/")
        return
    }

    let cookies = JSONifyCookies(request.headers.cookie)

    if (!cookies?.sessionid) {
        reply.code(HTTPSTATUSCODE.Unauthorized).redirect("/")
        return
    }

    let is_sessionid_not_valid = !(await DatabaseQueries.IsSessionIdValid(cookies.sessionid))

    if (is_sessionid_not_valid) {
        reply.code(HTTPSTATUSCODE.Unauthorized).redirect("/")
        return
    }

    reply.code(HTTPSTATUSCODE.Ok).type("text/html").send(HTML_TEMPLATE_PAGES.mainpage.data)
    return


})

SERVER.get("/album/name/:albumid", async function (request, reply) {

    let { albumid } = (request.params as any)

    if (!albumid) {
        reply.code(HTTPSTATUSCODE.BadRequest)
        return
    }

    if (!request.headers?.cookie) {
        reply.code(HTTPSTATUSCODE.Unauthorized)
        return
    }

    let cookies = JSONifyCookies(request.headers.cookie)

    if (!cookies.sessionid) {
        reply.code(HTTPSTATUSCODE.Unauthorized)
        return
    }

    let sessionid_is_not_valid = !(await DatabaseQueries.IsSessionIdValid(cookies.sessionid))

    if (sessionid_is_not_valid) {
        reply.code(HTTPSTATUSCODE.Unauthorized)
        return
    }

    let album_name = await DatabaseQueries.GetAlbumNameByItsAlbumID(albumid)
    reply.code(HTTPSTATUSCODE.Ok).type("text/plain").send(album_name)
    return

})

BindPathToFile("/react", "node_modules/react/umd/react.development.js", SERVER)
BindPathToFile("/react-dom", "node_modules/react-dom/umd/react-dom.development.js", SERVER)
BindPathToFile("/react-router-dom", "node_modules/react-router-dom/dist/umd/react-router-dom.development.js", SERVER)
BindPathToFile("/react-router", "node_modules/react-router/dist/umd/react-router.development.js", SERVER)
BindPathToFile("/remix-router", "node_modules/@remix-run/router/dist/router.umd.js", SERVER)
BindPathToFile("/jquery", "node_modules/jquery/dist/jquery.js", SERVER)

function AddGeneralMetaTags(template_page: HTMLPage) {
    template_page.AddMetaTag({ charset: 'utf-8' })
    template_page.AddMetaTag({ name: 'viewport', content: 'width=device-width, initial-scale=1' })
}

function InjectReactResourceFiles(template_page: HTMLPage) {
    template_page.AddScript('/react')
    template_page.AddScript('/react-dom')
    template_page.AddScript('/remix-router')
    template_page.AddScript('/react-router')
    template_page.AddScript('/react-router-dom')
}

function InitializeHtmlTemplatePages() {

    AddGeneralMetaTags(HTML_TEMPLATE_PAGES.homepage)
    InjectReactResourceFiles(HTML_TEMPLATE_PAGES.homepage)
    HTML_TEMPLATE_PAGES.homepage.SetReactPage('/pages/homepage.js')
    HTML_TEMPLATE_PAGES.homepage.AddStylesheet('/assets/css/homepage.css')
    HTML_TEMPLATE_PAGES.homepage.SetTitle('foto - a cloud photo album')


    AddGeneralMetaTags(HTML_TEMPLATE_PAGES.homepage)
    InjectReactResourceFiles(HTML_TEMPLATE_PAGES.mainpage)
    HTML_TEMPLATE_PAGES.mainpage.AddScript('/jquery')
    HTML_TEMPLATE_PAGES.mainpage.SetReactPage('/pages/main.js')
    HTML_TEMPLATE_PAGES.mainpage.AddStylesheet('/assets/css/main.css')
    HTML_TEMPLATE_PAGES.mainpage.SetTitle('foto')

}

function main() {
    InitializeHtmlTemplatePages()
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
                DatabaseQueries.FOTODB_CLIENT.connect()
                console.log(`The development server is now running at http://${SERVER_HOST}:${SERVER_PORT}`)
            }
        }
    
    )
}

process.on('SIGINT', async function() {
    await DatabaseQueries.FOTODB_CLIENT.end()
    DYNAMIC_REACT_PAGE_MANAGER.Save()
    process.exit(0)
})


main()

