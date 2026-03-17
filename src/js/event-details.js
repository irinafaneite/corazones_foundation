import { supabase } from './supabase.js'
import { initNavigation } from './navigation.js'

const eventHeader = document.getElementById('event-header')
const loadingHero = document.getElementById('loading-hero')
const loadingCover = document.getElementById('loading-cover')
const eventCover = document.getElementById('event-cover')

const init = async () => {
    initNavigation()
    const urlParams = new URLSearchParams(window.location.search)
    const eventId = urlParams.get('id')

    if (!eventId) {
        window.location.href = '/events.html'
        return
    }

    await fetchEventDetails(eventId)
}

const fetchEventDetails = async (id) => {
    const { data: event, error } = await supabase
        .from('events')
        .select('*, event_photos(*)')
        .eq('id', id)
        .single()

    if (error || !event) {
        console.error('Error fetching event details:', error)
        alert('Event not found')
        window.location.href = '/events.html'
        return
    }

    populatePage(event)
}

const formatDateShort = (dateString) => {
    if (!dateString) return 'TBA'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    }).format(date)
}

const formatDateFull = (dateString) => {
    if (!dateString) return 'Date TBA'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    }).format(date)
}

const populatePage = (event) => {
    // Top Info
    document.getElementById('event-date-top').textContent = formatDateShort(event.date)
    document.getElementById('event-location-top').textContent = event.site || event.location || 'Location TBA'
    document.getElementById('event-title').textContent = event.title
    document.getElementById('event-subtitle').textContent = event.subtitle || ''
    
    // Buttons
    const checkoutUrl = event.checkout_url || '#'
    document.getElementById('tickets-btn-top').href = checkoutUrl
    document.getElementById('tickets-btn-bottom').href = checkoutUrl

    // Cover Image
    const photo = event.event_photos?.[0]?.url
    if (photo) {
        eventCover.src = photo
        eventCover.onload = () => {
            loadingCover.classList.add('hidden')
            eventCover.classList.remove('hidden')
        }
    } else {
        eventCover.src = 'https://via.placeholder.com/1200x630?text=Corazones+of+Courage+Event'
        eventCover.classList.remove('hidden')
        loadingCover.classList.add('hidden')
    }

    // Schedule & Location
    document.getElementById('event-full-date').textContent = formatDateFull(event.date)
    const fullLocation = event.site ? `${event.site} - ${event.location || ''}` : (event.location || 'Location TBA')
    document.getElementById('event-full-location').textContent = fullLocation

    // Description
    document.getElementById('event-description').innerHTML = event.description || '<p class="text-center italic text-gray-400">No description provided for this event.</p>'

    // Show Header
    loadingHero.classList.add('hidden')
    eventHeader.classList.remove('hidden')
    
    // Page Title
    document.title = `${event.title} - Corazones of Courage Foundation`
}

init()
