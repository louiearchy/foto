
import { HttpStatusCode } from 'axios'
import axios from 'axios'
import assert from 'node:assert'

describe('APIs', function() {
    describe('GET /albums', function() {

        let base_axios_request;
        let response_for_user_not_on_session;
        let response_for_user_on_session;

        before (async function () {
            base_axios_request = await axios.create({
                baseURL: 'http://localhost:3000/',
                validateStatus: (_) => true
            })
            response_for_user_not_on_session = await base_axios_request.get('/albums')
            response_for_user_on_session = await base_axios_request.get(
                '/albums',
                {
                    headers: { Cookie: 'sessionid=dummy_sessionid' },
                    responseType: 'text'
                }
            )

        })

        it('should return 400 Unauthorized on user without sessionid', function() {
            assert.strictEqual(response_for_user_not_on_session.status, HttpStatusCode.Unauthorized)
        })

        it('should not return any data on user without sessionid', function() {
            assert.strictEqual(response_for_user_not_on_session.data, '')
        })

        it('should return the appropriate response contents', function() {
            let content_type = response_for_user_on_session.headers['content-type']
            assert.ok(content_type.includes('application/json'))
            assert.equal(response_for_user_on_session.status, HttpStatusCode.Ok)
        })

        it('should return expected albums', function() {
            let expected_data = [{"album_name": "My Album", "albumid": "albumid-001-001"}]
            let response_data = JSON.parse(response_for_user_on_session.data)
            assert.deepStrictEqual(response_data, expected_data)
        })


    })
})