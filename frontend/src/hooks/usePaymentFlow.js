import { useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * usePaymentFlow Hook
 * Manages payment flow based on user authentication state
 * 
 * 3 Scenarios:
 * 1. Guest user: Save pendingPlan to localStorage → redirect to /register
 * 2. Logged-in user: Trigger payment modal directly
 * 3. Dashboard: Check pendingPlan on mount, auto-trigger if exists
 */

const PENDING_PLAN_KEY = 'finbot_pending_plan';

// Plan configurations with pricing
const PLAN_CONFIG = {
    plus: {
        key: 'plus',
        name: 'Plus',
        icon: '⚡',
        monthlyPrice: 369,
        yearlyPrice: 3542, // %20 indirim: 369 * 12 * 0.8
    },
    pro: {
        key: 'pro',
        name: 'Pro',
        icon: '🚀',
        monthlyPrice: 449,
        yearlyPrice: 4310, // %20 indirim: 449 * 12 * 0.8
    }
};

/**
 * Get pending plan from localStorage
 */
export const getPendingPlan = () => {
    try {
        const stored = localStorage.getItem(PENDING_PLAN_KEY);
        if (!stored) return null;
        return JSON.parse(stored);
    } catch {
        return null;
    }
};

/**
 * Clear pending plan from localStorage
 */
export const clearPendingPlan = () => {
    localStorage.removeItem(PENDING_PLAN_KEY);
};

/**
 * Save pending plan to localStorage
 */
export const savePendingPlan = (planKey, period = 'monthly') => {
    const config = PLAN_CONFIG[planKey];
    if (!config) return null;

    const plan = {
        key: planKey,
        name: config.name,
        icon: config.icon,
        period: period,
        price: period === 'monthly' ? config.monthlyPrice : config.yearlyPrice,
        savedAt: Date.now()
    };

    localStorage.setItem(PENDING_PLAN_KEY, JSON.stringify(plan));
    return plan;
};

/**
 * Check if pending plan is still valid (within 24 hours)
 */
export const isPendingPlanValid = (plan) => {
    if (!plan || !plan.savedAt) return false;
    const hoursSaved = (Date.now() - plan.savedAt) / (1000 * 60 * 60);
    return hoursSaved < 24; // Valid for 24 hours
};

/**
 * Main Hook
 */
const usePaymentFlow = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const isLoggedIn = !!user;

    /**
     * Initiate payment flow
     * @param {string} planKey - 'plus' or 'pro'
     * @param {string} period - 'monthly' or 'yearly'
     * @param {function} onShowPaymentModal - Callback to show payment modal (for logged-in users)
     */
    const initiatePayment = useCallback((planKey, period, onShowPaymentModal) => {
        if (planKey === 'free') {
            if (isLoggedIn) {
                navigate('/chat');
            } else {
                navigate('/register');
            }
            return;
        }

        if (planKey === 'enterprise') {
            navigate('/contact');
            return;
        }

        const config = PLAN_CONFIG[planKey];
        if (!config) return;

        if (isLoggedIn) {
            // Scenario 2: Logged-in user - show payment modal directly
            if (onShowPaymentModal) {
                onShowPaymentModal({
                    key: planKey,
                    name: config.name,
                    price: period === 'monthly' ? config.monthlyPrice : config.yearlyPrice,
                    period: period
                });
            }
        } else {
            // Scenario 1: Guest user - save plan and redirect to register
            savePendingPlan(planKey, period);
            navigate('/register');
        }
    }, [isLoggedIn, navigate]);

    /**
     * Check and get valid pending plan
     */
    const checkPendingPlan = useCallback(() => {
        const plan = getPendingPlan();
        if (plan && isPendingPlanValid(plan)) {
            return plan;
        }
        // Clear expired plan
        if (plan) {
            clearPendingPlan();
        }
        return null;
    }, []);

    return {
        isLoggedIn,
        initiatePayment,
        checkPendingPlan,
        clearPendingPlan,
        getPendingPlan,
        savePendingPlan,
        PLAN_CONFIG
    };
};

export default usePaymentFlow;
