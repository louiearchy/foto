import http from 'node:http'

type OnResponseCallbackFunction = (response: http.IncomingMessage) => void
type OnResponseCallbackAsyncFunction = (response: http.IncomingMessage) => Promise<void | Function>

interface HttpRequestHeaders {
    cookie?: string | string[],
    'Content-Type'?: string,
    'Content-Length'?: number
}

export default class HttpRequest {

    protected host: string;
    protected port: number;

    constructor(host: string, port: number = 80) {
        this.host = host
        this.port = port
    }

    public Get(url: string, callback: OnResponseCallbackFunction, headers?: HttpRequestHeaders) {
        
        let options = {
            host: this.host,
            port: this.port,
            path: url
        }

        if (headers)
            Object.defineProperty(options, 'headers', { value: headers, enumerable: true })

        let request = http.get(options, (response) => {
            callback(response); 
            request.destroy();
        });

    }

    public AsyncGet(url: string, callback: OnResponseCallbackAsyncFunction, headers?: HttpRequestHeaders) {
        let options = {
            host: this.host,
            port: this.port,
            path: url
        }

        if (headers)
            Object.defineProperty(options, 'headers', { value: headers, enumerable: true })

        let request = http.get(options, async (response) => {
            await callback(response);
            request.destroy();
        })
    }

    public Post(
        url: string, 
        callback: OnResponseCallbackFunction, 
        headers?: HttpRequestHeaders, 
        data?: string | Buffer
    ) {

        let options = {
            method: 'POST',
            host: this.host,
            port: this.port,
            path: url
        }

        if (headers)
            Object.defineProperty(options, 'headers', { value: headers, enumerable: true })

        let request = http.request(options, (response) => {
            callback(response); 
            request.destroy();
        });

        if (data) {
            request.write(data)
            request.end()
        }

    }

}