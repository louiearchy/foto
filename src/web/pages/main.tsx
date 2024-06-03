
import React from "react"
import ReactDOM from "react-dom/client"
import ReactRouterDOM from "react-router-dom"


const rootdiv = document.createElement("root")
const root = ReactDOM.createRoot(rootdiv)

function Album(props) {
    return <div className="album">
        <img src={ props?.imgsrc ?? "" } />
        <button>{props?.album_name}</button>
    </div>
}

function AlbumView(props) {
    return <div id="album-view" className="flex-row" onClick={props?.onClick} style={{
        zIndex: props?.zIndex
    }}>

    </div>
}

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
            <button onClick={ () => {
                let album_name_field = (document.getElementById("album-name-field") as HTMLInputElement)
                let album_name = album_name_field.value
                if (album_name.length == 0) {
                    setWarningMsg("Please input an album name first!")
                }
            }}>Create Album</button>
            <button onClick={ () => props?.SetCreateAlbumPromptVisibility(false) }>Cancel</button> 
        </div>
        {
            (warningMsg != "") && <div id="warning-prompt">
                {warningMsg}
            </div>
        }
    </div>
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
        { isCreateAlbumPromptVisible && <CreateNewAlbumPrompt zIndex={1} 
            SetCreateAlbumPromptVisibility={SetCreateAlbumPromptVisibility}/> }
        <AlbumView onClick={ () => { setPopupPanelVisibility(false) }} zIndex={0}/>
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

window.onload = function() {
    document.body.appendChild(rootdiv)
    root.render(
        <React.StrictMode>
            <ReactRouterDOM.RouterProvider router={router}/>
        </React.StrictMode>
    )
}
