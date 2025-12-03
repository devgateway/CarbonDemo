import React, { useState } from 'react'
import GeoServerMap from './components/GeoServerMap'
import ErrorBoundary from './components/ErrorBoundary'
import './App.css'

function App() {
  const [config, setConfig] = useState({
    geoserverUrl: 'https://gis.developmentgateway.org/geoserver',
    workspace: 'senegal',
    layerName: 'carbon_pred_2024-05_100m_COG',
    crs: 'EPSG:3857', // Default to Web Mercator (Leaflet's default)
    style: '', // Style name from GeoServer (empty = default style)
    legendTitle: 'Carbon Prediction 2025' // Default legend title
  })

  const [layerKey, setLayerKey] = useState(0)

  const handleLoadLayer = (newConfig) => {
    setConfig(newConfig)
    setLayerKey(prev => prev + 1) // Force re-render of map component
  }

  return (
    <ErrorBoundary>
      <div className="app">
        <GeoServerMap 
          config={config} 
          onLoadLayer={handleLoadLayer}
          key={layerKey}
        />
      </div>
    </ErrorBoundary>
  )
}

export default App

