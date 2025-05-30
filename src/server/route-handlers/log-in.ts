
import { FastifyRequest, FastifyReply } from 'fastify'

import { AccountSubmissionInfo } from '../interfaces'
import DatabaseQueries from '../database-queries'
import Globals from '../globals'
import UtilsID from '../utility/id'

export default async function LogInRouteHandler(request: FastifyRequest, reply: FastifyReply) {
    
    let account_submission_info = (request.body as AccountSubmissionInfo)

    let username_credential_is_missing = !(account_submission_info?.username)
    let password_credential_is_missing = !(account_submission_info?.password)
    
    if (username_credential_is_missing || password_credential_is_missing) {
        return reply.code(Globals.HttpStatusCode.BadRequest).send('MISSING ACCOUNT INFO')
    }

    /* if account info is submitted completely */

    let username = account_submission_info.username
    let password = account_submission_info.password
    let account_doesnt_exist = !(await DatabaseQueries.QueryAccountInfo(username, password))

    if (account_doesnt_exist)
        return reply.code(Globals.HttpStatusCode.NotFound).send()

    let session_id = UtilsID.GenerateSessionID()
    await DatabaseQueries.SaveSession(username, session_id)
    return reply.code(Globals.HttpStatusCode.Ok).send(session_id)
        
}