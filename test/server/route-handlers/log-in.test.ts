
import { HttpStatusCode } from 'axios'
import axios from 'axios'
import assert from 'node:assert'

describe('APIs', function() {
    describe('POST /log-in', function() {
        const _axios = axios.create({ baseURL: 'http://localhost:3000', validateStatus: (_) => true }) 
        const headers = { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}

        it('should have appropriate responses for incomplete requests', async function() {
            let response = await _axios.post(
                '/log-in', 
                'username=some', 
                headers
            )
            assert.equal(response.status, HttpStatusCode.BadRequest)
            response = await _axios.post(
                '/log-in',
                'password=some',
                headers
            )
            assert.equal(response.status, HttpStatusCode.BadRequest)
        })

        it('should have appropriate response for valid credentials', async function() {
            let response = await _axios.post(
                '/log-in',
                'username=dummy&password=dummypassword',
                headers
            )
            assert.equal(response.status, HttpStatusCode.Ok)
            assert.ok(response.data.length > 0)
            assert.ok(
                (response.headers['content-type'] as string).includes('text/plain')
            )
        })

        it('should have appropriate response for invalid credentials', async function() {
            let response = await _axios.post(
                '/log-in',
                'username=dummy&password=dummypassword234',
                headers
            )
            assert.equal(response.status, HttpStatusCode.NotFound)
            assert.equal(response.data.length, 0)
        })



    })
})