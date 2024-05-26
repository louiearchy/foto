
import React from "react"
import ReactDOM from "react-dom/client"

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

function NavigationBar() {
    return (<nav>
        <a href="/">Home</a>
        <a>Terms & Conditions</a>
        <a>Privacy Policy</a>
        <a>About Us</a>
    </nav>)
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
            }} className="very-large-font no-margin">Foto</h1>
            <p style={{
                position: "relative",
                top: "-0.7cm"
            }}
            className="large-font no-margin main-color">a cloud photo album</p>
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

window.onload = function() {
    document.body.appendChild(rootDiv)
    root.render(<Homepage/>)
}
