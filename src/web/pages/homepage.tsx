
import React from 'react'
import ReactDOM from 'react-dom/client'
import ReactRouterDOM from 'react-router-dom'
import $ from 'jquery'

/**
 * an HTMLInputElement that is possible to be null
*/
type NHTMLInputElement = HTMLInputElement | null

type SetStringStateFunction = React.Dispatch<React.SetStateAction<string>>

type AccountAPIFunction = (
    username_field: NHTMLInputElement, 
    password_field: NHTMLInputElement, 
    setUsernameWarningMsg: SetStringStateFunction,
    setPasswordWarningMsg: SetStringStateFunction,
    setNotificationPopupMessage: SetStringStateFunction
) => void

type TextInputProps = {
    label?: string,
    style?: React.CSSProperties,
    warningmsg: string,
    setWarningMsg: SetStringStateFunction
}


namespace AccountAPI {

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
            let url = `/${action}`
            let request = $.ajax(url, {
                method: 'POST',
                data: { username, password },
                dataType: 'text',
                statusCode: {
                    200: () => resolve(''),
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
            if (response == 'ACCOUNT ALREADY EXISTS') 
                setNotificationPopupMessage(`The username with ${username_field.value} already exists, please create another one!`)
        }
        else /* if either of the fields are null */ {
            return
        }
    }
}

function ClassicNavigationLink(
    {href, children, style}: { href: string, children: any, style?: React.CSSProperties | undefined }
) {
    return <ReactRouterDOM.Link 
        to={href} 
        className='classic'
        style={style}>{children}</ReactRouterDOM.Link>
}

function ClassicOnWhiteNavigationLink(
    {href, children, style, className}: { href: string, children: any, style?: React.CSSProperties, className?: string }
) {
    let classname_value = 'classic-on-white ' + (className ?? '')
    return <ReactRouterDOM.Link
        to={href}
        className={classname_value}
        style={style}>{children}</ReactRouterDOM.Link>
}

function ClassicOnWhiteButton(
    {onClick, children, style}: {onClick?: () => void, children: any, style?: React.CSSProperties}
) {
    return <button className='classic-on-white' style={style} onClick={onClick}>{children}</button>
}


function NotificationPopupMessage( 
    { children } : { children: any } 
) {
    let notification_popup_message_ref = React.useRef<HTMLDivElement>(null)
    let final_position_keyframe = { top: 'calc(95% - calc(1em + 0.4cm))'}
    const PopUpKeyframes = [
        { top: '100%'},
        { top: 'calc(94% - calc(1em + 0.4cm)' },
        final_position_keyframe
    ]
    const PopDownKeyframes = [
        final_position_keyframe,
        { top: '100%' }
    ]
    React.useEffect( () => {
        if (notification_popup_message_ref) {
            notification_popup_message_ref.current?.animate(PopUpKeyframes, { duration: 300, fill: 'forwards' })
            let timeout_function_id = setTimeout(() => notification_popup_message_ref.current?.animate(PopDownKeyframes, { duration: 300, fill: 'forwards' }), 3000)
            return () => { 
                clearTimeout(timeout_function_id)
            }
        }
    })
    return <div id='notification-popup-message' ref={notification_popup_message_ref}>{children}</div>
}

function PhotoCard() {
    return <div className='photo-card'>
        <div className='rect'></div>
    </div>
}

function Homepage() {
    return <div style={{
                    height: '100vh',
                    width: '100vw',
            }} className='flex-column'>
                <div style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    alignItems: 'center',
                    justifyContent: 'center'
                }} className='flex-row' id='photo-cards-container'>
                    <PhotoCard/>
                    <PhotoCard/>
                    <PhotoCard/>
                </div>
                <div style={{
                    height: '30%',
                    width: '100%',
                    alignItems: 'center'
                }} className='flex-column' id='content'>
                    <span className='block' id='foto'>foto</span>
                    <span className='block' id='tagline'>when you capture your memories, you can store them here!</span>
                    <div id='navigation-link-container'>
                        <ClassicNavigationLink href={'/log-in'}>Log in to your account</ClassicNavigationLink>
                        <ClassicNavigationLink href={'/sign-up'}>Sign up for an account</ClassicNavigationLink>
                    </div>
                </div>
            </div>
}



const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
    { label, style, warningmsg, setWarningMsg },
    ref
) {
    return (
        <div className='block' style={style}>
            <label htmlFor={label?.toLowerCase()} className='block'>{label}</label>
            <input type='text' ref={ref} onChange={ () => setWarningMsg('') } />
            <span className='warning'>{warningmsg}</span>
        </div>
    )
})

function AccountSignInPrompt(
    { 
        title, 
        short_info, 
        action,
        action_function
    }: 
    { 
        title: string, 
        short_info: string, 
        action: string, 
        action_function: AccountAPIFunction
    }
) {

    let username_field_ref = React.useRef<HTMLInputElement>(null)
    let password_field_ref = React.useRef<HTMLInputElement>(null)
    let [username_warning_msg, setUsernameWarningMsg] = React.useState<string>('')
    let [password_warning_msg, setPasswordWarningMsg] = React.useState<string>('')
    let [notification_popup_message, setNotificationPopupMessage] = React.useState<string>('')

    return <div className='flex-column'
        style={{
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            width: '100vw',
            overflow: 'clip'
    }}>
        <div id='form-container' className='fade-in'>
            <ClassicOnWhiteNavigationLink className='fade-in' style={{ animationDelay: '200ms' }} href={'/'}>Back to Homepage</ClassicOnWhiteNavigationLink>
            <div className='fade-in' style={{ 
                width: '100%',
                textAlign: 'left',
                position: 'relative',
                top: '1.2cm',
                animationDelay: '250ms'
            }}>
                <span>{title}</span><br/>
                <span>{short_info}</span>
            </div>
            <div className='fade-in' style={{ 
                position: 'relative', 
                top: '2cm', 
                animationDelay: '300ms'
            }}>
                <TextInput 
                    ref={username_field_ref} 
                    warningmsg={username_warning_msg} 
                    setWarningMsg={setUsernameWarningMsg}
                    label='Username' 
                    style={{ marginBottom: '0.5cm' }}
                /> 
                <TextInput 
                    ref={password_field_ref} 
                    warningmsg={password_warning_msg} 
                    setWarningMsg={setPasswordWarningMsg}
                    label='Password'
                />
                <ClassicOnWhiteButton 
                    onClick={
                        () => action_function(
                            username_field_ref.current, 
                            password_field_ref.current, 
                            setUsernameWarningMsg, 
                            setPasswordWarningMsg,
                            setNotificationPopupMessage,
                        )
                    }
                    style={{ position: 'relative', top: '1cm' }}
                >
                    {action}
                </ClassicOnWhiteButton>
            </div>
        </div>
        { (notification_popup_message) && <NotificationPopupMessage>{notification_popup_message}</NotificationPopupMessage> }
    </div>
}
function LogInPage() {
    return <AccountSignInPrompt 
                title='Welcome back to foto!'
                short_info='You are now logging in back to your account'
                action='Log In'
                action_function={AccountAPI.LogIn}
           />
}

function SignUpPage() {
    return <AccountSignInPrompt
                title="It's your first time here in foto!"
                short_info='You are now signing up for an account'
                action='Sign Up'
                action_function={AccountAPI.SignUp}
            />
}

const router = ReactRouterDOM.createBrowserRouter([
    {
        path: '/',
        element: <Homepage/> 
    },
    {
        path: '/log-in',
        element: <LogInPage/>
    },
    {
        path: '/sign-up',
        element: <SignUpPage/>
    }
])

const rootdiv = document.createElement('root')
const root = ReactDOM.createRoot(rootdiv)

document.addEventListener('DOMContentLoaded', function() {
    document.body.appendChild(rootdiv)
    root.render(
        <React.StrictMode>
            <ReactRouterDOM.RouterProvider router={router}/>
        </React.StrictMode>
    )
})