
import http from 'node:http'
import assert from 'node:assert'
// @ts-ignore
import { HttpStatusCode } from '../../src/server/universal'
import HttpRequest from './http-request';

const SERVER = { host: 'localhost', port: 3000 }
const ServerRequestTemplate = new HttpRequest(SERVER.host, SERVER.port)

describe('HTML Pages', function() {

    describe('Homepage', function() {
        
        var homepage_with_sessionid_response;

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
                homepage_with_sessionid_response = response;
                assert.equal(response.statusCode, HttpStatusCode.FoundRedirection);
                done();
            };
            ServerRequestTemplate.Get('/', callback_test, { cookie: 'sessionid=dummy_sessionid;' });
        });
        
        it('should redirect to /home when in session', function() {
            assert.ok(homepage_with_sessionid_response?.headers['location']);
            assert.equal(homepage_with_sessionid_response?.headers['location'], '/home');
        });

    });

});

