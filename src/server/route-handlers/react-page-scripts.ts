
import path from 'node:path'
import { FastifyRequest, FastifyReply } from 'fastify'

import Globals from '../globals'
import UtilsFile from '../utility/file'

export default async function ReactPageScriptHandler ( request: FastifyRequest, reply: FastifyReply ) {
    let react_path_has_js_file_extension = request.url.lastIndexOf(".js") != -1
    let react_page_script_filename = (react_path_has_js_file_extension) ? request.url.replace('.js', '.tsx') : request.url + '.tsx'
    let true_path_to_react_page_script = path.join("src/web/", react_page_script_filename)

    let react_page_script_exists = await UtilsFile.IsFileExisting(true_path_to_react_page_script)
    if (react_page_script_exists) {
        let react_page_script = await Globals.DynamicReactPageManagerInstance.GetPage(true_path_to_react_page_script)
        if (react_page_script) {
            return reply.code(Globals.HttpStatusCode.Ok).type("text/javascript").send(react_page_script)
        }
        else /* if compilation error occurs */ {
            return reply.code(Globals.HttpStatusCode.InternalServerError).send()
        }
    }
}