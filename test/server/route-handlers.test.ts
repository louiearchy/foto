
import http from 'node:http'
import assert from 'node:assert'
// @ts-ignore
import { HttpStatusCode } from '../../src/server/universal'
import HttpRequest from './http-request';

const SERVER = { host: 'localhost', port: 3000 }
const ServerRequestTemplate = new HttpRequest(SERVER.host, SERVER.port)

async function RequestSessionID(): Promise<string> {
    return new Promise (( resolve, reject) => {

        let data = 'username=random_username&password=random_password';
        let headers = { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': data.length };
        let request_session_id_callback = (response) => {
            let setcookie_header = response.headers['set-cookie']
            if (setcookie_header) {
                let sessionid = setcookie_header[0] + ";";
                resolve(sessionid)
            }
            else {
                resolve('');
            }
        }

        ServerRequestTemplate.Post('/sign-up', request_session_id_callback, headers, data)
    })
}

describe('HTML Pages', function() {

    describe('Homepage', function() {

        var sessionid = ''
        var homepage_with_sessionid_response: http.IncomingMessage | undefined;

        before(async function() {
            sessionid = await RequestSessionID();
        });

        it('should return homepage when not logged in', function(done) {
            let callback_test = function(response: http.IncomingMessage) {
                assert.equal(response.statusCode, HttpStatusCode.Ok);
                assert.equal(response.headers["content-type"], "text/html");
                let content_length = parseInt(response.headers["content-length"] ?? "0");
                assert.ok(content_length > 0);
                done();
            }
            ServerRequestTemplate.Get('/', callback_test);
        });

        it('should redirect if we\'re already in session', function(done) {
            let callback_test = function(response: http.IncomingMessage) {
                homepage_with_sessionid_response = response
                assert.equal(response.statusCode, HttpStatusCode.FoundRedirection);
                done();
            };
            ServerRequestTemplate.Get('/', callback_test, { cookie: sessionid });
        });
        
        it('should redirect to /home when in session', function() {
            assert.ok(homepage_with_sessionid_response?.headers['location']);
            assert.equal(homepage_with_sessionid_response?.headers['location'], '/home');
        });

    });

});

