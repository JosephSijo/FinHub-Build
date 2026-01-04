import { useFinance } from "../../context/FinanceContext";
import { TransactionOverview } from "../transactions/TransactionOverview";
import { formatCurrency } from "../../utils/numberFormat";

export const Dashboard = () => {
    const {
        expenses,
        incomes,
        debts,
        accounts,
        currency
    } = useFinance();

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const currentMonthTransactions = {
        expenses: expenses.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }),
        incomes: incomes.filter(i => {
            const d = new Date(i.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
    };

    const recentTransactions = [
        ...expenses,
        ...incomes,
        ...debts
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    const totalLiquidity = accounts.reduce((sum, acc) => sum + (acc.type !== 'credit_card' ? acc.balance : 0), 0);

    return (
        <div className="min-h-screen bg-slate-900 p-4 pt-20">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                    <p className="text-slate-400 text-sm">Welcome back</p>
                </div>
            </header>

            <div className="space-y-6">
                {/* Placeholder for Balance Board if it were available */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-lg">
                    <p className="text-sm opacity-80 uppercase tracking-wider">Total Net Worth</p>
                    <p className="text-4xl font-black mt-2">{formatCurrency(totalLiquidity, currency)}</p>
                </div>

                <TransactionOverview
                    currentMonthTransactions={currentMonthTransactions}
                    recentTransactions={recentTransactions}
                    totalLiquidity={totalLiquidity}
                    currency={currency}
                />
            </div>
        </div>
    );
};
