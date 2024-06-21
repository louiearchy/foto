
import { FastifyRequest, FastifyReply } from 'fastify'
import fsPromise from 'node:fs/promises'
import path from 'node:path'

import Globals from '../globals'
import UtilsFile from '../utility/file'


export default async function FontsRouteHandler( request: FastifyRequest, reply: FastifyReply ) {
    let true_path_to_font_resource_file = path.join("built/web/", request.url)
    let font_resource_file_doesnt_exist = !(await UtilsFile.IsFileExisting(true_path_to_font_resource_file))

    if (font_resource_file_doesnt_exist)
        return reply.code(Globals.HttpStatusCode.NotFound)

    let mime_type = UtilsFile.DeduceMimeTypeByFileExtension(true_path_to_font_resource_file)
    if (mime_type) {
        reply.type(mime_type)
    }
    let font_resource_file = await fsPromise.readFile(true_path_to_font_resource_file)
    reply.send(font_resource_file)
}