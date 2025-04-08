
import React from 'react'
import { TextInputProps } from '../types'

import '../_css/global.css'
import TextInputStyle from '../_css/textinput.module.css'


const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
    { label, style, warningmsg, setWarningMsg },
    ref
) {
    let innateStyle = { display: 'block' }
    if (style)
        Object.assign(style, innateStyle)
    else
        style = innateStyle

    return (
        <div style={style}>
            <label htmlFor={label?.toLowerCase()} style={{display: 'block'}}>{label}</label>
            <input type='text' className={TextInputStyle['default']} ref={ref} onChange={ () => setWarningMsg('') } />
            <span className={TextInputStyle['warning']}>{warningmsg}</span>
        </div>
    )
})

export default TextInput