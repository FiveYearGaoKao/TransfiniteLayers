import { createApp } from 'vue'
import App from './App.vue'
import { autoSaveLoop, mainLoop } from './core'
import { localLoad, localSave } from './save'
createApp(App).mount('#app')
if (!localLoad()) localSave()
setInterval(autoSaveLoop, 1000)
mainLoop()
