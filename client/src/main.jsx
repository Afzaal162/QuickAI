import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import axios from 'axios'
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key')
}
// Configure Axios globally for the entire app
axios.defaults.baseURL = import.meta.env.DEV 
  ? 'http://localhost:3000' 
  : 'https://quick-ai-server-7fzzdc43e-afzaal-hassans-projects.vercel.app';

axios.defaults.withCredentials = true;
createRoot(document.getElementById('root')).render(
  <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl='/'>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ClerkProvider>
)
