'use client';

import React from 'react'

import * as AccountAPI from '../_logic/AccountAPI'
import RunGuard from '../_logic/guard'

import ClassicOnWhiteNavigationLink from './ClassicOnWhiteNavigationLink'
import ClassicOnWhiteButton from './ClassicOnWhiteButton'
import NotificationPopupMessage from './NotificationPopupMessage'
import TextInput from './TextInput'

import styles from '../_css/reusable.module.css'
import formContainerStyle from '../_css/formcontainer.module.css'

export default function AccountSignInPrompt(
    { 
        title, 
        short_info, 
        action,
    }: 
    { 
        title: string, 
        short_info: string, 
        action: string, 
    }
) {

    let username_field_ref = React.useRef<HTMLInputElement>(null)
    let password_field_ref = React.useRef<HTMLInputElement>(null)
    let [username_warning_msg, setUsernameWarningMsg] = React.useState<string>('')
    let [password_warning_msg, setPasswordWarningMsg] = React.useState<string>('')
    let [notification_popup_message, setNotificationPopupMessage] = React.useState<string>('')
    let action_function = (action == 'Sign Up') ? AccountAPI.SignUp : AccountAPI.LogIn

    React.useEffect(RunGuard)

    return <div className={styles['flex-column']}
        style={{
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            width: '100vw',
    }}>
        <div  className={`${styles['fade-in']} ${formContainerStyle['default']}`}>
            <ClassicOnWhiteNavigationLink className={styles['fade-in']} style={{ animationDelay: '200ms' }} href={'/'}>Back to Homepage</ClassicOnWhiteNavigationLink>
            <div className={styles['fade-in']} style={{ 
                width: '100%',
                textAlign: 'left',
                position: 'relative',
                top: '1.2cm',
                animationDelay: '250ms'
            }}>
                <span>{title}</span><br/>
                <span>{short_info}</span>
            </div>
            <div className={styles['fade-in']} style={{ 
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