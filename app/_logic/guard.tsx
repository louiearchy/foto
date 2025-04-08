
function userIsAlreadyLoggedIn(): boolean {
    return document.cookie.search("sessionid") != -1
}

function userIsNotYetLoggedIn(): boolean {
    return !userIsAlreadyLoggedIn()
}

export default function RunGuard() {

    let browser_is_on_pages_that_isnt_for_user_with_sessionid =
        window.location.pathname == '/log-in' ||
        window.location.pathname == '/sign-up' ||
        window.location.pathname == '/'

    let browser_is_on_pages_that_need_sessionid =
        window.location.pathname == '/home' ||
        (window.location.pathname.search('/album/') == 0)


    if (
        userIsAlreadyLoggedIn() && 
        browser_is_on_pages_that_isnt_for_user_with_sessionid
    ) 
        window.location.assign('/home')
    
    if (
        userIsNotYetLoggedIn() &&
        browser_is_on_pages_that_need_sessionid
    ) 
        window.location.assign('/')

}