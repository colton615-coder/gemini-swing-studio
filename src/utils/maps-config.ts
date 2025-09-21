// Google Maps Configuration
export const GOOGLE_MAPS_CONFIG = {
  // Demo API key - replace with your actual Google Maps API key
  API_KEY: process.env.GOOGLE_MAPS_API_KEY || "YOUR_API_KEY_HERE",
  
  // Map configuration similar to 18Birdies
  DEFAULT_OPTIONS: {
    zoom: 18,
    mapTypeId: 'satellite' as const,
    disableDefaultUI: true,
    zoomControl: true,
    gestureHandling: 'greedy' as const,
    styles: [
      {
        featureType: 'poi',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'transit',
        stylers: [{ visibility: 'off' }]
      }
    ]
  },

  // Golf course specific settings
  GOLF_SETTINGS: {
    teeMarkerColor: '#22c55e',
    greenMarkerColor: '#ef4444',
    userLocationColor: '#3b82f6',
    shotMarkerColor: '#000000',
    customTeeColor: '#f59e0b'
  }
};

// Course data providers (18Birdies uses multiple sources)
export const COURSE_DATA_SOURCES = {
  // These would typically require API keys and subscriptions
  providers: [
    'Golf Course Data Company',
    'GolfNow',
    'TeeOff',
    'USGA Course Rating',
    'State Golf Associations'
  ],
  
  // Real course data would include:
  features: [
    'Accurate yardages',
    'Green complexes',
    'Hazard locations', 
    'Elevation changes',
    'Course conditions',
    'Pin positions',
    'Weather integration'
  ]
};

export default GOOGLE_MAPS_CONFIG;