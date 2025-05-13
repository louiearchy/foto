
import { HttpStatusCode } from 'axios'
import axios from 'axios'
import assert from 'node:assert'

describe('APIs', function() {
    describe('DELETE /album/id', function() {
        const _axios = axios.create({baseURL: 'http://localhost:3000', validateStatus: (_) => true})
        it('should return appropriate response for user not in session', 
            async function() {
                let response = await _axios.delete('/album/albumid-001-001')
                assert.equal(response.status, HttpStatusCode.Unauthorized)
            }
        )
        it('should return appropriate response for user missing an albumid',
            async function() {
                let response = await _axios.delete('/album/')
                assert.equal(response.status, HttpStatusCode.BadRequest)
            }
        )
        it('should return appropriate response for user trying to delete not owned album', 
            async function() {
                let headers = { Cookie: 'sessionid=dummy_sessionid2' }
                let response = await _axios.delete('/album/albumid-001-001', {headers})
                assert.equal(response.status, HttpStatusCode.Unauthorized)
            }
        )
        it('should return appropriate respone for user deleting its own album', 
            async function() {
                let headers = { Cookie: 'sessionid=dummy_sessionid' }
                let response = await _axios.delete('/album/albumid-001-001', {headers})
                assert.equal(response.status, HttpStatusCode.Ok)
            }
        )
    })
})