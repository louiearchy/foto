
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

function AccountSignInPrompt(
    { title, short_info, action }: { title: string, short_info: string, action: string }
) {
    return <div className='flex-column'
        style={{
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            width: '100vw'
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
                <TextInput label='Username' style={{ marginBottom: '0.5cm' }}/> 
                <TextInput label='Password'/>
                <ClassicOnWhiteButton style={{ position: 'relative', top: '1cm' }}>{action}</ClassicOnWhiteButton>
            </div>
        </div>
    </div>
}
function LogInPage() {
    return <AccountSignInPrompt 
                title='Welcome back to foto!'
                short_info='You are now logging in back to your account'
                action='Log In'
           />
}

function SignUpPage() {
    return <AccountSignInPrompt
                title="It's your first time here in foto!"
                short_info='You are now signing up for an account'
                action='Sign Up'
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