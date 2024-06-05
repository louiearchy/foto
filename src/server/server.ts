
import Fastify from "fastify"
import HTMLPage from "./dynamic-html"
import DynamicReactPageManager from "./dynamic-react-page-manager"
import fs from "node:fs/promises"
import path from "node:path"
import pg from "pg"
import { v4 as uuidv4 } from "uuid"

const PORT = 3000
const HOST = "localhost"
const FOTO_DB_CONNECTION_CONFIG = {
    host: "127.0.0.1",
    port: 5432,
    database: 'fotodb'
}
const FOTO_DB_CLIENT = new pg.Client(FOTO_DB_CONNECTION_CONFIG)

interface AccountSubmissionInfo {
    username?: string,
    password?: string
}

const server = Fastify()
server.register(require('@fastify/formbody'))


const pages = {
    homepage: new HTMLPage(),
    mainpage: new HTMLPage()
}

const drpmWatchFilePath = "built/drpm-watch-file.json"
const dynamicReactPageManager = new DynamicReactPageManager(drpmWatchFilePath, "built/web/pages/")

const HttpStatusCode = {
    Ok: 200,
    NotFound: 404,
    InternalServerError: 500,
    BadRequest: 400,
    Unauthorized: 401
}

async function IsFileExisting(filepath: string): Promise<boolean> {
    try {
        await fs.access(filepath, fs.constants.R_OK | fs.constants.F_OK)
        return Promise.resolve(true)
    } catch {
        return Promise.resolve(false)
    }
}

function InitializePages() {

    pages.homepage.AddMetaTag({ charset: "utf-8" })
    pages.homepage.AddMetaTag({ name: "viewport", content: "width=device-width, initial-scale=1" })
    pages.homepage.AddScript("react")
    pages.homepage.AddScript("react-dom")
    pages.homepage.AddScript("remix-router")
    pages.homepage.AddScript("react-router")
    pages.homepage.AddScript("react-router-dom")
    pages.homepage.SetReactPage("pages/homepage.js")
    pages.homepage.AddStylesheet("assets/css/homepage.css")
    pages.homepage.SetTitle("foto - a cloud photo album")


    pages.mainpage.AddMetaTag({ charset: "utf-8" })
    pages.mainpage.AddMetaTag({ name: "viewport", content: "width=device-width, initial-scale=1" })
    pages.mainpage.AddScript("react")
    pages.mainpage.AddScript("react-dom")
    pages.mainpage.AddScript("remix-router")
    pages.mainpage.AddScript("react-router")
    pages.mainpage.AddScript("react-router-dom")
    pages.mainpage.AddScript("jquery")
    pages.mainpage.SetReactPage("pages/main.js")
    pages.mainpage.AddStylesheet("assets/css/main.css")
    pages.mainpage.SetTitle("foto")

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
            let fileData = await fs.readFile(filepath)
            let fileMimeType = DeduceMimeTypeByFileExtension(filepath)
            if (fileMimeType) {
                reply.type(fileMimeType)
            }
            reply.code(HttpStatusCode.Ok).send(fileData)
        }
        else /* if the file does not exist */ {
            reply.code(HttpStatusCode.NotFound)
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

async function IsSessionIdValid(sessionid: string): Promise<boolean> {
    let query = await FOTO_DB_CLIENT.query(
        `SELECT EXISTS (SELECT sessionid FROM sessions WHERE sessionid='${sessionid}')`
    )
    return Promise.resolve(query.rows[0]?.exists ?? false)
}

server.get("/", async (request, reply) => { 

    let clientHasCookie = typeof request.headers?.cookie === "string"
    if (clientHasCookie) {
        let cookies = JSONifyCookies(request.headers.cookie)
        if (cookies?.sessionid) {
            if (await IsSessionIdValid(cookies.sessionid)) {
                reply.redirect("/home")
                return
            }
        }
    }

    reply.type("text/html").send(pages.homepage.data) 
})

server.get("/log-in", async (request, reply) => { 
    
    let clientHasCookie = typeof request.headers?.cookie === "string"
    if (clientHasCookie) {
        let cookies = JSONifyCookies(request.headers.cookie)
        if (cookies?.sessionid) {
            if (await IsSessionIdValid(cookies.sessionid)) {
                reply.redirect("/home")
                return
            }
        }
    }

    reply.type("text/html").send(pages.homepage.data) 
})

server.get("/sign-up", async (request, reply) => {
    
    let clientHasCookie = typeof request.headers?.cookie === "string"
    if (clientHasCookie) {
        let cookies = JSONifyCookies(request.headers.cookie)
        if (cookies?.sessionid) {
            if (await IsSessionIdValid(cookies.sessionid)) {
                reply.redirect("/home")
                return
            }
        }
    }
    reply.type("text/html").send(pages.homepage.data) 
})

server.get("/pages/*", async (request, reply) => {
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
        let pageData = await dynamicReactPageManager.GetPage(truePathToReactPage)
        if (pageData) {
            reply.code(HttpStatusCode.Ok).type("text/javascript").send(pageData)
        }
        else /* if compilation error occurs */ {
            reply.code(HttpStatusCode.InternalServerError)
        }
    }
})

server.get("/assets/*", async (request, reply) => {
    let truePathToAssetResource = request.url.replace("/assets/", "src/web/")
    let assetResourceExists = await IsFileExisting(truePathToAssetResource)
    if (assetResourceExists) {
        let mimeType = DeduceMimeTypeByFileExtension(truePathToAssetResource)
        if (mimeType) {
            reply.type(mimeType)
        }
        let assetResourceData = await fs.readFile(truePathToAssetResource)
        reply.send(assetResourceData)
    }
    else {
        reply.code(HttpStatusCode.NotFound)
    }
})

server.get("/fonts/*", async (request, reply) => {
    let truePathToFontResource = path.join("built/web/", request.url)
    let fontResourceExists = await IsFileExisting(truePathToFontResource)
    if (fontResourceExists) {
        let mimeType = DeduceMimeTypeByFileExtension(truePathToFontResource)
        if (mimeType) {
            reply.type(mimeType)
        }
        let fontResourceData = await fs.readFile(truePathToFontResource)
        reply.send(fontResourceData)
    }
    else /* if the font resource does not exists */ {
        reply.code(HttpStatusCode.NotFound)
    }
})

/**
 * This checks if there's an account with the following credentials saved in 
 * the accounts table
 */
async function QueryAccountInfo(username: string, password: string): Promise<boolean> {
    let query = await FOTO_DB_CLIENT.query(
        `SELECT EXISTS( SELECT username, password from accounts WHERE username='${username}' AND password='${password}')`
    )
    return Promise.resolve(query.rows[0]?.exists ?? false)
}

/**
 * This checks if the username has already been registered in the accounts table
 * @param username 
 */
async function CheckUsernameIfAlreadyRegistered(username: string): Promise<boolean> {
    let query = await FOTO_DB_CLIENT.query(
        `SELECT EXISTS( SELECT username FROM accounts WHERE username='${username}')`
    )
    return Promise.resolve(query.rows[0]?.exists ?? true)
}

async function GetUsernameBySessionID(sessionid: string): Promise<string | undefined> {
    let query = await FOTO_DB_CLIENT.query(
        `SELECT username FROM sessions WHERE sessionid='${sessionid}'`
    )
    return Promise.resolve(query.rows[0]?.username ?? undefined)
}

async function RecordNewAlbum(username: string, albumid: string, album_name: string): Promise<void> {
    await FOTO_DB_CLIENT.query(
        `INSERT INTO albums (username, albumid, album_name) VALUES ('${username}', '${albumid}', '${album_name}')`
    )
    return Promise.resolve()
}

async function RecordAccount(username: string, password: string) {
    await FOTO_DB_CLIENT.query(
        `INSERT INTO accounts (username, password) VALUES ('${username}', '${password}')`
    )
}

async function SaveSession(username: string, sessionid: string): Promise<void> {
    await FOTO_DB_CLIENT.query(`INSERT INTO sessions (username, sessionid) VALUES ('${username}', '${sessionid}')`)
}

async function IsAlbumIdValid(albumid: string): Promise<boolean> {
    let query = await FOTO_DB_CLIENT.query(`SELECT EXISTS (SELECT albumid FROM albums WHERE albumid='${albumid}')`)
    return query.rows[0]?.exists ?? false
}

async function RecordNewPicture(username: string, albumid: string | undefined, pictureid: string ): Promise<void> {
    albumid = (albumid) ? (`'${albumid}'`) : 'NULL'
    let query = await FOTO_DB_CLIENT.query(
        `
            INSERT INTO pictures (username, albumid, pictureid) VALUES ('${username}', ${albumid}, '${pictureid}')
        `
    )
    return Promise.resolve()
}

function GenerateSessionID(): string {
    return uuidv4()
}

function GenerateAlbumId(): string {
    return uuidv4()
}

function GeneratePictureId(): string {
    return uuidv4()
}

server.post("/log-in", async (request, reply) => {
    let account_submission_info = (request.body as AccountSubmissionInfo)
    const MISSING_ACCOUNT_INFO = "Missing account info"
    
    if (!account_submission_info?.username || !account_submission_info?.password) {
        reply.code(HttpStatusCode.BadRequest)
        reply.send(MISSING_ACCOUNT_INFO)
        return
    }

    /* if account info is submitted completely */

    let username = account_submission_info.username
    let password = account_submission_info.password
    const account_exists = await QueryAccountInfo(username, password)

    if (account_exists) {
        let session_id = GenerateSessionID()
        await SaveSession(username, session_id)
        reply.code(HttpStatusCode.Ok)
        let set_cookie_value = `sessionid=${session_id}`
        reply.header('set-cookie', set_cookie_value)
    }

    else /* if the account does not exists */ {
        reply.code(HttpStatusCode.NotFound)
    }
        
})

server.post("/sign-up", async (request, reply) => {

    let account_info = (request.body as AccountSubmissionInfo)
    const MISSING_ACCOUNT_INFO = "Missing account info"
    const USERNAME_ALREADY_EXISTS = "USERNAME_ALREADY_EXISTS"
    if (!account_info?.username || !account_info.password) {
        reply.code(HttpStatusCode.BadRequest)
        reply.send(MISSING_ACCOUNT_INFO)
        return
    }

    /* if account info is submitted completely */

    let username = account_info.username
    let password = account_info.password

    const username_exists = await CheckUsernameIfAlreadyRegistered(username)
    
    if (username_exists) {
        reply.code(HttpStatusCode.BadRequest).send(USERNAME_ALREADY_EXISTS)
        return
    }

    RecordAccount(username, password)

    let session_id = GenerateSessionID()
    SaveSession(username, session_id)
    reply.code(HttpStatusCode.Ok)
    reply.header('set-cookie', `sessionid=${session_id}`)
    
})

/**
 * The handler for clients creating a new album
 */
server.post("/new/album", async (request, reply) => {
    let clientHasCookie = request.headers?.cookie ?? false
    if (clientHasCookie) {
        let cookies = JSONifyCookies(request.headers.cookie)
        let withSessionId = cookies?.sessionid
        if (withSessionId) {
            if (await IsSessionIdValid(cookies.sessionid)) {
                let isWithContentType = typeof request.headers?.["content-type"] === 'string'
                let isWithContentLength = request.headers?.["content-length"] !== undefined
                if (isWithContentLength && isWithContentType) {
                    let contentType = request.headers["content-type"].toLowerCase()
                    if (contentType == "text/plain") {
                        let album_name = (request.body as string)
                        let username = await GetUsernameBySessionID(cookies.sessionid)
                        let albumid = GenerateAlbumId()
                        await RecordNewAlbum(username, albumid, album_name)
                        reply.code(HttpStatusCode.Ok).send(albumid).type("text/plain")
                        return
                    }
                    else /* if the content type is not text/plain */ {
                        reply.code(HttpStatusCode.BadRequest)
                        return
                    }
                }
                else /* if the request did not give the content-length and content-type */ {
                    reply.code(HttpStatusCode.BadRequest)
                    return
                }
            }
            else /* if the session id is not valid */ {
                reply.code(HttpStatusCode.BadRequest)
                return
            }
        }
        else /* without session id */ {
            reply.code(HttpStatusCode.Unauthorized)
            return
        }
    }
})

/**
 * The handler for clients posting a picture
 */
server.post("/albums/:id?", async (request, reply) => {
    let clientHasCookie = request.headers?.cookie ?? false
    if (clientHasCookie) {
        let cookies = JSONifyCookies(request.headers.cookie)
        let withSessionId = cookies?.sessionid
        if (withSessionId) {
            if (await IsSessionIdValid(cookies.sessionid)) {
                
                let { id } = (request.params as any)
                let albumid = id
                if (albumid) {
                    let isAlbumIdInvalid = !(await IsAlbumIdValid(albumid))
                    if (isAlbumIdInvalid) {
                        reply.code(HttpStatusCode.BadRequest)
                        return
                    }
                }


                let requestHeadersIsIncomplete = 
                    (!(typeof request.headers?.["content-type"] === 'string')) || 
                    (!(typeof request.headers?.["content-length"] === 'string'))

                if (requestHeadersIsIncomplete) {
                    reply.code(HttpStatusCode.BadRequest)
                    return
                }

                let contenttype = request.headers["content-type"]
                let contentlength: number = parseInt(request.headers?.["content-length"])
                let data: Buffer = Buffer.alloc(contentlength)
                let offset = 0

                request.raw.on('data', function (chunk: Buffer) {  
                    data.fill(chunk, )
                    offset += chunk.byteLength
                })

                request.raw.on('end', async function () {
                    
                    let uniqueid_for_picture = GeneratePictureId()
                    let file_extension = DeduceFileExtensionByContentType(contenttype)
                    let pictureid = `${uniqueid_for_picture}.${file_extension}`
                    let filename = path.join("built/data/pics", pictureid)
                    let username = await GetUsernameBySessionID(cookies.sessionid)
                    await fs.writeFile(
                        filename, data
                    )
                    await RecordNewPicture(username, albumid, pictureid)
                    reply.code(HttpStatusCode.Ok)

                })


            }
            else /* if the session id is not valid */ {
                reply.code(HttpStatusCode.Unauthorized)
                return
            }
        }
        else /* if the client has no session id */ {
            reply.code(HttpStatusCode.Unauthorized)
            return
        }
    }
    else /* if the client has no cookies */ {
        reply.code(HttpStatusCode.Unauthorized)
        return
    }
})

server.get("/home", async function (request, reply) {
    if (request.headers?.cookie) {
        let cookies = JSONifyCookies(request.headers.cookie)
        if (cookies?.sessionid) {
            let is_sessionid_valid = await IsSessionIdValid(cookies.sessionid)
            if (!is_sessionid_valid) {
                reply.redirect("/")
                return
            }
            reply.code(HttpStatusCode.Ok).type("text/html").send(pages.mainpage.data)  
        }
        else /* if no sessionid is given */ {
            reply.redirect("/")
            return
        }
    }
})

BindPathToFile("/react", "node_modules/react/umd/react.development.js", server)
BindPathToFile("/react-dom", "node_modules/react-dom/umd/react-dom.development.js", server)
BindPathToFile("/react-router-dom", "node_modules/react-router-dom/dist/umd/react-router-dom.development.js", server)
BindPathToFile("/react-router", "node_modules/react-router/dist/umd/react-router.development.js", server)
BindPathToFile("/remix-router", "node_modules/@remix-run/router/dist/router.umd.js", server)
BindPathToFile("/jquery", "node_modules/jquery/dist/jquery.js", server)

async function InitializeFotoDbConnection() {
    await FOTO_DB_CLIENT.connect()
}

function main() {
    InitializePages()
    server.listen(
    
        /* server options */
        { port: PORT, host: HOST }, 
    
        /* onListen callback */
        function (error, address) {
            if (error) {
                console.log(error)
                process.exit(-1)
            }
            else {
                InitializeFotoDbConnection()
                console.log(`The development server is now running at http://${HOST}:${PORT}`)
            }
        }
    
    )
}

process.on('SIGINT', async function() {
    await FOTO_DB_CLIENT.end()
    dynamicReactPageManager.Save()
    process.exit(0)
})


main()

