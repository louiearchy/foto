
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

function ClassicOnWhiteNavigationLink(
    {href, children, style}: { href: string, children: any, style?: React.CSSProperties }
) {
    return <ReactRouterDOM.Link
        to={href}
        className='classic-on-white'
        style={style}>{children}</ReactRouterDOM.Link>
}

function ClassicOnWhiteButton(
    {onClick, children, style}: {onClick?: () => void, children: any, style?: React.CSSProperties}
) {
    return <button className='classic-on-white' style={style} onClick={onClick}>{children}</button>
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

function TextInput(
    { label, style, warningmsg }: { 
        label: string, 
        style?: React.CSSProperties,
        warningmsg?: string
    }
) {
    return <div className='block' style={style}>
        <label htmlFor={label.toLowerCase()} className='block'>{label}</label>
        <input type='text'/>
        <span className='warning'>{warningmsg}</span>
    </div>
}

function LogInPage() {
    return <div className='flex-column' 
        style={{ 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100vh',
            width: '100vw'
        }}>
        <div id='form-container'>
            <ClassicOnWhiteNavigationLink href={'/'}>Back to Homepage</ClassicOnWhiteNavigationLink>
            <div style={{ 
                width: '100%',
                textAlign: 'left',
                position: 'relative',
                top: '1.2cm',
            }}>
                <span>Welcome back to foto!</span><br/>
                <span>You are now logging in back to your account</span></div>
            <div style={{ position: 'relative', top: '2cm' }}>
                <TextInput label='Username' style={{ marginBottom: '0.5cm' }}/> 
                <TextInput label='Password'/>
                <ClassicOnWhiteButton style={{ position: 'relative', top: '1cm' }}>Log In</ClassicOnWhiteButton>
            </div>
        </div>
    </div>
}

const router = ReactRouterDOM.createBrowserRouter([
    {
        path: '/',
        element: <Homepage/> 
    },
    {
        path: '/log-in',
        element: <LogInPage/>
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