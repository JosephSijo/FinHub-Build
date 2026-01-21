import { useState, useCallback, useMemo, useEffect } from 'react';
import { AuthUser } from '../types';
import { STORAGE_KEYS } from '../utils/constants';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

// Helper to format email from mobile
const getEmail = (mobile: string) => `${mobile}@finbase.app`;
// Helper to satisfy min password length (Supabase requires 6 chars usually)
const getPassword = (pin: string) => `${pin}#finbase`;

export const useAuth = () => {
    const [authStatus, setAuthStatus] = useState<'guest' | 'authenticating' | 'authenticated'>('authenticating');
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
    const [isAwaitingPin, setIsAwaitingPin] = useState(false);
    const [pendingMobile, setPendingMobile] = useState(() => localStorage.getItem(STORAGE_KEYS.REMEMBERED_MOBILE) || '');
    const [isRememberedUser, setIsRememberedUser] = useState(() => !!localStorage.getItem(STORAGE_KEYS.REMEMBERED_MOBILE));
    const [rememberedMobile, setRememberedMobile] = useState(() => localStorage.getItem(STORAGE_KEYS.REMEMBERED_MOBILE) || '');
    const [deletionDate, setDeletionDate] = useState<string | null>(() => localStorage.getItem(STORAGE_KEYS.DELETION_SCHEDULE));
    const [authMessage, setAuthMessage] = useState<{ message: string, subMessage?: string } | undefined>();
    const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);

    // Initial Session Check
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const mobile = session.user.email?.split('@')[0] || '';
                setCurrentUser({
                    id: session.user.id,
                    mobile: mobile,
                    name: session.user.user_metadata?.name || 'User'
                });
                setAuthStatus('authenticated');

                // Sync remember me state
                if (mobile) {
                    localStorage.setItem(STORAGE_KEYS.REMEMBERED_MOBILE, mobile);
                    setRememberedMobile(mobile);
                    setIsRememberedUser(true);
                }
            } else {
                setAuthStatus('guest');
                setCurrentUser(null);
            }
        };
        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                const mobile = session.user.email?.split('@')[0] || '';
                setCurrentUser({
                    id: session.user.id,
                    mobile: mobile,
                    name: session.user.user_metadata?.name || 'User'
                });
                setAuthStatus('authenticated');
            } else {
                setAuthStatus('guest');
                setCurrentUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const clearPendingSession = useCallback(async () => {
        await supabase.auth.signOut();
        setAuthStatus('guest');
        setCurrentUser(null);
        setPendingMobile('');
        setGeneratedOtp(null);
        localStorage.removeItem(STORAGE_KEYS.AUTH); // Legacy cleanup
        localStorage.removeItem(STORAGE_KEYS.REMEMBERED_MOBILE);
        setRememberedMobile('');
        setIsRememberedUser(false);
    }, []);

    const logout = useCallback(async () => {
        try {
            await supabase.auth.signOut();
            setAuthStatus('guest');
            setCurrentUser(null);
            if (!isRememberedUser) {
                setPendingMobile('');
            }
        } catch (error) {
            console.error("Logout failed", error);
            // Force local cleanup anyway
            setAuthStatus('guest');
            setCurrentUser(null);
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
        // We can't easily check if user exists without trying to login or using an integrity API
        // For this UI flow, we assume we proceed to PIN entry.
        // If they assume they have an account but don't, login will fail, and we can guide them?
        // Or we can just let them try to login.
        setIsAwaitingPin(true);
        return true;
    }, []);

    const login = useCallback(async (pin: string, rememberMe: boolean = false) => {
        setAuthMessage({ message: "Authenticating", subMessage: "Connecting to secure node..." });
        setAuthStatus('authenticating');

        try {
            const email = getEmail(pendingMobile);
            const password = getPassword(pin);

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            if (data.session) {
                const user = data.session.user;
                const authUser: AuthUser = {
                    id: user.id,
                    mobile: pendingMobile,
                    name: user.user_metadata?.name || 'User'
                };

                setCurrentUser(authUser);
                setAuthMessage({ message: "Login Success", subMessage: "Syncing financial data..." });
                setAuthStatus('authenticated');
                setIsAwaitingPin(false);

                if (deletionDate) {
                    await cancelAccountDeletion();
                    toast.success('Account deletion request canceled.');
                }

                if (rememberMe) {
                    localStorage.setItem(STORAGE_KEYS.REMEMBERED_MOBILE, pendingMobile);
                    setRememberedMobile(pendingMobile);
                    setIsRememberedUser(true);
                }
                return true;
            }
            return false;
        } catch (error: any) {
            console.error("Login Error:", error);
            setAuthMessage(undefined);
            setAuthStatus('guest');
            if (error.message === 'Invalid login credentials') {
                toast.error("Invalid credentials. If this is a new account, please Sign Up.");
            } else {
                toast.error(`Login failed: ${error.message}`);
            }
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

    const resetPin = useCallback(async (_mobile: string, _newPin: string) => {
        // With Supabase, 'Reset PIN' is effectively 'Update Password'
        // BUT we need to be logged in to update password, OR use the reset password email flow.
        // Since we use fake emails, we can't do email reset.
        // PROPOSAL: Allow "Reset" only if they can prove identity via OTP (which we simulate).
        // Then we call supabase.auth.updateUser() - REQUIRES LOGGED IN SESSION.
        // CATCH-22: Can't login if forgot PIN.
        // SOLUTION FOR NOW: This implementation assumes we are doing a 'fresh' signup override or we need admin privileges.
        // REALISTICALLY: Admin function needed.
        // FOR THIS FIX: We will just warn them.
        toast.error("Password reset requires email access. Please contact support.");
        return false;
    }, []);

    const signup = useCallback(async (mobile: string, pin: string, name: string, rememberMe: boolean = false) => {
        setAuthMessage({ message: "Creating Account", subMessage: "Provisioning secure database..." });
        setAuthStatus('authenticating');

        try {
            const email = getEmail(mobile);
            const password = getPassword(pin);

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { name, mobile }
                }
            });

            if (error) throw error;

            if (data.session) {
                const user = data.session.user;
                const authUser: AuthUser = {
                    id: user.id,
                    mobile: mobile,
                    name: name
                };

                setCurrentUser(authUser);
                setAuthMessage({ message: "Signup Success", subMessage: "Initializing Ledger..." });
                setAuthStatus('authenticated');
                setIsAwaitingPin(false);

                if (rememberMe) {
                    localStorage.setItem(STORAGE_KEYS.REMEMBERED_MOBILE, mobile);
                    setRememberedMobile(mobile);
                    setIsRememberedUser(true);
                }
                return true;
            } else if (data.user && !data.session) {
                // Auto confirm logic might be needed if email confirmation is on
                toast.success("Account created! Please sign in.");
                setAuthStatus('guest');
                setIsAwaitingPin(true); // Go back to login
                return true;
            }
            return false;

        } catch (error: any) {
            console.error("Signup Error:", error);
            setAuthMessage(undefined);
            setAuthStatus('guest');
            toast.error(`Signup failed: ${error.message}`);
            return false;
        }
    }, []);

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
