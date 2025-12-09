import React from 'react'
import { useRouter } from 'expo-router'
import PasscodeSetup from '../components/security/PasscodeSetup'

export default function PasscodeSetupScreen() {
  const router = useRouter()

  return (
    <PasscodeSetup
      onComplete={() => router.back()}
      onCancel={() => router.back()}
    />
  )
}
