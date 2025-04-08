
import http from 'node:http'
import assert from 'node:assert'
// @ts-ignore
import { HttpStatusCode } from '../../src/server/universal'
import HttpRequest from './http-request';

const SERVER = { host: 'localhost', port: 3000 }
const ServerRequestTemplate = new HttpRequest(SERVER.host, SERVER.port)

describe('APIs', function() {
    describe('GET /album/name/:albumid', function() {

        let valid_album_name_request_incomingmessage: http.IncomingMessage | undefined;
        let valid_album_name_request_data = ""

        let invalid_album_id_for_album_name_request_incomingmessage: http.IncomingMessage | undefined
        let invalid_album_id_for_album_name_request_data = ""

        // This is for requests that wants to retrieve the name of an album
        // that they do not own or unauthorized to do so
        let invalid_session_id_request_incomingmessage: http.IncomingMessage | undefined
        let invalid_session_id_request_data = ""

        before(function(done) {
            ServerRequestTemplate.AsyncGet('/album/name/albumid-001-001', async function(response: http.IncomingMessage) {
                return new Promise((asyncResolve, reject) => {
                    response.on('data', function(chunk) {
                        valid_album_name_request_data += chunk.toString()
                    });
                    response.on('end', function() {
                        valid_album_name_request_incomingmessage = response
                        done()
                        asyncResolve()
                    })
                });
            }, { cookie: 'sessionid=dummy_sessionid;'})
        })

        before(function(done) {
            ServerRequestTemplate.AsyncGet('/album/name/invalid-album-id', async function(response: http.IncomingMessage) {
                return new Promise((resolve, reject) => {
                    response.on('data', function(chunk) {
                        invalid_album_id_for_album_name_request_data += chunk.toString()
                    })
                    response.on('end', function() {
                        invalid_album_id_for_album_name_request_incomingmessage = response
                        done()
                        resolve()
                    })
                });
            }, { cookie: 'sessionid=dummy_sessionid' })
        })

        before(function(done) {
            ServerRequestTemplate.AsyncGet('/album/name/albumid-001-001', async function (response: http.IncomingMessage) {
                return new Promise((resolve, reject) => {
                    response.on('data', function(chunk) {
                        invalid_session_id_request_data += chunk.toString()
                    })
                    response.on('end', function() {
                        invalid_session_id_request_incomingmessage = response
                        done()
                        resolve()
                    })
                })
            }, { cookie: 'sessionid=dummy_sessionid2' })
        })
            
        
        describe('Scenario 1: No albumid was given', function() {
            it('should respond 400 Bad Request when the client requests', function(done) {
                ServerRequestTemplate.Get('/album/name/', function(response) {
                    assert.equal(response.statusCode, HttpStatusCode.BadRequest);
                    done();
                })
            });
        });
        
        describe('Scenario 2: No sessionid when requesting for this route', function() {
            it('should respond 401 Unauthorized', function(done) {
                ServerRequestTemplate.Get('/album/name/some-album-id', function(response) {
                    assert.equal(response.statusCode, HttpStatusCode.Unauthorized);
                    done();
                });
            });
        });
        
        describe('Scenario 3: A complete and valid request', function() {
            it('should return a 200 Ok on a complete valid request', function() {
                assert.equal(valid_album_name_request_incomingmessage.statusCode, HttpStatusCode.Ok);
            })
            it('should return an album name if the owner has it', function() {
                assert.equal(valid_album_name_request_data, "My Album");
            })
            it('should have a content-type in its response', function() {
                assert.ok(valid_album_name_request_incomingmessage?.headers['content-type'])
            })
            it('should have a content-length in its response', function() {
                assert.ok(valid_album_name_request_incomingmessage?.headers['content-length'])
            })
            it('should have a content-length greater than 0 bytes', function() {
                assert.ok(parseInt(valid_album_name_request_incomingmessage?.headers['content-length']) > 0)
            })
            it('should return a text/plain content-type', function() {
                assert.ok(valid_album_name_request_incomingmessage?.headers['content-type'].includes('text/plain'))
            }) 
        })

        describe('Scenario 4: Invalid albumid was given', function() {
            it('should return a 404 Not Found', function() {
                assert.equal(invalid_album_id_for_album_name_request_incomingmessage.statusCode, HttpStatusCode.NotFound)
            })
            it('should not have content-type header', function() {
                assert.ok(!invalid_album_id_for_album_name_request_incomingmessage?.headers['content-type'])
            })
            it('should not return any body data', function() {
                assert.equal(invalid_album_id_for_album_name_request_data.length, 0);
            })
        })

        describe('Scenario 5: Unauthorized client requesting other client\'s album names', function() {
            it('should return a 404 Not Found', function() {
                assert.equal(invalid_session_id_request_incomingmessage.statusCode, HttpStatusCode.NotFound)
            })
            it('should not return any album name', function() {
                assert.equal(invalid_session_id_request_data.length, 0)
                assert.equal(invalid_session_id_request_incomingmessage?.headers['content-length'], '0')
            })
            it('should not have content-type header', function() {
                assert.ok(!invalid_session_id_request_incomingmessage?.headers['content-type'])
            })
        })
    });
})