
import Fastify from "fastify"
import HTMLPage from "./dynamic-html"
import fs from "node:fs/promises"

const PORT = 3000
const HOST = "localhost"

const server = Fastify()

const pages = {
    homepage: new HTMLPage()
}

const HttpStatusCode = {
    Ok: 200,
    NotFound: 404,
    InternalServerError: 500 
}

function IsFileExisting(filepath: string): Promise<boolean> {
    try {
        fs.access(filepath)
        return Promise.resolve(true)
    }
    catch {
        return Promise.resolve(false)
    }
}

function InitializePages() {
    pages.homepage.AddMetaTag({ charset: "utf-8" })
    pages.homepage.AddMetaTag({ name: "viewport", content: "width=device-width, initial-scale=1" })
    pages.homepage.AddScript("react")
    pages.homepage.AddScript("react-dom")
    pages.homepage.AddScript("pages/homepage.js")
}

function DeduceMimeTypeByFileExtension(filepath: string): string | undefined {
    let fileExtension = filepath.split('.').reverse()[0]
    switch (fileExtension.toLowerCase()) {
        case "js":
            return "text/javascript"
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
BindPathToFile("/react", "node_modules/react/umd/react.development.js", server)
BindPathToFile("/react-dom", "node_modules/react-dom/umd/react-dom.development.js", server)

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


main()

