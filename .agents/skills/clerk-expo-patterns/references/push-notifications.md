# Push Notifications with User Context

Store the Expo push token against the Clerk user using `publicMetadata` or your own database.

## Register Push Token After Sign-In

```tsx
import { useUser } from '@clerk/expo'
import Constants from 'expo-constants'
import * as Notifications from 'expo-notifications'
import { useEffect } from 'react'

export function PushTokenRegistrar() {
  const { user, isLoaded } = useUser()
  const existingToken = user?.unsafeMetadata?.expoPushToken

  useEffect(() => {
    if (!isLoaded || !user?.id || existingToken) return

    async function register() {
      const { status } = await Notifications.requestPermissionsAsync()
      if (status !== 'granted') return

      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId
      if (!projectId) return

      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data

      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          expoPushToken: token,
        },
      })
    }

    register()
  }, [existingToken, isLoaded, user?.id])

  return null
}
```

> Use `unsafeMetadata` for client-writable data. Use `publicMetadata` (server-only write) for verified data.

## Send Notification to User (Server)

```tsx
import { clerkClient } from '@clerk/nextjs/server'

async function sendNotification(userId: string, title: string, body: string) {
  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const token = user.publicMetadata?.expoPushToken as string | undefined

  if (!token) return

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: token, title, body }),
  })
}
```

## CRITICAL

- `user.update()` is client-side — it writes `unsafeMetadata` without server auth
- For verified/sensitive data, use the Clerk Backend SDK from your server to write `publicMetadata`
- Re-register the push token if `user.id` changes (org switch does not change user.id, but sign-out/sign-in as different user does)
