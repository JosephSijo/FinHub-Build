import React, { useState, useMemo } from 'react';
import {
  Target,
  TrendingUp,
  Wallet,
  Building2,
  CreditCard,
  ShieldCheck,
  Zap,
  Activity,
  ArrowRightLeft,
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import { InteractiveFinancialValue } from './ui/InteractiveFinancialValue';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

import { TruthBanner } from './dashboard/TruthBanner';
import { TacticalRecovery } from './dashboard/TacticalRecovery';
import { AdvancedInsights } from './dashboard/AdvancedInsights';
import { CollapsibleSection } from './ui/CollapsibleSection';
import { useShadowWallet } from '@/hooks/useShadowWallet';
import { formatCurrency, formatFinancialValue } from '@/utils/numberFormat';
import { MeshBackground } from './ui/MeshBackground';
import { CategoryBackdrop } from './ui/CategoryBackdrop';
import { isTransfer } from '@/utils/isTransfer';
import { Expense, Income, Account, Debt, AIContext, Goal, Liability } from '@/types';
import { calculateFoundationMetrics } from '@/utils/architect';
import { ActionInsightCard, actionInsightsLogic } from '../features/actionInsights';
import { NotificationCard, notificationsLogic, NotificationContext } from '../features/notifications';