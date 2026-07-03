import { createApp } from 'vue';
import { createPinia } from 'pinia';
import naive from 'naive-ui';

import App from './App.vue';
import router from './router';
import { setupPermissionDirective } from './directives';
import './styles/global.css';
import 'virtual:uno.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(naive);
setupPermissionDirective(app);

app.mount('#app');
