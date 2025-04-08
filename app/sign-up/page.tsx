'use client'
import React from 'react'

import AccountSignInPrompt from '../_components/AccountSignInPrompt'
import useTitle from '../_logic/useTitle'


export default function SignUpPage() {
    useTitle('Foto - Sign Up for an account!')
    return <AccountSignInPrompt
                title="It's your first time here in foto!"
                short_info='You are now signing up for an account'
                action='Sign Up'
            />
}