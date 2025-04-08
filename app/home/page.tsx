'use client';
import React from "react"
import Link from 'next/link'

import * as FotoBackendAPI from '../_logic/FotoBackendAPI'
import RunGuard from '../_logic/guard'

import '../_css/main.css'
import useTitle from "../_logic/useTitle";

function Album(props) {
    return <div className="album">
        { 
            (props?.imgSrc) ? 
                /* if there's an image preview available */ <img src={ (props?.imgSrc) ? props.imgSrc : "" } /> :
                /* if there's no image */ <div className="album-blank-preview"></div>
        }
        <div className="info">
            <Link href={props?.link}>{props?.name}</Link>

            { 
                props?.name != "All Photos" && 
                <button onClick={() => {props?.DeleteAlbum(props?.albumid)}}>
                    <img src='/assets/svgs/trash-bin-minimalistic-svgrepo-com-black.svg'/>
                </button>
            }
        </div>
    </div>
}


// This is where the user sees their created albums
export default function AlbumsView() {
    
    let [list_of_albums, SetListOfAlbums] = React.useState<FotoBackendAPI.AlbumEntries>(FotoBackendAPI.GetAlbums())
    let [is_create_album_prompt_visible, SetCreateAlbumPromptVisibility] = React.useState(false)

    // State functions
    // --------------------------------------------------
    function UpdateListOfAlbums() {
        SetListOfAlbums(FotoBackendAPI.GetAlbums())
    }

    function DeleteAlbum(albumid: string) {
        FotoBackendAPI.DeleteAlbum(albumid, UpdateListOfAlbums)
    }

    function HideCreateAlbumPrompt() {
        SetCreateAlbumPromptVisibility(false)
    }

    function ShowCreateAlbumPrompt() {
        SetCreateAlbumPromptVisibility(true)
    }
    // --------------------------------------------------

    // Effects
    // --------------------------------------------------
    function SynchronizeAlbumViewWithFotoBackend() {
        FotoBackendAPI.EventHook.addEventListener('ALBUMS_LOADED', UpdateListOfAlbums)
        FotoBackendAPI.GetAlbumsFromServer()
        return () => FotoBackendAPI.EventHook.removeEventListener('ALBUMS_LOADED', UpdateListOfAlbums)
    }

    React.useEffect(() => {
        RunGuard()
        SynchronizeAlbumViewWithFotoBackend()
    })
    // --------------------------------------------------

    // Components
    // --------------------------------------------------
    function CreateAlbumPrompt() {

        let [warning_message, SetWarningMessage] = React.useState("")
        let album_name_field_ref = React.useRef<HTMLInputElement | null>(null)

        function ClearWarningMessage() {
            if (warning_message != "")
                SetWarningMessage("")
        }

        async function CreateAlbum() {
            if (album_name_field_ref && album_name_field_ref?.current) {
                let album_name = album_name_field_ref.current.value
                if (album_name.length == 0) {
                    SetWarningMessage("Please input an album name first")
                }
                else {
                    HideCreateAlbumPrompt()
                    await FotoBackendAPI.CreateNewAlbum(album_name)
                    UpdateListOfAlbums()
                }
            }
        }

        return (
            <div className="absolute" style={{ zIndex: 0 }} id="create-album-prompt">
                <h2>Create Album</h2>
                <input type="text" ref={album_name_field_ref} id="album-name-field" onInput={ClearWarningMessage}/>
                <div className="flex-row">
                    <button onClick={CreateAlbum}>Create Album</button>
                    <button onClick={HideCreateAlbumPrompt}>Cancel</button> 
                </div>
                { (warning_message != "") && <div id="warning-prompt">{warning_message}</div> }
            </div>
        )
    }
    // --------------------------------------------------



    return (
        <div className='flex-column' id='albums-view'>
            { is_create_album_prompt_visible && <CreateAlbumPrompt/> }
            <div id="albums-container" className="flex-row">
                { 
                    list_of_albums.map( (albumEntry) => {
                        let albumid = albumEntry?.albumid ?? 'all-photos'
                        let albumlink = `/album/${albumid}`
                        return <Album 
                            name={albumEntry.album_name} 
                            key={albumEntry.albumid}
                            albumid={albumEntry.albumid}
                            DeleteAlbum={DeleteAlbum}
                            link={albumlink}
                        /> 
                    })
                }
            </div>
            <div className='flex center'><button onClick={ShowCreateAlbumPrompt}>Create Album</button></div>
        </div>
    )
}