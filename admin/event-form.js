import { supabase } from '../src/js/supabase.js'
import { requireAuth } from '../src/js/admin-utils.js'

const saveBtn = document.getElementById('save-btn')
const formTitle = document.getElementById('form-title')
const imagePreview = document.getElementById('image-preview')
const coverPhotoFile = document.getElementById('cover_photo_file')

let selectedFile = null
let existingPhoto = null

// Configure Quill to use inline styles for alignment
const AlignStyle = Quill.import('attributors/style/align');
// Font will use classes (default) to match our CSS
const Font = Quill.import('formats/font');

// Define allowed fonts (these match the ql-font-XXX classes in CSS)
Font.whitelist = [
    'kanit',
    'montserrat',
    'playfair',
    'public-sans'
];

Quill.register(AlignStyle, true);
Quill.register(Font, true);

// Initialize Quill
const quill = new Quill('#editor-container', {
    theme: 'snow',
    placeholder: 'Write the event description here...',
    modules: {
        toolbar: [
            [{ 'font': Font.whitelist }], 
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'align': [] }],
            ['link', 'image', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['clean']
        ]
    }
})

// Handle image preview
coverPhotoFile.addEventListener('change', (e) => {
    const file = e.target.files[0]
    if (file) {
        selectedFile = file
        const reader = new FileReader()
        reader.onload = (e) => {
            imagePreview.innerHTML = `<img src="${e.target.result}" class="w-full h-full object-cover">`
        }
        reader.readAsDataURL(file)
    }
})

// Initialize Form
const init = async () => {
    await requireAuth()
    
    const urlParams = new URLSearchParams(window.location.search)
    const eventId = urlParams.get('id')
    
    if (eventId) {
        formTitle.textContent = 'Edit Event'
        loadEvent(eventId)
    }
}

const loadEvent = async (id) => {
    // Fetch event
    const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single()
        
    if (eventError) {
        console.error('Error loading event:', eventError)
        alert('Error loading event details')
        window.location.href = './dashboard.html'
        return
    }

    // Fetch photo
    const { data: photo, error: photoError } = await supabase
        .from('event_photos')
        .select('*')
        .eq('event_id', id)
        .maybeSingle() // Use maybeSingle to avoid error if no photo exists

    if (photoError) {
        console.error('Error fetching photo:', photoError)
    }

    existingPhoto = photo
    fillForm(event, photo)
}

const fillForm = (event, photo) => {
    document.getElementById('event-id').value = event.id
    
    // Show Stripe info
    if (event.id) {
        document.getElementById('display-event-id').value = event.id
        document.getElementById('stripe-info-container').classList.remove('hidden')
    }

    document.getElementById('title').value = event.title
    document.getElementById('subtitle').value = event.subtitle || ''
    document.getElementById('date').value = event.date ? new Date(event.date).toISOString().slice(0, 16) : ''
    document.getElementById('site').value = event.site || ''
    document.getElementById('location').value = event.location || ''
    document.getElementById('checkout_url').value = event.checkout_url || ''
    document.getElementById('is_available').checked = event.is_available
    quill.root.innerHTML = event.description || ''

    if (photo) {
        imagePreview.innerHTML = `<img src="${photo.url}" class="w-full h-full object-cover">`
    }
}

const uploadImage = async (eventId) => {
    if (!selectedFile) return null

    const fileExt = selectedFile.name.split('.').pop()
    const fileName = `${eventId}/${Math.random()}.${fileExt}`
    const filePath = `covers/${fileName}`

    // Upload to Storage
    const { error: uploadError } = await supabase.storage
        .from('event-covers')
        .upload(filePath, selectedFile)

    if (uploadError) throw uploadError

    // Get Public URL
    const { data: { publicUrl } } = supabase.storage
        .from('event-covers')
        .getPublicUrl(filePath)

    return { storage_path: filePath, url: publicUrl }
}

saveBtn.addEventListener('click', async () => {
    const id = document.getElementById('event-id').value
    const title = document.getElementById('title').value
    const subtitle = document.getElementById('subtitle').value
    const dateInput = document.getElementById('date').value
    const site = document.getElementById('site').value
    const location = document.getElementById('location').value
    const checkout_url = document.getElementById('checkout_url').value
    const is_available = document.getElementById('is_available').checked
    const description = quill.root.innerHTML

    if (!title) {
        alert('Please enter an event title.')
        return
    }

    saveBtn.disabled = true
    saveBtn.textContent = 'Saving...'

    try {
        const eventData = {
            title,
            subtitle,
            date: dateInput ? new Date(dateInput).toISOString() : null,
            site,
            location,
            checkout_url,
            is_available,
            description
        }

        let eventId = id
        if (id) {
            const { error } = await supabase.from('events').update(eventData).eq('id', id)
            if (error) throw error
        } else {
            const { data, error } = await supabase.from('events').insert([eventData]).select().single()
            if (error) throw error
            eventId = data.id
        }

        // Handle Image Upload
        if (selectedFile) {
            const photoData = await uploadImage(eventId)
            
            // Delete old photo if exists
            if (existingPhoto) {
                await supabase.storage.from('event-covers').remove([existingPhoto.storage_path])
                await supabase.from('event_photos').delete().eq('id', existingPhoto.id)
            }

            // Save new photo reference
            const { error: photoError } = await supabase.from('event_photos').insert([{
                event_id: eventId,
                storage_path: photoData.storage_path,
                url: photoData.url
            }])
            if (photoError) throw photoError
        }

        window.location.href = './dashboard.html'
    } catch (error) {
        console.error('Error saving event:', error)
        alert('Failed to save event: ' + error.message)
        saveBtn.disabled = false
        saveBtn.textContent = 'Save Event'
    }
})

init()
