package main

import (
	"fmt"
	"image"
	_ "image/jpeg"
	"math"
	"net"
	"os"
	"os/exec"
	"os/signal"
	"strings"
	"syscall"
)

const IDEAL_MAXIMUM_RESOLUTION = 500

func CalculateIdealDownResolutedPhotoDimnensions(photo_config *image.Config, maximum_resolution uint) (uint, uint) {
	aspect_ratio := float64(photo_config.Width) / float64(photo_config.Height)

	// for some reason, when we decode jpeg files with go
	// the dimensions gets swapped
	image_width := photo_config.Height

	ideal_image_height := aspect_ratio * float64(image_width)
	ideal_image_width := IDEAL_MAXIMUM_RESOLUTION

	return uint(ideal_image_width), uint(math.Round(ideal_image_height))
}

func PhotoNeedsDownResolution(photo_config *image.Config) bool {
	// for some reason, the image width and height gets swapped
	// in image.Config, so we swap it again
	image_width := photo_config.Height
	return image_width > 500
}

func DownResolutePhoto(path_to_photo string, path_to_output string, maximum_resolution uint) {

	photo_file, os_open_err := os.Open(path_to_photo)
	if os_open_err != nil {
		return
	}

	config, _, decode_config_err := image.DecodeConfig(photo_file)

	if decode_config_err != nil {
		photo_file.Close()
		return
	}

	if !PhotoNeedsDownResolution(&config) {
		photo_file.Close()
		return
	}

	ideal_width, ideal_height := CalculateIdealDownResolutedPhotoDimnensions(&config, maximum_resolution)
	scaling_value := fmt.Sprintf("%dx%d", ideal_width, ideal_height)

	ffmpeg_process := exec.Command("ffmpeg", "-i", path_to_photo, "-s", scaling_value, path_to_output)
	ffmpeg_process.Run()

	photo_file.Close()

}

func CheckIfFileExists(filepath string) bool {
	_, err := os.Stat(filepath)
	if err != nil {
		return false
	} else {
		return true
	}
}

func CheckIfFileDoesNotExist(filepath string) bool {
	return !CheckIfFileExists(filepath)
}

func HandleClient(client_connection net.Conn) {
	buffer := make([]byte, 1024)
	read_size, read_err := client_connection.Read(buffer)
	if read_err != nil {
		fmt.Println(read_err)
		client_connection.Close()
	}

	// DOWN-RESOLUTE <path/to/photo> <path/to/down-resoluted/photo>
	msg := string(buffer[:read_size])

	splitted_msg := strings.Split(msg, " ")
	command := splitted_msg[0]
	path_to_photo := splitted_msg[1]
	path_to_output := splitted_msg[2]

	if command != "DOWN-RESOLUTE" {
		client_connection.Write([]byte("INVALID COMMAND GIVEN"))
		client_connection.Close()
	}

	if CheckIfFileDoesNotExist(path_to_photo) {
		client_connection.Write([]byte("FILE DOES NOT EXIST"))
		client_connection.Close()
	}

	DownResolutePhoto(path_to_photo, path_to_output, IDEAL_MAXIMUM_RESOLUTION)
	client_connection.Write([]byte("OK"))
	client_connection.Close()
}

func info(msg string) {
	fmt.Printf("\u001b[1m\u001b[94m[imgproc]:\u001b[0m %s\n", msg)
}

func main() {

	server_address := "localhost:3001"
	signal_channel := make(chan os.Signal, 1)

	signal.Notify(signal_channel, syscall.SIGINT, syscall.SIGTERM)

	listener, listen_err := net.Listen("tcp", server_address)
	if listen_err != nil {
		info(listen_err.Error())
	}

	info(fmt.Sprintf("image processing service is now running at %s", server_address))

	go func() {
		signal_value := <-signal_channel
		info(fmt.Sprintf("detected %s", signal_value))
		info("image processing service is now exiting...")
		listener.Close()
		os.Exit(0)
	}()

	for {
		client_connection, err := listener.Accept()
		if err != nil {
			fmt.Println(err)
			continue
		}

		go HandleClient(client_connection)

	}

}
