
import { HttpStatusCode } from 'axios'
import axios from 'axios'
import assert from 'node:assert'

describe('APIs', function() {
    describe('POST /new/album', function() {

        const BASE_URL = 'http://localhost:3000/'

        it('should return appropriate responses for user not in session', async function() {
            let response = await axios.request({
                method: 'post', baseURL: BASE_URL, url: '/new/album',
                validateStatus: (_) => true
            })
            assert.deepEqual(response.status, HttpStatusCode.Unauthorized)
            assert.ok(!response.headers['content-type'])
        })

        it('should return appropriate response for request with unexpected content-type', async function() {
            let response = await axios.request({
                method: 'post', baseURL: BASE_URL, url: '/new/album', 
                headers: { 
                    Cookie: 'sessionid=dummy_sessionid',
                    'Content-Type': 'application/json'
                },
                validateStatus: (_) => true
            })
            assert.equal(response.status, HttpStatusCode.BadRequest)
        })

        it('should return successful response for a valid create album request', async function() {
            let response = await axios.request({
                method: 'post', baseURL: BASE_URL, url: '/new/album',
                headers: {
                    Cookie: 'sessionid=dummy_sessionid',
                    'Content-Type': 'text/plain'
                },
                data: 'SomeAlbum'
            })
            assert.equal(response.status, HttpStatusCode.Ok)
            assert.ok(response.data)
            assert.ok(response.headers['content-length'])
            assert.ok(response.headers['content-type'])
        })

    })
})