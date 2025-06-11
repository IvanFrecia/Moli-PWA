import { defineConfig } from 'unocss'
import presetWind3 from '@unocss/preset-wind3'
import presetAttributify from '@unocss/preset-attributify'
import presetTypography from '@unocss/preset-typography'

export default defineConfig({
  presets: [
    presetWind3(),
    presetAttributify(),
    presetTypography(),
  ],
  theme: {
    colors: {
      primary: '#9c27b0', // Magenta/Violet theme from Angular Material
      secondary: '#673ab7',
      accent: '#e91e63',
      warn: '#f44336',
      success: '#4caf50',
    }
  },
  shortcuts: [
    ['btn', 'px-4 py-2 rounded inline-block bg-primary text-white cursor-pointer hover:bg-primary-600 disabled:cursor-default disabled:bg-gray-600 disabled:opacity-50'],
    ['btn-secondary', 'btn bg-secondary hover:bg-secondary-600'],
    ['icon', 'inline-block w-1em h-1em stroke-current'],
  ]
})
