
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
    let fileExtension = filepath.split('.').reverse()[0]
    switch (fileExtension.toLowerCase()) {
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

function DeduceFileExtensionByContentType(contentType: string): string {
    switch (contentType.toLowerCase()) {
        case "image/jpg":
        case "image/png":
        case "image/webp":
            return contentType.toLowerCase().split("/")[1]
        default:
            return "unknown"
    }
}

/**
 * A helper function that takes care of the mechanisms in binding a request.path to
 * a specific file
 */
function BindPathToFile(requestPath: string, filepath: string, server) {
    server.get(requestPath, async (_, reply) => {
        let isFileExisting = await IsFileExisting(filepath)
        if (isFileExisting) {
            let fileData = await fsPromise.readFile(filepath)
            let fileMimeType = DeduceMimeTypeByFileExtension(filepath)
            if (fileMimeType) {
                reply.type(fileMimeType)
            }
            reply.code(HTTPSTATUSCODE.Ok).send(fileData)
        }
        else /* if the file does not exist */ {
            reply.code(HTTPSTATUSCODE.NotFound)
        }
    })
}

function JSONifyCookies(cookies: string): any {
    let withMultipleCookies = cookies.indexOf(";") > 0
    let returningObject = {}
    let cookies_pair_list = []
    if (withMultipleCookies) {
        cookies_pair_list = cookies.split(";")
    }
    else {
        cookies_pair_list.push(cookies)
    }
    for (let i = 0; i < cookies_pair_list.length; i++) 
    {
        let cookie_pair = cookies_pair_list[i];
        let withSeparator = cookie_pair.indexOf("=") > 0
        if (withSeparator) {
            let splitted_cookie_pair = cookie_pair.split("=")
            let cookieKey = splitted_cookie_pair[0]
            let cookieValue = splitted_cookie_pair[1]
            if (cookieKey.length > 0 && cookieValue.length > 0) {
                Object.defineProperty(returningObject, cookieKey, {
                    value: cookieValue,
                    enumerable: true
                })
            }
        }
    }
    return returningObject
}

SERVER.get("/", async (request, reply) => { 

    let clientHasCookie = typeof request.headers?.cookie === "string"
    if (clientHasCookie) {
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
    
    let clientHasCookie = typeof request.headers?.cookie === "string"
    if (clientHasCookie) {
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
    
    let clientHasCookie = typeof request.headers?.cookie === "string"
    if (clientHasCookie) {
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
    let isWithoutJsFileExtension = request.url.lastIndexOf(".js") == -1
    const truePathToReactPage = path.join("src/web/", 
        (isWithoutJsFileExtension) ? request.url + ".tsx" : request.url.replace(".js", ".tsx"))
    let reactPageExists = await IsFileExisting(truePathToReactPage)
    if (reactPageExists) {
        let pageData = await DYNAMIC_REACT_PAGE_MANAGER.GetPage(truePathToReactPage)
        if (pageData) {
            reply.code(HTTPSTATUSCODE.Ok).type("text/javascript").send(pageData)
        }
        else /* if compilation error occurs */ {
            reply.code(HTTPSTATUSCODE.InternalServerError)
        }
    }
})

SERVER.get("/assets/*", async (request, reply) => {
    let truePathToAssetResource = request.url.replace("/assets/", "src/web/")
    let assetResourceExists = await IsFileExisting(truePathToAssetResource)
    if (assetResourceExists) {
        let mimeType = DeduceMimeTypeByFileExtension(truePathToAssetResource)
        if (mimeType) {
            reply.type(mimeType)
        }
        let assetResourceData = await fsPromise.readFile(truePathToAssetResource)
        reply.send(assetResourceData)
    }
    else {
        reply.code(HTTPSTATUSCODE.NotFound)
    }
})

SERVER.get("/fonts/*", async (request, reply) => {
    let truePathToFontResource = path.join("built/web/", request.url)
    let fontResourceExists = await IsFileExisting(truePathToFontResource)
    if (fontResourceExists) {
        let mimeType = DeduceMimeTypeByFileExtension(truePathToFontResource)
        if (mimeType) {
            reply.type(mimeType)
        }
        let fontResourceData = await fsPromise.readFile(truePathToFontResource)
        reply.send(fontResourceData)
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
    const MISSING_ACCOUNT_INFO = "Missing account info"
    
    if (!account_submission_info?.username || !account_submission_info?.password) {
        reply.code(HTTPSTATUSCODE.BadRequest)
        reply.send(MISSING_ACCOUNT_INFO)
        return
    }

    /* if account info is submitted completely */

    let username = account_submission_info.username
    let password = account_submission_info.password
    const account_exists = await DatabaseQueries.QueryAccountInfo(username, password)

    if (account_exists) {
        let session_id = GenerateSessionID()
        await DatabaseQueries.SaveSession(username, session_id)
        reply.code(HTTPSTATUSCODE.Ok)
        let set_cookie_value = `sessionid=${session_id}`
        reply.header('set-cookie', set_cookie_value)
    }

    else /* if the account does not exists */ {
        reply.code(HTTPSTATUSCODE.NotFound)
    }
        
})

SERVER.post("/sign-up", async (request, reply) => {

    let account_info = (request.body as AccountSubmissionInfo)
    const MISSING_ACCOUNT_INFO = "Missing account info"
    const USERNAME_ALREADY_EXISTS = "USERNAME_ALREADY_EXISTS"
    if (!account_info?.username || !account_info.password) {
        reply.code(HTTPSTATUSCODE.BadRequest)
        reply.send(MISSING_ACCOUNT_INFO)
        return
    }

    /* if account info is submitted completely */

    let username = account_info.username
    let password = account_info.password

    const username_exists = await DatabaseQueries.CheckUsernameIfAlreadyRegistered(username)
    
    if (username_exists) {
        reply.code(HTTPSTATUSCODE.BadRequest).send(USERNAME_ALREADY_EXISTS)
        return
    }

    DatabaseQueries.RecordAccount(username, password)

    let session_id = GenerateSessionID()
    DatabaseQueries.SaveSession(username, session_id)
    reply.code(HTTPSTATUSCODE.Ok)
    reply.header('set-cookie', `sessionid=${session_id}`)
    
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

