import { auth } from './firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'

export const handleFirebaseLogin = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const token = await userCredential.user.getIdToken()
    
    // Store the token in a cookie
    await fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    })

    return userCredential.user
  } catch (error) {
    throw error
  }
}
