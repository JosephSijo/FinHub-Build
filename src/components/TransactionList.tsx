import React, { useState } from 'react';
import { Card } from './ui/card';
import { Expense, Income, Debt, Account } from '../types';
import { TransactionOverview } from './transactions/TransactionOverview';
import { TransactionFilters } from './transactions/TransactionFilters';
import { ExpenseItem, IncomeItem, DebtItem } from './transactions/TransactionItems';
import { useDeleteWithUndo } from '../hooks/useDeleteWithUndo';

interface TransactionListProps {
  expenses: Expense[];
  incomes: Income[];
  debts: Debt[];
  accounts: Account[];
  currency: string;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onEditIncome: (income: Income) => void;
  onDeleteIncome: (id: string) => void;
  onEditDebt: (debt: Debt) => void;
  onDeleteDebt: (id: string) => void;
  onSettleDebt: (id: string) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  expenses,
  incomes,
  debts,
  accounts,
  currency,
  onEditExpense,
  onDeleteExpense,
  onEditIncome,
  onDeleteIncome,
  onEditDebt,
  onDeleteDebt,
  onSettleDebt
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'expenses' | 'income' | 'debts' | 'subs' | 'emis' | 'emergency' | 'goals'>('all');

  // Combine all transactions using 'kind' to differentiate
  const allTransactions = [
    ...expenses.map(e => ({ ...e, kind: 'expense' as const })),
    ...incomes.map(i => ({ ...i, kind: 'income' as const })),
    ...debts.map(d => ({ ...d, kind: 'debt' as const }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const { handleDelete: handleXDelete, isPending } = useDeleteWithUndo((id) => {
    const t = allTransactions.find(x => x.id === id);
    if (!t) return;
    if (t.kind === 'expense') onDeleteExpense(id);
    else if (t.kind === 'income') onDeleteIncome(id);
    else if (t.kind === 'debt') onDeleteDebt(id);
  });

  // Calculate transaction summary
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthTransactions = {
    expenses: expenses.filter(e => {
      const date = new Date(e.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }),
    incomes: incomes.filter(i => {
      const date = new Date(i.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
  };

  // Get recent transactions (last 5)
  const recentTransactions = allTransactions.slice(0, 5);

  // Calculate total liquidity (Bank + Cash)
  const totalLiquidity = accounts
    .filter(acc => acc.type === 'bank' || acc.type === 'cash')
    .reduce((sum, acc) => sum + acc.balance, 0);

  const filteredTransactions = allTransactions.filter((t) => {
    const matchesSearch =
      ('description' in t && t.description?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ('source' in t && t.source?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ('personName' in t && t.personName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.tags && Array.isArray(t.tags) && t.tags.some(tag => tag?.toLowerCase().includes(searchTerm.toLowerCase())));

    if (!matchesSearch) return false;

    if (filter === "all") return true;
    if (filter === "expenses") return t.kind === "expense";
    if (filter === "income") return t.kind === "income";
    if (filter === "debts") return t.kind === "debt";
    if (filter === "subs") {
      if (t.kind === "expense") {
        return ('category' in t && t.category === 'Subscription') ||
          (t.tags && t.tags.includes("subscription")) ||
          ('description' in t && t.description && (
            t.description.toLowerCase().includes('subscription') ||
            t.description.toLowerCase().includes('netflix') ||
            t.description.toLowerCase().includes('spotify') ||
            t.description.toLowerCase().includes('prime')
          ));
      }
      return false;
    }
    if (filter === "emis") {
      if (t.kind === "expense") {
        return ('category' in t && t.category === 'EMI') ||
          (t.tags && (t.tags.includes("emi") || t.tags.includes("loan"))) ||
          ('description' in t && t.description && (
            t.description.toLowerCase().includes('emi') ||
            t.description.toLowerCase().includes('loan payment') ||
            t.description.toLowerCase().includes('loan')
          ));
      }
      return false;
    }
    if (filter === "emergency") {
      if (t.kind === "expense") {
        return ('category' in t && t.category === 'Healthcare') ||
          ('description' in t && t.description && (
            t.description.toLowerCase().includes('insurance') ||
            t.description.toLowerCase().includes('medical') ||
            t.description.toLowerCase().includes('health') ||
            t.description.toLowerCase().includes('emergency')
          ));
      }
      return false;
    }
    if (filter === "goals") {
      return (t.tags && Array.isArray(t.tags) && t.tags.some((tag: string) => tag?.toLowerCase().includes('goal'))) ||
        ('description' in t && t.description && (
          t.description.toLowerCase().includes('goal') ||
          t.description.toLowerCase().includes('saving')
        ));
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <TransactionOverview
        currentMonthTransactions={currentMonthTransactions}
        recentTransactions={recentTransactions}
        totalLiquidity={totalLiquidity}
        currency={currency}
      />

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 mb-1">All Transactions</h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Track and manage all your financial transactions
        </p>
      </div>

      <TransactionFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filter={filter}
        setFilter={setFilter}
      />

      {/* Transaction List */}
      <div className="pb-20">
        {filteredTransactions.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">No transactions found.</p>
            <p className="text-sm text-gray-400 mt-2">
              {filter === "emis"
                ? "No EMI payments recorded. Add expenses with 'EMI' category or visit the Liability tab to track loans."
                : "Try adjusting your filters or search term"}
            </p>
          </Card>
        ) : (
          filteredTransactions.map((transaction) => {
            const description = 'description' in transaction ? transaction.description :
              'source' in transaction ? transaction.source :
                'personName' in transaction ? transaction.personName : 'Transaction';

            if (transaction.kind === 'expense') {
              return (
                <ExpenseItem
                  key={transaction.id}
                  expense={transaction as Expense}
                  currency={currency}
                  onEdit={onEditExpense}
                  onDelete={() => handleXDelete(transaction.id, description)}
                  isPendingDelete={isPending(transaction.id)}
                />
              );
            } else if (transaction.kind === 'income') {
              return (
                <IncomeItem
                  key={transaction.id}
                  income={transaction as Income}
                  currency={currency}
                  onEdit={onEditIncome}
                  onDelete={() => handleXDelete(transaction.id, description)}
                  isPendingDelete={isPending(transaction.id)}
                />
              );
            } else {
              return (
                <DebtItem
                  key={transaction.id}
                  debt={transaction as Debt}
                  currency={currency}
                  onEdit={onEditDebt}
                  onDelete={() => handleXDelete(transaction.id, description)}
                  onSettle={onSettleDebt}
                  isPendingDelete={isPending(transaction.id)}
                />
              );
            }
          })
        )}
      </div>
    </div>
  );
};
