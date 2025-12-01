import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Plus, TrendingUp, TrendingDown, DollarSign, RefreshCw, Search, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { searchSymbols, getPopularSymbols, fetchHistoricalPrice, fetchCurrentPrice, refreshPrices, detectUserLocation, getStocksByExchange } from '../utils/stockData';
import { api } from '../utils/api';

interface Investment {
  id: string;
  symbol: string;
  name: string;
  type: 'stock' | 'mutual_fund' | 'sip' | 'crypto';
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  purchaseDate: string;
  currency: string;
}

interface InvestmentsTabProps {
  currency: string;
  userId: string;
  expenses?: any[];
  incomes?: any[];
}

export function InvestmentsTab({ currency, userId, expenses = [], incomes = [] }: InvestmentsTabProps) {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [symbolSuggestions, setSymbolSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingInvestments, setIsLoadingInvestments] = useState(true);

  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    type: 'stock' as Investment['type'],
    quantity: '',
    buyPrice: '',
    currentPrice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    exchange: 'NSE' as 'NSE' | 'BSE' | 'NASDAQ',
  });

  const userLocation = detectUserLocation();
  const isIndianUser = currency === 'INR' || userLocation === 'IN';

  // Load investments on mount
  useEffect(() => {
    loadInvestments();
  }, [userId]);

  const loadInvestments = async () => {
    setIsLoadingInvestments(true);
    try {
      const response = await api.getInvestments(userId);
      if (response.success) {
        setInvestments(response.investments || []);
      }
    } catch (error) {
      console.error('Error loading investments:', error);
      toast.error('Failed to load investments');
    } finally {
      setIsLoadingInvestments(false);
    }
  };

  // Load popular symbols on mount
  useEffect(() => {
    if (isAddDialogOpen && !formData.symbol) {
      if (formData.type === 'stock' && isIndianUser) {
        setSymbolSuggestions(getStocksByExchange(formData.exchange));
      } else {
        setSymbolSuggestions(getPopularSymbols(formData.type, currency));
      }
      setShowSuggestions(true);
    }
  }, [isAddDialogOpen, formData.type, formData.symbol, formData.exchange, currency, isIndianUser]);

  // Search symbols as user types
  const handleSymbolSearch = (value: string) => {
    setFormData({ ...formData, symbol: value });
    
    if (value.length > 0) {
      const results = searchSymbols(value);
      setSymbolSuggestions(results);
      setShowSuggestions(true);
    } else {
      if (formData.type === 'stock' && isIndianUser) {
        setSymbolSuggestions(getStocksByExchange(formData.exchange));
      } else {
        setSymbolSuggestions(getPopularSymbols(formData.type, currency));
      }
      setShowSuggestions(true);
    }
  };

  // Select a symbol from suggestions
  const handleSelectSymbol = async (suggestion: any) => {
    setFormData({ 
      ...formData, 
      symbol: suggestion.symbol, 
      name: suggestion.name,
      type: suggestion.type 
    });
    setShowSuggestions(false);

    // Auto-fetch prices when symbol is selected
    await fetchPricesForSymbol(suggestion.symbol);
  };

  // Fetch historical and current prices
  const fetchPricesForSymbol = async (symbol: string) => {
    if (!symbol || !formData.purchaseDate) return;

    setIsLoadingPrice(true);
    try {
      // Fetch historical price for purchase date
      const historicalData = await fetchHistoricalPrice(symbol, formData.purchaseDate);
      if (historicalData) {
        setFormData(prev => ({ ...prev, buyPrice: historicalData.price.toString() }));
      }

      // Fetch current price
      const currentPrice = await fetchCurrentPrice(symbol);
      if (currentPrice) {
        setFormData(prev => ({ ...prev, currentPrice: currentPrice.toString() }));
      }

      toast.success('Prices fetched successfully!');
    } catch (error) {
      console.error('Error fetching prices:', error);
      toast.error('Failed to fetch prices. Please enter manually.');
    } finally {
      setIsLoadingPrice(false);
    }
  };

  // Handle purchase date change
  const handlePurchaseDateChange = async (date: string) => {
    setFormData({ ...formData, purchaseDate: date });

    // Auto-fetch buy price when date changes (if symbol is selected)
    if (formData.symbol) {
      setIsLoadingPrice(true);
      try {
        const historicalData = await fetchHistoricalPrice(formData.symbol, date);
        if (historicalData) {
          setFormData(prev => ({ ...prev, buyPrice: historicalData.price.toString() }));
          toast.success(`Buy price updated for ${date}`);
        }
      } catch (error) {
        console.error('Error fetching historical price:', error);
      } finally {
        setIsLoadingPrice(false);
      }
    }
  };

  const handleAddInvestment = async () => {
    if (!formData.symbol || !formData.name || !formData.quantity || !formData.buyPrice || !formData.currentPrice || !formData.purchaseDate) {
      toast.error('Please fill in all fields');
      return;
    }

    const investmentData = {
      symbol: formData.symbol.toUpperCase(),
      name: formData.name,
      type: formData.type,
      quantity: parseFloat(formData.quantity),
      buyPrice: parseFloat(formData.buyPrice),
      currentPrice: parseFloat(formData.currentPrice),
      purchaseDate: formData.purchaseDate,
      currency: currency
    };

    try {
      const response = await api.createInvestment(userId, investmentData);
      if (response.success) {
        setInvestments([...investments, response.investment]);
        setIsAddDialogOpen(false);
        resetForm();
        toast.success('Investment added successfully!');
      } else {
        throw new Error(response.error || 'Failed to create investment');
      }
    } catch (error) {
      console.error('Error creating investment:', error);
      toast.error('Failed to add investment');
    }
  };

  const resetForm = () => {
    setFormData({
      symbol: '',
      name: '',
      type: 'stock',
      quantity: '',
      buyPrice: '',
      currentPrice: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      exchange: 'NSE', // Reset exchange as well
    });
    setShowSuggestions(false);
  };

  const handleRefreshPrices = async () => {
    if (investments.length === 0) {
      toast.error('No investments to refresh');
      return;
    }

    setIsRefreshing(true);
    try {
      const symbols = investments.map(inv => inv.symbol);
      const newPrices = await refreshPrices(symbols);

      setInvestments(prev => 
        prev.map(inv => ({
          ...inv,
          currentPrice: newPrices[inv.symbol] || inv.currentPrice
        }))
      );

      toast.success('Prices refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing prices:', error);
      toast.error('Failed to refresh prices');
    } finally {
      setIsRefreshing(false);
    }
  };

  const calculateTotalValue = () => {
    return investments.reduce((sum, inv) => sum + (inv.currentPrice * inv.quantity), 0);
  };

  const calculateTotalCost = () => {
    return investments.reduce((sum, inv) => sum + (inv.buyPrice * inv.quantity), 0);
  };

  const calculateTotalGainLoss = () => {
    return calculateTotalValue() - calculateTotalCost();
  };

  const calculateGainLossPercentage = () => {
    const cost = calculateTotalCost();
    if (cost === 0) return 0;
    return ((calculateTotalGainLoss() / cost) * 100);
  };

  // Portfolio allocation data
  const allocationData = investments.map(inv => ({
    name: inv.symbol,
    value: inv.currentPrice * inv.quantity
  }));

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

  const totalValue = calculateTotalValue();
  const totalGainLoss = calculateTotalGainLoss();
  const gainLossPercentage = calculateGainLossPercentage();

  // Get investment-related transactions
  const investmentTransactions = [
    ...expenses.filter(e => 
      e.category === 'Investment' ||
      (e.description && (
        e.description.toLowerCase().includes('invest') ||
        e.description.toLowerCase().includes('stock') ||
        e.description.toLowerCase().includes('mutual fund') ||
        e.description.toLowerCase().includes('crypto')
      ))
    ),
    ...incomes.filter(i =>
      i.source && (
        i.source.toLowerCase().includes('dividend') ||
        i.source.toLowerCase().includes('investment') ||
        i.source.toLowerCase().includes('capital gain')
      )
    )
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const totalInvested = expenses.filter(e => 
    e.category === 'Investment' ||
    (e.description && e.description.toLowerCase().includes('invest'))
  ).reduce((sum, t) => sum + t.amount, 0);

  const totalReturns = incomes.filter(i =>
    i.source && (
      i.source.toLowerCase().includes('dividend') ||
      i.source.toLowerCase().includes('investment') ||
      i.source.toLowerCase().includes('capital gain')
    )
  ).reduce((sum, t) => sum + t.amount, 0);

  // ** FIX 1: Moved this object definition up and added the missing comma **
  const CURRENCY_SYMBOLS: any = {
    'INR': '₹', // <-- Missing comma was here
    'USD': '$',
    'EUR': '€',
    'GBP': '£'
  };

  // ** FIX 2: All JSX must be inside the return statement **
  return (
    <div className="space-y-6">
      {/* Investment Transaction Summary */}
      {investmentTransactions.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-2 border-emerald-200 dark:border-emerald-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-emerald-900 dark:text-emerald-100">Investment Activity</h3>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  Recent transactions
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Invested</p>
                <p className="text-xl text-red-600 dark:text-red-400">
                  {CURRENCY_SYMBOLS[currency]}{totalInvested.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Returns</p>
                <p className="text-xl text-green-600 dark:text-green-400">
                  +{CURRENCY_SYMBOLS[currency]}{totalReturns.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          
          {/* Recent Transactions */}
          <div className="pt-4 border-t border-emerald-200 dark:border-emerald-700">
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mb-3">Recent Transactions:</p>
            <div className="space-y-2">
              {investmentTransactions.map((transaction, idx) => {
                const isExpense = 'description' in transaction;
                return (
                  <div key={idx} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">
                        {isExpense ? transaction.description : transaction.source}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                    <p className={`text-sm whitespace-nowrap ml-3 ${isExpense ? 'text-red-600' : 'text-green-600'}`}>
                      {isExpense ? '-' : '+'}{CURRENCY_SYMBOLS[currency]}{transaction.amount.toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2>Investment Portfolio</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Track your stocks, mutual funds, and SIPs
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Investment
        </Button>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
              <h3>{CURRENCY_SYMBOLS[currency] || '$'}{totalValue.toFixed(2)}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              totalGainLoss >= 0 
                ? 'bg-green-100 dark:bg-green-900/30' 
                : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              {totalGainLoss >= 0 ? (
                <TrendingUp className="w-6 h-6 text-green-600" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Gain/Loss</p>
              <h3 className={totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                {totalGainLoss >= 0 ? '+' : ''}{CURRENCY_SYMBOLS[currency] || '$'}{totalGainLoss.toFixed(2)}
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              gainLossPercentage >= 0 
                ? 'bg-green-100 dark:bg-green-900/30' 
                : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              <TrendingUp className={`w-6 h-6 ${
                gainLossPercentage >= 0 ? 'text-green-600' : 'text-red-600'
              }`} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Return %</p>
              <h3 className={gainLossPercentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                {gainLossPercentage >= 0 ? '+' : ''}{gainLossPercentage.toFixed(2)}%
              </h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Portfolio Allocation Chart */}
      {investments.length > 0 && (
        <Card className="p-6">
          <h3 className="mb-4">Portfolio Allocation</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={allocationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {allocationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => `${CURRENCY_SYMBOLS[currency] || '$'}${value.toFixed(2)}`}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Holdings List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3>Holdings</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefreshPrices}
            disabled={isRefreshing || investments.length === 0}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Prices
          </Button>
        </div>

        {investments.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No investments yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Start tracking your investment portfolio
            </p>
            <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Investment
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {investments.map((inv) => {
              const totalCost = inv.buyPrice * inv.quantity;
              const currentValue = inv.currentPrice * inv.quantity;
              const gainLoss = currentValue - totalCost;
              const gainLossPercent = totalCost === 0 ? 0 : (gainLoss / totalCost) * 100;

              return (
                <div key={inv.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <span className="text-sm">{inv.symbol.substring(0, 2)}</span>
                      </div>
                      <div>
                        <h4>{inv.symbol}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {inv.name} • {inv.quantity} {inv.type === 'stock' ? 'shares' : 'units'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Purchased: {new Date(inv.purchaseDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Avg: {CURRENCY_SYMBOLS[currency] || '$'}{inv.buyPrice.toFixed(2)} → Current: {CURRENCY_SYMBOLS[currency] || '$'}{inv.currentPrice.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2 justify-end mt-1">
                      <p className={gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {gainLoss >= 0 ? '+' : ''}{CURRENCY_SYMBOLS[currency] || '$'}{gainLoss.toFixed(2)}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        gainLoss >= 0 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {gainLossPercent >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Market News Section */}
      <Card className="p-6">
        <h3 className="mb-4">Market Updates</h3>
        <div className="space-y-3">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm">
              📈 <strong>Smart Price Fetching:</strong> FinHub automatically suggests prices based on your purchase date and fetches current market prices for accurate portfolio tracking.
            </p>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-sm">
              💡 <strong>Pro Tip:</strong> Use the "Refresh Prices" button to update all your holdings with the latest market prices.
            </p>
          </div>
        </div>
      </Card>

      {/* Add Investment Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Investment</DialogTitle>
            <DialogDescription>
              Add a new stock, mutual fund, or SIP to your portfolio
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={(value: any) => {
                  setFormData({ ...formData, type: value });
                  if (value === 'stock' && isIndianUser) {
                    setSymbolSuggestions(getStocksByExchange(formData.exchange));
                  } else {
                    setSymbolSuggestions(getPopularSymbols(value, currency));
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock">Stock</SelectItem>
                    <SelectItem value="mutual_fund">Mutual Fund</SelectItem>
                    <SelectItem value="sip">SIP</SelectItem>
                    <SelectItem value="crypto">Cryptocurrency</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isIndianUser && formData.type === 'stock' && (
                <div>
                  <Label>Exchange</Label>
                  <Select value={formData.exchange} onValueChange={(value: any) => {
                    setFormData({ ...formData, exchange: value });
                    setSymbolSuggestions(getStocksByExchange(value));
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NSE">NSE (National Stock Exchange)</SelectItem>
                      <SelectItem value="BSE">BSE (Bombay Stock Exchange)</SelectItem>
                      <SelectItem value="NASDAQ">NASDAQ (US)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="relative">
              <Label>Symbol/Code</Label>
              <div className="relative">
                <Input
                  value={formData.symbol}
                  onChange={(e) => handleSymbolSearch(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  placeholder="Search for symbol..."
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              
              {showSuggestions && symbolSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {symbolSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectSymbol(suggestion);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{suggestion.symbol}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{suggestion.name}</p>
                        </div>
                        <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                          {suggestion.exchange}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Apple Inc."
              />
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Purchase Date
              </Label>
              <Input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => handlePurchaseDateChange(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Buy price will be fetched based on this date
              </p>
            </div>

            <div>
              <Label>Quantity/Units</Label>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="Number of shares/units"
                step="0.01"
              />
            </div>

            <div>
              <Label className="flex items-center justify-between">
                <span>Buy Price (Avg)</span>
                {isLoadingPrice && (
                  <span className="text-xs text-blue-600 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Fetching...
                  </span>
                )}
              </Label>
              <Input
                type="number"
                value={formData.buyPrice}
                onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
                placeholder="Auto-filled based on purchase date"
                step="0.01"
                disabled={isLoadingPrice}
              />
            </div>

            <div>
              <Label className="flex items-center justify-between">
                <span>Current Price</span>
                {isLoadingPrice && (
                  <span className="text-xs text-blue-600 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Fetching...
                  </span>
                )}
              </Label>
              <Input
                type="number"
                value={formData.currentPrice}
                onChange={(e) => setFormData({ ...formData, currentPrice: e.target.value })}
                placeholder="Auto-filled from market"
                step="0.01"
                disabled={isLoadingPrice}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleAddInvestment} className="flex-1" disabled={isLoadingPrice}>
                Add Investment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}