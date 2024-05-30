
import subprocess
import sys
import os
import zipfile
import psycopg
import datetime

PATH = os.getenv("PATH").split(";")
PATH.pop() # this removes the empty string at the end

DEFAULT_DATABASE_CLUSTER_PATH = "built/database-cluster/"
SERVER_DATABASE_HOST = "localhost"
SERVER_DATABASE_PORT = 5432
DATABASE_SERVER_PROCESS = None
POSTGRES_DATABASE_CONNECTION = None
FOTO_DATABASE_CONNECTION = None


class TimeoutManager:

    # Sets the timeout (in seconds unit)
    def __init__(self, timeout: int):
        self.timeout = timeout

    def start(self):
        self.starting_time = datetime.datetime.now()

    def isOverTimeout(self):
        ending_time = datetime.datetime.now()
        return (self.starting_time - ending_time).total_seconds() >= self.timeout
    


def RunShellCommand(cmd: str):
    return subprocess.run(cmd, shell=True)

def BuildServer():
    cmd = "npx tsc --project ./src/server/tsconfig.json"
    process = RunShellCommand(cmd)
    return process

def RunServer():
    return RunShellCommand("node ./built/server/server.js")

def ExitOnFail(condition: bool, message_when_process_fails: str | None = None):
    if condition == False:
        if message_when_process_fails != None:
            print(message_when_process_fails)
        exit(-1)

def IsRunningForPackingFonts():
    if len(sys.argv) == 2:
        return sys.argv[1].startswith("--pack-fonts")
    else:
        return False
    
def CheckRequiredFonts(path_to_fonts_directory: str, list_of_required_fonts: list[str]):
    for required_font in list_of_required_fonts:
        possible_path_to_required_font = os.path.join(path_to_fonts_directory, f"{required_font}.zip")
        if os.path.isfile(possible_path_to_required_font) == False:
            print(f"Missing required font: {required_font}")
            return False
    return True

def UnpackFont(path_to_font_zip: str, path_to_unpacked_fonts_directory: str):
    fontname = path_to_font_zip.split("\\")[-1].split(".")[0].lower()
    path_to_unpacked_fontname_directory = os.path.join(path_to_unpacked_fonts_directory, fontname)

    # we would not unpack a font again if it has been unpacked previously
    if os.path.isdir(path_to_unpacked_fontname_directory) == False:
        print(f"Unpacking {path_to_font_zip}...")
        zip_session = zipfile.ZipFile(path_to_font_zip)
        zip_session.extractall(path_to_unpacked_fontname_directory)
        zip_session.close()
    
def PackFonts(path_to_fonts_directory: str):
    list_of_required_fonts = [
        "Work_Sans"
    ]
    
    path_to_unpacked_fonts_directory = "built/web/fonts/"
    if os.path.isdir(path_to_unpacked_fonts_directory) == False:
        os.makedirs(path_to_unpacked_fonts_directory)

    print("Checking for required fonts...")
    CheckRequiredFonts(path_to_fonts_directory, list_of_required_fonts)

    for path_to_font_file in list_of_required_fonts:
        path_to_font_file = os.path.join(path_to_fonts_directory, f"{path_to_font_file}.zip")
        UnpackFont(path_to_font_file, path_to_unpacked_fonts_directory)



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
            database_connection = psycopg.connect(conninfo)
            return database_connection
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

def SetupTablesOnDatabase():
    
    cursor = FOTO_DATABASE_CONNECTION.cursor()
    create_accounts_table_cmd = """
        CREATE TABLE IF NOT EXISTS accounts (
            username varchar(255) NOT NULL,
            password varchar(255) NOT NULL,
            PRIMARY KEY (username)
        )
    """
    cursor.execute(create_accounts_table_cmd)

    create_sessions_table_cmd = """
        CREATE TABLE IF NOT EXISTS sessions (
            username varchar(255) NOT NULL,
            sessionid varchar(255) NOT NULL,
            PRIMARY KEY (sessionid)
        )
    """
    cursor.execute(create_sessions_table_cmd)
    FOTO_DATABASE_CONNECTION.commit()

def CloseConnectionIfExists(connection: psycopg.Connection):
    if connection != None:
        connection.close()

def CloseDatabaseServer():
    if DATABASE_SERVER_PROCESS != None:
        DATABASE_SERVER_PROCESS.terminate()
        # wait for the database server process to terminate
        # before this script exits
        while DATABASE_SERVER_PROCESS.poll() != None:
            continue

def FreeDatabaseRelatedResources():
    CloseConnectionIfExists( POSTGRES_DATABASE_CONNECTION )
    CloseConnectionIfExists( FOTO_DATABASE_CONNECTION )
    CloseDatabaseServer()
    

def FunctionFailed(value: bool):
    return value == False

def CheckPostgreSqlTools():
    
    print("Checking postgresql tools...")

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
        print("Missing postgresql tools: ", end="")
        no_of_missing_postgresql_tools = len(missing_postgresql_tools)
        index = 0
        for missing_tool in missing_postgresql_tools:
            if index < no_of_missing_postgresql_tools - 1:
                print(missing_tool, end=", ")
                index += 1
            else:
                print(missing_tool)
                index += 1
        print("Please check if they are installed correctly!")

    is_checking_successful = is_with_missing_postgresql_tools == False
    return is_checking_successful
    
def IsDatabaseClusterExisting():
    return os.path.isdir(DEFAULT_DATABASE_CLUSTER_PATH)

def RunDatabaseServer():
    print("Running database server...")
    global DATABASE_SERVER_PROCESS
    postgres = GetExecutablePath("postgres")
    try:
        DATABASE_SERVER_PROCESS = subprocess.Popen(
            [postgres, "-D", DEFAULT_DATABASE_CLUSTER_PATH]
        )
        return True
    except OSError:
        print("failed to run the database server!")
        return False


def SetupDatabaseCluster():
    if IsDatabaseClusterExisting() == False:
        print(f"Creating database cluster... {DEFAULT_DATABASE_CLUSTER_PATH}")
        command = f"initdb -D {DEFAULT_DATABASE_CLUSTER_PATH}"
        process = RunShellCommand(command)
        if process.returncode != 0:
            return False
        else:
            if os.path.isdir(DEFAULT_DATABASE_CLUSTER_PATH) == False:
                print("failed to create database cluster!")
                return False
            else:
                print(f"Successfully created database cluster! {DEFAULT_DATABASE_CLUSTER_PATH}")
                return True

def SetupDatabaseNTables():

    print("Establishing connection to postgres database...")
    if FunctionFailed( EstablishPostgresDatabaseServerConnection(timeout=30) ):
        return False

    print("Setting up foto database...")
    SetupFotoDatabase()

    print("Establishing connection to foto database...")
    if FunctionFailed( EstablishFotoDatabaseServerConnection(timeout=30) ):
        return False
    
    print("Setting up tables in foto database...")
    SetupTablesOnDatabase()

    return True



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

if __name__ == "__main__":

    # python foto.py
    is_running_for_building_and_running_dev_server = len(sys.argv) == 1

    # python foto.py --pack-fonts=<path/to/fonts/directory>
    is_running_for_packing_fonts = IsRunningForPackingFonts()

    if is_running_for_building_and_running_dev_server:
        # We use try except statement so that whenever the user decides to terminate
        # this script or the server, we seamlessly print pretty messages instead of
        # ugly KeyboardInterrupt error when interrupting
        try:
            
            building_server_process = BuildServer()
            is_building_server_successful = building_server_process.returncode == 0
            ExitOnFail( is_building_server_successful, "failed to build the server!" )

            ExitOnFail( SetupDatabase() )
            RunServer()

        except KeyboardInterrupt:
            FreeDatabaseRelatedResources()
            print("") # we use this as most terminals prints ' ^C ' which obscures our print
            print("Exiting...")
            exit(0)

    if is_running_for_packing_fonts:
        path_to_fonts_directory = sys.argv[1].split("=")[-1].replace("\"", "")
        if os.path.isdir(path_to_fonts_directory):
            PackFonts(path_to_fonts_directory)
        else:
            print(f"{path_to_fonts_directory} does not exist! please check!")
            exit(-1)
