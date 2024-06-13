
export default function JSONifyCookies(cookies: string): any {

    let cookies_are_many = cookies.indexOf(";") > 0
    let returning_json_object = {}
    let cookie_list: string[] = []

    if (cookies_are_many) {
        cookie_list = cookies.split(";")
    }
    else {
        cookie_list.push(cookies)
    }

    cookie_list.map( (current_cookie) => {
        let cookie_has_separator = current_cookie.indexOf("=") > 0
        if (cookie_has_separator) {
            let splitted_cookie_by_separator = current_cookie.split("=")
            let cookie_key = splitted_cookie_by_separator[0]
            let cookie_value = splitted_cookie_by_separator[1]
            if (cookie_key.length > 0 && cookie_value.length > 0) {
                Object.defineProperty(returning_json_object, cookie_key, {
                    value: cookie_value,
                    enumerable: true
                })
            }
        }
    })

    return returning_json_object
}
