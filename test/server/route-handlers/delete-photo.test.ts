
import { HttpStatusCode } from 'axios'
import axios from 'axios'
import assert from 'node:assert'

describe('APIs', function() {
    describe('DELETE /photo/id', function() {
        const _axios = axios.create({ 
            baseURL: 'http://localhost:3000', 
            validateStatus: (_) => true
        }) 
        it('should return appropriate response for user not in session',
            async function() {
                let response = await _axios.delete('/photo/photoid-001-001')
                assert.equal(response.status, HttpStatusCode.Unauthorized)
            }
        )
        it('should return appropriate response for user in session but does not own the photo',
            async function() {
                let headers = { Cookie: 'sessionid=dummy_sessionid2' }
                let response = await _axios.delete(
                    '/photo/photoid-001-001',
                    {headers}
                )
                assert.equal(response.status, HttpStatusCode.Unauthorized)
            }
        )
    })
})