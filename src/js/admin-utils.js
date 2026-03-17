import { supabase } from './supabase.js'

export const requireAuth = async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (!session || error) {
        window.location.href = '/admin/login.html'
    }
    return session
}

export const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
        window.location.href = '/admin/login.html'
    }
}

export const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}
