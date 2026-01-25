import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { ArrowLeftRight, RefreshCw, TrendingUp } from 'lucide-react';
import { api } from '../utils/api';
import { toast } from 'sonner';

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦' },
];

export function CurrencyConverter() {
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('INR');
  const [amount, setAmount] = useState('1');
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch exchange rates when base currency changes
  useEffect(() => {
    fetchExchangeRates(fromCurrency);
  }, [fromCurrency]);

  // Convert when amount or currencies change
  useEffect(() => {
    if (exchangeRates[toCurrency] && amount) {
      const converted = parseFloat(amount) * exchangeRates[toCurrency];
      setConvertedAmount(converted);
    }
  }, [amount, toCurrency, exchangeRates]);

  const fetchExchangeRates = async (baseCurrency: string) => {
    setIsLoading(true);
    try {
      const response = await api.getExchangeRates(baseCurrency);
      if (response.success) {
        setExchangeRates(response.rates);
        setLastUpdated(new Date());
      } else {
        toast.error('Failed to fetch exchange rates');
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      toast.error('Failed to fetch exchange rates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  const handleRefresh = () => {
    fetchExchangeRates(fromCurrency);
    toast.success('Exchange rates updated!');
  };

  const getSymbol = (code: string) => {
    return CURRENCIES.find(c => c.code === code)?.symbol || code;
  };


  const exchangeRate = exchangeRates[toCurrency] || 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5" />
            Currency Converter
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Real-time exchange rates
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 gap-2 font-black uppercase text-[10px]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Sync
        </Button>
      </div>

      <div className="space-y-6">
        {/* From Currency */}
        <div className="space-y-2">
          <Label htmlFor="converter-from-currency">From</Label>
          <div className="flex gap-3">
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger id="converter-from-currency" name="fromCurrency" className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <div className="flex items-center gap-2">
                      <span>{currency.flag}</span>
                      <span>{currency.code}</span>
                      <span className="text-xs text-gray-500">({currency.symbol})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              id="converter-amount"
              name="amount"
              type="number"
              value={amount}
              onChange={(e) => {
                const val = e.target.value;
                if (parseFloat(val) < 0) return;
                setAmount(val);
              }}
              placeholder="Enter amount"
              className="flex-1"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSwapCurrencies}
            className="rounded-full"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </Button>
        </div>

        {/* To Currency */}
        <div className="space-y-2">
          <Label htmlFor="converter-to-currency">To</Label>
          <div className="flex gap-3">
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger id="converter-to-currency" name="toCurrency" className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <div className="flex items-center gap-2">
                      <span>{currency.flag}</span>
                      <span>{currency.code}</span>
                      <span className="text-xs text-gray-500">({currency.symbol})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div id="converter-result" className="flex-1 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
                </div>
              ) : convertedAmount !== null ? (
                <div>
                  <div className="text-blue-900 dark:text-blue-100">
                    {getSymbol(toCurrency)} {convertedAmount.toFixed(2)}
                  </div>
                </div>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </div>
          </div>
        </div>

        {/* Exchange Rate Info */}
        {exchangeRate > 0 && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm">
                  <strong>1 {fromCurrency}</strong> = <strong>{exchangeRate.toFixed(4)} {toCurrency}</strong>
                </p>
                {lastUpdated && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Popular Conversions */}
        <div>
          <h4 className="mb-3">Quick Conversions</h4>
          <div className="grid grid-cols-2 gap-2">
            {[1, 10, 100, 1000].map((val) => {
              const converted = val * exchangeRate;
              return (
                <button
                  key={val}
                  onClick={() => setAmount(val.toString())}
                  className="p-3 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {getSymbol(fromCurrency)} {val}
                  </div>
                  <div className="text-sm mt-1">
                    {getSymbol(toCurrency)} {converted.toFixed(2)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
