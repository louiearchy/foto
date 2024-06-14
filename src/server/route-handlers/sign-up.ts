
import { FastifyRequest, FastifyReply } from 'fastify'

import { AccountSubmissionInfo } from '../interfaces'
import DatabaseQueries from '../database-queries'
import Globals from '../globals'
import UtilsID from '../utility/id'

export default async function SignUpRequestHandler( request: FastifyRequest, reply: FastifyReply ){

    let account_submission_info = (request.body as AccountSubmissionInfo)

    let username_credential_is_missing = !(account_submission_info?.username)
    let password_credential_is_missing = !(account_submission_info?.password)
    
    if (username_credential_is_missing || password_credential_is_missing) {
        return reply.code(Globals.HttpStatusCode.BadRequest).send('MISSING ACCOUNT INFO')
    }

    /* if account info is submitted completely */

    let username = account_submission_info.username
    let password = account_submission_info.password

    const username_exists = await DatabaseQueries.CheckUsernameIfAlreadyRegistered(username)
    
    if (username_exists) {
        reply.code(Globals.HttpStatusCode.BadRequest).send('USERNAME ALREADY EXISTS')
        return
    }

    DatabaseQueries.RecordAccount(username, password)

    let session_id = UtilsID.GenerateSessionID()
    DatabaseQueries.SaveSession(username, session_id)

    reply.header('set-cookie', `sessionid=${session_id}`).code(Globals.HttpStatusCode.Ok)
    
}