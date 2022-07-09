import { hydrate, render } from 'preact'
import { LocationProvider } from 'preact-iso'

import { App } from './app'

const app = document.getElementById('app')!
const jsx = (
    <LocationProvider><App /></LocationProvider>
)
if (app.hasChildNodes()) {
    hydrate(jsx, app)
} else {
    render(jsx, app)
}

