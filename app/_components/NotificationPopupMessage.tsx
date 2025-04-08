'use client'
import React from 'react'

import styles from '../_css/notificationpopupmessage.module.css'

export default function NotificationPopupMessage( 
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
    return <div className={styles['notification-popup-message']} ref={notification_popup_message_ref}>{children}</div>
}