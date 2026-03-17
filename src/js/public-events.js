import { supabase } from './supabase.js'
import { initNavigation } from './navigation.js'

const eventsContainer = document.getElementById('events-container')
const loadingState = document.getElementById('loading-state')
const emptyState = document.getElementById('empty-state')

const init = async () => {
    initNavigation()
    await fetchEvents()
}

const fetchEvents = async () => {
    // Fetch only available events, ordered by date
    const { data: events, error } = await supabase
        .from('events')
        .select('*, event_photos(*)')
        .eq('is_available', true)
        .order('date', { ascending: true })

    if (error) {
        console.error('Error fetching events:', error)
        if (loadingState) loadingState.classList.add('hidden')
        if (eventsContainer) {
            eventsContainer.innerHTML = '<p class="text-center text-secondary py-12">Failed to load events. Please try again later.</p>'
        }
        return
    }

    if (loadingState) loadingState.classList.add('hidden')
    
    if (events.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden')
    } else if (eventsContainer) {
        renderEvents(events)
    }
}

const formatDate = (dateString) => {
    if (!dateString) return 'TBA'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }).format(date)
}

const formatTime = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    }).format(date)
}

const renderEvents = (events) => {
    eventsContainer.innerHTML = events.map(event => {
        const dateFormatted = formatDate(event.date)
        const timeFormatted = formatTime(event.date)
        const photo = event.event_photos?.[0]?.url || 'https://via.placeholder.com/600x400?text=Corazones+Foundation+Event'
        
        // Create a temporary element to strip HTML for the snippet
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = event.description || ''
        const textDescription = tempDiv.textContent || tempDiv.innerText || ''
        const snippet = textDescription.substring(0, 150) + (textDescription.length > 150 ? '...' : '')

        return `
            <div class="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 flex flex-col h-full animate-fade-in-up">
                <a href="/event-details.html?id=${event.id}" class="relative overflow-hidden aspect-[16/9] block">
                    <img src="${photo}" alt="${event.title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                    <div class="absolute top-4 left-4">
                        <span class="bg-white/90 backdrop-blur-sm text-primary px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
                            ${dateFormatted}
                        </span>
                    </div>
                </a>
                
                <div class="p-8 flex flex-col flex-grow">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="flex items-center text-other text-sm font-bold">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            ${timeFormatted}
                        </div>
                        <div class="flex items-center text-other text-sm font-bold">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            ${event.site ? `${event.site}, ` : ''}${event.location || 'Location TBA'}
                        </div>
                    </div>

                    <a href="/event-details.html?id=${event.id}" class="block">
                        <h3 class="text-2xl font-bold text-primary mb-2 group-hover:text-other transition-colors leading-tight">${event.title}</h3>
                    </a>
                    <p class="text-gray-600 text-sm mb-6 flex-grow">${event.subtitle || ''}</p>
                    
                    <div class="pt-6 border-t border-gray-50 mt-auto">
                        <a href="/event-details.html?id=${event.id}" class="block w-full text-center bg-primary hover:bg-secondary text-white font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg transform active:scale-[0.98]">
                            View Details
                        </a>
                    </div>
                </div>
            </div>
        `
    }).join('')
}

init()
