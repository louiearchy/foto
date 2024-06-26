
import React from 'react'
import ReactDOM from 'react-dom/client'
import ReactRouterDOM from 'react-router-dom'

function ClassicNavigationLink(
    {href, children, style}: { href: string, children: any, style?: React.CSSProperties | undefined }
) {
    return <ReactRouterDOM.Link 
        to={href} 
        className='classic'
        style={style}>{children}</ReactRouterDOM.Link>
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

const router = ReactRouterDOM.createBrowserRouter([
    {
        path: '/',
        element: <Homepage/> 
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