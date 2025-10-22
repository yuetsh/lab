import { ref } from 'vue'

export function useMessage() {
  const message = ref('')
  const messageType = ref<'success' | 'error' | 'info'>('info')

  const showMessage = (text: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) => {
    message.value = text
    messageType.value = type
    
    if (duration > 0) {
      setTimeout(() => {
        message.value = ''
      }, duration)
    }
  }

  return {
    message,
    messageType,
    showMessage
  }
}
