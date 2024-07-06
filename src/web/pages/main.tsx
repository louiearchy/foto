
import React from "react"
import ReactDOM from "react-dom/client"
import ReactRouterDOM from "react-router-dom"
import $ from "jquery"

const rootdiv = document.createElement("root")
const root = ReactDOM.createRoot(rootdiv)


interface AlbumEntry {
    album_name: string,
    albumid?: string
}

interface PhotoEntry {
    key: string,
    url: string
}

type AlbumEntries = AlbumEntry[]

var currently_viewed_album: string = ''
var dummy_key_track = 1

namespace FotoBackendAPI {

    class FotoBackendEvent extends EventTarget {
        constructor() {
            super()
        }
    }

    var albums: AlbumEntries = [{album_name: 'All Photos', albumid: undefined}]
    var foto_backend_event = new FotoBackendEvent()
    var events = {
        ALBUM_NAME_RECEIVED: new Event('ALBUM_NAME_RECEIVED'),
        ALBUMS_LOADED: new Event('ALBUMS_LOADED')
    }

    export var EventHook = foto_backend_event
    export var Events = events

    export function GetAlbums() {
        return albums
    }

    export function GetAlbumsFromServer() {
        let request = $.ajax('/albums', {
            method: 'GET',
            dataType: 'json'
        })
        request.done((albums_sent_by_the_server: AlbumEntries) => {
            albums.push(...albums_sent_by_the_server)
            foto_backend_event.dispatchEvent(events.ALBUMS_LOADED)
        })
        request.fail( (textstatus, error_thrown) => {
            console.log(textstatus)
            console.log(error_thrown)
        })
    }

    export function GetAlbumID() {
        return window.location.pathname.split('/').reverse()[0]
    }

    export function GetAlbumNameFromServer() {
        let album_id = GetAlbumID()
        let is_viewing_specific_album = /\/album\//.test(window.location.pathname)
        let url = `/album/name/${album_id}`

        if (is_viewing_specific_album) {
            $.get(url, function( data ) {
                currently_viewed_album = data
                foto_backend_event.dispatchEvent(events.ALBUM_NAME_RECEIVED)
            })
        }
    }

    export function ClearCurrentViewedAlbum() {
        currently_viewed_album = ''
    }

    function DeduceMimeTypeByFileExtension(filepath: string): string {
        let file_extension = filepath.split(".").reverse()[0].toLowerCase()
        switch (file_extension) {
            case "jpg":
            case "jpeg":
                return 'image/jpeg'
            case 'png':
            case 'webp':
                return `image/${file_extension}`
            default:
                return 'unknown'
        }
    }

    export function UploadPhoto(file: File): Promise<string> {
        return new Promise( async (resolve, reject) => {
            let xhr = new XMLHttpRequest()
            let pathname = '/to' + window.location.pathname
            xhr.open('POST', pathname)
            xhr.setRequestHeader('Content-Type', DeduceMimeTypeByFileExtension(file.name))
            xhr.onreadystatechange = function() {
                if (xhr.readyState == xhr.DONE && xhr.status == 200) {
                    resolve(xhr.responseText)
                }
            }
            let data = await file.arrayBuffer()
            xhr.send(data)
        })
    }

    export async function UploadPhotos(
        submission_buttons_disabled_setter: React.Dispatch<React.SetStateAction<boolean>>,
        file_input_ref: React.MutableRefObject<HTMLInputElement | null>,
        SetPhotos: React.Dispatch<React.SetStateAction<PhotoEntry[]>>,
        photos: PhotoEntry[]
    ) {
        submission_buttons_disabled_setter(true)
        let files_to_be_uploaded = (document.getElementById('file-upload-input') as (HTMLInputElement | null))?.files
        
        if (files_to_be_uploaded) {
            if (files_to_be_uploaded.length == 0)  {
                alert('No files yet to be uploaded, please choose first!')
                submission_buttons_disabled_setter(false)
                return
            }
            else /* if there are files to be uploaded */ {
                for (
                    // initialization
                    let i = 0, current_file = files_to_be_uploaded.item(i);

                    // condition
                    i < files_to_be_uploaded.length; 

                    // update expression
                    current_file = files_to_be_uploaded.item(++i)
                ) {
                    if (current_file) {
                        await UploadPhoto(current_file)
                        let url = URL.createObjectURL(current_file)
                        let new_photo_entry = { key: dummy_key_track.toString(), url: url }
                        dummy_key_track++
                        photos.push(new_photo_entry)
                        SetPhotos([...photos])
                    }
                }
                // this resets the file input
                if (file_input_ref?.current) {
                    file_input_ref.current.value = ''
                }
                submission_buttons_disabled_setter(false)
            }
        }

    }
    
    async function RegisterNewAlbum(album_name: string): Promise<string | undefined>{
        return new Promise( (resolve, reject) => {
            let request = $.ajax('/new/album', {
                method: 'POST',
                contentType: 'text/plain',
                data: album_name,
                dataType: 'text'
            })
            request.done((data) => {
                this.alreadySuccessfullyRequestedAlbums = true
                resolve(data)
            })
            request.fail( (_, textstatus, error_thrown) => {
                console.log(textstatus)
                console.log(error_thrown)
                reject()
            })
        })
    }
    
    export async function CreateNewAlbum(album_name: string): Promise<void> {
        let album_id = await RegisterNewAlbum(album_name)
        if (album_id) {
            albums.push({
                album_name: album_name,
                albumid: album_id
            })
        }
        return Promise.resolve()
    }

} // FotoBackendAPI


function Album(props) {
    return <div className="album">
        { 
            (props?.imgSrc) ? 
                /* if there's an image preview available */ <img src={ (props?.imgSrc) ? props.imgSrc : "" } /> :
                /* if there's no image */ <div className="album-blank-preview"></div>
        }
        <ReactRouterDOM.Link 
            to={props?.link}
            onClick={ () => {
                currently_viewed_album = props?.name
            }
            }
        >{props?.name}</ReactRouterDOM.Link>
    </div>
}

let already_sent_albums_request = false

function AlbumView(props) {
    
    let [albumEntries, SetAlbumEntries] = React.useState<AlbumEntries>([...FotoBackendAPI.GetAlbums()])
    let SetCreateAlbumPromptVisibility = props?.SetCreateAlbumPromptVisibility

    React.useEffect( () => {
        function updateAlbumEntries() {
            SetAlbumEntries([...FotoBackendAPI.GetAlbums()])
        }
        FotoBackendAPI.EventHook.addEventListener('ALBUMS_LOADED', updateAlbumEntries)
        if (!already_sent_albums_request) {
            FotoBackendAPI.GetAlbumsFromServer()
            already_sent_albums_request = true
        }
        return () => FotoBackendAPI.EventHook.removeEventListener('ALBUMS_LOADED', updateAlbumEntries)
    })

    function CreateNewAlbumPrompt(props) {
        let [warningMsg, setWarningMsg] = React.useState("")
        return <div className="absolute" style={{
            zIndex: props?.zIndex
        }} id="create-album-prompt">
            <h2>Create Album</h2>
            <input type="text" id="album-name-field" onInput={
                () => {
                    if (warningMsg != "") {
                        setWarningMsg("")
                    }
                }
            }/>
            <div className="flex-row">
                <button onClick={ async () => {
                    let album_name_field = (document.getElementById("album-name-field") as HTMLInputElement)
                    let album_name = album_name_field.value
                    if (album_name.length == 0) {
                        setWarningMsg("Please input an album name first!")
                    }
                    else {
                        SetCreateAlbumPromptVisibility(false)
                        await FotoBackendAPI.CreateNewAlbum(album_name)
                        SetAlbumEntries(
                            /* 
                                we create a shallow copy of the albums
                            */
                            [...FotoBackendAPI.GetAlbums()]
                        )
                    }
                }}>Create Album</button>
                <button onClick={ () => SetCreateAlbumPromptVisibility(false) }>Cancel</button> 
            </div>
            {
                (warningMsg != "") && <div id="warning-prompt">
                    {warningMsg}
                </div>
            }
        </div>
    }



    return <>
        { props?.isCreateAlbumPromptVisible && <CreateNewAlbumPrompt/> }
        <div id="album-view" className="flex-row" onClick={props?.onClick} style={{
            zIndex: props?.zIndex
        }}>
            { albumEntries.map( (albumEntry) => {
                let albumid = albumEntry?.albumid ?? 'all-photos'
                let albumlink = `/album/${albumid}`
                return <Album 
                    name={albumEntry.album_name} 
                    key={albumEntry.albumid}
                    link={albumlink}
                /> 
            })}
        </div>
    </>
}

function UserActionPanel(props) {
    return <div id="user-action-panel" className="flex center" onClick={
        () => props?.setPopupPanelVisibility(false)
    } style={{
        zIndex: props?.zIndex
    }}>
        {
            props?.popupPanelVisible && <div className="absolute flex-column" style={{
                height: "fit-content",
                minWidth: "fit-content",
                bottom: "2cm"
            }} id="popup-panel">
                <button onClick={
                    (e) => {
                        e.stopPropagation()
                        props?.SetCreateAlbumPromptVisibility(true)
                        props?.setPopupPanelVisibility(false)
                    }
                }>Create Album</button>
                <button onClick={
                    (e) => {
                        e.stopPropagation()
                        props?.setPopupPanelVisibility(false)
                    }
                }>Post Pictures</button>
            </div>
        }
        <button className="circle" id="popup-button" onClick={
            (e) => {
                e.stopPropagation()
                props?.setPopupPanelVisibility(true)
            }
        }>
            <img src="/assets/svgs/plus.svg" style={{
                height: '1cm',
                width: '1cm'
            }}/>
        </button>
    </div>
}


function Main() {
    let [isCreateAlbumPromptVisible, SetCreateAlbumPromptVisibility] = React.useState(false)
    let [popupPanelVisible, setPopupPanelVisibility] = React.useState(false)

    return <div className="flex-column" style={{ height: '100vh' }}>
        <AlbumView 
            onClick={ () => { setPopupPanelVisibility(false) }} 
            zIndex={0}
            isCreateAlbumPromptVisible={isCreateAlbumPromptVisible}
            SetCreateAlbumPromptVisibility={SetCreateAlbumPromptVisibility}
        />
        <UserActionPanel 
            SetCreateAlbumPromptVisibility={SetCreateAlbumPromptVisibility}
            setPopupPanelVisibility={setPopupPanelVisibility}
            popupPanelVisible={popupPanelVisible}
            zIndex={0}
        />
    </div>
}

let already_sent_album_name_request = false

function SpecificAlbumViewNavigationBar() {
    let [albumName, setAlbumName] = React.useState(currently_viewed_album)

    React.useEffect( () => {
        
        let albumid = window.location.pathname.split('/').reverse()[0]
        if (albumid === 'all-photos')
            return setAlbumName('All Photos')

        function updateAlbumName() {
            setAlbumName(currently_viewed_album)
        }
        FotoBackendAPI.EventHook.addEventListener('ALBUM_NAME_RECEIVED', updateAlbumName)
        if (!already_sent_album_name_request) {
            FotoBackendAPI.GetAlbumNameFromServer()
            already_sent_album_name_request = true
        }
        return () => FotoBackendAPI.EventHook.removeEventListener('ALBUM_NAME_RECEIVED', updateAlbumName)
    }, [albumName])


    return <div style={{
        padding: "0.2cm 0.5cm",
        height: "10%",
        maxHeight: "1cm"
    }} className="flex-row">
        <div style={
            {
                width: "10%"
            }
        }>
            <ReactRouterDOM.Link 
                to={"/home"} 
                id="to-homepage-arrow" 
                onClick={ () => FotoBackendAPI.ClearCurrentViewedAlbum() }>
                <img src="/assets/svgs/arrow-sm-left-svgrepo-com.svg"/>
            </ReactRouterDOM.Link>
        </div>
        <div style={{
            width: "80%"
        }} className="flex center">
        <span style={{
            fontFamily: 'Work Sans',
            fontSize: '1.3em'
        }}>{albumName}</span>
        </div>
        <div style={{
            width: "10%"
        }}></div>
    </div>
}

function PhotosView(props) {
    let [submissionButtonsDisabledValue, setSubmissionButtonsDisabledValue] = React.useState(false)
    let file_input_ref: React.MutableRefObject<HTMLInputElement | null> = React.useRef(null)
    let SetPhotos = props?.SetPhotos
    let photos = props?.photos

    return <div style={{
        height: "90%",
        width: "100%"
    }} className="flex-column">
        <div id="photos-view-container">
            { photos.map( (photo) => <img src={photo.url} key={photo.key} className="photo" /> ) } 
        </div>
        <div className="flex center" style={{
            width: "100%",
            height: "10%",
            maxHeight: "1cm",
        }}>
            <input 
                type="file" 
                id="file-upload-input" 
                accept="image/webp, image/png, image/jpeg" 
                multiple
                disabled={submissionButtonsDisabledValue}
                ref={file_input_ref}
             />
            <button onClick={() => {
                FotoBackendAPI.UploadPhotos(
                    setSubmissionButtonsDisabledValue, 
                    file_input_ref,
                    SetPhotos,
                    photos
                )
            }} disabled={submissionButtonsDisabledValue}>Submit</button>
        </div>
    </div>
}

function SpecificAlbumView() {
    let [photos, SetPhotos] = React.useState<PhotoEntry[]>([])
    React.useEffect( () => {
        let albumid = FotoBackendAPI.GetAlbumID()
        let url = `/photos/${albumid}`
        $.ajax(url, {
            method: 'GET',
            dataType: 'json',
            success: function (photo_urls: string[]) {
                let photos: PhotoEntry[] = []
                photo_urls.map( (photo_url) => photos.push({ key: (dummy_key_track++).toString(), url: photo_url }))
                SetPhotos(photos)
            }
        })
    }, [currently_viewed_album])
    return <div className="flex-column" style={{
        height: "100vh"
    }}>
        <SpecificAlbumViewNavigationBar/>
        <PhotosView photos={photos} SetPhotos={SetPhotos}/>
    </div>
}

const router = ReactRouterDOM.createBrowserRouter([
    {
        path: "/home",
        element: <Main/>
    },
    {
        path: "/album/:id",
        element: <SpecificAlbumView/>
    }
])

document.addEventListener('DOMContentLoaded', function() {

    document.body.appendChild(rootdiv)
    root.render(
        <React.StrictMode>
            <ReactRouterDOM.RouterProvider router={router}/>
        </React.StrictMode>
    )

}) 
