import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { NumberInput } from './ui/number-input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { TrendingUp, Plus, RefreshCw, Search, Calendar, Loader2, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import { searchSymbols, getPopularSymbols, fetchHistoricalPrice, fetchCurrentPrice, refreshPrices, detectUserLocation, getStocksByExchange } from '../utils/stockData';
import { Investment } from '../types';
import { formatCurrency } from '../utils/numberFormat';
import { InteractiveFinancialValue } from './ui/InteractiveFinancialValue';
import { useFinance } from '../context/FinanceContext';
import { CyberButton } from './ui/CyberButton';
import { WealthBuilderSimulator } from './WealthBuilderSimulator';
import { MeshBackground } from './ui/MeshBackground';
import { PortfolioAllocationChart } from './investments/PortfolioAllocationChart';
import { InvestmentList } from './investments/InvestmentList';
import { EmptyState } from './EmptyState';

export function InvestmentsTab() {
  const {
    settings: { currency }, accounts, expenses, incomes,
    investments, createInvestment, updateInvestment, deleteInvestment,
    createIncome
  } = useFinance();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [symbolSuggestions, setSymbolSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [timeRange, setTimeRange] = useState<'1M' | '3M' | 'All'>('All');
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    type: 'stock' as Investment['type'],
    quantity: '',
    buyPrice: '',
    currentPrice: '',
    totalYield: '0',
    purchaseDate: new Date().toISOString().split('T')[0],
    exchange: 'NSE' as 'NSE' | 'BSE' | 'NASDAQ',
    isPhysicalAsset: false,
    sourceAccountId: '',
  });

  const userLocation = detectUserLocation();
  const isIndianUser = currency === 'INR' || userLocation === 'IN';

  // Load popular symbols on mount/dialog open
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
      quantity: parseFloat(formData.quantity.toString()),
      buyPrice: parseFloat(formData.buyPrice.toString()),
      currentPrice: parseFloat(formData.currentPrice.toString()),
      totalYield: parseFloat(formData.totalYield.toString()) || 0,
      isPhysicalAsset: formData.type === 'physical_asset',
      accountId: formData.sourceAccountId,
      purchaseDate: formData.purchaseDate,
      currency: currency
    };

    try {
      await createInvestment(investmentData, formData.sourceAccountId);
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating investment:', error);
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
      totalYield: '0',
      purchaseDate: new Date().toISOString().split('T')[0],
      exchange: 'NSE', // Reset exchange as well
      isPhysicalAsset: false,
      sourceAccountId: '',
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

      // Update investments with new prices using context
      await Promise.all(investments.map(inv => {
        const newPrice = newPrices[inv.symbol];
        if (newPrice && newPrice !== inv.currentPrice) {
          return updateInvestment(inv.id, { currentPrice: newPrice });
        }
        return Promise.resolve();
      }));

      toast.success('Prices refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing prices:', error);
      toast.error('Failed to refresh prices');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Edit investment
  const handleEditInvestment = (investment: Investment) => {
    setSelectedInvestment(investment);
    setFormData({
      symbol: investment.symbol,
      name: investment.name,
      type: investment.type,
      quantity: investment.quantity.toString(),
      buyPrice: investment.buyPrice.toString(),
      currentPrice: (investment.currentPrice || 0).toString(),
      totalYield: (investment.totalYield || 0).toString(),
      purchaseDate: investment.purchaseDate,
      exchange: 'NSE',
      isPhysicalAsset: investment.type === 'physical_asset',
      sourceAccountId: investment.accountId || '',
    });
    setIsEditDialogOpen(true);
  };

  // Update investment
  const handleUpdateInvestment = async () => {
    if (!selectedInvestment || !formData.symbol || !formData.name || !formData.quantity || !formData.buyPrice || !formData.currentPrice || !formData.purchaseDate) {
      toast.error('Please fill in all fields');
      return;
    }

    const investmentData = {
      symbol: formData.symbol.toUpperCase(),
      name: formData.name,
      type: formData.type,
      quantity: parseFloat(formData.quantity.toString()),
      buyPrice: parseFloat(formData.buyPrice.toString()),
      currentPrice: parseFloat(formData.currentPrice.toString()),
      totalYield: parseFloat(formData.totalYield.toString()) || 0,
      isPhysicalAsset: formData.type === 'physical_asset',
      purchaseDate: formData.purchaseDate,
      currency: currency
    };

    try {
      await updateInvestment(selectedInvestment.id, investmentData);
      setIsEditDialogOpen(false);
      setSelectedInvestment(null);
      resetForm();
    } catch (error) {
      console.error('Error updating investment:', error);
    }
  };

  // Open close dialog
  const handleOpenCloseDialog = (investment: Investment) => {
    setSelectedInvestment(investment);
    setSelectedAccount(accounts.length > 0 ? accounts[0].id : '');
    setIsCloseDialogOpen(true);
  };

  // Close/Exit investment
  const handleCloseInvestment = async () => {
    if (!selectedInvestment || !selectedAccount) {
      toast.error('Please select an account');
      return;
    }

    const currentValue = (selectedInvestment.currentPrice || 0) * selectedInvestment.quantity;
    const gainLoss = currentValue - (selectedInvestment.buyPrice * selectedInvestment.quantity);

    try {
      // Create income transaction for the proceeds
      await createIncome({
        source: `Sold ${selectedInvestment.symbol} (${selectedInvestment.quantity} ${selectedInvestment.type === 'stock' ? 'shares' : 'units'})`,
        amount: currentValue,
        date: new Date().toISOString().split('T')[0],
        category: gainLoss >= 0 ? 'Capital Gain' : 'Capital Loss',
        accountId: selectedAccount,
        // tags: ['Investment', selectedInvestment.symbol],
      });

      // Delete investment
      await deleteInvestment(selectedInvestment.id);

      setIsCloseDialogOpen(false);
      setSelectedInvestment(null);
      setSelectedAccount('');

      toast.success(
        gainLoss >= 0
          ? `Investment closed! Profit: ${formatCurrency(gainLoss, currency)}`
          : `Investment closed. Loss: ${formatCurrency(Math.abs(gainLoss), currency)}`
      );

    } catch (error) {
      console.error('Error closing investment:', error);
    }
  };

  const calculateTotalValue = () => {
    // Aggregation Rule: Source Independence & Ghost Node Protection
    return investments
      .filter(inv => {
        // Exclude if linked to an existing account that is NOT 'investment'
        if (inv.accountId && inv.accountId !== 'none') {
          const acc = accounts.find(a => a.id === inv.accountId);
          if (acc && acc.type !== 'investment') return false;
        }

        // Time-Weighting: Optional filtering by purchase date
        if (timeRange !== 'All') {
          const purchaseDate = new Date(inv.purchaseDate);
          const now = new Date();
          const monthsDiff = (now.getFullYear() - purchaseDate.getFullYear()) * 12 + (now.getMonth() - purchaseDate.getMonth());
          if (timeRange === '1M' && monthsDiff > 0) return false;
          if (timeRange === '3M' && monthsDiff > 2) return false;
        }
        return true;
      })
      .reduce((sum, inv) => sum + ((inv.currentPrice || 0) * inv.quantity), 0);
  };

  const calculateTotalCost = () => {
    return investments
      .filter(inv => {
        if (inv.accountId && inv.accountId !== 'none') {
          const acc = accounts.find(a => a.id === inv.accountId);
          if (acc && acc.type !== 'investment') return false;
        }
        if (timeRange !== 'All') {
          const purchaseDate = new Date(inv.purchaseDate);
          const now = new Date();
          const monthsDiff = (now.getFullYear() - purchaseDate.getFullYear()) * 12 + (now.getMonth() - purchaseDate.getMonth());
          if (timeRange === '1M' && monthsDiff > 0) return false;
          if (timeRange === '3M' && monthsDiff > 2) return false;
        }
        return true;
      })
      .reduce((sum, inv) => sum + (inv.buyPrice * inv.quantity), 0);
  };

  const calculateTotalYield = () => {
    return investments
      .filter(inv => {
        if (inv.accountId && inv.accountId !== 'none') {
          const acc = accounts.find(a => a.id === inv.accountId);
          if (acc && acc.type !== 'investment') return false;
        }
        if (timeRange !== 'All') {
          const purchaseDate = new Date(inv.purchaseDate);
          const now = new Date();
          const monthsDiff = (now.getFullYear() - purchaseDate.getFullYear()) * 12 + (now.getMonth() - purchaseDate.getMonth());
          if (timeRange === '1M' && monthsDiff > 0) return false;
          if (timeRange === '3M' && monthsDiff > 2) return false;
        }
        return true;
      })
      .reduce((sum, inv) => sum + (inv.totalYield || 0), 0);
  };

  const calculateTotalGainLoss = () => {
    return calculateTotalValue() + calculateTotalYield() - calculateTotalCost();
  };

  const calculateGainLossPercentage = () => {
    const cost = calculateTotalCost();
    if (cost === 0) return 0;
    // Growth Calculation: ((Sum Market Value / Sum Principals) - 1) * 100
    // Note: We include Yield in the 'Market Value' side for true ROI, or exclude for pure capital growth.
    // User request: ((Sum Current Values / Sum Principals) - 1) * 100
    return ((calculateTotalValue() / cost) - 1) * 100;
  };

  const totalValue = calculateTotalValue();
  const totalGainLoss = calculateTotalGainLoss();
  const gainLossPercentage = calculateGainLossPercentage();

  // Get investment-related transactions
  // Note: Cast to any[] then filter due to potential type mismatches between expenses/incomes
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



  return (
    <div className="space-y-6 pb-24">
      {/* Portfolio Summary Card (Inspired by Bills Tab) */}
      {/* Investment Growth Summary Card (Segmented Stack Pattern) */}
      <div className="mesh-gradient-card sq-2xl overflow-hidden group relative">
        <MeshBackground variant="invest" />
        <div className="bg-transparent p-0 relative z-10">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy-dark.png')] opacity-[0.03] pointer-events-none z-0" />

          {/* stack-cap */}
          <div className="p-6 flex items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 bg-blue-500/10 sq-md flex items-center justify-center border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-white font-black text-xs uppercase tracking-[0.3em]">Growth Node</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                  Active Capital Projection
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-slate-500 uppercase font-black tracking-[0.2em] mb-1">Portfolio Valuation</p>
              <div className="relative">
                <div className="text-xl font-black text-white tabular-nums font-mono">
                  <InteractiveFinancialValue value={totalValue} currency={currency} />
                </div>
                <div className="absolute inset-0 bg-blue-500/20 blur-xl -z-10 animate-pulse" />
              </div>
            </div>
          </div>

          {/* stack-body */}
          <div className="py-4 px-6 relative z-10 border-t border-white/5">
            <div className="flex justify-between items-center mb-6">
              <div className="space-y-1">
                <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Aggregate P&L</p>
                <div className={`text-xl font-black font-mono tabular-nums ${totalGainLoss >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                  {totalGainLoss >= 0 ? '+' : ''}
                  <InteractiveFinancialValue value={totalGainLoss} currency={currency} />
                </div>
              </div>
              <div className={`px-4 py-2 sq-md text-[10px] font-black tracking-widest border transition-all ${totalGainLoss >= 0
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.1)]'
                }`}>
                {totalGainLoss >= 0 ? '▲' : '▼'} {gainLossPercentage.toFixed(2)}% ROI
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5 mb-6">
              <div className="bg-white/5 p-3 sq-md border border-white/5">
                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1.5 opacity-60">Locked Capital</p>
                <div className="text-sm font-black text-slate-200 font-mono tabular-nums">
                  <InteractiveFinancialValue value={calculateTotalCost()} currency={currency} />
                </div>
              </div>
              <div className="bg-white/5 p-3 sq-md border border-white/5">
                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1.5 opacity-60">Yield Injection</p>
                <div className="text-sm font-black text-blue-400 font-mono tabular-nums">
                  <InteractiveFinancialValue value={calculateTotalYield()} currency={currency} />
                </div>
              </div>
            </div>

            {/* Recent Investment Transactions */}
            {investmentTransactions.length > 0 && (
              <div className="space-y-2">
                <p className="text-label text-[8px] opacity-50 uppercase font-black tracking-widest mb-3">Audit Trail</p>
                {investmentTransactions.map((transaction: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors px-2 -mx-2 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate">{transaction.description || transaction.source}</p>
                      <p className="text-label text-[8px] mt-0.5 opacity-50">
                        {transaction.category} • {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`text-balance text-xs font-bold shrink-0 ${transaction.source ? 'text-[#30D158]' : 'text-zinc-400'}`}>
                      {transaction.source ? '+' : '-'}
                      <InteractiveFinancialValue value={transaction.amount} currency={currency} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* stack-footer */}
          <div className="stack-footer">
            <div className="flex items-center justify-between w-full">
              <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
                <SelectTrigger className="h-9 w-32 bg-black/20 border-white/5 text-label text-[10px] sq-md">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/10 text-white">
                  <SelectItem value="1M">30 Days</SelectItem>
                  <SelectItem value="3M">90 Days</SelectItem>
                  <SelectItem value="All">All Time</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshPrices}
                disabled={isRefreshing || investments.length === 0}
                className="h-9 px-4 text-label text-[10px] text-[#0A84FF] hover:text-[#007AFF] hover:bg-[#0A84FF]/10 sq-md"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Sync Market
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Header & Actions - Standardized Layout */}
      <div className="flex items-center justify-between px-2">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-slate-100 tracking-tight truncate">Active Portfolio</h2>
          <p className="text-xs text-slate-500 mt-1 truncate">Manage stocks, mutual funds and assets</p>
        </div>
        <CyberButton
          onClick={() => setIsAddDialogOpen(true)}
          icon={Plus}
          className="h-12"
        >
          Add Asset
        </CyberButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {investments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-20 bg-black sq-2xl border border-dashed border-white/10">
            <EmptyState
              icon={TrendingUp}
              title="No assets tracked yet"
              description="Start building your portfolio by adding your first investment."
              illustration="🌿"
              actionLabel="Add Investment"
              onAction={() => setIsAddDialogOpen(true)}
            />
          </div>
        ) : (
          <div className="space-y-6">
            <InvestmentList
              investments={investments}
              onAdd={() => setIsAddDialogOpen(true)}
              onEdit={handleEditInvestment}
              onClose={handleOpenCloseDialog}
              currency={currency}
            />

            <PortfolioAllocationChart
              investments={investments}
              currency={currency}
            />

            {/* Knowledge Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-6 bg-black border border-white/5 sq-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#30D158]/10 flex items-center justify-center">
                    <ArrowUpRight className="w-4 h-4 text-[#30D158]" />
                  </div>
                  <h4 className="text-label text-[8px] opacity-60">Market Insight</h4>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                  FinHub automatically suggests prices based on your purchase date and fetches real-time quotes for accurate tracking.
                </p>
              </Card>
              <Card className="p-6 bg-black border border-white/5 sq-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                  </div>
                  <h4 className="text-label text-[8px] opacity-60">Portfolio Health</h4>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                  Keep your data fresh using the <span className="text-[#0A84FF] font-black">Sync</span> button to update all holdings with the latest market activity.
                </p>
              </Card>
            </div>

          </div>
        )}
      </div>

      {/* Add Investment Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open: boolean) => {
        setIsAddDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-black border-white/10 text-white p-0 sq-2xl">
          <div className="p-8 border-b border-white/5">
            <DialogHeader className="p-0">
              <DialogTitle className="text-xl font-bold tracking-tight text-white">Add Investment</DialogTitle>
              <DialogDescription className="text-slate-500 text-xs mt-1">
                Add a new stock, mutual fund, or SIP to your portfolio
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="add-investment-type" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Type</Label>
                <Select value={formData.type} onValueChange={(value: any) => {
                  setFormData({ ...formData, type: value });
                  if (value === 'stock' && isIndianUser) {
                    setSymbolSuggestions(getStocksByExchange(formData.exchange));
                  } else {
                    setSymbolSuggestions(getPopularSymbols(value, currency));
                  }
                }}>
                  <SelectTrigger id="add-investment-type" name="type" className="bg-white/5 border-white/5 sq-md h-14 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/10 text-white">
                    <SelectItem value="stock">Stock</SelectItem>
                    <SelectItem value="mutual_fund">Mutual Fund</SelectItem>
                    <SelectItem value="sip">SIP</SelectItem>
                    <SelectItem value="crypto">Cryptocurrency</SelectItem>
                    <SelectItem value="physical_asset">Physical Asset (Gold, Real Estate, etc.)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isIndianUser && formData.type === 'stock' && (
                <div>
                  <Label htmlFor="add-investment-exchange" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Exchange</Label>
                  <Select value={formData.exchange} onValueChange={(value: any) => {
                    setFormData({ ...formData, exchange: value });
                    setSymbolSuggestions(getStocksByExchange(value));
                  }}>
                    <SelectTrigger id="add-investment-exchange" name="exchange" className="bg-white/5 border-white/5 sq-md h-14 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10 text-white">
                      <SelectItem value="NSE">NSE (National Stock Exchange)</SelectItem>
                      <SelectItem value="BSE">BSE (Bombay Stock Exchange)</SelectItem>
                      <SelectItem value="NASDAQ">NASDAQ (US)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="relative">
              <Label htmlFor="add-investment-symbol" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Symbol/Code</Label>
              <div className="relative">
                <Input
                  id="add-investment-symbol"
                  name="symbol"
                  value={formData.symbol}
                  onChange={(e) => handleSymbolSearch(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  className="bg-white/5 border-white/5 sq-md h-14 text-white pr-10"
                  placeholder="Search for symbol..."
                  autoComplete="off"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              </div>

              {showSuggestions && symbolSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-black border border-white/10 sq-md shadow-2xl max-h-60 overflow-y-auto overflow-x-hidden">
                  {symbolSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectSymbol(suggestion);
                      }}
                      className="w-full text-left px-5 py-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white group-hover:text-blue-400 transition-colors">{suggestion.symbol}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{suggestion.name}</p>
                        </div>
                        <span className="text-[9px] font-black px-2 py-1 bg-blue-500/10 text-blue-400 rounded-lg uppercase tracking-widest border border-blue-500/10">
                          {suggestion.exchange}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="add-investment-account" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Source/Holding Account</Label>
              <Select value={formData.sourceAccountId} onValueChange={(value) => setFormData({ ...formData, sourceAccountId: value })}>
                <SelectTrigger id="add-investment-account" className="bg-white/5 border-white/5 sq-md h-14 text-white">
                  <SelectValue placeholder="Select account..." />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/10 text-white">
                  <SelectItem value="none">No Linking (Physical Only)</SelectItem>
                  {accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name} ({acc.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-slate-500 mt-2 italic px-1">Linking an account enables Principal tracking via Transfers.</p>
            </div>

            <div>
              <Label htmlFor="add-investment-name" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Name</Label>
              <Input
                id="add-investment-name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white/5 border-white/5 sq-md h-14 text-white"
                placeholder="e.g., Apple Inc."
                autoComplete="off"
              />
            </div>

            <div>
              <Label htmlFor="add-investment-date" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                <Calendar className="w-3 h-3 text-blue-400" />
                Purchase Date
              </Label>
              <Input
                id="add-investment-date"
                name="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => handlePurchaseDateChange(e.target.value)}
                className="bg-white/5 border-white/5 sq-md h-14 text-white"
                max={new Date().toISOString().split('T')[0]}
                autoComplete="off"
              />
              <p className="text-[10px] text-slate-500 mt-2 italic px-1">
                Buy price will be fetched based on this date
              </p>
            </div>

            <div>
              <Label htmlFor="add-investment-quantity" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Quantity/Units</Label>
              <NumberInput
                id="add-investment-quantity"
                name="quantity"
                value={formData.quantity}
                onChange={(value) => setFormData({ ...formData, quantity: value })}
                className="bg-white/5 border-white/5 sq-md h-14 text-white"
                placeholder="Number of shares/units"
                autoComplete="off"
              />
            </div>

            <div>
              <Label htmlFor="add-investment-buy-price" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center justify-between">
                <span>Buy Price (Avg)</span>
                {isLoadingPrice && (
                  <span className="text-[9px] text-blue-400 flex items-center gap-1 font-black uppercase tracking-widest">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Fetching...
                  </span>
                )}
              </Label>
              <NumberInput
                id="add-investment-buy-price"
                name="buyPrice"
                value={formData.buyPrice}
                onChange={(value) => setFormData({ ...formData, buyPrice: value })}
                className="bg-white/5 border-white/5 sq-md h-14 text-white"
                placeholder="Auto-filled based on purchase date"
                disabled={isLoadingPrice}
                autoComplete="off"
              />
            </div>

            <div>
              <Label htmlFor="add-investment-current-price" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center justify-between">
                <span>Current Market Value (Per Unit)</span>
                {isLoadingPrice && (
                  <span className="text-[9px] text-blue-400 flex items-center gap-1 font-black uppercase tracking-widest">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Fetching...
                  </span>
                )}
              </Label>
              <NumberInput
                id="add-investment-current-price"
                name="currentPrice"
                value={formData.currentPrice}
                onChange={(value) => setFormData({ ...formData, currentPrice: value })}
                className="bg-white/5 border-white/5 rounded-2xl h-14 text-white"
                placeholder="Auto-filled from market"
                disabled={isLoadingPrice}
                autoComplete="off"
              />
            </div>

            <div>
              <Label htmlFor="add-investment-total-yield" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Total Yield (Dividends/Interest)</Label>
              <NumberInput
                id="add-investment-total-yield"
                name="totalYield"
                value={formData.totalYield}
                onChange={(value) => setFormData({ ...formData, totalYield: value })}
                className="bg-white/5 border-white/5 rounded-2xl h-14 text-white"
                placeholder="Total extra cash generated"
                autoComplete="off"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1 rounded-2xl h-12 border-white/10 hover:bg-white/5 text-slate-400">
                Cancel
              </Button>
              <Button onClick={handleAddInvestment} className="flex-1 rounded-2xl h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold" disabled={isLoadingPrice}>
                Add Investment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Investment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open: boolean) => {
        setIsEditDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-black border-white/10 text-white p-0 sq-2xl">
          <div className="p-8 border-b border-white/5">
            <DialogHeader className="p-0">
              <DialogTitle className="text-xl font-bold tracking-tight text-white">Edit Asset</DialogTitle>
              <DialogDescription className="text-slate-500 text-xs mt-1">
                Update details of your existing investment node
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-investment-type" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Type</Label>
                <Select value={formData.type} onValueChange={(value: any) => {
                  setFormData({ ...formData, type: value });
                  if (value === 'stock' && isIndianUser) {
                    setSymbolSuggestions(getStocksByExchange(formData.exchange));
                  } else {
                    setSymbolSuggestions(getPopularSymbols(value, currency));
                  }
                }}>
                  <SelectTrigger id="edit-investment-type" name="type" className="bg-white/5 border-white/5 rounded-2xl h-14 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white">
                    <SelectItem value="stock">Stock</SelectItem>
                    <SelectItem value="mutual_fund">Mutual Fund</SelectItem>
                    <SelectItem value="sip">SIP</SelectItem>
                    <SelectItem value="crypto">Cryptocurrency</SelectItem>
                    <SelectItem value="physical_asset">Physical Asset (Gold, Real Estate, etc.)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isIndianUser && formData.type === 'stock' && (
                <div>
                  <Label htmlFor="edit-investment-exchange" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Exchange</Label>
                  <Select value={formData.exchange} onValueChange={(value: any) => {
                    setFormData({ ...formData, exchange: value });
                    setSymbolSuggestions(getStocksByExchange(value));
                  }}>
                    <SelectTrigger id="edit-investment-exchange" name="exchange" className="bg-white/5 border-white/5 rounded-2xl h-14 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      <SelectItem value="NSE">NSE (National Stock Exchange)</SelectItem>
                      <SelectItem value="BSE">BSE (Bombay Stock Exchange)</SelectItem>
                      <SelectItem value="NASDAQ">NASDAQ (US)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="relative">
              <Label htmlFor="edit-investment-symbol" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Symbol/Code</Label>
              <div className="relative">
                <Input
                  id="edit-investment-symbol"
                  name="symbol"
                  value={formData.symbol}
                  onChange={(e) => handleSymbolSearch(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  className="bg-white/5 border-white/5 sq-md h-14 text-white pr-10"
                  placeholder="Search for symbol..."
                  autoComplete="off"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              </div>

              {showSuggestions && symbolSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-black border border-white/10 sq-md shadow-2xl max-h-60 overflow-y-auto overflow-x-hidden">
                  {symbolSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectSymbol(suggestion);
                      }}
                      className="w-full text-left px-5 py-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white group-hover:text-blue-400 transition-colors">{suggestion.symbol}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{suggestion.name}</p>
                        </div>
                        <span className="text-[9px] font-black px-2 py-1 bg-blue-500/10 text-blue-400 rounded-lg uppercase tracking-widest border border-blue-500/10">
                          {suggestion.exchange}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="edit-investment-account" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Source/Holding Account</Label>
              <Select value={formData.sourceAccountId} onValueChange={(value) => setFormData({ ...formData, sourceAccountId: value })}>
                <SelectTrigger id="edit-investment-account" className="bg-white/5 border-white/5 rounded-2xl h-14 text-white">
                  <SelectValue placeholder="Select account..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  <SelectItem value="none">No Linking (Physical Only)</SelectItem>
                  {accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name} ({acc.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-investment-name" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Name</Label>
              <Input
                id="edit-investment-name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white/5 border-white/5 sq-md h-14 text-white"
                placeholder="e.g., Apple Inc."
                autoComplete="off"
              />
            </div>

            <div>
              <Label htmlFor="edit-investment-date" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                <Calendar className="w-3 h-3 text-blue-400" />
                Purchase Date
              </Label>
              <Input
                id="edit-investment-date"
                name="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => handlePurchaseDateChange(e.target.value)}
                className="bg-white/5 border-white/5 sq-md h-14 text-white"
                max={new Date().toISOString().split('T')[0]}
                autoComplete="off"
              />
              <p className="text-[10px] text-slate-500 mt-2 italic px-1">
                Buy price will be fetched based on this date
              </p>
            </div>
            <div>
              <Label htmlFor="edit-investment-quantity" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Quantity/Units</Label>
              <NumberInput
                id="edit-investment-quantity"
                name="quantity"
                value={formData.quantity}
                onChange={(value) => setFormData({ ...formData, quantity: value })}
                className="bg-white/5 border-white/5 sq-md h-14 text-white"
                placeholder="Number of shares/units"
                autoComplete="off"
              />
            </div>

            <div>
              <Label htmlFor="edit-investment-buy-price" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center justify-between">
                <span>Buy Price (Avg)</span>
                {isLoadingPrice && (
                  <span className="text-[9px] text-blue-400 flex items-center gap-1 font-black uppercase tracking-widest">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Fetching...
                  </span>
                )}
              </Label>
              <NumberInput
                id="edit-investment-buy-price"
                name="buyPrice"
                value={formData.buyPrice}
                onChange={(value) => setFormData({ ...formData, buyPrice: value })}
                className="bg-white/5 border-white/5 sq-md h-14 text-white"
                placeholder="Auto-filled based on purchase date"
                disabled={isLoadingPrice}
                autoComplete="off"
              />
            </div>

            <div>
              <Label htmlFor="edit-investment-current-price" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center justify-between">
                <span>Current Market Value (Per Unit)</span>
                {isLoadingPrice && (
                  <span className="text-[9px] text-blue-400 flex items-center gap-1 font-black uppercase tracking-widest">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Fetching...
                  </span>
                )}
              </Label>
              <NumberInput
                id="edit-investment-current-price"
                name="currentPrice"
                value={formData.currentPrice}
                onChange={(value) => setFormData({ ...formData, currentPrice: value })}
                className="bg-white/5 border-white/5 rounded-2xl h-14 text-white"
                placeholder="Auto-filled from market"
                disabled={isLoadingPrice}
                autoComplete="off"
              />
            </div>

            <div>
              <Label htmlFor="edit-investment-total-yield" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Total Yield (Dividends/Interest)</Label>
              <NumberInput
                id="edit-investment-total-yield"
                name="totalYield"
                value={formData.totalYield}
                onChange={(value) => setFormData({ ...formData, totalYield: value })}
                className="bg-white/5 border-white/5 rounded-2xl h-14 text-white"
                placeholder="Total extra cash generated"
                autoComplete="off"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1 rounded-2xl h-12 border-white/10 hover:bg-white/5 text-slate-400">
                Cancel
              </Button>
              <Button onClick={handleUpdateInvestment} className="flex-1 rounded-2xl h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold" disabled={isLoadingPrice}>
                Update Asset
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Close Investment Dialog */}
      <Dialog open={isCloseDialogOpen} onOpenChange={(open: boolean) => {
        setIsCloseDialogOpen(open);
        if (!open) {
          setSelectedInvestment(null);
          setSelectedAccount('');
        }
      }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-black border-white/10 text-white p-0 sq-2xl">
          <div className="p-8 border-b border-white/5">
            <DialogHeader className="p-0">
              <DialogTitle className="text-xl font-bold tracking-tight text-white">Full Exit Protocol</DialogTitle>
              <DialogDescription className="text-slate-500 text-xs mt-1">
                Liquidate your position and distribute proceeds
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6">
            {selectedInvestment && (
              <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center border border-white/5">
                      <span className="text-xs font-black text-blue-400">{selectedInvestment.symbol.substring(0, 2)}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-white tracking-tight">{selectedInvestment.symbol}</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        {selectedInvestment.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest border ${totalGainLoss >= 0
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/10'
                      }`}>
                      {totalGainLoss >= 0 ? '+' : ''}{totalGainLoss.toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Position Size</p>
                    <p className="text-sm font-bold text-white">{selectedInvestment.quantity} {selectedInvestment.type === 'stock' ? 'shares' : 'units'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Exit Est.</p>
                    <p className="text-sm font-bold text-blue-400">{formatCurrency((selectedInvestment.currentPrice || 0) * selectedInvestment.quantity, currency)}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="close-account" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Destination Account</Label>
              <Select value={selectedAccount} onValueChange={(value: string) => {
                setSelectedAccount(value);
              }}>
                <SelectTrigger id="close-account" name="accountId" className="bg-white/5 border-white/5 rounded-2xl h-14 text-white">
                  <SelectValue placeholder="Select destination account..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4 pt-4">
              <Button variant="outline" onClick={() => setIsCloseDialogOpen(false)} className="flex-1 rounded-2xl h-12 border-white/10 hover:bg-white/5 text-slate-400">
                Abort
              </Button>
              <Button onClick={handleCloseInvestment} className="flex-1 rounded-2xl h-12 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-widest shadow-lg shadow-rose-900/20">
                Confirm Exit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Wealth Builder Simulator */}
      <div className="mt-8">
        <WealthBuilderSimulator />
      </div>
    </div>
  );
}
