
// @ts-ignore
import UtilsFile from '../../../src/server/utility/file' // this throws a rootDir error, but we ignore it
import assert from 'assert'

describe('UtilsFile', function() {
    describe('IsFileExisting()', function() {

        it('should return true when file exists', async function() {
            let does_file_exists = await UtilsFile.IsFileExisting('./package.json');
            assert.equal(does_file_exists, true);
        });

        it('should return false when file does not exist', async function() {
            let does_file_exists = await UtilsFile.IsFileExisting('./non-existing-file');
            assert.equal(does_file_exists, false);
        });

    });

    describe('DeduceMimeTypeByFileExtension()', function() {
        let pairs = [
            {
                filename: 'some.file.in.the.dir.js',
                expected_mime: 'text/javascript'
            },
            {
                filename: 'some.file.in.the.dir.css',
                expected_mime: 'text/css'
            },
            {
                filename: 'some.file.in.the.dir.otf',
                expected_mime: 'font/otf'
            },
            {
                filename: 'some.file.in.the.dir.ttf',
                expected_mime: 'font/ttf'
            },
            {
                filename: 'some.file.in.the.dir.svg',
                expected_mime: 'image/svg+xml'
            },
            {
                filename: 'some.file.in.the.dir.jpeg',
                expected_mime: 'image/jpeg'
            },
            {
                filename: 'some.file.in.the.dir.jpg',
                expected_mime: 'image/jpeg'
            },
            {
                filename: 'some.file.in.the.dir.png',
                expected_mime: 'image/png'
            },
            {
                filename: 'some.file.in.the.dir.webp',
                expected_mime: 'image/webp'
            },
            {
                filename: 'some.webp.unk',
                expected_mime: undefined
            }
        ];
        pairs.forEach( function (pair) {
            it(`should return appropriate mime: ${pair.expected_mime} for ${pair.filename}`, function() {
                assert.equal(UtilsFile.DeduceMimeTypeByFileExtension(pair.filename), pair.expected_mime);
            });
        });
    });

    describe('DeduceFileExtensionByContentType()', function() {
        let pairs = [
            ['image/jpeg', 'jpeg'],
            ['image/png', 'png'],
            ['image/webp', 'webp']
        ];
        pairs.forEach( function (pair) {
            let mime = pair[0];
            let file_extension = pair[1];
            it(`should return appropriate file extension: '${file_extension}' of '${mime}'`, function() {
                assert.equal(UtilsFile.DeduceFileExtensionByContentType(mime), file_extension);
            });
        });
    });

    describe('GetFilenameFromFilePath()', function() {
        it('should return correct filename', function() {
            assert.equal(UtilsFile.GetFilenameFromFilePath('/some/dir/in/the/directory/a-filename.txt'), 'a-filename.txt');
        });
        it('should return an empty string if the path ends with a directory', function(){
            assert.equal(UtilsFile.GetFilenameFromFilePath('/some/dir/'), '');
        });
    });

    describe('ReplaceFileExtension()', function() {
        it('should replace the file extension on a simple filename', function() {
            assert.equal(UtilsFile.ReplaceFileExtension('filename.txt', '.png'), 'filename.png');
        });
        it('should still yield the same result if the given target file extension does not come with a dot', function(){
            assert.equal(UtilsFile.ReplaceFileExtension('filename.txt', 'png'), 'filename.png');
        });
        it('should replace the file extension from multiple dotted filepath', function() {
            assert.equal(UtilsFile.ReplaceFileExtension('some.filename.txt', '.png'), 'some.filename.png');
        });
        it('should add an extension for filepath that ends with a "."', function() {
            assert.equal(UtilsFile.ReplaceFileExtension('some.filename.', 'png'), 'some.filename.png');
            assert.equal(UtilsFile.ReplaceFileExtension('some.filename.', '.png'), 'some.filename.png');
        });
    });

});