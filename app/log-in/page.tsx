'use client'
import React from 'react'

import AccountSignInPrompt from '../_components/AccountSignInPrompt'
import useTitle from '../_logic/useTitle'

export default function LogInPage() {
    useTitle('Foto - Log In to your account')
    return <AccountSignInPrompt 
                title='Welcome back to foto!'
                short_info='You are now logging in back to your account'
                action='Log In'
           />
}