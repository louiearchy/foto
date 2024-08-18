
// @ts-ignore
import JSONifyCookies from '../../../src/server/utility/jsonify-cookies'
import assert from 'assert'

describe('JSONifyCookies', function() {
    it('should return a paired json for a single cookie', function() {
        assert.deepEqual(
            JSONifyCookies('somecookie=somevalue'),
            { somecookie: 'somevalue' }
        );
        assert.deepEqual(
            JSONifyCookies('somecookie=somevalue;'),
            { somecookie: 'somevalue' }
        );
    });
    it('should be able to handle itself from double cookies', function() {
        assert.deepEqual(
            JSONifyCookies('somecookie=somevalue;somecookie=anothervalue'),
            { somecookie: 'anothervalue' }
        );
    });
    it('should be able to ignore cookies that are missing values', function() {
        assert.deepEqual(
            JSONifyCookies('somecookie=withvalue;anothercookie=;anotheranothercookie;'),
            { somecookie: 'withvalue' }
        );
    });
})