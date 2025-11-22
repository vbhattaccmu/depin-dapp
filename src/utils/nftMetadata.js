// Generate NFT metadata with BigWater logo

// Convert image URL to base64 (for embedding in NFT)
const imageUrlToBase64 = async (url) => {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Error converting image to base64:', error)
    return null
  }
}

// Generate NFT with BigWater logo
const generateLogoSVG = (deviceId, deviceType) => {
  const typeColors = {
    water_sensor: { primary: '#1890ff', gradient1: '#40a9ff', gradient2: '#096dd9' },
    water_meter: { primary: '#52c41a', gradient1: '#73d13d', gradient2: '#389e0d' },
    quality_monitor: { primary: '#722ed1', gradient1: '#9254de', gradient2: '#531dab' },
    flow_meter: { primary: '#fa8c16', gradient1: '#ffa940', gradient2: '#d46b08' },
    other: { primary: '#8c8c8c', gradient1: '#bfbfbf', gradient2: '#595959' },
  }

  const colors = typeColors[deviceType] || typeColors.other

  // Create an artistic background with waves and gradients
  return `
    <svg width="800" height="800" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <!-- Animated gradient background -->
        <linearGradient id="bgGradient${deviceId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.gradient1};stop-opacity:0.15" />
          <stop offset="50%" style="stop-color:${colors.primary};stop-opacity:0.25" />
          <stop offset="100%" style="stop-color:${colors.gradient2};stop-opacity:0.15" />
        </linearGradient>
        
        <!-- Wave pattern -->
        <pattern id="wave${deviceId}" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
          <path d="M0,50 Q25,40 50,50 T100,50" stroke="${colors.primary}" stroke-width="2" fill="none" opacity="0.1"/>
          <path d="M0,60 Q25,50 50,60 T100,60" stroke="${colors.primary}" stroke-width="2" fill="none" opacity="0.1"/>
        </pattern>
        
        <!-- Glow effect -->
        <filter id="glow${deviceId}">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        <!-- Logo gradient -->
        <linearGradient id="logoGradient${deviceId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.gradient1};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors.gradient2};stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Background with gradient and waves -->
      <rect width="800" height="800" fill="url(#bgGradient${deviceId})"/>
      <rect width="800" height="800" fill="url(#wave${deviceId})"/>
      
      <!-- Decorative circles -->
      <circle cx="100" cy="100" r="150" fill="${colors.primary}" opacity="0.05"/>
      <circle cx="700" cy="700" r="180" fill="${colors.primary}" opacity="0.05"/>
      <circle cx="650" cy="150" r="120" fill="${colors.gradient1}" opacity="0.03"/>
      
      <!-- BigWater Logo Placeholder (will be replaced by actual logo) -->
      <g transform="translate(400, 300)">
        <!-- Water Drop with Circuit Design -->
        <path d="M 0,-120 C -45,-120 -90,-75 -90,-15 C -90,60 0,120 0,120 C 0,120 90,60 90,-15 C 90,-75 45,-120 0,-120 Z" 
              fill="url(#logoGradient${deviceId})" 
              stroke="${colors.primary}" 
              stroke-width="4"
              filter="url(#glow${deviceId})"/>
        
        <!-- Circuit Pattern -->
        <g opacity="0.9">
          <circle cx="0" cy="-30" r="12" fill="white"/>
          <circle cx="-35" cy="0" r="12" fill="white"/>
          <circle cx="35" cy="0" r="12" fill="white"/>
          <circle cx="0" cy="30" r="12" fill="white"/>
          
          <line x1="0" y1="-30" x2="-35" y2="0" stroke="white" stroke-width="3"/>
          <line x1="0" y1="-30" x2="35" y2="0" stroke="white" stroke-width="3"/>
          <line x1="-35" y1="0" x2="0" y2="30" stroke="white" stroke-width="3"/>
          <line x1="35" y1="0" x2="0" y2="30" stroke="white" stroke-width="3"/>
          
          <!-- Smaller nodes -->
          <circle cx="0" cy="-30" r="5" fill="${colors.primary}"/>
          <circle cx="-35" cy="0" r="5" fill="${colors.primary}"/>
          <circle cx="35" cy="0" r="5" fill="${colors.primary}"/>
          <circle cx="0" cy="30" r="5" fill="${colors.primary}"/>
        </g>
      </g>
      
      <!-- Device ID Badge -->
      <g transform="translate(400, 580)">
        <rect x="-280" y="0" width="560" height="120" rx="20" fill="white" opacity="0.95" 
              filter="url(#glow${deviceId})"/>
        
        <!-- BigWater DePIN Text -->
        <text x="0" y="40" text-anchor="middle" 
              font-family="Arial, sans-serif" font-size="28" font-weight="700" 
              fill="${colors.primary}">
          BigWater DePIN
        </text>
        
        <!-- Device ID -->
        <text x="0" y="80" text-anchor="middle" 
              font-family="monospace" font-size="36" font-weight="bold" 
              fill="#1a1a1a">
          ${deviceId}
        </text>
      </g>
      
      <!-- Device Type Label -->
      <text x="400" y="730" text-anchor="middle" 
            font-family="Arial, sans-serif" font-size="24" font-weight="600"
            fill="#555">
        ${deviceType.replace('_', ' ').toUpperCase()}
      </text>
      
      <!-- Decorative corner elements -->
      <circle cx="50" cy="50" r="8" fill="${colors.primary}" opacity="0.4"/>
      <circle cx="750" cy="50" r="8" fill="${colors.primary}" opacity="0.4"/>
      <circle cx="50" cy="750" r="8" fill="${colors.primary}" opacity="0.4"/>
      <circle cx="750" cy="750" r="8" fill="${colors.primary}" opacity="0.4"/>
    </svg>
  `.trim()
}

// Convert SVG to base64 data URI
const svgToBase64 = (svg) => {
  const base64 = btoa(unescape(encodeURIComponent(svg)))
  return `data:image/svg+xml;base64,${base64}`
}

// Generate complete NFT metadata following ERC721 standard
export const generateNFTMetadata = (deviceData) => {
  const {
    deviceId,
    deviceName,
    deviceType,
    location,
    description,
  } = deviceData

  // Generate SVG logo (this will be enhanced with actual logo in production)
  const logoSVG = generateLogoSVG(deviceId, deviceType)
  const imageURI = svgToBase64(logoSVG)

  // Create metadata following OpenSea/ERC721 standard
  const metadata = {
    name: deviceName,
    description: description || `BigWater DePIN Device: ${deviceName}`,
    image: imageURI,
    external_url: `https://bigwater.io/device/${deviceId}`,
    attributes: [
      {
        trait_type: 'Device ID',
        value: deviceId,
      },
      {
        trait_type: 'Device Type',
        value: deviceType.replace('_', ' ').charAt(0).toUpperCase() + deviceType.replace('_', ' ').slice(1),
      },
      {
        trait_type: 'Location',
        value: location || 'Not specified',
      },
      {
        trait_type: 'Registration Date',
        display_type: 'date',
        value: Math.floor(Date.now() / 1000), // Unix timestamp
      },
      {
        trait_type: 'Network',
        value: 'XDC',
      },
      {
        trait_type: 'Protocol',
        value: 'BigWater DePIN',
      },
      {
        trait_type: 'Status',
        value: 'Active',
      },
    ],
  }

  return metadata
}

// Convert metadata to JSON string for blockchain storage
export const metadataToJSON = (metadata) => {
  return JSON.stringify(metadata)
}

// Generate data URI for metadata (alternative to IPFS)
export const metadataToDataURI = (metadata) => {
  const json = JSON.stringify(metadata)
  const base64 = btoa(unescape(encodeURIComponent(json)))
  return `data:application/json;base64,${base64}`
}

// Parse metadata from blockchain
export const parseNFTMetadata = (metadataString) => {
  try {
    if (!metadataString) return null
    
    // Handle data URI
    if (metadataString.startsWith('data:application/json;base64,')) {
      const base64 = metadataString.split(',')[1]
      // Clean possible invalid base64 chars
      const cleaned = base64.replace(/[^A-Za-z0-9+/=]/g, '')
      const json = decodeURIComponent(escape(atob(cleaned)))
      return JSON.parse(json)
    }
    
    // Handle regular JSON string
    return JSON.parse(metadataString)
  } catch (error) {
    console.error('Failed to parse NFT metadata:', error)
    return null
  }
}

// Generate preview image URL for NFT card
export const getNFTImageURL = (metadata) => {
  if (typeof metadata === 'string') {
    metadata = parseNFTMetadata(metadata)
  }
  
  return metadata?.image || generateDefaultImage()
}

// Generate default image if none exists
const generateDefaultImage = () => {
  const svg = `
    <svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
      <rect width="800" height="800" fill="#f0f0f0"/>
      <text x="400" y="400" text-anchor="middle" font-family="Arial" font-size="48" fill="#999">
        BigWater DePIN
      </text>
    </svg>
  `
  return svgToBase64(svg)
}

export default {
  generateNFTMetadata,
  metadataToJSON,
  metadataToDataURI,
  parseNFTMetadata,
  getNFTImageURL,
}
