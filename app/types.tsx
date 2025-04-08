export type NHTMLInputElement = HTMLInputElement | null

export type SetStringStateFunction = React.Dispatch<React.SetStateAction<string>>

export type AccountAPIFunction = (
    username_field: NHTMLInputElement, 
    password_field: NHTMLInputElement, 
    setUsernameWarningMsg: SetStringStateFunction,
    setPasswordWarningMsg: SetStringStateFunction,
    setNotificationPopupMessage: SetStringStateFunction
) => void

export type TextInputProps = {
    label?: string,
    style?: React.CSSProperties,
    warningmsg: string,
    setWarningMsg: SetStringStateFunction
}