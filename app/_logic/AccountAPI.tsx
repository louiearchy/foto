
import { 
    NHTMLInputElement,
    SetStringStateFunction
 } from '../types'

 import $ from 'jquery'

// to be improved
let main_server_address = 'http://localhost:3000' 

const username_char_requirements = {
    min: 4,
    max: 10
}
const password_char_requirements = {
    min: 4,
    max: 30
}

function ValidateFields(
    username_field: HTMLInputElement, 
    password_field: HTMLInputElement,
    setUsernameWarningMsg: SetStringStateFunction,
    setPasswordWarningMsg: SetStringStateFunction
): boolean {

    let username = username_field.value
    let password = password_field.value
    let return_early = false

    if (username.length < username_char_requirements.min) {
        setUsernameWarningMsg('Username should be at least 4 characters')
        return_early = true
    }
        
    if (username.length > username_char_requirements.max) {
        setUsernameWarningMsg('Username should be at a maximum 10 characters')
        return_early = true
    }

    if (password.length < password_char_requirements.min) {
        setPasswordWarningMsg('Password should be at least 4 characters')
        return_early = true
    }

    if (password.length > password_char_requirements.max) {
        setPasswordWarningMsg('Passwhord should be at a maximum 30 characters')
        return_early = true
    }

    return return_early

}

function ContactServer(
    username: string,
    password: string,
    action: 'log-in' | 'sign-up'
): Promise<string> {
    return new Promise( (resolve, reject) => {
        let url = `${main_server_address}/${action}`
        let request = $.ajax(url, {
            method: 'POST',
            data: { username, password },
            crossDomain: true,
            dataType: 'text',
            statusCode: {
                200: (data) => {
                    document.cookie = `sessionid=${data}`
                    resolve('')
                },
                404: () => resolve( (action == 'log-in') ? 'ACCOUNT DOESNT EXISTS' : 'MISSING ACCOUNT INFO'),
                400: () => resolve(request.responseText)
            }
        })
    })
}

export async function LogIn(
    username_field: NHTMLInputElement, 
    password_field: NHTMLInputElement,
    setUsernameWarningMsg: SetStringStateFunction,
    setPasswordWarningMsg: SetStringStateFunction,
    setNotificationPopupMessage: SetStringStateFunction
) {

    if (username_field && password_field) {
        let should_return_early = ValidateFields(username_field, password_field, setUsernameWarningMsg, setPasswordWarningMsg)
        if (should_return_early)
            return

        let response = await ContactServer(username_field.value, password_field.value, 'log-in')
        if (response == 'ACCOUNT DOESNT EXISTS')
            setNotificationPopupMessage('Account does not exist, or the username or password may be incorrect!')
        else
            window.location.assign('/home')
    }
    else /* if either of the fields are null */ 
        return
    
    
}
export async function SignUp(
    username_field: NHTMLInputElement, 
    password_field: NHTMLInputElement,
    setUsernameWarningMsg: SetStringStateFunction,
    setPasswordWarningMsg: SetStringStateFunction,
    setNotificationPopupMessage: SetStringStateFunction
) {
    if (username_field && password_field) {
        let should_return_early = ValidateFields(username_field, password_field, setUsernameWarningMsg, setPasswordWarningMsg)
        if (should_return_early)
            return

        let response = await ContactServer(username_field.value, password_field.value, 'sign-up')
        if (response == 'USERNAME ALREADY EXISTS') 
            setNotificationPopupMessage(`The username ${username_field.value} already exists, please create another one!`)
        else
            window.location.assign('/home')
    }
    else /* if either of the fields are null */ {
        return
    }
}
