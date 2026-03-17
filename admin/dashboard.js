import { supabase } from '../src/js/supabase.js'
import { requireAuth, signOut, formatDate } from '../src/js/admin-utils.js'

const eventsList = document.getElementById('events-list')
const logoutBtn = document.getElementById('logout-btn')

// Initialize Dashboard
const init = async () => {
    await requireAuth()
    await loadEvents()
}

const loadEvents = async () => {
    const { data: events, error } = await supabase
        .from('events')
        .select('*, event_photos(*)')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error loading events:', error)
        eventsList.innerHTML = `<tr><td colspan="4" class="px-6 py-4 text-center text-secondary">Failed to load events</td></tr>`
        return
    }

    renderEvents(events)
}

const renderEvents = (events) => {
    if (events.length === 0) {
        eventsList.innerHTML = `<tr><td colspan="4" class="px-6 py-12 text-center text-gray-400 italic">No events found. Start by creating one!</td></tr>`
        return
    }

    eventsList.innerHTML = events.map(event => {
        const photo = event.event_photos?.[0]?.url
        return `
            <tr class="hover:bg-gray-50/80 transition-colors">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-4">
                        <img src="${photo || '/logo-blanco.png'}" class="w-12 h-12 rounded object-cover border border-gray-100 invert-0 ${!photo ? 'invert bg-primary' : ''}">
                        <div>
                            <div class="font-bold text-primary">${event.title}</div>
                            <div class="text-xs text-gray-500 truncate max-w-[200px] mb-1">${event.subtitle || ''}</div>
                            <div class="flex items-center gap-1 cursor-pointer" title="Double click to select">
                                <span class="text-[10px] text-gray-400 font-bold">ID:</span>
                                <code class="text-[10px] bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-gray-600 font-mono select-all">${event.id}</code>
                            </div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm font-medium text-gray-700">${formatDate(event.date)}</div>
                    <div class="text-xs text-gray-500 italic">${event.site || ''}</div>
                    <div class="text-xs text-gray-400">${event.location || 'Remote'}</div>
                </td>
                <td class="px-6 py-4">
                    <button onclick="toggleAvailability('${event.id}', ${event.is_available})" class="px-3 py-1 rounded-full text-xs font-bold transition-all ${event.is_available ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}">
                        ${event.is_available ? 'Available' : 'Unavailable'}
                    </button>
                </td>
                <td class="px-6 py-4 text-right">
                    <div class="flex justify-end gap-2">
                        <a href="./event-form.html?id=${event.id}" class="p-2 text-primary hover:bg-gray-100 rounded-lg transition-all" title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                        </a>
                        <button onclick="deleteEvent('${event.id}')" class="p-2 text-secondary hover:bg-red-50 rounded-lg transition-all" title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `
    }).join('')
}

// Global functions for events
window.toggleAvailability = async (id, currentStatus) => {
    const { error } = await supabase
        .from('events')
        .update({ is_available: !currentStatus })
        .eq('id', id)

    if (error) alert('Error updating status')
    else loadEvents()
}

window.deleteEvent = async (id) => {
    if (!confirm('Are you sure you want to delete this event?')) return
    
    // Cleanup photos first (Supabase should handle CASCADE delete for DB but we need to cleanup storage)
    const { data: photos } = await supabase.from('event_photos').select('storage_path').eq('event_id', id)
    if (photos && photos.length > 0) {
        await supabase.storage.from('event-covers').remove(photos.map(p => p.storage_path))
    }

    const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)

    if (error) alert('Error deleting event')
    else loadEvents()
}

logoutBtn.addEventListener('click', signOut)

init()
