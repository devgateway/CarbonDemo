import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import './GeoServerMap.css'

// Fix for default marker icons in Leaflet with React
import 'leaflet/dist/leaflet.css'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})

L.Marker.prototype.options.icon = DefaultIcon

// Function to fetch layer title from GeoServer
const fetchLayerTitle = async (geoserverUrl, workspace, layerName) => {
  try {
    const layer = `${workspace}:${layerName}`
    const getCapabilitiesUrl = `${geoserverUrl}/wms?` +
      `SERVICE=WMS&` +
      `VERSION=1.3.0&` +
      `REQUEST=GetCapabilities`
    
    const response = await fetch(getCapabilitiesUrl)
    const text = await response.text()
    
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(text, 'text/xml')
    
    const parseError = xmlDoc.querySelector('parsererror')
    if (parseError) {
      console.error('XML parsing error:', parseError.textContent)
      return null
    }
    
    // Find the layer
    const layers = xmlDoc.querySelectorAll('Layer')
    let targetLayer = null
    
    for (let layerEl of layers) {
      const nameEl = layerEl.querySelector('Name')
      if (nameEl && nameEl.textContent.trim() === layer) {
        targetLayer = layerEl
        break
      }
    }
    
    if (!targetLayer) {
      return null
    }
    
    // Get Title element
    const titleEl = targetLayer.querySelector('Title')
    if (titleEl) {
      return titleEl.textContent.trim()
    }
    
    // Fallback to layer name if no title
    return layerName
  } catch (error) {
    console.error('Error fetching layer title:', error)
    return null
  }
}

// Function to fetch available styles for a layer from GeoServer
const fetchAvailableStyles = async (geoserverUrl, workspace, layerName) => {
  try {
    const layer = `${workspace}:${layerName}`
    const getCapabilitiesUrl = `${geoserverUrl}/wms?` +
      `SERVICE=WMS&` +
      `VERSION=1.3.0&` +
      `REQUEST=GetCapabilities`
    
    const response = await fetch(getCapabilitiesUrl)
    const text = await response.text()
    
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(text, 'text/xml')
    
    const parseError = xmlDoc.querySelector('parsererror')
    if (parseError) {
      console.error('XML parsing error:', parseError.textContent)
      return []
    }
    
    // Find the layer
    const layers = xmlDoc.querySelectorAll('Layer')
    let targetLayer = null
    
    for (let layerEl of layers) {
      const nameEl = layerEl.querySelector('Name')
      if (nameEl && nameEl.textContent.trim() === layer) {
        targetLayer = layerEl
        break
      }
    }
    
    if (!targetLayer) {
      return []
    }
    
    // Get all Style elements
    const styles = targetLayer.querySelectorAll('Style')
    const styleList = []
    
    styles.forEach(styleEl => {
      const nameEl = styleEl.querySelector('Name')
      const titleEl = styleEl.querySelector('Title')
      if (nameEl) {
        styleList.push({
          name: nameEl.textContent.trim(),
          title: titleEl ? titleEl.textContent.trim() : nameEl.textContent.trim()
        })
      }
    })
    
    return styleList
  } catch (error) {
    console.error('Error fetching available styles:', error)
    return []
  }
}

// Function to fetch layer bounding box from GeoServer
const fetchLayerBounds = async (geoserverUrl, workspace, layerName) => {
  try {
    const layer = `${workspace}:${layerName}`
    const getCapabilitiesUrl = `${geoserverUrl}/wms?` +
      `SERVICE=WMS&` +
      `VERSION=1.3.0&` +
      `REQUEST=GetCapabilities`
    
    const response = await fetch(getCapabilitiesUrl)
    const text = await response.text()
    
    // Parse XML to find bounding box
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(text, 'text/xml')
    
    // Check for parsing errors
    const parseError = xmlDoc.querySelector('parsererror')
    if (parseError) {
      console.error('XML parsing error:', parseError.textContent)
      return null
    }
    
    // Find all Layer elements and search for our layer
    const layers = xmlDoc.querySelectorAll('Layer')
    let targetLayer = null
    
    for (let layerEl of layers) {
      const nameEl = layerEl.querySelector('Name')
      if (nameEl && nameEl.textContent.trim() === layer) {
        targetLayer = layerEl
        break
      }
    }
    
    if (!targetLayer) {
      console.warn(`Layer ${layer} not found in GetCapabilities`)
      return null
    }
    
    // Try to get EX_GeographicBoundingBox first (always in WGS84/EPSG:4326)
    const geoBBox = targetLayer.querySelector('EX_GeographicBoundingBox')
    if (geoBBox) {
      const west = parseFloat(geoBBox.querySelector('westBoundLongitude')?.textContent)
      const east = parseFloat(geoBBox.querySelector('eastBoundLongitude')?.textContent)
      const south = parseFloat(geoBBox.querySelector('southBoundLatitude')?.textContent)
      const north = parseFloat(geoBBox.querySelector('northBoundLatitude')?.textContent)
      
      if (!isNaN(west) && !isNaN(east) && !isNaN(south) && !isNaN(north)) {
        // Leaflet format: [[south, west], [north, east]]
        return [[south, west], [north, east]]
      }
    }
    
    // Fallback to BoundingBox (may be in different CRS)
    const bboxes = targetLayer.querySelectorAll('BoundingBox')
    for (let bbox of bboxes) {
      const bboxCrs = bbox.getAttribute('CRS') || bbox.getAttribute('SRS') || ''
      
      // Prefer EPSG:4326 if available
      if (bboxCrs.includes('4326')) {
        const minx = parseFloat(bbox.getAttribute('minx'))
        const miny = parseFloat(bbox.getAttribute('miny'))
        const maxx = parseFloat(bbox.getAttribute('maxx'))
        const maxy = parseFloat(bbox.getAttribute('maxy'))
        
        if (!isNaN(minx) && !isNaN(miny) && !isNaN(maxx) && !isNaN(maxy)) {
          // For WMS 1.3.0 with EPSG:4326, axis order is lat,lon (y,x)
          // But we need lon,lat for Leaflet
          return [[miny, minx], [maxy, maxx]]
        }
      }
    }
    
    // Try any BoundingBox as last resort
    if (bboxes.length > 0) {
      const bbox = bboxes[0]
      const minx = parseFloat(bbox.getAttribute('minx'))
      const miny = parseFloat(bbox.getAttribute('miny'))
      const maxx = parseFloat(bbox.getAttribute('maxx'))
      const maxy = parseFloat(bbox.getAttribute('maxy'))
      const bboxCrs = bbox.getAttribute('CRS') || bbox.getAttribute('SRS') || ''
      
      if (!isNaN(minx) && !isNaN(miny) && !isNaN(maxx) && !isNaN(maxy)) {
        // If it's EPSG:3857, convert to WGS84
        if (bboxCrs.includes('3857')) {
          const toDegrees = (coord) => (coord / 20037508.34) * 180
          return [[toDegrees(miny), toDegrees(minx)], [toDegrees(maxy), toDegrees(maxx)]]
        }
        // Assume it's in lat/lon order
        return [[miny, minx], [maxy, maxx]]
      }
    }
    
    return null
  } catch (error) {
    console.error('Error fetching layer bounds:', error)
    return null
  }
}

const GeoServerMap = ({ config, onLoadLayer }) => {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const layerRef = useRef(null)
  const [localConfig, setLocalConfig] = useState(config)
  const [error, setError] = useState(null)
  const [showPanel, setShowPanel] = useState(true)
  const [availableStyles, setAvailableStyles] = useState([])
  const [loadingStyles, setLoadingStyles] = useState(false)
  const [legendUrl, setLegendUrl] = useState(null)
  const [showLegend, setShowLegend] = useState(true)
  const [layerTitle, setLayerTitle] = useState(null)

  // Track if user is typing to prevent unwanted syncs
  const isUserTypingRef = useRef(false)
  const typingTimeoutRef = useRef(null)

  useEffect(() => {
    // Initialize map only once
    if (!mapInstanceRef.current && mapRef.current) {
      try {
        // Start with a default view - will zoom to layer when it loads
        mapInstanceRef.current = L.map(mapRef.current).setView([0, 0], 2)
        mapInstanceRef.current.getContainer().style.backgroundColor = '#f0f0f0'
        
        // Add OpenStreetMap base layer for reference
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(mapInstanceRef.current)
      } catch (err) {
        console.error('Error initializing map:', err)
        setError('Failed to initialize map: ' + err.message)
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    // Update layer when config changes
    if (mapInstanceRef.current && localConfig.geoserverUrl && localConfig.workspace && localConfig.layerName) {
      // Remove existing layer
      if (layerRef.current) {
        mapInstanceRef.current.removeLayer(layerRef.current)
        layerRef.current = null
      }

      // Create WMS layer name
      const layer = `${localConfig.workspace}:${localConfig.layerName}`

      try {
        // Get CRS from config or default to EPSG:3857 (Web Mercator - Leaflet's default)
        const crs = localConfig.crs || 'EPSG:3857'
        
        // Determine WMS version based on CRS
        // WMS 1.3.0 uses CRS parameter, WMS 1.1.0 uses SRS parameter
        const useWms130 = crs.startsWith('EPSG:')
        const wmsVersion = useWms130 ? '1.3.0' : '1.1.0'
        
        // Create WMS tile layer using Leaflet's built-in WMS support
        const wmsOptions = {
          layers: layer,
          format: 'image/png',
          transparent: true,
          version: wmsVersion,
          attribution: 'GeoServer',
          maxZoom: 18
        }
        
        // Add style parameter if specified
        if (localConfig.style && localConfig.style.trim() !== '') {
          wmsOptions.styles = localConfig.style.trim()
        }
        
        layerRef.current = L.tileLayer.wms(`${localConfig.geoserverUrl}/wms`, wmsOptions)
        
        // Override getTileUrl to explicitly set CRS/SRS parameter
        // Leaflet's tileLayer.wms uses the map's CRS, but we want to use the configured CRS
        const originalGetTileUrl = layerRef.current.getTileUrl.bind(layerRef.current)
        layerRef.current.getTileUrl = function(coords) {
          const url = originalGetTileUrl(coords)
          // Replace or add CRS/SRS parameter based on WMS version
          const paramName = wmsVersion === '1.3.0' ? 'CRS' : 'SRS'
          const regex = new RegExp(`[&?]${paramName}=[^&]*`, 'i')
          const separator = url.indexOf('?') === -1 ? '?' : '&'
          
          let newUrl = url
          if (regex.test(url)) {
            newUrl = url.replace(regex, `&${paramName}=${encodeURIComponent(crs)}`)
          } else {
            newUrl = url + separator + `${paramName}=${encodeURIComponent(crs)}`
          }
          
          // Ensure style parameter is set correctly
          if (localConfig.style && localConfig.style.trim() !== '') {
            const styleRegex = /[&?]STYLES=[^&]*/i
            if (styleRegex.test(newUrl)) {
              newUrl = newUrl.replace(styleRegex, `&STYLES=${encodeURIComponent(localConfig.style.trim())}`)
            } else {
              newUrl += `&STYLES=${encodeURIComponent(localConfig.style.trim())}`
            }
          }
          
          return newUrl
        }

        layerRef.current.addTo(mapInstanceRef.current)

        layerRef.current.on('load', async () => {
          setError(null)
          console.log('GeoServer WMS layer loaded successfully')
          setShowPanel(false)
          
          // Fetch and zoom to layer bounds
          try {
            const bounds = await fetchLayerBounds(
              localConfig.geoserverUrl,
              localConfig.workspace,
              localConfig.layerName
            )
            
            if (bounds) {
              // Fit map to layer bounds with some padding
              mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] })
              console.log('Zoomed to layer bounds:', bounds)
            } else {
              console.warn('Could not determine layer bounds, using default view')
            }
          } catch (err) {
            console.error('Error zooming to layer bounds:', err)
          }
        })

        layerRef.current.on('tileerror', (error, tile) => {
          const errorMsg = `Error loading layer tiles. 
            - Check if the layer exists: ${localConfig.workspace}:${localConfig.layerName}
            - Verify the CRS (try EPSG:4326 or EPSG:3857)
            - Check GeoServer WMS is enabled for this layer
            - Open browser console for detailed error`
          setError(errorMsg)
          console.error('Error loading tile:', error, tile)
          if (layerRef.current) {
            console.error('Failed WMS URL:', layerRef.current.getTileUrl(tile.coords || {x: 0, y: 0, z: 0}))
          }
        })
        
        // Add debugging
        console.log('WMS Layer Configuration:', {
          url: `${localConfig.geoserverUrl}/wms`,
          layer: layer,
          crs: crs,
          version: wmsVersion,
          style: localConfig.style || 'default'
        })
        
        // Log a sample tile URL for debugging
        setTimeout(() => {
          if (layerRef.current) {
            const sampleUrl = layerRef.current.getTileUrl({x: 0, y: 0, z: 0})
            console.log('Sample WMS GetMap URL:', sampleUrl)
          }
        }, 100)
      } catch (err) {
        setError('Failed to create WMS layer: ' + err.message)
        console.error('Error creating layer:', err)
      }
    }
  }, [localConfig])

  // Fetch layer title when layer changes
  useEffect(() => {
    if (localConfig.geoserverUrl && localConfig.workspace && localConfig.layerName) {
      fetchLayerTitle(
        localConfig.geoserverUrl,
        localConfig.workspace,
        localConfig.layerName
      ).then(title => {
        if (title) {
          setLayerTitle(title)
        } else {
          // Fallback to a formatted version of the layer name
          setLayerTitle(localConfig.layerName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
        }
      })
    }
  }, [localConfig.geoserverUrl, localConfig.workspace, localConfig.layerName])

  // Update legend URL when style or layer changes
  useEffect(() => {
    if (localConfig.geoserverUrl && localConfig.workspace && localConfig.layerName) {
      const layer = `${localConfig.workspace}:${localConfig.layerName}`
      const styleParam = localConfig.style && localConfig.style.trim() !== '' 
        ? `&STYLE=${encodeURIComponent(localConfig.style.trim())}` 
        : ''
      const newLegendUrl = `${localConfig.geoserverUrl}/wms?` +
        `SERVICE=WMS&` +
        `VERSION=1.3.0&` +
        `REQUEST=GetLegendGraphic&` +
        `FORMAT=image/png&` +
        `LAYER=${encodeURIComponent(layer)}` +
        styleParam +
        `&LEGEND_OPTIONS=fontName:Arial;fontSize:12;fontColor:0x000000;bgColor:0xFFFFFF;dpi:90`
      setLegendUrl(newLegendUrl)
    }
  }, [localConfig.geoserverUrl, localConfig.workspace, localConfig.layerName, localConfig.style])

  const handleInputChange = (field, value) => {
    // Mark that user is typing
    isUserTypingRef.current = true
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Update local config
    setLocalConfig(prev => ({
      ...prev,
      [field]: value
    }))
    setError(null)
    
    // Reset typing flag after user stops typing for 500ms
    typingTimeoutRef.current = setTimeout(() => {
      isUserTypingRef.current = false
    }, 500)
  }
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  const handleLoadLayer = () => {
    if (!localConfig.geoserverUrl || !localConfig.workspace || !localConfig.layerName) {
      setError('Please fill in all fields')
      return
    }
    setShowPanel(true)
    setError(null)
    onLoadLayer(localConfig)
  }

  const handleFetchStyles = async () => {
    if (!localConfig.geoserverUrl || !localConfig.workspace || !localConfig.layerName) {
      setError('Please fill in GeoServer URL, Workspace, and Layer Name first')
      return
    }
    
    setLoadingStyles(true)
    setError(null)
    
    try {
      const styles = await fetchAvailableStyles(
        localConfig.geoserverUrl,
        localConfig.workspace,
        localConfig.layerName
      )
      
      if (styles.length > 0) {
        setAvailableStyles(styles)
        console.log('Available styles:', styles)
      } else {
        setError('No styles found for this layer. Using default style.')
        setAvailableStyles([])
      }
    } catch (err) {
      setError('Error fetching styles: ' + err.message)
      setAvailableStyles([])
    } finally {
      setLoadingStyles(false)
    }
  }

  return (
    <div className="geoserver-map-container">
      <div ref={mapRef} className="map" />
      
      {showPanel && (
        <div className="info-panel">
          <h3>GeoServer WMS Layer Configuration</h3>
          
          <label>
            GeoServer URL:
            <input
              type="text"
              value={localConfig.geoserverUrl || ''}
              onChange={(e) => handleInputChange('geoserverUrl', e.target.value)}
              placeholder="http://localhost:8080/geoserver"
            />
          </label>
          
          <label>
            Workspace:
            <input
              type="text"
              value={localConfig.workspace || ''}
              onChange={(e) => handleInputChange('workspace', e.target.value)}
              placeholder="topp"
            />
          </label>
          
          <label>
            Layer Name:
            <input
              type="text"
              value={localConfig.layerName || ''}
              onChange={(e) => handleInputChange('layerName', e.target.value)}
              placeholder="states"
            />
          </label>
          
          <label>
            CRS (Coordinate Reference System):
            <input
              type="text"
              value={localConfig.crs || 'EPSG:3857'}
              onChange={(e) => handleInputChange('crs', e.target.value)}
              placeholder="EPSG:3857"
            />
            <small style={{display: 'block', marginTop: '3px', color: '#666', fontSize: '12px'}}>
              Common: EPSG:3857 (Web Mercator), EPSG:4326 (WGS84)
            </small>
          </label>
          
          <label>
            Style Name (optional):
            <div style={{display: 'flex', gap: '5px', marginTop: '5px'}}>
              <input
                type="text"
                value={localConfig.style || ''}
                onChange={(e) => handleInputChange('style', e.target.value)}
                placeholder="Leave empty for default style"
                style={{flex: 1}}
              />
              <button
                onClick={handleFetchStyles}
                disabled={loadingStyles}
                style={{
                  padding: '8px 12px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: loadingStyles ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  whiteSpace: 'nowrap'
                }}
                title="Fetch available styles from GeoServer"
              >
                {loadingStyles ? '...' : 'Fetch Styles'}
              </button>
            </div>
            {availableStyles.length > 0 && (
              <select
                onChange={(e) => handleInputChange('style', e.target.value)}
                value={localConfig.style || ''}
                style={{
                  width: '100%',
                  marginTop: '5px',
                  padding: '5px',
                  fontSize: '12px'
                }}
              >
                <option value="">Default Style</option>
                {availableStyles.map((style, idx) => (
                  <option key={idx} value={style.name}>
                    {style.title}
                  </option>
                ))}
              </select>
            )}
            <small style={{display: 'block', marginTop: '3px', color: '#666', fontSize: '12px'}}>
              Leave empty to use default style, or specify a style name from GeoServer
            </small>
          </label>
          
          <label>
            Custom Legend Title (optional):
            <input
              type="text"
              value={localConfig.legendTitle || ''}
              onChange={(e) => handleInputChange('legendTitle', e.target.value)}
              placeholder="Leave empty to use layer title from GeoServer"
            />
            <small style={{display: 'block', marginTop: '3px', color: '#666', fontSize: '12px'}}>
              Override the default legend title with a custom one
            </small>
          </label>
          
          <button onClick={handleLoadLayer}>Load Layer</button>
          
          {error && <div className="error-message">{error}</div>}
        </div>
      )}
      
      {!showPanel && (
        <button 
          className="show-panel-button"
          onClick={() => setShowPanel(true)}
          title="Show configuration panel"
        >
          ⚙️
        </button>
      )}
      
      {legendUrl && showLegend && !showPanel && (
        <div className="legend-panel">
          <div className="legend-header">
            <h4 title={localConfig.legendTitle || layerTitle || 'Legend'}>
              {localConfig.legendTitle || layerTitle || 'Legend'}
            </h4>
            <button 
              className="legend-close-button"
              onClick={() => setShowLegend(false)}
              title="Hide legend"
            >
              ×
            </button>
          </div>
          <div className="legend-content">
            <img 
              src={legendUrl} 
              alt="Layer Legend" 
              onError={(e) => {
                console.error('Error loading legend image')
                e.target.style.display = 'none'
                e.target.parentElement.innerHTML = '<p style="color: #666; font-size: 12px; padding: 10px;">Legend not available</p>'
              }}
            />
          </div>
        </div>
      )}
      
      {legendUrl && !showLegend && !showPanel && (
        <button 
          className="show-legend-button"
          onClick={() => setShowLegend(true)}
          title="Show legend"
        >
          🗺️
        </button>
      )}
    </div>
  )
}

export default GeoServerMap
