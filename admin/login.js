import { supabase } from '../src/js/supabase.js'

const loginForm = document.getElementById('login-form')
const errorMessage = document.getElementById('error-message')
const submitBtn = document.getElementById('submit-btn')

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    
    // UI Loading state
    errorMessage.classList.add('hidden')
    submitBtn.disabled = true
    submitBtn.textContent = 'Authenticating...'
    
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    })
    
    if (error) {
        errorMessage.textContent = error.message
        errorMessage.classList.remove('hidden')
        submitBtn.disabled = false
        submitBtn.textContent = 'Sign In'
    } else {
        window.location.href = './dashboard.html'
    }
})

// Check if session exists on load
const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
        window.location.href = './dashboard.html'
    }
}

checkSession()
