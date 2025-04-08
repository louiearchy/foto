'use client'
import React from 'react'

import PhotoCard from './_components/PhotoCard'
import ClassicNavigationLink from './_components/ClassicNavigationLink'
import RunGuard from './_logic/guard'
import useTitle from './_logic/useTitle'

import styles from './_css/reusable.module.css'
import './_css/global.css'

export default function Homepage() {

    useTitle('Foto - a cloud photo album')

    React.useEffect(RunGuard)
    return <div className={styles['flex-column']} style={{ height: '100dvh', width: '100dvw' }}>
                <div style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    alignItems: 'center',
                    justifyContent: 'center',
                }} className={`${styles['flex-row']} photo-cards-container`}>
                    <PhotoCard/>
                    <PhotoCard/>
                    <PhotoCard/>
                </div>
                <div style={{
                    height: '30%',
                    width: '100%',
                    alignItems: 'center'
                }} className={styles['flex-column']} id='content'>
                    <span style={{ display: 'block' }} id='foto'>foto</span>
                    <span style={{ display: 'block' }} id='tagline'>when you capture your memories, you can store them here!</span>
                    <div className='navigation-link-container'>
                        <ClassicNavigationLink href={'/log-in'}>Log in to your account</ClassicNavigationLink>
                        <ClassicNavigationLink href={'/sign-up'}>Sign up for an account</ClassicNavigationLink>
                    </div>
                </div>
            </div>
}