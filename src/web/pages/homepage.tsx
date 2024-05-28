
import React from "react"
import ReactDOM from "react-dom/client"
import ReactRouterDOM from "react-router-dom"

const rootDiv = document.createElement("div")
const root = ReactDOM.createRoot(rootDiv)

function ClassicButton(props) {
    return <button className="classic">{props?.text}</button>
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

    return (
    <>
        <nav>
            <div className="desktop">
                <a href="/">Home</a>
                <a>Terms & Conditions</a>
                <a>Privacy Policy</a>
                <a>About Us</a>
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
                <ClassicButton text="Log In"/>
                <ClassicButton text="Sign Up"/>
            </FlexRow>
        </div>
    )
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

const router = ReactRouterDOM.createBrowserRouter([
    {
        path: "/",
        element: <Homepage/>
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
