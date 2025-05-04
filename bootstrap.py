
import os
import shutil
import subprocess
import typing
import psycopg
import time
import argparse
import glob


cli_arguments_parser = argparse.ArgumentParser()
cli_arguments_parser.add_argument('task', type=str)
ARGS = cli_arguments_parser.parse_args()


# CONSTANTS
# ---------------------------------------------------
class ANSI:
    ESC = "\u001b["
    bold = "1m"
    yellow = "33m"
    red = "31m"
    RESET = f"{ESC}0m"

class Address:
    def __init__(self, host, port):
        self.host = host
        self.port = port
        self.str_port = str(self.port)
        self.__http_address = f'http://{self.host}:{self.port}'
        self.__only_address = f'{self.host}:{self.port}'
    
    def getHttpAddress(self):
        return self.__http_address

    def getOnlyAddress(self):
        return self.__only_address
    
INFO_WATERMARK = f"{ANSI.ESC}{ANSI.bold}{ANSI.ESC}{ANSI.yellow}[bootstrap]:{ANSI.RESET}"
ERROR_WATERMARK = f"{ANSI.ESC}{ANSI.bold}{ANSI.ESC}{ANSI.red}[bootstrap]:"
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_CLUSTER = os.path.join(ROOT_DIR, "built/database-cluster")
POSTMASTER_PID = os.path.join(DATABASE_CLUSTER, 'postmaster.pid')
PROCESS_LIST = {}
SERVER_ADDRESS = Address(host='localhost', port=3000)
IMAGE_PIPELINE_SERVICE_ADDRESS = Address(host='localhost', port=3001)
NEXTJS_ADDRESS = Address(host='localhost', port=4000)
p_Server = "p_Server"
p_ImagePipelineService = "p_ImagePipelineService"
p_NextJs = "p_NextJs"
# ---------------------------------------------------

shutdown_routine_already_run = False

def info(msg):
    print(f"{INFO_WATERMARK} {msg}")

def error(msg):
    print(f"{ERROR_WATERMARK} {msg}{ANSI.RESET}")

def checkIfOnPath(*args):
    list_of_missing_executables = []
    for executable in args:
        executable_is_missing = shutil.which(executable) is None
        if executable_is_missing:
            list_of_missing_executables.append(executable)

    there_are_missing_executables = len(list_of_missing_executables) > 0
    if there_are_missing_executables:
        missing_execs = ", ".join(list_of_missing_executables)
        print(f"These missing tools are needed by bootstrap: {missing_execs}")
    status_if_good_to_go = not there_are_missing_executables 
    return status_if_good_to_go

def postgreSQLIsRunning():
    return os.path.exists(POSTMASTER_PID)

def handleExecutableArgument(args):
    args_list = list(args)
    running_an_executable_on_PATH = not (args_list[0].startswith(".") or os.path.isabs(args_list[0]))
    if running_an_executable_on_PATH:
        args_list[0] = shutil.which(args_list[0])
    return args_list

def runShell(*args):
    args_list = handleExecutableArgument(args)    
    return subprocess.run(args_list)

def getPostgreSQLServerStatus(dbname: str):
    return runShell("pg_isready", f"--dbname={dbname}").returncode

def runProcess(*args, msg_to_wait_for: str | None = None):
    args_list = handleExecutableArgument(args)
    process = subprocess.Popen(args_list, stdout=subprocess.PIPE)
    if msg_to_wait_for is not None:
        message_hasnt_been_logged_yet = True
        while message_hasnt_been_logged_yet:
            stdout_message = process.stdout.readline().decode("utf-8")
            message_hasnt_been_logged_yet = not (stdout_message.find(msg_to_wait_for) >= 0)
    return process

def processStillRunning(process: subprocess.Popen[bytes]):
    return process.poll() is None

def terminateProcess(process_symbol: any, msg: str | None = None):
    if process_symbol in PROCESS_LIST and\
        PROCESS_LIST[process_symbol] is not None:
        process = typing.cast(subprocess.Popen[bytes], PROCESS_LIST[process_symbol])
        if processStillRunning(process):
            if msg is not None:
                info(msg)
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()

def runExitRoutine():
    global shutdown_routine_already_run
    if shutdown_routine_already_run:
        return

    terminateProcess(p_Server, 
                     msg="shutting down server...")
    terminateProcess(p_ImagePipelineService, 
                     msg="shutting down image pipeline service...")
    terminateProcess(p_NextJs,
                     msg="shutting down nextjs...")

    if postgreSQLIsRunning():
        info("shutting down postgresql server...")
        runShell("pg_ctl", "stop", "-D", DATABASE_CLUSTER)

    shutdown_routine_already_run = True

def abortOnFail(
        process: subprocess.CompletedProcess[bytes],
        msg: str | None = None
    ):
    if process.returncode != 0:
        if msg is not None:
            error(msg)
        runExitRoutine()
        exit(1)


def catchOnError(func):
    def wrapped_function():
        try:
            func()
            runExitRoutine()
            exit(0)
        except Exception as e:
            error(e)
            runExitRoutine()
            exit(-1)
    return wrapped_function

def deleteFilesByGlob(glob_expr: str):
    for file in glob.iglob(glob_expr):
        os.remove(file)


# Hidden Tasks
# ---------------------------------------------------
def t_checkCliDependencies():
    there_are_missing_dependencies = not checkIfOnPath(
        'ffmpeg', 'go', 'initdb', 'postgres', 'createdb', 'pg_ctl',
        'psql', 'npm', 'node', 'npx', 'pg_isready'
    )
    if there_are_missing_dependencies:
        runExitRoutine()
        exit(-1)


def t_buildServer():
    info("building server...")
    process = runShell("npx", "tsc", "--project", "./src/server/tsconfig.json")
    abortOnFail(process, msg="failed to build the server!")

def t_buildImagePipelineService():
    info("building image pipeline service...")
    src = os.path.join(ROOT_DIR, "src/image-processing-service/")
    dest = os.path.join(ROOT_DIR, "built/foto-image-processing-service.exe") 
    process = runShell("go", "build", "-C", src, "-o", dest)
    abortOnFail(process, msg="failed to build the image pipeline service!")

def t_setupImageProcessingService():
    info("setting up image pipeline service...")
    thumbnails_directory = os.path.join(ROOT_DIR, "built/data/thumbnails/")
    photos_directory = os.path.join(ROOT_DIR, "built/data/photos/")
    os.makedirs(thumbnails_directory, exist_ok=True)
    os.makedirs(photos_directory, exist_ok=True)

def t_setupDatabaseCluster():
    database_cluster_does_not_exist = not os.path.exists(DATABASE_CLUSTER)
    if database_cluster_does_not_exist: 
        info("initializing database cluster...")
        process = runShell("initdb", "-D", DATABASE_CLUSTER)
        abortOnFail(process, msg="failed to initialize database cluster")
        info("successfully initialized database cluster!")

def t_runPostgreSQLServer():
    if postgreSQLIsRunning():
        return
    info("running postgresql server...")
    process = runShell("pg_ctl", "start", "-D", DATABASE_CLUSTER)
    abortOnFail(process, msg="failed to run postgresql server!")
    
    ACCEPTING_CONNECTIONS = 0
    REJECTING_CONNECTIONS = 1
    NO_RESPONSE_AFTER_ATTEMPT = 2
    NO_ATTEMPT_MADE = 3
    timeout_in_s = 60

    info("waiting for postgresql to be ready...")
    status = getPostgreSQLServerStatus("postgres")
    if status == ACCEPTING_CONNECTIONS: 
        return

    if status == NO_RESPONSE_AFTER_ATTEMPT or NO_ATTEMPT_MADE:
        error("something wrong in connecting to the PostgreSQL server!")
        runExitRoutine()
        exit(-1)

    if status == REJECTING_CONNECTIONS:
        postgresql_server_is_not_ready = status != 0
        starting_time = time.time()
        while postgresql_server_is_not_ready:
            elapsed_time = time.time() - starting_time
            if elapsed_time >= timeout_in_s:
                error("postgres took too much time to be ready, aborting...")
                runExitRoutine()
                exit(-1)
                return
            postgresql_server_is_not_ready = getPostgreSQLServerStatus("postgres") != 0
            time.sleep(5)

def t_setupFotoDatabase():
    db_connection = psycopg.connect("dbname=postgres")
    db_connection.autocommit = True
    db_cursor = db_connection.cursor()
    query_result = db_cursor.execute(
        "SELECT '1' FROM pg_database WHERE datname='fotodb'").fetchall()
    fotodb_does_not_exist = len(query_result) == 0
    if fotodb_does_not_exist:
        info("setting fotodb...")
        db_cursor.execute('CREATE DATABASE fotodb')
    db_cursor.close()
    db_connection.close()

def t_setupFotoDbSchema():
    setupdbschema_sql_file = os.path.join(ROOT_DIR, "src/database-schema.sql")
    info("setting foto database schema...")
    process = runShell("psql", "--dbname=fotodb", "-f", setupdbschema_sql_file)
    abortOnFail(process, msg="failed to setup database schema!")

def t_runServer():
    main_file = os.path.join(ROOT_DIR, "built/server/server.js")
    info("booting up server...")
    PROCESS_LIST[p_Server] = runProcess(
        "node", main_file, SERVER_ADDRESS.host, SERVER_ADDRESS.str_port,
        msg_to_wait_for="The development server is now running at"
    )
    info(f"server is now up and running! ({SERVER_ADDRESS.getHttpAddress()})")

def t_runImagePipelineService():
    image_pipeline_service = os.path.join(ROOT_DIR, 
                                          "built/foto-image-processing-service.exe")
    info("running image pipeline service...")
    PROCESS_LIST[p_ImagePipelineService] = runProcess(
        image_pipeline_service, 
        msg_to_wait_for="image processing service is now running at"
    )
    info(
        f"image pipeline service is now up and running! ({IMAGE_PIPELINE_SERVICE_ADDRESS.getOnlyAddress()})"
    )

def t_runNextJs():
    info("running nextjs app...")
    PROCESS_LIST[p_NextJs] = runProcess(
        "npx", "next", "dev", "-H", NEXTJS_ADDRESS.host, "-p", NEXTJS_ADDRESS.str_port,
        msg_to_wait_for='Ready in'
    )
    info(f"nextjs is now up and running! ({NEXTJS_ADDRESS.getHttpAddress()})")

def t_setupEnvVariables():
    os.environ['NEXTJS_APP_ADDRESS'] = NEXTJS_ADDRESS.getHttpAddress()

def t_buildTest():
    info("building tests...")
    process = runShell("npx", "tsc", "--project", "test/server/tsconfig.json")
    abortOnFail(process, msg='failed to build tests!')

def t_cleanDbRecords():
    info("cleaning all records from fotodb...")
    process = runShell('psql', '--dbname=fotodb', '-f', 'src/clean-db.sql')
    abortOnFail(process, msg='failed to clean records from fotodb!')

def t_cleanUserData():
    info("cleaning all user data...")
    deleteFilesByGlob('built/data/thumbnails/*')
    deleteFilesByGlob('built/data/photos/*')

def t_runTest():
    info("running tests...")
    process = runShell('npx', 'mocha', './built/test/server/**/*.test.js', '--require', './built/test/fixture.js')
    abortOnFail(process, msg='failed to run tests for some reason')

    
# ---------------------------------------------------

@catchOnError
def dev():
    t_setupEnvVariables()
    t_checkCliDependencies()
    t_buildServer()
    t_buildImagePipelineService()
    t_setupImageProcessingService()
    t_setupDatabaseCluster()
    t_runPostgreSQLServer()
    t_setupFotoDatabase()
    t_setupFotoDbSchema()

    t_runServer()
    t_runImagePipelineService()
    t_runNextJs()

    try:
        while True:
            continue
    except KeyboardInterrupt:
        # no need to invoke runExitRoutine since
        # the SIGINT signal it sent to all subprocesses automatically
        exit(0)

@catchOnError
def test():
    t_setupEnvVariables()
    t_checkCliDependencies()
    t_buildServer()
    t_buildTest()
    t_buildImagePipelineService()
    t_setupImageProcessingService()
    t_setupDatabaseCluster()
    t_runPostgreSQLServer()
    t_setupFotoDatabase()
    t_setupFotoDbSchema()

    t_runServer()
    t_runImagePipelineService()
    t_runTest()
    runExitRoutine()
    exit(-1)


@catchOnError
def clean():
    t_runPostgreSQLServer()
    t_cleanDbRecords()
    t_cleanUserData()
    runExitRoutine()
    exit(0)

if __name__ == "__main__":

    match ARGS.task:
        case 'dev':
            dev()
        case 'test':
            test()
        case 'clean':
            clean()
