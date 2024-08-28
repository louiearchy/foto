
import gulp from 'gulp'
import mocha from 'gulp-mocha'
import ts from 'gulp-typescript'
import childprocess from 'node:child_process'

const tsTestProject = ts.createProject('built/test/tsconfig.json', {
        target: 'ES6',
        allowSyntheticDefaultImports: true,
        moduleResolution: 'nodenext',
        module: 'nodenext'
})

const serverDestinationFolder = 'built/src/server';

const serverProject = ts.createProject(serverDestinationFolder, {
    target: 'ES6',
    allowSyntheticDefaultImports: true,
    moduleResolution: 'nodenext',
    module: 'nodenext'
});

var development_server_process;

// This serves as a reference to check if all of the processes
// needed is now running
var development_server_processes_track = {
    server: false,
    img_processing_service: false
}

function RunDevServerInternal() {
    return new Promise( (resolve, reject) => {
        
        development_server_process = childprocess.spawn('python foto.py', { shell: true });

        // We cannot use the 'spawn' event as a way to detect if the server
        // has started, then invoking the gulp callback function, because it only
        // tells us that the python bootloader script spawned but not the server
        // itself, so we can only detect if the server is now running and ready
        // to listen for clients when we detect the message "The development server is now running..."
        development_server_process?.stdout?.on('data', function(data){
            let msg = data.toString('utf-8');
            
            if (/The development server is now running at http:\/\/*/.test(msg)) {
                development_server_processes_track.server = true;
                let all_server_processes_is_now_running = 
                    development_server_processes_track.server && development_server_processes_track.img_processing_service;
                if (all_server_processes_is_now_running)
                    resolve();
            }

            if (/image processing service is now running at localhost:3001/.test(msg)) {
                development_server_processes_track.img_processing_service = true;
                let all_server_processes_is_now_running =
                    development_server_processes_track.server && development_server_processes_track.img_processing_service;
                
                if (all_server_processes_is_now_running)
                    resolve();
            }

            if (/panic: runtime error: \w+/.test(msg)) {
                reject('Runtime error occurred in running image processing service!');
            }

        });
        development_server_process.on('error', (err) => reject(err));
    });
}

function ShutdownDevServerInternal() {
    return new Promise((resolve, reject) => {
        development_server_process?.on('exit', function() {
            resolve();
        });
        development_server_process?.kill();
    })
}

function RunSqlFile(path_to_sql_file) {
    return new Promise((resolve, reject) => {
        let sql_process = childprocess.spawn(`psql -d fotodb -f ${path_to_sql_file} --quiet`, { shell: true });
        sql_process.on('exit', resolve);
        sql_process.on('error', reject);
    })
}


// This is neccessary to run before running tests since we're interacting
// with the database
async function clean_db() {
    await RunSqlFile('src/reset-db.sql');
}

async function populate_db_with_dummy_data() {
    await RunSqlFile('test/server/populate-with-data.sql');
}

export async function run_dev_server() {
    await RunDevServerInternal();
}

export async function shutdown_server() {
    await ShutdownDevServerInternal();
}

export function build_server() {
    return gulp.src('src/server/**/*.ts').pipe(serverProject()).pipe(gulp.dest(serverDestinationFolder));
}

function build_test() {
    return gulp.src('test/**/*.ts').pipe(tsTestProject()).pipe(gulp.dest('built/test/'))
}

async function run_test() {
    return gulp.src('built/test/**/*.js', { read: false })
               .pipe(mocha({exit: true}));
}


export const test = gulp.series(
    build_server, 
    build_test, 
    run_dev_server,
    clean_db,
    populate_db_with_dummy_data,
    run_test, 
    shutdown_server
);
