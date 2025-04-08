
import React from 'react'
import styles from '../_css/link.module.css'

export default function ClassicOnWhiteButton(
    {onClick, children, style}: {onClick?: () => void, children: any, style?: React.CSSProperties}
) {
    return <button className={styles['classic-on-white']} style={style} onClick={onClick}>{children}</button>
}