import renderToString from 'preact-render-to-string'
import { App } from './app'

export async function render() {
  const html = renderToString(<App />)
  return {
    body: html,
  }
}