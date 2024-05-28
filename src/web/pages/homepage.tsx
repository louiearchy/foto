
import React from "react"
import ReactDOM from "react-dom/client"
import ReactRouterDOM from "react-router-dom"

const rootDiv = document.createElement("div")
const root = ReactDOM.createRoot(rootDiv)

enum AccountSubmissionContext {
    LogIn,
    SignUp
}

function FlexColumn(props) {
    let classes = "flex-column"
    if (props?.className) {
        classes += ` ${props.className}`
    }

    return <div className={classes} style={props?.style}>{props?.children}</div>
}

function FlexRow(props) {
    let classes = "flex-row"
    if (props?.className) {
        classes += ` ${props.className}`
    }

    return <div className={classes} style={props?.style}>{props?.children}</div>
}

function MobileNavigationBar(props) {
    return <div id="mobile-navigation-bar">
        <button className="mobile-nav-button" style={{
            alignSelf: "flex-start"
        }} onClick={
            () => {
                if (props?.SetMobileNavVisibility) {
                    props.SetMobileNavVisibility(false)
                }
            }
        }>
            <img src="/assets/svgs/closenav.svg" id="close-navigation-bar"/>
        </button>
        <a href="/">Home</a>
        <a>Terms & Conditions</a>
        <a>Privacy Policy</a>
        <a>About Us</a>
    </div>
}

function NavigationBar() {
    let [isMobileNavigationBarVisible, SetMobileNavVisibility] = React.useState(false)
    let navigation_links_list = [
        {
            href: "/",
            label: "Home"
        },
        {
            label: "Terms & Conditions"
        },
        {
            label: "Privacy Policy"
        },
        {
            label: "About Us"
        }
    ]
    let id_count = 0
    let navigation_links = navigation_links_list.map( navigation_link => {
        if (navigation_link?.href) {
            return <ReactRouterDOM.Link to={navigation_link.href} key={id_count++}>{navigation_link.label}</ReactRouterDOM.Link>
        }
        else {
            return <a key={id_count++}>{navigation_link.label}</a>
        }
        
    })
    return (
    <>
        <nav>
            <div className="desktop">
                {navigation_links}
            </div>
            <button className="mobile-nav-button" onClick={
                () => { 
                    SetMobileNavVisibility(true) 
                }
            }>
                <img src="/assets/svgs/navicon.svg" id="mobile-nav-icon"/>
            </button>
        </nav>
        {
            isMobileNavigationBarVisible &&
            <MobileNavigationBar SetMobileNavVisibility={SetMobileNavVisibility}/>
        }
    </>)
}

function Main() {
    return (
        <div style={{
            flexGrow: "3"
        }} className="flex-column flex-all-center">
            <h1 style={{
                position: "relative",
                top: "-1cm",
                backgroundColor: "var(--main-color)",
                color: "white",
                padding: "0 1cm",
                borderRadius: "1cm"
            }} className="very-large-font no-margin text-center">Foto</h1>
            <p style={{
                position: "relative",
                top: "-0.7cm"
            }}
            className="large-font no-margin main-color text-center">a cloud photo album</p>
            <FlexRow className="flex-all-center" style={{
                gap: "1cm"
            }}>
                <ReactRouterDOM.Link to={"/log-in"} className="classic-button">Log In</ReactRouterDOM.Link>
                <ReactRouterDOM.Link to={"/sign-up"} className="classic-button">Sign Up</ReactRouterDOM.Link>
            </FlexRow>
        </div>
    )
}

function Capitalize(value: string): string {
    return value[0].toUpperCase() + value.substring(1).toLowerCase()
}

function TextForm(props) {
    let id = props?.label.toLowerCase()
    let label = Capitalize(props?.label as string)
    let classes = (props?.isWarningIconVisible) ? "warning" : undefined
    return <div style={props?.style}>
        <div style={{
            display: "flex",
            height: "1cm",
            flexDirection: "row",
            alignItems: "center"
        }}>
            <label htmlFor={id} className={classes}>{label}</label>
            {
                props?.isWarningIconVisible && 
                <img src="/assets/svgs/warningicon.svg" className="warningicon"/>
            }
        </div>
        <input type="text" id={id} className={classes}/>
        <div style={{
            height: "calc(1em + 0.5cm)"
        }} className="warning">{ (props?.isWarningIconVisible) ? props?.prompt : undefined }</div>
    </div>
}

function Homepage() {
    return (
        <FlexColumn style={{
            height: "calc(100vh - 1cm)"
        }}>
            <NavigationBar/>
            <Main/>
        </FlexColumn>
    )
}

function HandleAccountSubmission(
    context: AccountSubmissionContext
): {
    IsUsernameFieldEmpty: boolean,
    IsPasswordFieldEmpty: boolean,
    IsUsernameFieldCharactersInsufficient: boolean,
    IsPasswordFieldCharactersInsufficient: boolean
} {
    let result = {
        IsUsernameFieldEmpty: false,
        IsPasswordFieldEmpty: false,
        IsUsernameFieldCharactersInsufficient: false,
        IsPasswordFieldCharactersInsufficient: false
    }
    let username = (document.getElementById("username") as HTMLInputElement ).value
    let password = (document.getElementById("password") as HTMLInputElement).value
    let username_minimum_characters = 4
    let password_minimum_characters = 4
    
    result.IsUsernameFieldEmpty = (username.length == 0)
    result.IsPasswordFieldEmpty = (password.length == 0)
    result.IsUsernameFieldCharactersInsufficient = (username.length > 0 && username.length < username_minimum_characters)
    result.IsPasswordFieldCharactersInsufficient = (password.length > 0 && password.length < password_minimum_characters)

    if (Object.values(result).includes(true)) {
        return result
    }


    return result
    
}

function LogInPage() {
    let [isUsernameWarningIconVisible, SetUsernameWarning] = React.useState(false)
    let [isPasswordWarningIconVisible, SetPasswordWarning] = React.useState(false)
    let [usernameFieldPrompt, SetUsernameFieldPrompt]: [string, React.Dispatch<React.SetStateAction<string>>] = React.useState("")
    let [passwordFieldPrompt, SetPasswordFieldPrompt]: [string, React.Dispatch<React.SetStateAction<string>>] = React.useState("")


    return (
        <FlexColumn style={{
            height: "calc(100vh - 1cm)"
        }}>
            <NavigationBar/>
            <div className="flex-row flex-all-center" style={{
                width: "100%",
                height: "100%"
            }}>
                <div id="account-form">
                    <ReactRouterDOM.Link to={"/"} className="classic-button">Back to Homepage</ReactRouterDOM.Link>
                    <div style={{
                        marginTop: "2cm"
                    }}>
                        <TextForm label="username" isWarningIconVisible={isUsernameWarningIconVisible} prompt={usernameFieldPrompt}/>
                        <TextForm label="password" style={
                            {marginTop: "0.1cm"}
                        } isWarningIconVisible={isPasswordWarningIconVisible} prompt={passwordFieldPrompt}/>
                        <button onClick={
                            () => { 
                                let account_submission_result = HandleAccountSubmission(AccountSubmissionContext.LogIn) 
                                if (account_submission_result.IsUsernameFieldEmpty) {
                                    SetUsernameWarning(true)
                                    SetUsernameFieldPrompt("Username must be filled!")
                                }
                                if (account_submission_result.IsPasswordFieldEmpty) {
                                    SetPasswordWarning(true)
                                    SetPasswordFieldPrompt("Password must be filled!")
                                }
                                if (account_submission_result.IsUsernameFieldCharactersInsufficient) {
                                    SetUsernameWarning(true)
                                    SetUsernameFieldPrompt("Username must be 4 characters or above!")
                                }
                                if (account_submission_result.IsPasswordFieldCharactersInsufficient) {
                                    SetPasswordWarning(true)
                                    SetPasswordFieldPrompt("Password must be 4 characters or above!")
                                }
                                if (isUsernameWarningIconVisible && (
                                    !account_submission_result.IsUsernameFieldEmpty &&
                                    !account_submission_result.IsUsernameFieldCharactersInsufficient
                                )) {
                                    SetUsernameWarning(false)
                                }
                                if (isPasswordWarningIconVisible && (
                                    !account_submission_result.IsPasswordFieldEmpty &&
                                    !account_submission_result.IsPasswordFieldCharactersInsufficient
                                )) {
                                    SetPasswordWarning(false)
                                }
                            }
                        } className="classic-button" style={{
                            marginTop: "1cm"
                        }}>Log In</button>
                    </div>
                </div>
            </div>
        </FlexColumn>
    )
}

const router = ReactRouterDOM.createBrowserRouter([
    {
        path: "/",
        element: <Homepage/>
    },
    {
        path: "/log-in",
        element: <LogInPage/>
    }
])

window.onload = function() {
    document.body.appendChild(rootDiv)
    root.render(
        <React.StrictMode>
            <ReactRouterDOM.RouterProvider router={router} />
        </React.StrictMode>
    )
}
