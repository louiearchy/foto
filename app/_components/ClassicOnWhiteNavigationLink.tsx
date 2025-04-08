import React from 'react'
import Link from 'next/link'

import styles from '../_css/link.module.css'

export default function ClassicOnWhiteNavigationLink(
    {href, children, style, className}: { href: string, children: any, style?: React.CSSProperties, className?: string }
) {
    return <Link
        href={href}
        className={`${styles['classic-on-white']} ${className}`}
        style={style}>{children}</Link>
}