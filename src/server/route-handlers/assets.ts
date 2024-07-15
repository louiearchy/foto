
import { ExtendedFastifyRequest } from '../interfaces'
import { FastifyReply } from 'fastify'
import fsPromise from 'node:fs/promises'

import Globals from '../globals'
import UtilsFile from '../utility/file'

export default async function AssetsRouteHandler ( request: ExtendedFastifyRequest, reply: FastifyReply ) {
    let true_path_to_the_asset_file = request.url.replace("/assets/", "src/web/")
    let asset_file_exists = await UtilsFile.IsFileExisting(true_path_to_the_asset_file)
    if (asset_file_exists) {
        let asset_file_mime_type = UtilsFile.DeduceMimeTypeByFileExtension(true_path_to_the_asset_file)
        if (asset_file_mime_type) {
            reply.type(asset_file_mime_type)
        }
        let asset_file = await fsPromise.readFile(true_path_to_the_asset_file)
        return reply.send(asset_file)
    }
    else {
        return reply.code(Globals.HttpStatusCode.NotFound).send()
    }
}

