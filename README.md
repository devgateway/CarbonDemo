# GeoServer WMS Layer Viewer

A React component that displays GeoServer layers using WMS (Web Map Service) with Leaflet.

## Features

- React-based component architecture
- WMS layer support from GeoServer
- Style selection and management
- Automatic zoom to layer extent
- Interactive configuration panel
- Error handling and validation
- Easy to customize and integrate

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to the URL shown in the terminal (typically `http://localhost:5173`)

## Usage

1. The app will open with default configuration
2. Use the configuration panel to set your GeoServer settings:
   - **GeoServer URL**: Your GeoServer instance URL (e.g., `http://localhost:8080/geoserver`)
   - **Workspace**: The workspace name (e.g., `topp`, `cite`, etc.)
   - **Layer Name**: The name of the layer to display
   - **CRS**: Coordinate Reference System (default: EPSG:3857 for Web Mercator)
   - **Style Name**: Optional style name from GeoServer (leave empty for default)
   - **Custom Legend Title**: Optional custom title for the legend (leave empty to use layer title from GeoServer)
3. Click "Fetch Styles" to see available styles for the layer
4. Click "Load Layer" to display the GeoServer layer
5. The map will automatically zoom to the layer's extent
6. The legend will appear in the bottom-right corner with the layer title

## Example Configuration

- **GeoServer URL**: `http://localhost:8080/geoserver`
- **Workspace**: `topp`
- **Layer Name**: `states`

## Customization

### Change Default Map Center

Edit `src/components/GeoServerMap.jsx` and modify the initial map view:

```javascript
mapInstanceRef.current = L.map(mapRef.current).setView([39.8283, -98.5795], 4)
```

The coordinates `[39.8283, -98.5795]` represent the center of the United States, and `4` is the zoom level.

### Change Default Configuration

Edit `src/App.jsx` to change the default configuration:

```javascript
const [config, setConfig] = useState({
  geoserverUrl: 'http://localhost:8080/geoserver',
  workspace: 'topp',
  layerName: 'states'
})
```

## Project Structure

```
geoserver_test/
├── src/
│   ├── components/
│   │   ├── GeoServerMap.jsx    # Main map component
│   │   └── GeoServerMap.css    # Component styles
│   ├── App.jsx                 # Main app component
│   ├── App.css                 # App styles
│   ├── main.jsx                # React entry point
│   └── index.css               # Global styles
├── index.html                  # HTML template
├── package.json                # Dependencies
└── vite.config.js              # Vite configuration
```

## Libraries Used

- **React**: 18.2.0 - UI library
- **Leaflet**: 1.9.4 - Open-source JavaScript library for mobile-friendly interactive maps
- **ESRI Leaflet**: 3.0.10 - Plugin for Leaflet to work with ArcGIS services
- **Vite**: 5.0.8 - Build tool and dev server

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Styling Layers in GeoServer

GeoServer provides powerful styling capabilities through SLD (Styled Layer Descriptor) and CSS. Here's what you can do:

### 1. Create Styles in GeoServer Web Interface

1. **Access GeoServer Admin**: Navigate to `http://your-geoserver:8080/geoserver/web`
2. **Go to Styles**: Click "Styles" in the left menu
3. **Create New Style**: Click "Add a new style"
4. **Choose Style Format**:
   - **SLD (Styled Layer Descriptor)**: XML-based, most powerful
   - **CSS**: Simpler syntax, good for basic styling
   - **YSLD**: YAML-based, easier to read than SLD

### 2. Common Styling Options

#### For Raster Layers (like your carbon prediction layer):

**Color Ramp Examples:**
- **Heat map**: Red to yellow for high values, blue for low values
- **Grayscale**: Black to white gradient
- **Rainbow**: Full spectrum colors
- **Custom**: Define your own color stops

**In SLD, you can use:**
```xml
<ColorMap>
  <ColorMapEntry color="#0000FF" quantity="0" label="Low"/>
  <ColorMapEntry color="#00FFFF" quantity="50" label="Medium"/>
  <ColorMapEntry color="#FFFF00" quantity="100" label="High"/>
  <ColorMapEntry color="#FF0000" quantity="200" label="Very High"/>
</ColorMap>
```

#### For Vector Layers:

- **Fill colors**: Solid colors, patterns, or gradients
- **Stroke colors and widths**: Border styling
- **Point symbols**: Markers, icons, custom shapes
- **Labels**: Text styling and placement
- **Opacity**: Transparency settings

### 3. Apply Styles to Layers

1. **Go to Layers**: Click "Layers" in GeoServer admin
2. **Select Your Layer**: Find and click on your layer
3. **Edit Layer**: Click "Edit" tab
4. **Set Default Style**: Choose a style from the dropdown
5. **Publish**: Click "Save" to apply

### 4. Using Styles in This App

- **Default Style**: Leave "Style Name" field empty to use the layer's default style
- **Named Style**: Enter the exact style name from GeoServer
- **Fetch Styles**: Click "Fetch Styles" button to see all available styles for your layer
- **Select from Dropdown**: After fetching, choose a style from the dropdown

### 5. Quick Style Tips

**For Better Visibility:**
- Use high contrast color ramps (e.g., dark blue to bright yellow)
- Adjust opacity to see underlying basemap
- Use colorbrewer.org for color scheme ideas
- Consider your data range when setting color stops

**For Carbon/Environmental Data:**
- Green to red: Low to high carbon
- Blue to red: Cool to warm
- Grayscale: Simple, professional look
- Custom: Match your organization's color scheme

### 6. Advanced: SLD_BODY Parameter

For dynamic styling, you can also use the `SLD_BODY` parameter in WMS requests, but this requires sending the full SLD XML. The current app uses the simpler `STYLES` parameter with pre-defined style names.

## Legend Features

The app automatically displays a legend for your layer:

- **Automatic Title**: The legend uses the layer title from GeoServer's GetCapabilities
- **Custom Title**: You can override the title by entering a custom legend title in the configuration panel
- **Style-Aware**: The legend updates automatically when you change styles
- **Toggleable**: Click the × button to hide, or the 🗺️ button to show the legend again
- **Responsive**: Long titles are truncated with ellipsis, full title shown on hover

### Setting Good Legend Titles in GeoServer

For the best legend titles:

1. **Set Layer Title in GeoServer**:
   - Go to GeoServer Admin → Layers → Select your layer
   - Click "Edit" tab
   - Set a descriptive "Title" (e.g., "Carbon Prediction 2024 - 100m Resolution")
   - Click "Save"

2. **Use Custom Legend Title in App**:
   - Enter a custom title in the "Custom Legend Title" field
   - This overrides the GeoServer layer title
   - Useful for shorter, more concise titles

3. **Best Practices**:
   - Keep titles concise but descriptive
   - Include units if relevant (e.g., "Carbon (tons/ha)")
   - Include date/version if applicable
   - Use title case for readability

## Notes

- Make sure your GeoServer instance is accessible from your browser
- If you encounter CORS issues, you may need to configure GeoServer to allow cross-origin requests
- The component uses WMS (Web Map Service) to fetch tiles from GeoServer
- The component handles layer cleanup and re-initialization properly
- Styles must be published in GeoServer before they can be used
- The map automatically zooms to the layer's extent when loaded
- The legend title is automatically fetched from GeoServer's GetCapabilities response

