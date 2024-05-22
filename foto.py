
import subprocess


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

if __name__ == "__main__":

    # We use try except statement so that whenever the user decides to terminate
    # this script or the server, we seamlessly print pretty messages instead of
    # ugly KeyboardInterrupt error when interrupting
    try:
        
        building_server_process = BuildServer()
        is_building_server_successful = building_server_process.returncode == 0
        ExitOnFail( is_building_server_successful, "failed to build the server!" )

        RunServer()

    except KeyboardInterrupt:
        print("") # we use this as most terminals prints ' ^C ' which obscures our print
        print("Exiting...")
        exit(0)
