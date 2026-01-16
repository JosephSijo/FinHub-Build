import { useState, useCallback, useMemo } from 'react';
import { AuthUser } from '../types';
import { STORAGE_KEYS } from '../utils/constants';
import { hashPin } from '../utils/security';
import { toast } from 'sonner';

// Pre-defined users for Beta/Demo
const DEMO_USERS = [
    {
        mobile: '9656885833',
        pin: '03ac674216f3e15c1d717fd11ea91000ad7d6596b12c87b7efcb6835a75225d3', // 1234
        name: 'Joseph FinHub Node // 0x50.3',
        userId: 'josephsijo-prod-001'
    },
    {
        mobile: '1234567890',
        pin: 'a991b9f69792078652e8964893796d13bd0195e7912d08a9cb528cc29f0f971c', // 4321
        name: 'Demo FinHub Node // 0x50.3',
        userId: 'demo-prod-001'
    },
    {
        mobile: '9447147230',
        pin: '899b9a314067a23557b5db9b87d3e599e2f3200bd69b6cdc6dcf08f8b8e40e2e', // 2255
        name: 'tin2mon FinHub Node // 0x50.3',
        userId: 'tin2mon-prod-001'
    }
];

export const useAuth = () => {
    const [authStatus, setAuthStatus] = useState<'guest' | 'authenticating' | 'authenticated'>(() => {
        const storedAuth = localStorage.getItem(STORAGE_KEYS.AUTH);
        return storedAuth ? 'authenticated' : 'guest';
    });
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
        const storedAuth = localStorage.getItem(STORAGE_KEYS.AUTH);
        if (storedAuth) {
            try {
                return JSON.parse(storedAuth);
            } catch (error) {
                console.error('Failed to restore auth session:', error);
                localStorage.removeItem(STORAGE_KEYS.AUTH);
            }
        }
        return null;
    });
    const [isAwaitingPin, setIsAwaitingPin] = useState(false);
    const [pendingMobile, setPendingMobile] = useState(() => localStorage.getItem(STORAGE_KEYS.REMEMBERED_MOBILE) || '');
    const [isRememberedUser, setIsRememberedUser] = useState(() => !!localStorage.getItem(STORAGE_KEYS.REMEMBERED_MOBILE));
    const [rememberedMobile, setRememberedMobile] = useState(() => localStorage.getItem(STORAGE_KEYS.REMEMBERED_MOBILE) || '');
    const [deletionDate, setDeletionDate] = useState<string | null>(() => localStorage.getItem(STORAGE_KEYS.DELETION_SCHEDULE));
    const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
    const [authMessage, setAuthMessage] = useState<{ message: string, subMessage?: string } | undefined>();

    const clearPendingSession = useCallback(() => {
        setAuthStatus('guest');
        setCurrentUser(null);
        setPendingMobile('');
        setGeneratedOtp(null);
        localStorage.removeItem(STORAGE_KEYS.AUTH);
        localStorage.removeItem(STORAGE_KEYS.REMEMBERED_MOBILE);
        setRememberedMobile('');
        setIsRememberedUser(false);
    }, []);

    const logout = useCallback(() => {
        setAuthStatus('guest');
        setCurrentUser(null);
        setGeneratedOtp(null);
        localStorage.removeItem(STORAGE_KEYS.AUTH);
        if (!isRememberedUser) {
            setPendingMobile('');
        }
    }, [isRememberedUser]);

    const cancelAccountDeletion = useCallback(async () => {
        setDeletionDate(null);
        localStorage.removeItem(STORAGE_KEYS.DELETION_SCHEDULE);
    }, []);

    const scheduleAccountDeletion = useCallback(async () => {
        const date = new Date();
        date.setDate(date.getDate() + 30);
        const dateString = date.toISOString();

        setDeletionDate(dateString);
        localStorage.setItem(STORAGE_KEYS.DELETION_SCHEDULE, dateString);

        toast.warning('Account scheduled for deletion in 30 days.');
        logout();
    }, [logout]);

    const checkIdentity = useCallback(async (mobile: string) => {
        setPendingMobile(mobile);
        const isExistingUser = DEMO_USERS.some(u => u.mobile === mobile) ||
            localStorage.getItem(`finhub_user_${mobile}`) !== null;
        setIsAwaitingPin(true);
        return isExistingUser;
    }, []);

    const login = useCallback(async (pin: string, rememberMe: boolean = false) => {
        setAuthMessage({ message: "Validating PIN", subMessage: "Verifying secure node access..." });
        setAuthStatus('authenticating');

        await new Promise(resolve => setTimeout(resolve, 2000));

        const hashedPin = await hashPin(pin);
        const demoUser = DEMO_USERS.find(u => u.mobile === pendingMobile && u.pin === hashedPin);

        let authenticatedUser: AuthUser | null = null;

        if (demoUser) {
            authenticatedUser = {
                id: demoUser.userId,
                mobile: demoUser.mobile,
                name: demoUser.name
            };
        } else {
            const storedUser = localStorage.getItem(`finhub_user_${pendingMobile}`);
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                if (parsed.pin === hashedPin || parsed.pin === pin) {
                    authenticatedUser = {
                        id: parsed.userId,
                        mobile: parsed.mobile,
                        name: parsed.name
                    };
                }
            }
        }

        if (authenticatedUser) {
            setCurrentUser(authenticatedUser);
            localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(authenticatedUser));
            setAuthMessage({ message: "Handshake Success", subMessage: "Synchronizing decrypted ledger..." });
            setAuthStatus('authenticated');
            setIsAwaitingPin(false);

            if (deletionDate) {
                await cancelAccountDeletion();
                toast.success('Your account deletion request has been canceled. Welcome back!');
            }

            if (rememberMe) {
                localStorage.setItem(STORAGE_KEYS.REMEMBERED_MOBILE, pendingMobile);
                setRememberedMobile(pendingMobile);
                setIsRememberedUser(true);
            }

            return true;
        } else {
            setAuthMessage(undefined);
            setAuthStatus('guest');
            return false;
        }
    }, [pendingMobile, deletionDate, cancelAccountDeletion]);

    const sendOtp = useCallback(async (mobile: string) => {
        setPendingMobile(mobile);
        const mockOtp = Math.floor(1000 + Math.random() * 9000).toString();
        setGeneratedOtp(mockOtp);
        toast.info("Verification code sent", {
            description: `Dev Mode: Use ${mockOtp} (Simulated SMS)`
        });
        return true;
    }, []);

    const verifyOtp = useCallback(async (_mobile: string, otp: string) => {
        if (otp === "0000" || otp === generatedOtp) {
            return true;
        }
        return false;
    }, [generatedOtp]);

    const resetPin = useCallback(async (mobile: string, newPin: string) => {
        const hashedPin = await hashPin(newPin);
        const storedUser = localStorage.getItem(`finhub_user_${mobile}`);
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            parsed.pin = hashedPin;
            localStorage.setItem(`finhub_user_${mobile}`, JSON.stringify(parsed));
            toast.success("PIN reset successfully");
            return true;
        }
        const demoUserIndex = DEMO_USERS.findIndex(u => u.mobile === mobile);
        if (demoUserIndex !== -1) {
            const shadowedUser = { ...DEMO_USERS[demoUserIndex], pin: hashedPin };
            localStorage.setItem(`finhub_user_${mobile}`, JSON.stringify(shadowedUser));
            toast.success("Demo user PIN updated locally");
            return true;
        }
        return false;
    }, []);

    const signup = useCallback(async (mobile: string, pin: string, name: string, rememberMe: boolean = false) => {
        setAuthMessage({ message: "Creating Node", subMessage: "Initializing secure identity protocols..." });
        setAuthStatus('authenticating');
        await new Promise(resolve => setTimeout(resolve, 2000));

        const hashedPin = await hashPin(pin);
        const newUser = { id: `user_${Date.now()}`, mobile, name, pin: hashedPin };

        localStorage.setItem(`finhub_user_${mobile}`, JSON.stringify(newUser));
        const authUser: AuthUser = { id: newUser.id, mobile: newUser.mobile, name: newUser.name };
        setCurrentUser(authUser);
        localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(authUser));
        setAuthMessage({ message: "Handshake Success", subMessage: "Synchronizing decrypted ledger..." });
        setAuthStatus('authenticated');
        setIsAwaitingPin(false);

        if (rememberMe) {
            localStorage.setItem(STORAGE_KEYS.REMEMBERED_MOBILE, mobile);
            setRememberedMobile(mobile);
            setIsRememberedUser(true);
        }

        return true;
    }, []);

    // Auth state is now initialized via lazy initialization in useState above

    return useMemo(() => ({
        authStatus,
        currentUser,
        isAwaitingPin,
        pendingMobile,
        isRememberedUser,
        rememberedMobile,
        deletionDate,
        authMessage,
        checkIdentity,
        login,
        logout,
        sendOtp,
        verifyOtp,
        resetPin,
        signup,
        clearPendingSession,
        scheduleAccountDeletion,
        cancelAccountDeletion,
        setAuthStatus,
        setCurrentUser,
        setPendingMobile,
        setIsRememberedUser,
        setRememberedMobile,
        setDeletionDate
    }), [
        authStatus, currentUser, isAwaitingPin, pendingMobile, isRememberedUser,
        rememberedMobile, deletionDate, authMessage, checkIdentity, login, logout,
        sendOtp, verifyOtp, resetPin, signup, clearPendingSession,
        scheduleAccountDeletion, cancelAccountDeletion
    ]);
};
