import React from 'react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
                <meta charSet="utf-8"/>
            </head>
            <body>
                { children }
            </body>
        </html>
    )
}