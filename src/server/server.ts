
import Fastify from "fastify"

const PORT = 3000
const HOST = "localhost"

const server = Fastify()

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

