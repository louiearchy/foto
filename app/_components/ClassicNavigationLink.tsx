import React from 'react'
import Link from 'next/link'

import styles from '../_css/link.module.css'

export default function ClassicNavigationLink(
    {href, children, style}: { href: string, children: any, style?: React.CSSProperties | undefined }
) {
    return <Link 
        href={href}
        className={styles.classic}
        style={style}>{children}</Link>
}