import { defineConfig, presetUno, presetAttributify, presetIcons } from 'unocss';

export default defineConfig({
  presets: [presetUno(), presetAttributify(), presetIcons()],
  shortcuts: {
    'flex-center': 'flex items-center justify-center',
    'flex-between': 'flex items-center justify-between',
    'page-container': 'p-24px',
  },
  theme: {
    colors: {
      primary: '#2080f0',
      success: '#18a058',
      warning: '#f0a020',
      error: '#d03050',
    },
  },
});
