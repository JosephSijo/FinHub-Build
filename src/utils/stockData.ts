// Stock data utilities for fetching symbol information and prices

interface StockSuggestion {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
}

interface PriceData {
  price: number;
  date: string;
}

// Popular stock symbols for suggestions
const US_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', exchange: 'NASDAQ' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock', exchange: 'NASDAQ' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'stock', exchange: 'NASDAQ' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock', exchange: 'NASDAQ' },
  { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock', exchange: 'NASDAQ' },
  { symbol: 'META', name: 'Meta Platforms Inc.', type: 'stock', exchange: 'NASDAQ' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'stock', exchange: 'NASDAQ' },
  { symbol: 'NFLX', name: 'Netflix Inc.', type: 'stock', exchange: 'NASDAQ' },
];

const INDIAN_NSE_STOCKS = [
  { symbol: 'TCS', name: 'Tata Consultancy Services', type: 'stock', exchange: 'NSE' },
  { symbol: 'INFY', name: 'Infosys Limited', type: 'stock', exchange: 'NSE' },
  { symbol: 'RELIANCE', name: 'Reliance Industries', type: 'stock', exchange: 'NSE' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Limited', type: 'stock', exchange: 'NSE' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Limited', type: 'stock', exchange: 'NSE' },
  { symbol: 'WIPRO', name: 'Wipro Limited', type: 'stock', exchange: 'NSE' },
  { symbol: 'SBIN', name: 'State Bank of India', type: 'stock', exchange: 'NSE' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel', type: 'stock', exchange: 'NSE' },
  { symbol: 'ITC', name: 'ITC Limited', type: 'stock', exchange: 'NSE' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', type: 'stock', exchange: 'NSE' },
];

const INDIAN_BSE_STOCKS = [
  { symbol: 'TCS', name: 'Tata Consultancy Services', type: 'stock', exchange: 'BSE' },
  { symbol: 'INFY', name: 'Infosys Limited', type: 'stock', exchange: 'BSE' },
  { symbol: 'RELIANCE', name: 'Reliance Industries', type: 'stock', exchange: 'BSE' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Limited', type: 'stock', exchange: 'BSE' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Limited', type: 'stock', exchange: 'BSE' },
  { symbol: 'WIPRO', name: 'Wipro Limited', type: 'stock', exchange: 'BSE' },
  { symbol: 'SBIN', name: 'State Bank of India', type: 'stock', exchange: 'BSE' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel', type: 'stock', exchange: 'BSE' },
  { symbol: 'ITC', name: 'ITC Limited', type: 'stock', exchange: 'BSE' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', type: 'stock', exchange: 'BSE' },
];

const CRYPTO_STOCKS = [
  { symbol: 'BTC-USD', name: 'Bitcoin', type: 'crypto', exchange: 'Crypto' },
  { symbol: 'ETH-USD', name: 'Ethereum', type: 'crypto', exchange: 'Crypto' },
  { symbol: 'BNB-USD', name: 'Binance Coin', type: 'crypto', exchange: 'Crypto' },
  { symbol: 'XRP-USD', name: 'Ripple', type: 'crypto', exchange: 'Crypto' },
  { symbol: 'SOL-USD', name: 'Solana', type: 'crypto', exchange: 'Crypto' },
];

const POPULAR_STOCKS = [...US_STOCKS, ...INDIAN_NSE_STOCKS, ...CRYPTO_STOCKS];

const POPULAR_MUTUAL_FUNDS = [
  { symbol: 'AXISBLUECHIP', name: 'Axis Bluechip Fund', type: 'mutual_fund', exchange: 'MF' },
  { symbol: 'ICICIPRUTOP100', name: 'ICICI Prudential Top 100 Fund', type: 'mutual_fund', exchange: 'MF' },
  { symbol: 'SBISMALLCAP', name: 'SBI Small Cap Fund', type: 'mutual_fund', exchange: 'MF' },
  { symbol: 'HDFC500', name: 'HDFC Index Fund Nifty 50', type: 'mutual_fund', exchange: 'MF' },
  { symbol: 'UTINIFTY', name: 'UTI Nifty Index Fund', type: 'mutual_fund', exchange: 'MF' },
];

/**
 * Search for stock symbols based on query
 */
export function searchSymbols(query: string): StockSuggestion[] {
  if (!query || query.length < 1) {
    return [];
  }

  const searchTerm = query.toUpperCase();
  const allSymbols = [...POPULAR_STOCKS, ...POPULAR_MUTUAL_FUNDS];

  return allSymbols
    .filter(item => 
      item.symbol.includes(searchTerm) || 
      item.name.toUpperCase().includes(searchTerm)
    )
    .slice(0, 10);
}

/**
 * Detect user location based on currency or timezone
 */
export function detectUserLocation(): 'IN' | 'US' | 'OTHER' {
  // Try to detect from timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (timezone.includes('Asia/Kolkata') || timezone.includes('Asia/Calcutta')) {
    return 'IN';
  }
  if (timezone.includes('America/')) {
    return 'US';
  }
  return 'OTHER';
}

/**
 * Get popular symbols for initial suggestions based on location
 */
export function getPopularSymbols(type?: string, currency?: string): StockSuggestion[] {
  const location = currency === 'INR' ? 'IN' : detectUserLocation();
  
  if (type === 'mutual_fund' || type === 'sip') {
    return POPULAR_MUTUAL_FUNDS.slice(0, 5);
  }
  if (type === 'crypto') {
    return CRYPTO_STOCKS;
  }
  
  // Location-based suggestions
  if (location === 'IN') {
    return [...INDIAN_NSE_STOCKS.slice(0, 10), ...US_STOCKS.slice(0, 5)];
  }
  
  return [...US_STOCKS, ...INDIAN_NSE_STOCKS.slice(0, 5)];
}

/**
 * Get stocks by exchange
 */
export function getStocksByExchange(exchange: 'NSE' | 'BSE' | 'NASDAQ'): StockSuggestion[] {
  switch (exchange) {
    case 'NSE':
      return INDIAN_NSE_STOCKS;
    case 'BSE':
      return INDIAN_BSE_STOCKS;
    case 'NASDAQ':
      return US_STOCKS;
    default:
      return [];
  }
}

/**
 * Fetch historical price for a given date
 * Note: In production, this would call a real API like Alpha Vantage, Yahoo Finance, or IEX Cloud
 */
export async function fetchHistoricalPrice(
  symbol: string, 
  date: string
): Promise<PriceData | null> {
  try {
    // For demo purposes, we'll simulate API response
    // In production, you would call: https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=YOUR_KEY
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock price based on symbol (for demo)
    const mockPrices: Record<string, number> = {
      'AAPL': 150,
      'GOOGL': 2800,
      'MSFT': 350,
      'AMZN': 3200,
      'TSLA': 800,
      'META': 350,
      'NVDA': 500,
      'NFLX': 450,
      'TCS': 3500,
      'INFY': 1500,
      'RELIANCE': 2400,
      'HDFCBANK': 1600,
      'ICICIBANK': 950,
      'WIPRO': 450,
      'SBIN': 550,
      'BTC-USD': 45000,
      'ETH-USD': 3000,
      'BNB-USD': 400,
    };

    const basePrice = mockPrices[symbol] || 100;
    
    // Add some variation based on date (older = slightly different price)
    const purchaseDate = new Date(date);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
    const priceVariation = (Math.random() - 0.5) * 0.2; // +/- 10% variation
    const historicalPrice = basePrice * (1 - (daysDiff / 365) * 0.1 + priceVariation);

    return {
      price: Math.max(1, parseFloat(historicalPrice.toFixed(2))),
      date: date
    };
  } catch (error) {
    console.error('Error fetching historical price:', error);
    return null;
  }
}

/**
 * Fetch current market price
 * Note: In production, this would call a real API
 */
export async function fetchCurrentPrice(symbol: string): Promise<number | null> {
  try {
    // For demo purposes, we'll simulate API response
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock current prices (for demo)
    const mockPrices: Record<string, number> = {
      'AAPL': 175,
      'GOOGL': 2950,
      'MSFT': 380,
      'AMZN': 3400,
      'TSLA': 850,
      'META': 380,
      'NVDA': 550,
      'NFLX': 480,
      'TCS': 3700,
      'INFY': 1600,
      'RELIANCE': 2500,
      'HDFCBANK': 1650,
      'ICICIBANK': 1000,
      'WIPRO': 470,
      'SBIN': 580,
      'BTC-USD': 52000,
      'ETH-USD': 3500,
      'BNB-USD': 450,
    };

    const price = mockPrices[symbol] || 100;
    return parseFloat(price.toFixed(2));
  } catch (error) {
    console.error('Error fetching current price:', error);
    return null;
  }
}

/**
 * Refresh multiple stock prices at once
 */
export async function refreshPrices(symbols: string[]): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};
  
  await Promise.all(
    symbols.map(async (symbol) => {
      const price = await fetchCurrentPrice(symbol);
      if (price !== null) {
        prices[symbol] = price;
      }
    })
  );

  return prices;
}
