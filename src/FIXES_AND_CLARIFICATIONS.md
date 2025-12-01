# FinHub: Fixes and Clarifications Summary

## Overview
This document outlines all fixes and clarifications made to distinguish between **Personal IOUs** (interpersonal debts) and **Liabilities** (institutional loans with EMIs).

---

## Key Distinctions

### 🤝 Personal IOUs
- **Purpose**: Track money borrowed from or lent to friends/family
- **Access**: Floating Action Button → "Personal IOU"
- **Features**:
  - Track who owes whom
  - "I Lent" vs "I Borrowed" options
  - Settlement tracking
  - Status: Pending/Settled
- **Filter**: "IOUs" button in Transaction screen (yellow theme)
- **Category**: "Personal IOU" in expense categories

### 🏦 Liabilities (Institutional Loans)
- **Purpose**: Track formal loans from banks/institutions with EMI payments
- **Access**: Dedicated "Liability" tab in bottom navigation
- **Features**:
  - Loan types: Home, Car, Personal, Credit Card, Education, Other
  - Track: Principal, Outstanding, Interest Rate, EMI Amount, Tenure
  - Visual progress bars for repayment tracking
  - Links to EMI payment transactions
  - Mini-dashboard showing recent EMI payments
- **Filter**: "EMIs" button in Transaction screen (orange theme)
- **Category**: "EMI" in expense categories

---

## Changes Made

### 1. FAB Menu Update
**File**: `/App.tsx`
- **Before**: "🤝 Debt Payment"
- **After**: "🤝 Personal IOU"
- **Reason**: Clarify this is for interpersonal debts, not institutional loans

### 2. Transaction Form Title & Description
**File**: `/components/TransactionForm.tsx`
- **Title**: Changed "Debt Payment" to "Personal IOU"
- **Added Guidance**: "Track money borrowed from or lent to friends/family. For institutional loans with EMIs, use the Liability tab."
- **Impact**: Users now understand the distinction when adding personal IOUs

### 3. Transaction Filter Button
**File**: `/components/TransactionList.tsx`
- **Before**: "Debts" with CreditCard icon
- **After**: "IOUs" with Users icon
- **Reason**: Clearer terminology, distinct icon from EMI filter

### 4. EMI Filter Info Banner
**File**: `/components/TransactionList.tsx`
- **Added**: Orange banner when EMI filter is active
- **Content**: "These are loan EMI payment transactions. Manage your loans in the Liability tab."
- **Empty State**: Helpful message directing users to Liability tab if no EMIs found

### 5. Liability Tab Info Banner
**File**: `/components/LiabilityTab.tsx`
- **Added**: Blue informational card at top
- **Content**: Explains what liabilities are and directs users to Personal IOUs for interpersonal debts
- **Impact**: Prevents confusion about which feature to use

### 6. Category System Update
**File**: `/types/index.ts`
- **Changed**: "Debt Payment" → "Personal IOU"
- **Added**: EMI and Subscription categories
- **Legacy Support**: Old "Debt Payment" category still recognized in icon mapping

### 7. Icon Mapping
**File**: `/components/TransactionList.tsx`
- **EMI**: CreditCard icon (🏦)
- **Subscription**: Repeat icon (📺)
- **Personal IOU**: Users icon (🤝)
- **Legacy Support**: "Debt Payment" still maps to Users icon

---

## User Flow Clarifications

### Adding a Personal IOU (Friend/Family)
1. Click floating + button (bottom right)
2. Select "Personal IOU"
3. Fill in:
   - Person's name
   - Amount
   - Type: "I Lent" or "I Borrowed"
   - Date
4. Save
5. View in Transactions → "IOUs" filter
6. Settle when paid back

### Adding an Institutional Loan
1. Navigate to "Liability" tab (bottom nav)
2. Click "Add Liability"
3. Fill in:
   - Loan name (e.g., "Home Loan - HDFC")
   - Type (Home, Car, Personal, etc.)
   - Principal amount
   - Outstanding balance
   - Interest rate
   - Monthly EMI
   - Start date
   - Tenure (months)
4. Save
5. Track progress with visual indicators
6. Link to account (optional)

### Recording an EMI Payment
1. Click floating + button
2. Select "Money Out"
3. Fill in:
   - Description: "Home Loan EMI - May 2024"
   - Amount: EMI amount
   - Category: **"EMI"**
   - Account: Deduct from account
   - Date
4. Save
5. View in Transactions → "EMIs" filter
6. Appears in Liability tab mini-dashboard

### Recording a Subscription Payment
1. Click floating + button
2. Select "Money Out"
3. Fill in:
   - Description: "Netflix Premium"
   - Amount: Subscription fee
   - Category: **"Subscription"**
   - Account: Deduct from account
   - Date
   - Optional: Mark as Recurring
4. Save
5. View in Transactions → "Subs" filter

---

## Transaction Filters Explained

### Filter Buttons in Transaction Screen:

1. **All** - Shows all transactions
2. **Expenses** (Red) - All money out
3. **Income** (Green) - All money in
4. **IOUs** (Yellow) - Personal debts (borrowed/lent)
5. **Subs** (Purple) - Subscription payments
6. **EMIs** (Orange) - Loan EMI payments
7. **Emergency** (Blue) - Emergency fund related
8. **Goals** (Purple) - Goal savings related

---

## Dashboard Widgets

### Summary Cards Display:
1. **Total Income** - Green
2. **Net Balance** - Green/Red based on value
3. **Emergency Fund** - Blue
4. **Total Expenses** - Red
5. **Total Liabilities** - Orange (NEW!)
6. **Goals Allocated** - Purple

---

## Navigation Structure

### Bottom Tab Bar (6 Tabs):
1. **Home** - Dashboard overview
2. **Txns** - All transactions with filters
3. **Liability** - Manage institutional loans (NEW!)
4. **Goals** - Savings goals
5. **Invest** - Investment portfolio
6. **More** - Access to:
   - Emergency Fund
   - Accounts & Cards
   - Settings
   - Notifications

---

## Data Relationships

### Personal IOUs:
```
Debt {
  personName: "John Doe"
  amount: 5000
  type: "borrowed" | "lent"
  status: "pending" | "settled"
  accountId: "account_id"
}
```

### Liabilities:
```
Liability {
  name: "Home Loan - HDFC"
  type: "home_loan" | "car_loan" | "personal_loan" | etc.
  principal: 5000000
  outstanding: 4500000
  interestRate: 8.5
  emiAmount: 45000
  tenure: 240 (months)
  startDate: "2024-01-01"
  accountId: "account_id" (optional)
}
```

### EMI Expense Transaction:
```
Expense {
  description: "Home Loan EMI - May 2024"
  amount: 45000
  category: "EMI"
  tags: ["loan", "emi"]
  accountId: "account_id"
}
```

---

## Best Practices

### ✅ DO:
- Use **Personal IOUs** for money with friends/family
- Use **Liabilities** for bank loans, car loans, home loans
- Use **EMI category** when recording loan payments
- Use **Subscription category** for recurring services
- Link liabilities to the account used for EMI deductions

### ❌ DON'T:
- Don't create a liability for ₹500 borrowed from a friend
- Don't use Personal IOU for your home loan
- Don't mix EMI and Subscription categories
- Don't forget to settle Personal IOUs when paid back

---

## Technical Implementation

### Backend Routes:
- **Personal IOUs**: `/user/:userId/debts`
- **Liabilities**: `/user/:userId/liabilities`
- **Both use**: Supabase KV store for persistence

### State Management:
- `debts` state - Personal IOUs
- `liabilities` state - Institutional loans
- Both loaded independently on app startup

### Category Detection:
- **EMI Filter**: Checks for category="EMI" OR tags contains "emi"/"loan" OR description contains "emi"/"loan payment"
- **Subs Filter**: Checks for category="Subscription" OR tags contains "subscription" OR description contains common services

---

## Migration Notes

### For Existing Users:
- Old "Debt Payment" category entries remain functional
- Icon mapping supports both old and new naming
- No data migration required
- Users can continue using existing workflows

### Recommendations:
1. Review existing "Debt Payment" category expenses
2. If they're EMI payments, update category to "EMI"
3. If they're personal, category is now "Personal IOU"
4. Create liabilities for institutional loans
5. Link future EMI payments to liability records

---

## Summary

The key improvement is **semantic clarity**:
- **Personal IOUs** = People relationships (I owe you / You owe me)
- **Liabilities** = Institutional obligations (Banks, lenders, EMIs)
- **EMI Category** = Monthly loan payments (expenses)
- **Subscription Category** = Recurring service payments (expenses)

This separation ensures users can:
1. Track interpersonal financial relationships
2. Manage formal loan obligations
3. Monitor EMI payment history
4. Analyze spending by type
5. Get accurate financial insights

All changes are backward compatible while providing clearer guidance for new users.
