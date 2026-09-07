import { ref } from 'vue'

// 模块级状态：全局共享一份提示，由 App.vue 统一渲染成 toast。
// ProjectCard 这类会在操作后被卸载的组件（比如删除自己）必须用它，
// 否则提示会随组件一起消失。
const message = ref('')
const messageType = ref<'success' | 'error' | 'info'>('info')
let timer: ReturnType<typeof setTimeout> | null = null

export function useGlobalMessage() {
  const showMessage = (
    text: string,
    type: 'success' | 'error' | 'info' = 'info',
    duration = 3000
  ) => {
    message.value = text
    messageType.value = type

    // 清掉上一条的定时器，避免旧的超时把新提示提前抹掉
    if (timer) clearTimeout(timer)
    timer = null

    if (duration > 0) {
      timer = setTimeout(() => {
        message.value = ''
        timer = null
      }, duration)
    }
  }

  return { message, messageType, showMessage }
}
