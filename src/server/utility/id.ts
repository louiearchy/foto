
import { v4 as uuidv4 } from 'uuid'

function GenerateSessionID(): string {
    return uuidv4()
}

function GenerateAlbumId(): string {
    return uuidv4()
}

function GeneratePhotoSessionToken(): string {
    return uuidv4()
}

export default {
    GenerateAlbumId,
    GenerateSessionID,
    GeneratePhotoSessionToken
}
