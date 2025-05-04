
import { HttpStatusCode } from 'axios'
import axios, { AxiosRequestConfig } from 'axios'
import assert from 'node:assert'

const NO_BODY = ''

describe('APIs', function() {
    describe('GET /album/name/:albumid', function() {
        
        let response_for_valid_request;
        let response_for_invalid_albumid_request;
        let response_for_not_owner_client_request;

        before( async function () {
            response_for_valid_request = await axios_instance.get(
                '/album/name/albumid-001-001',
                { 
                    headers: { Cookie: 'sessionid=dummy_sessionid' }, 
                    responseType: 'text' 
                }
            )
            response_for_invalid_albumid_request = await 
                axios_instance.get('/album/name/:albumid', 
                {
                    headers: { Cookie: 'sessionid=dummy_sessionid' },
                    responseType: 'text'
                }
            )
            response_for_not_owner_client_request = await
                axios_instance.get(
                    '/album/name/albumid-001-001',
                    { 
                        headers: { Cookie: 'sessionid=dummy_sessionid2' },
                        responseType: 'text'
                    }
            )
        })

        let axios_instance = axios.create({
            baseURL: 'http://localhost:3000/',
            // to prevent Axios to throw an error for non-2xx responses 
            // while testing; we would handle the errors ourselves
            validateStatus: (_) => true
        })
        
        it('should return BadRequest if albumid was not given', async () => {
            let headers = { Cookie: 'sessionid=dummy_sessionid' }
            let request_config: AxiosRequestConfig<any> = 
                { headers, responseType: 'text' }
            let response = await axios_instance.get('/album/name/',  request_config)
            assert.equal(response.status, HttpStatusCode.BadRequest)
        })

        it('should return Unauthorized (400) if user has no sessionid', async () => {
            let response = await axios_instance.get(
                '/album/name/some-album-id', 
                { responseType: 'text' }
            )
            assert.equal(response.status, HttpStatusCode.Unauthorized)
        })


        describe('On a valid request', () => {
            it('should return a 200 Ok', () => {
                assert.equal(response_for_valid_request.status, HttpStatusCode.Ok)
            })
            it('should return the album name', () => {
                assert.equal(response_for_valid_request.data, 'My Album')
            })
            it('should respond with Content-Type', () => {
                assert.ok(response_for_valid_request.headers['content-type'])
            })
            it('should respond with Content-Length', () => [
                assert.ok(response_for_valid_request.headers['content-length'])
            ])
            it('should respond content-length greater than 0 bytes', () => {
                assert.ok(parseInt(response_for_valid_request.headers['content-length']) > 0)
            })
            it('should return a Content-Type of text/plain', () => {
                assert.equal(response_for_valid_request.headers['content-type'], 'text/plain')
            })
        })

        describe('On invalid albumid', async () => {
            it('should return 404 Not Found', () => {
                assert.equal(
                    response_for_invalid_albumid_request.status, 
                    HttpStatusCode.NotFound
                )
            })
            it('should not have Content-Type header', () => {
                assert.ok(
                    !response_for_invalid_albumid_request.headers['content-type']
                )
            })
            it('should not have any body', () => {
                assert.ok(
                    !response_for_invalid_albumid_request.data
                )
            })
        })

        describe('On client requesting another client\'s album name', async () => {
            it('should return 404 Not Found', () => {
                assert.equal(
                    response_for_not_owner_client_request.status, 
                    HttpStatusCode.NotFound
                )
            })
            it('should not return any album name', () => {
                assert.strictEqual(
                    response_for_not_owner_client_request.data, 
                    NO_BODY
                )
            })
            it('should not return any Content-Type header', () => {
                assert.ok(
                    !response_for_not_owner_client_request.headers['content-type']
                )
            })
        })

    })
})