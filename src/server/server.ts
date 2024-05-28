
import Fastify from "fastify"
import HTMLPage from "./dynamic-html"
import DynamicReactPageManager from "./dynamic-react-page-manager"
import fs from "node:fs/promises"
import path from "node:path"

const PORT = 3000
const HOST = "localhost"

const server = Fastify()

const pages = {
    homepage: new HTMLPage()
}

const drpmWatchFilePath = "built/drpm-watch-file.json"
const dynamicReactPageManager = new DynamicReactPageManager(drpmWatchFilePath, "built/web/pages/")

const HttpStatusCode = {
    Ok: 200,
    NotFound: 404,
    InternalServerError: 500 
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

server.get("/", (request, reply) => { reply.type("text/html").send(pages.homepage.data) })
server.get("/log-in", (request, reply) => { reply.type("text/html").send(pages.homepage.data) })
server.get("/sign-up", (request, reply) => {reply.type("text/html").send(pages.homepage.data) })

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

BindPathToFile("/react", "node_modules/react/umd/react.development.js", server)
BindPathToFile("/react-dom", "node_modules/react-dom/umd/react-dom.development.js", server)
BindPathToFile("/react-router-dom", "node_modules/react-router-dom/dist/umd/react-router-dom.development.js", server)
BindPathToFile("/react-router", "node_modules/react-router/dist/umd/react-router.development.js", server)
BindPathToFile("/remix-router", "node_modules/@remix-run/router/dist/router.umd.js", server)

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
                console.log(`The development server is now running at http://${HOST}:${PORT}`)
            }
        }
    
    )
}

process.on('SIGINT', function() {
    dynamicReactPageManager.Save()
    process.exit(0)
})


main()

