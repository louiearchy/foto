
import subprocess
import sys
import os
import zipfile

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

            RunServer()

        except KeyboardInterrupt:
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
