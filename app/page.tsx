import { redirect } from 'next/navigation'

export default async function Home() {
  // Server-side redirect to prompt-enhancer
  redirect('/prompt-enhancer')
  
  // This return is never reached due to redirect
  return null
}