
import React from "react"
import ReactDOM from "react-dom/client"
import ReactRouterDOM from "react-router-dom"

const rootDiv = document.createElement("div")
const root = ReactDOM.createRoot(rootDiv)

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
    let navigation_links = navigation_links_list.map( navigation_link => {
        if (navigation_link?.href) {
            return <ReactRouterDOM.Link to={navigation_link.href}>{navigation_link.label}</ReactRouterDOM.Link>
        }
        else {
            return <a>{navigation_link.label}</a>
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
