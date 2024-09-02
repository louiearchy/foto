
import glob
import subprocess
import os
import psycopg
import re
import sys
import datetime
import shutil
import signal

PATH = os.getenv("PATH").split(";")
PATH.pop() # this removes the empty string at the end
CLI_ARGS = sys.argv[1:]

DEFAULT_DATABASE_CLUSTER_PATH = "built/database-cluster/"
SERVER_DATABASE_HOST = "localhost"
SERVER_DATABASE_PORT = 5432
POSTGRES_DATABASE_CONNECTION = None
FOTO_DATABASE_CONNECTION = None
IMAGE_PROCESSING_SERVICE = None
SERVER_PROCESS = None

class ANSI:
    
    ESC = "\u001b["

    bold = "1m"

    yellow = "33m"
    red = "31m"

    RESET = f"{ESC}0m"
    

class Log:

    def info(msg):
        print(f"{ANSI.ESC}{ANSI.bold}{ANSI.ESC}{ANSI.yellow}[foto.py]:", end=f"{ANSI.RESET} ")
        print(msg)

    def error(msg):
        print(f"{ANSI.ESC}{ANSI.bold}{ANSI.ESC}{ANSI.red}[foto.py]:", end=f"{ANSI.RESET} ")
        print(msg)


class TimeoutManager:

    # Sets the timeout (in seconds unit)
    def __init__(self, timeout: int):
        self.timeout = timeout

    def start(self):
        self.starting_time = datetime.datetime.now()

    def isOverTimeout(self):
        ending_time = datetime.datetime.now()
        return (self.starting_time - ending_time).total_seconds() >= self.timeout

def RunShellCommand(cmd: str, no_output: bool = False, no_stdin: bool = False):
    stdout_pipe = subprocess.DEVNULL if no_output else None
    stderr_pipe = stdout_pipe
    stdin_pipe = subprocess.DEVNULL if no_stdin else None
    return subprocess.run(cmd, shell=True, stdout=stdout_pipe, stderr=stderr_pipe, stdin=stdin_pipe)

def BuildServer():
    cmd = "npx tsc --project ./src/server/tsconfig.json"
    process = RunShellCommand(cmd)
    return process

# The separate_thread_mode here specifies that whether the server subprocess
# should block the main thread until it ends or not, when true, the server subprocess
# doesn't block the thread and this script is free to do other things
def RunServer(host: str, port: int, separate_thread_mode: bool):
    run_server_cmd = f"node ./built/server/server.js {host} {port}"
    if separate_thread_mode:
        return subprocess.Popen(run_server_cmd)
    else:
        return RunShellCommand(f"node ./built/server/server.js {host} {port}")

def ExitOnFail(condition: bool, message_when_process_fails: str | None = None):
    if condition == False:
        if message_when_process_fails != None:
            Log.error(message_when_process_fails)
        exit(-1)

def GetExecutablePath(executable: str):
    global PATH
    possible_executable_extensions = [".exe", ".bat"]
    for path_entry in PATH:
        for extension in possible_executable_extensions:
            possible_path_to_executable = os.path.join(path_entry, f"{executable}{extension}")
            if os.path.exists(possible_path_to_executable):
                return possible_path_to_executable
            else:
                continue
    return None

def CheckIfOnPath(executable: str):
    return GetExecutablePath(executable) != None

def EstablishDatabaseServerConnection(dbname: str, timeout: int):
    timeout_checker = TimeoutManager(timeout)
    timeout_checker.start()
    conninfo = f"dbname={dbname}"

    while (True):
        try:
            # It is possible that connecting to the database server might take some time
            # so we supply a connect_timeout parameter to psycopg
            database_connection = psycopg.connect(conninfo, connect_timeout=timeout)
            return database_connection
        # It is possible that the database server isn't ready yet
        # when we try to establish connection with it, so we should expect
        # a psycopg.OperationalError
        except psycopg.OperationalError:
            if timeout_checker.isOverTimeout():
                return None
            else:
                continue

def EstablishPostgresDatabaseServerConnection(timeout: int):
    global POSTGRES_DATABASE_CONNECTION
    POSTGRES_DATABASE_CONNECTION = EstablishDatabaseServerConnection("postgres", timeout)
    if POSTGRES_DATABASE_CONNECTION == None:
        return False
    else:
        POSTGRES_DATABASE_CONNECTION.autocommit = True
        return True

def EstablishFotoDatabaseServerConnection(timeout: int):
    global FOTO_DATABASE_CONNECTION
    FOTO_DATABASE_CONNECTION = EstablishDatabaseServerConnection("fotodb", timeout)
    if FOTO_DATABASE_CONNECTION == None:
        return False
    else:
        return True

def CheckIfDatabaseExists(connection: psycopg.Connection, dbname: str):
    cursor = connection.cursor()
    cursor.execute(f"SELECT EXISTS (SELECT datname FROM pg_catalog.pg_database WHERE datname='{dbname}')")
    does_db_exists = cursor.fetchall()[0][0]
    return does_db_exists

def SetupFotoDatabase():

    is_fotodb_existing = CheckIfDatabaseExists(POSTGRES_DATABASE_CONNECTION, "fotodb")

    if is_fotodb_existing == False:
        cursor = POSTGRES_DATABASE_CONNECTION.cursor()
        create_foto_database_cmd = "CREATE DATABASE fotodb"
        cursor.execute(create_foto_database_cmd)


def CloseConnectionIfExists(connection: psycopg.Connection, msg: str = ""):
    if connection != None:
        Log.info(msg)
        connection.close()

def CloseDatabaseServer():
    if os.path.exists("./built/database-cluster/postmaster.pid"):
        RunShellCommand(f"pg_ctl stop -D {DEFAULT_DATABASE_CLUSTER_PATH} -m fast", no_stdin=False)

def FreeDatabaseRelatedResources():
    global POSTGRES_DATABASE_CONNECTION, FOTO_DATABASE_CONNECTION
    CloseConnectionIfExists( POSTGRES_DATABASE_CONNECTION,msg="closing postgres database connection..." )
    CloseConnectionIfExists( FOTO_DATABASE_CONNECTION, msg="closing foto database connection..." )
    CloseDatabaseServer()
    

def FunctionFailed(value: bool):
    return value == False

def CheckPostgreSqlTools():
    
    Log.info("checking postgresql tools...")

    is_initdb_on_path = CheckIfOnPath("initdb")
    is_postgres_on_path = CheckIfOnPath("postgres")
    is_createdb_on_path = CheckIfOnPath("createdb")
    missing_postgresql_tools = []

    if is_initdb_on_path == False:
        missing_postgresql_tools.append("initdb")    
    
    if is_postgres_on_path == False:
        missing_postgresql_tools.append("postgres")

    if is_createdb_on_path == False:
        missing_postgresql_tools.append("createdb")

    is_with_missing_postgresql_tools = len(missing_postgresql_tools) > 0
        
    if is_with_missing_postgresql_tools:
        Log.error(f"missing postgresql tools: {','.join(missing_postgresql_tools)}")
        Log.error("please check if they are installed correctly")

    is_checking_successful = is_with_missing_postgresql_tools == False
    return is_checking_successful
    
def IsDatabaseClusterExisting():
    return os.path.isdir(DEFAULT_DATABASE_CLUSTER_PATH)

def RunDatabaseServer():
    Log.info("running database server...")
    pg_ctl = GetExecutablePath("pg_ctl")
    try:
        RunShellCommand(' '.join([pg_ctl, "start", "-D", DEFAULT_DATABASE_CLUSTER_PATH]), no_stdin=True)
        return True
    except OSError:
        Log.info("failed to run the database server!")
        return False


def SetupDatabaseCluster():
    if IsDatabaseClusterExisting() == False:
        Log.info(f"creating database cluster {DEFAULT_DATABASE_CLUSTER_PATH}")
        command = f"initdb -D {DEFAULT_DATABASE_CLUSTER_PATH}"
        process = RunShellCommand(command, no_output=True)
        if process.returncode != 0:
            return False
        else:
            if os.path.isdir(DEFAULT_DATABASE_CLUSTER_PATH) == False:
                Log.error("failed to create database cluster!")
                return False
            else:
                Log.error(f"Successfully created database cluster! {DEFAULT_DATABASE_CLUSTER_PATH}")
                return True

def SetupFotoDatabaseSchema():
    process = RunShellCommand(f"psql -d fotodb -f src/database-schema.sql --quiet", no_output=True) 
    return process.returncode == 0

def SetupDatabaseNTables():

    Log.info("establishing connection to postgres database...")
    if FunctionFailed( EstablishPostgresDatabaseServerConnection(timeout=30) ):
        return False

    Log.info("setting up foto database...")
    SetupFotoDatabase()

    Log.info("defining database schema...")
    if FunctionFailed(SetupFotoDatabaseSchema()):
        return False

    return True

def ShutdownImageProcessingService():
    global IMAGE_PROCESSING_SERVICE
    if IMAGE_PROCESSING_SERVICE != None:
        Log.info("shutting down image processing service...")
        IMAGE_PROCESSING_SERVICE.terminate()

def RunImageProcessingService():
    global IMAGE_PROCESSING_SERVICE
    try: 
        IMAGE_PROCESSING_SERVICE = subprocess.Popen(
            "go run src/image-processing-service/main.go", shell=True
        )
        return True
    except OSError:
        Log.error("failed to run the database server!")
        return False



def SetupDatabase():

    if FunctionFailed( CheckPostgreSqlTools() ):
        return False
    
    if FunctionFailed( SetupDatabaseCluster() ):
        return False
    
    if FunctionFailed( RunDatabaseServer() ):
        return False
    
    if FunctionFailed( SetupDatabaseNTables() ):
        return False

    
    return True

def SetupImageProcessingService():

    thumbnail_directory_path = "built/data/thumbnails/"
    if os.path.exists(thumbnail_directory_path) == False:
        os.makedirs(thumbnail_directory_path)
    
    photos_directory_path = "built/data/photos/"
    if os.path.exists(photos_directory_path) == False:
        os.makedirs(photos_directory_path)

def FotoPyExit(code, frame):
    # we terminate the server process first before
    # terminating the db server to prevent errors in regards to
    # postgresql connection
    if SERVER_PROCESS != None:
        SERVER_PROCESS.terminate()
        SERVER_PROCESS.wait()
    FreeDatabaseRelatedResources()
    ShutdownImageProcessingService()
    Log.info("exiting...")
    sys.exit(0)

def RunDevelopmentServer(host: str = "localhost", port: int = 3000, detached_mode: bool = False):

    ExitOnFail(CheckIfOnPath("ffmpeg"), "ffmpeg is needed!")
    ExitOnFail(CheckIfOnPath("go"), "go is needed!")

    Log.info("building server...")
    building_server_process = BuildServer()
    is_building_server_successful = building_server_process.returncode == 0
    ExitOnFail( is_building_server_successful, "failed to build the server!" )

    Log.info("building image processing service...")
    SetupImageProcessingService()

    Log.info("setting up database...")
    ExitOnFail( SetupDatabase() )
    ExitOnFail( RunImageProcessingService() )

    if detached_mode:
        return RunServer(host, port, detached_mode)
    else:
        RunServer(host, port, False)
        

def DeleteFilesByGlob(glob_expr: str):
    for file in glob.iglob(glob_expr):
        os.remove(file)

def DeletePhotos():

    DeleteFilesByGlob("built/data/thumbnails/*")
    DeleteFilesByGlob("built/data/photos/*")

def CleanData():

    global FOTO_DATABASE_CONNECTION

    Log.info("cleaning data...")

    if FunctionFailed( RunDatabaseServer() ):
        return

    Log.info("deleting all records...")
    RunShellCommand("psql -d fotodb -f src/reset-db.sql", no_stdin=True)

    Log.info("deleting all photos from built/...")
    DeletePhotos()

    FreeDatabaseRelatedResources()

def DeleteDir(dirpath: str):
    if os.path.exists(dirpath):
        shutil.rmtree(dirpath)

def HardReset():
    
    Log.info("deleting database cluster...")
    if os.path.exists("built/database-cluster/"):
        shutil.rmtree("built/database-cluster/")
    
    Log.info("deleting photos...")
    DeleteDir("built/data/photos/")

    Log.info("deleting compiled files...")
    DeleteFilesByGlob("built/*.json")
    DeleteDir("built/server/")
    DeleteDir("built/web/")

def BuildTest():
    RunShellCommand("npx tsc --project test/server/tsconfig.json")

def RunTest():
    Log.info("running test...")
    RunShellCommand("npx mocha './built/test/server/**/*.test.js' --require './built/test/fixture.js'")

if __name__ == "__main__":

    no_arguments_were_given = len(CLI_ARGS) == 0
    there_were_arguments_given = not no_arguments_were_given

    signal.signal(signal.SIGINT, FotoPyExit)
    signal.signal(signal.SIGTERM, FotoPyExit)

    if no_arguments_were_given:
        RunDevelopmentServer()
    
    elif there_were_arguments_given:

        if re.match("--host=\\d+", CLI_ARGS[0]):
            host = CLI_ARGS[0].replace("--host=", "")
            RunDevelopmentServer(host, 80)
            FotoPyExit()

        task = CLI_ARGS[0].lower()

        match task:

            case "clean-data":
                CleanData()

            case "hard-reset":
                HardReset()
            
            case "test":
                BuildTest()
                SERVER_PROCESS = RunDevelopmentServer(detached_mode=True)
                RunTest()
                FotoPyExit(2, None)
            
            case _:
                Log.error(f"unrecognized task: {task}")