import { createApp } from 'vue'
import App from './App.vue'
import { autoSaveLoop, mainLoop } from './core'
import { localLoad, localSave, loadSlotChoice } from '@/save/save'
import '@/compute/buyables'
import { loadSettings, applyTheme } from '@/settings'
loadSettings()
applyTheme()
loadSlotChoice()
createApp(App).mount('#app')
if (!localLoad()) localSave()
setInterval(autoSaveLoop, 1000)
mainLoop()
