'use client';
import React from 'react'
import Link from 'next/link'

import '../../_css/main.css'

import * as FotoBackendAPI from '../../_logic/FotoBackendAPI'
import RunGuard from '../../_logic/guard'

let main_server_address = 'http://localhost:3000'

export default function AlbumView() {
    let [album_name, SetAlbumName] = React.useState('')
    let [thumbnail_photos, SetAlbumThumbnailPhotos] = React.useState<string[]>([])
    let [currently_viewed_photo, SetCurrentlyViewedPhoto] = React.useState('')

    let files_input_ref = React.useRef<HTMLInputElement | null>(null)

    // State functions
    // ---------------------------------------------------
    function SynchronizeAlbumName() {
        SetAlbumName(FotoBackendAPI.GetAlbumName())
    }
    function SynchronizeAlbumThumbnailPhotos() {
        SetAlbumThumbnailPhotos(FotoBackendAPI.GetAlbumThumbnailPhotos())
    }
    function HideCurrentlyViewedPhoto() {
        SetCurrentlyViewedPhoto('')
    }
    function AddPhotoToAlbum(thumbnail_photo_url: string) {
        let new_thumbnail_photos = thumbnail_photos
        new_thumbnail_photos.push(thumbnail_photo_url)
        SetAlbumThumbnailPhotos([...new_thumbnail_photos])
    }
    function RemovePhotoFromAlbumPhotos(given_photo_url: string) {
        let photo_id = given_photo_url.split("/").reverse()[0].split(".")[0]
        let thumbnail_photo_url = `${main_server_address}/thumbnail/${photo_id}`
        let new_photos = thumbnail_photos.filter((photo_url) => photo_url != thumbnail_photo_url)
        // might dereference the array for garbage collection, since we create a new
        // array with the filter function
        thumbnail_photos = []
        SetAlbumThumbnailPhotos([...new_photos])
    }
    // ---------------------------------------------------

    // Effect hooks
    // ---------------------------------------------------
    function SynchronizeAlbumPhotosWithFotoBackend() {
        FotoBackendAPI.EventHook.addEventListener('ALBUM_PHOTOS_LOADED', SynchronizeAlbumThumbnailPhotos)
        FotoBackendAPI.GetAlbumPhotosFromServer()
        return () => FotoBackendAPI.EventHook.removeEventListener('ALBUM_PHOTOS_LOADED', SynchronizeAlbumThumbnailPhotos)
    }

    function SynchronizeAlbumNameWithFotoBackend() {
        FotoBackendAPI.EventHook.addEventListener('ALBUM_NAME_RECEIVED', SynchronizeAlbumName)
        FotoBackendAPI.GetAlbumNameFromServer()
        return () => FotoBackendAPI.EventHook.removeEventListener('ALBUM_NAME_RECEIVED', SynchronizeAlbumName)
    }

    React.useEffect(() => {
        RunGuard()
        SynchronizeAlbumNameWithFotoBackend()
        SynchronizeAlbumPhotosWithFotoBackend()
    })
    // ---------------------------------------------------

    function SubmitPhotos() {
        if (files_input_ref && files_input_ref?.current) {
            let photos_to_be_uploaded = files_input_ref.current.files
            if (photos_to_be_uploaded && photos_to_be_uploaded.length > 0) {
                FotoBackendAPI.UploadPhotos(
                    photos_to_be_uploaded,
                    // on post upload complete callback function
                    (photo_id: string) => {
                        // to be improved
                        let thumbnail_url = `http://localhost:3000/thumbnail/${photo_id}`
                        AddPhotoToAlbum(thumbnail_url)
                    }
                )
                files_input_ref.current.value = ''
            }
        }
    }

    function DeletePhoto() {
        let photo_id = currently_viewed_photo.split('/')[4].split('.')[0]
        FotoBackendAPI.DeletePhoto(photo_id)
        HideCurrentlyViewedPhoto()
        RemovePhotoFromAlbumPhotos(currently_viewed_photo)
    }

    return (
        <div className='flex-column' id='album-view'>
            { 
                (currently_viewed_photo != '') && 
                <div id='album-view-current-viewed-photo-container'>
                    <div className='flex-row'>
                        <button onClick={HideCurrentlyViewedPhoto}>
                            <img src='/svgs/arrow-sm-left-svgrepo-com-white.svg'/>
                        </button>
                        <div></div>
                        <button onClick={DeletePhoto}>
                            <img src='/svgs/trash-bin-minimalistic-svgrepo-com.svg'/>
                        </button>
                    </div>
                    <img src={currently_viewed_photo}/>
                </div>
            }
            <div className='flex-row' id='album-view-navigation-bar'>
                <div>
                    <Link href='/home' onClick={FotoBackendAPI.ResetState}>
                        <img src='/svgs/arrow-sm-left-svgrepo-com.svg'/>
                    </Link>
                </div> 
                <div className='flex center'>{album_name}</div>
                <div></div>
            </div> 
            <div className='flex-row' id='album-view-photos-container'>{
                thumbnail_photos.map( (thumbnail_photo_url) => {
                    let photo_url = FotoBackendAPI.GetPhotoUrlByThumbnailUrl(thumbnail_photo_url)
                    return <img src={thumbnail_photo_url} 
                                key={thumbnail_photo_url} 
                                onClick={() => SetCurrentlyViewedPhoto(photo_url)}
                            />
                })
            }</div>
            <div className='flex center' id='album-view-submit-container'>
                <input type='file' ref={files_input_ref} multiple={true}/>
                <button onClick={SubmitPhotos}>Submit</button>
            </div>
        </div>
    )
}