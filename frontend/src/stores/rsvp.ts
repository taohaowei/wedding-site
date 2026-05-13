import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RsvpFormState } from '@/api/types'
import { postRsvp } from '@/api/rsvp'

export const useRsvpStore = defineStore('rsvp', () => {
  const form = ref<RsvpFormState>({
    name: '',
    attending: '',
    headcount: undefined,
    needLodging: undefined,
    arrivalDate: undefined,
    dietary: '',
    message: ''
  })

  const submitting = ref(false)
  const submitted = ref(false)
  const errorMsg = ref('')

  function reset() {
    form.value = {
      name: '',
      attending: '',
      headcount: undefined,
      needLodging: undefined,
      arrivalDate: undefined,
      dietary: '',
      message: ''
    }
    submitting.value = false
    submitted.value = false
    errorMsg.value = ''
  }

  async function submit() {
    submitting.value = true
    errorMsg.value = ''
    const r = await postRsvp(form.value)
    submitting.value = false
    if (r.ok) {
      submitted.value = true
      return true
    } else {
      errorMsg.value = r.error
      return false
    }
  }

  return { form, submitting, submitted, errorMsg, reset, submit }
})
