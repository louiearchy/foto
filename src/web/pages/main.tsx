
import React from "react"
import ReactDOM from "react-dom/client"
import ReactRouterDOM from "react-router-dom"
import $ from "jquery"

const rootdiv = document.createElement("root")
const root = ReactDOM.createRoot(rootdiv)


interface AlbumEntry {
    album_name: string,
    albumid: string
}

type AlbumEntries = AlbumEntry[]

class PhotoNAlbumManager {

    public albums: AlbumEntries
    protected alreadySuccessfullyRequestedAlbums: boolean

    constructor() {
        this.albums = []
        this.alreadySuccessfullyRequestedAlbums = false
    }

    protected async RegisterNewAlbum(album_name: string): Promise<string | undefined>{
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

    public async GetAlbumsFromServer() {
        let request = $.ajax('/albums', {
            method: 'GET',
            dataType: 'json'
        })
        request.done((data) => {
            this.albums = (data as AlbumEntries)
        })
        request.fail( (textstatus, error_thrown) => {
            console.log(textstatus)
            console.log(error_thrown)
        })
    }

    public isAlreadyRequestedAlbumsFromServer(): boolean {
        return this.alreadySuccessfullyRequestedAlbums
    }

    public async CreateNewAlbum(album_name: string): Promise<void> {
        let album_id = await this.RegisterNewAlbum(album_name)
        if (album_id) {
            this.albums.push({
                album_name: album_name,
                albumid: album_id
            })
        }
        return Promise.resolve()
    }

}

const photoNAlbumManager = new PhotoNAlbumManager()

function Album(props) {
    return <div className="album">
        { 
            (props?.imgSrc) ? 
                /* if there's an image preview available */ <img src={ (props?.imgSrc) ? props.imgSrc : "" } /> :
                /* if there's no image */ <div className="album-blank-preview"></div>
        }
        <button>{props?.name}</button>
    </div>
}

function AlbumView(props) {
    
    let [albumEntries, SetAlbumEntries] = React.useState<AlbumEntries>([])
    let SetCreateAlbumPromptVisibility = props?.SetCreateAlbumPromptVisibility

    React.useEffect(() => {
        SetAlbumEntries(photoNAlbumManager.albums)
    }, [photoNAlbumManager.albums])

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
                        await photoNAlbumManager.CreateNewAlbum(album_name)
                        SetAlbumEntries(photoNAlbumManager.albums)
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
            { albumEntries.map( albumEntry => <Album name={albumEntry.album_name} key={albumEntry.albumid}/> )}
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

    return <div className="flex-column container-height">
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

const router = ReactRouterDOM.createBrowserRouter([
    {
        path: "/home",
        element: <Main/>
    }
])

photoNAlbumManager.GetAlbumsFromServer()

window.onload = function() {
    document.body.appendChild(rootdiv)
    root.render(
        <React.StrictMode>
            <ReactRouterDOM.RouterProvider router={router}/>
        </React.StrictMode>
    )
}
