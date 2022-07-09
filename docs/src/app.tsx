import { h } from 'preact'
import { setup } from 'goober'
import { Router, Route, ErrorBoundary } from 'preact-iso'
import Layout from './components/Layout'

setup(h)

// TODO: lazy routes does need addition of prepass in entry-server
import Home from './pages/Home'
import GettingStarted from './pages/docs/getting-started'

export function App() {
  return (
    <Layout>
      <ErrorBoundary>
        <div>
          <Router>
            <Route component={Home} path="/" />
            <Route component={GettingStarted} path="/docs/getting-started" />
          </Router>
        </div>
      </ErrorBoundary>
    </Layout>
  )
}
