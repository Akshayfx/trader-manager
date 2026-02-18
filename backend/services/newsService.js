/**
 * News Service
 * Handles economic calendar and news events using free APIs
 */

const axios = require('axios');
const logger = require('../utils/logger');

// Free Economic Calendar APIs
const API_SOURCES = {
  // Primary: Economic Calendar API (RapidAPI) - Free tier: 100 requests/day
  horizonfx: {
    baseUrl: 'https://economic-calendar.p.rapidapi.com',
    headers: {
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
      'X-RapidAPI-Host': 'economic-calendar.p.rapidapi.com'
    }
  },
  // Fallback: Finnhub (Free tier: 60 calls/minute)
  finnhub: {
    baseUrl: 'https://finnhub.io/api/v1',
    token: process.env.FINNHUB_API_KEY || ''
  },
  // Backup: Mock data for development
  mock: null
};

// Cache for news events
let newsCache = {
  data: [],
  lastUpdated: null,
  expiresIn: 5 * 60 * 1000 // 5 minutes
};

/**
 * Get upcoming news events with optional filtering
 */
async function getUpcomingNews(hoursAhead = 4, currencies = null, impactLevels = null) {
  try {
    // Check cache first
    if (isCacheValid()) {
      return filterUpcomingEvents(newsCache.data, hoursAhead, currencies, impactLevels);
    }

    // Try primary API
    let events = await fetchFromHorizonFX(hoursAhead);
    
    // Fallback to Finnhub if primary fails
    if (!events || events.length === 0) {
      events = await fetchFromFinnhub(hoursAhead);
    }
    
    // Use mock data if all APIs fail
    if (!events || events.length === 0) {
      events = getMockNewsEvents();
    }

    // Update cache
    newsCache.data = events;
    newsCache.lastUpdated = Date.now();

    return filterUpcomingEvents(events, hoursAhead, currencies, impactLevels);
  } catch (error) {
    logger.error('Error fetching news:', error);
    return filterUpcomingEvents(getMockNewsEvents(), hoursAhead, currencies, impactLevels);
  }
}

/**
 * Fetch from HorizonFX API (RapidAPI)
 */
async function fetchFromHorizonFX(hoursAhead) {
  try {
    if (!API_SOURCES.horizonfx.headers['X-RapidAPI-Key']) {
      logger.warn('RapidAPI key not configured');
      return null;
    }

    const fromDate = new Date().toISOString().split('T')[0];
    const toDate = new Date(Date.now() + hoursAhead * 60 * 60 * 1000).toISOString().split('T')[0];

    const response = await axios.get(`${API_SOURCES.horizonfx.baseUrl}/events`, {
      headers: API_SOURCES.horizonfx.headers,
      params: {
        from: fromDate,
        to: toDate,
        countries: 'US,EU,GB,JP,AU,CA,CH,NZ'
      },
      timeout: 10000
    });

    if (response.data && Array.isArray(response.data)) {
      return response.data.map(event => ({
        id: event.id,
        currency: event.currencyCode || event.countryCode,
        event: event.name,
        impact: mapImpactLevel(event.volatility),
        time: new Date(event.dateUtc),
        actual: event.actual,
        forecast: event.consensus,
        previous: event.previous,
        unit: event.unit
      }));
    }
    return null;
  } catch (error) {
    logger.error('HorizonFX API error:', error.message);
    return null;
  }
}

/**
 * Fetch from Finnhub API
 */
async function fetchFromFinnhub(hoursAhead) {
  try {
    if (!API_SOURCES.finnhub.token) {
      logger.warn('Finnhub API key not configured');
      return null;
    }

    const fromDate = new Date().toISOString().split('T')[0];
    const toDate = new Date(Date.now() + hoursAhead * 60 * 60 * 1000).toISOString().split('T')[0];

    const response = await axios.get(`${API_SOURCES.finnhub.baseUrl}/calendar/economic`, {
      params: {
        from: fromDate,
        to: toDate,
        token: API_SOURCES.finnhub.token
      },
      timeout: 10000
    });

    if (response.data && response.data.economicCalendar) {
      return response.data.economicCalendar.map(event => ({
        id: event.time,
        currency: event.country,
        event: event.event,
        impact: mapImpactLevel(event.impact),
        time: new Date(event.time),
        actual: event.actual,
        forecast: event.estimate,
        previous: event.prev
      }));
    }
    return null;
  } catch (error) {
    logger.error('Finnhub API error:', error.message);
    return null;
  }
}

/**
 * Map API impact level to our format
 */
function mapImpactLevel(volatility) {
  if (!volatility) return 'low';
  const level = volatility.toString().toLowerCase();
  if (level === 'high' || level === '3') return 'high';
  if (level === 'medium' || level === '2') return 'medium';
  return 'low';
}

/**
 * Check if cache is valid
 */
function isCacheValid() {
  if (!newsCache.lastUpdated) return false;
  return (Date.now() - newsCache.lastUpdated) < newsCache.expiresIn;
}

/**
 * Filter events to only upcoming ones with optional currency and impact filtering
 */
function filterUpcomingEvents(events, hoursAhead, currencies = null, impactLevels = null) {
  const now = new Date();
  const cutoff = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

  return events
    .filter(event => {
      const eventTime = new Date(event.time);
      const isUpcoming = eventTime >= now && eventTime <= cutoff;
      
      // Filter by currencies if specified
      const currencyMatch = !currencies || currencies.length === 0 || 
        currencies.includes(event.currency);
      
      // Filter by impact levels if specified
      const impactMatch = !impactLevels || impactLevels.length === 0 || 
        impactLevels.includes(event.impact);
      
      return isUpcoming && currencyMatch && impactMatch;
    })
    .map(event => ({
      ...event,
      minutesUntil: Math.floor((new Date(event.time) - now) / (1000 * 60)),
      formattedTime: formatTime(event.time)
    }))
    .sort((a, b) => new Date(a.time) - new Date(b.time));
}

/**
 * Format time for display
 */
function formatTime(date) {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
}

/**
 * Get high impact events for a currency
 */
async function getHighImpactEvents(currency) {
  const events = await getUpcomingNews(24);
  return events.filter(e => 
    e.currency === currency && e.impact === 'high'
  );
}

/**
 * Check if there is news protection needed
 */
async function checkNewsProtection(symbol) {
  const baseCurrency = symbol.substring(0, 3);
  const quoteCurrency = symbol.substring(3, 6);
  
  const events = await getUpcomingNews(2);
  
  const relevantEvents = events.filter(e => 
    e.currency === baseCurrency || e.currency === quoteCurrency
  );
  
  const highImpact = relevantEvents.filter(e => e.impact === 'high');
  
  return {
    needsProtection: highImpact.length > 0,
    events: highImpact,
    minutesUntil: highImpact.length > 0 ? highImpact[0].minutesUntil : null
  };
}

/**
 * Get news impact color
 */
function getImpactColor(impact) {
  switch (impact) {
    case 'high': return '#ef4444';
    case 'medium': return '#f59e0b';
    case 'low': return '#10b981';
    default: return '#6b7280';
  }
}

/**
 * Get mock news events for development
 */
function getMockNewsEvents() {
  const now = new Date();
  
  return [
    {
      id: '1',
      currency: 'USD',
      event: 'FOMC Minutes',
      impact: 'high',
      time: new Date(now.getTime() + 6 * 60 * 1000),
      actual: null,
      forecast: null,
      previous: null,
      unit: ''
    },
    {
      id: '2',
      currency: 'USD',
      event: 'Non-Farm Payrolls',
      impact: 'high',
      time: new Date(now.getTime() + 45 * 60 * 1000),
      actual: null,
      forecast: '200K',
      previous: '199K',
      unit: 'Jobs'
    },
    {
      id: '3',
      currency: 'EUR',
      event: 'ECB Rate Decision',
      impact: 'high',
      time: new Date(now.getTime() + 120 * 60 * 1000),
      actual: null,
      forecast: '4.5%',
      previous: '4.5%',
      unit: '%'
    },
    {
      id: '4',
      currency: 'GBP',
      event: 'CPI Data',
      impact: 'medium',
      time: new Date(now.getTime() + 180 * 60 * 1000),
      actual: null,
      forecast: '4.2%',
      previous: '4.1%',
      unit: '%'
    }
  ];
}

/**
 * Get active news alert (nearest event matching criteria)
 */
async function getActiveNewsAlert(currencies = null, impactLevels = ['high']) {
  const events = await getUpcomingNews(4, currencies, impactLevels);
  
  if (events.length > 0) {
    return events[0];
  }
  
  return null;
}

module.exports = {
  getUpcomingNews,
  getHighImpactEvents,
  checkNewsProtection,
  getImpactColor,
  getActiveNewsAlert,
  getMockNewsEvents
};
