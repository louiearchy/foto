
import http from 'node:http'
import assert from 'node:assert'
// @ts-ignore
import { HttpStatusCode } from '../../src/server/universal'


function GetServer(
    host: string,
    port: number,
    path: string,
    callback: (response: http.IncomingMessage) => void,
    options?: { cookie: string },
) {
    let headers = (options && options?.cookie) ? { 'cookie': options.cookie } : {}; 
    http.get({
        host: host,
        port: port,
        path: path,
        headers
    }, callback)
}

function PostServer(
    host: string, 
    port: number,
    path: string,
    data: string | Buffer,
    headers?: any
): Promise<http.IncomingMessage> {
    return new Promise((resolve, reject) => {
        let options = {
            method: 'POST',
            host: host,
            port: port,
            path: path
        }
        
        if (headers)
            Object.defineProperty(options, 'headers', { value: headers, enumerable: true });

        let req = http.request(options, function(response) {
            resolve(response);
        });

        req.on('error', function(err) {
            reject(err);
        });

        req.write(data);
        req.end();
    })
}

async function RequestSessionID() {

    let data = 'username=random_username&password=random_password';
    let headers = { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': data.length };

    let response = await PostServer(
        'localhost', 
        3000, 
        '/sign-up',
        data,
        headers
    );

    let setcookie_header = response.headers['set-cookie']
    if (setcookie_header) {
        let sessionid = setcookie_header[0] + ";";
        return sessionid;
    }
    else {
        return '';
    }
}

describe('HTML Pages', function() {

    describe('Homepage', function() {

        var sessionid = ''
        var homepage_with_sessionid_response: http.IncomingMessage | undefined;

        before(async function() {
            sessionid = await RequestSessionID();
        });

        it('should return homepage when not logged in', function(done) {
            GetServer(
                'localhost',
                3000,
                '/',
                function(response) {
                    assert.equal(response.statusCode, HttpStatusCode.Ok);
                    assert.equal(response.headers["content-type"], "text/html");
                    let content_length = parseInt(response.headers["content-length"] ?? "0");
                    assert.ok(content_length > 0);
                    done();
                }
            );
        });

        it('should redirect if we\'re already in session', function(done) {
            GetServer(
                'localhost',
                3000,
                '/',
                function (response) {
                    homepage_with_sessionid_response = response
                    assert.equal(response.statusCode, HttpStatusCode.FoundRedirection);
                    done();
                },
                { cookie: sessionid }
            );
        });
        
        it('should redirect to /home when in session', function() {
            assert.ok(homepage_with_sessionid_response?.headers['location']);
            assert.equal(homepage_with_sessionid_response?.headers['location'], '/home');
        });

    });

});

