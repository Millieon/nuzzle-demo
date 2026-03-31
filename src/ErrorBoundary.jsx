import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100%', padding: '32px',
          background: '#F5F5F3', fontFamily: 'DM Sans, sans-serif',
          gap: 12, textAlign: 'center'
        }}>
          <div style={{ fontSize: 28 }}>⚠️</div>
          <p style={{ fontSize: 15, fontWeight: 500, color: '#111' }}>Something went wrong</p>
          <p style={{ fontSize: 13, color: '#888', lineHeight: 1.5, maxWidth: 280 }}>
            {this.state.error?.message || 'Unknown error'}
          </p>
          <p style={{ fontSize: 11, color: '#bbb', marginTop: 8 }}>
            Check the browser console for details
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            style={{ marginTop: 8, padding: '10px 20px', background: '#111', color: '#fff',
              border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer',
              letterSpacing: '0.1em', textTransform: 'uppercase' }}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
