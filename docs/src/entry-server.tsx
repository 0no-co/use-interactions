import { LocationProvider } from 'preact-iso'
import renderToString from 'preact-render-to-string'
import { extractCss } from 'goober'
import { App } from './app'

// @ts-ignore
global.location = {
  origin: 'http://localhost:3000'
}

export async function render(url: string) {
  const jsx = (
    // @ts-ignore
    <LocationProvider url={url}>
      <App />
    </LocationProvider>
  )
  const html = renderToString(jsx)
  return {
    body: html,
    css: extractCss()
  }
}