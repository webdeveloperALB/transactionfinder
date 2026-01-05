import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { secureStorage } from '../lib/storage';

export const useUserState = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkUserState = async () => {
      try {
        // Skip state checks for public routes and CRM routes
        if (
          location.pathname === '/code-entry' || 
          location.pathname === '/' ||
          location.pathname.startsWith('/crm')
        ) {
          return;
        }

        // Get secret code from secure storage or location state
        const stored = secureStorage.get();
        const secretCode = location.state?.secretCode || stored.secretCode;

        if (!secretCode) {
          // Only redirect if we're not already on a public route
          if (location.pathname !== '/' && location.pathname !== '/code-entry') {
            navigate('/', { replace: true });
          }
          return;
        }

        // Store the secret code if it came from location state
        if (location.state?.secretCode) {
          secureStorage.set({ secretCode: location.state.secretCode });
        }

        // Get user data using secret code
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('secret_code', secretCode)
          .single();

        if (userError || !userData) {
          secureStorage.clear();
          if (location.pathname !== '/' && location.pathname !== '/code-entry') {
            navigate('/', { replace: true });
          }
          return;
        }

        // Check transaction status
        const { data: transactionData } = await supabase
          .from('transactions')
          .select('id, created_at')
          .eq('user_id', userData.id)
          .maybeSingle();

        // Check search status - Modified to get only the latest search result
        const { data: searchData } = await supabase
          .from('search_results')
          .select('status, search_started_at, search_completed_at')
          .eq('user_id', userData.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Determine the correct route based on user state
        let targetRoute = location.pathname;

        if (!transactionData && location.pathname !== '/transaction-info') {
          targetRoute = '/transaction-info';
        } else if (transactionData && searchData) {
          const now = new Date();
          const startTime = searchData.search_started_at ? new Date(searchData.search_started_at) : null;
          const endTime = searchData.search_completed_at ? new Date(searchData.search_completed_at) : null;

          if (startTime && endTime) {
            if (now < endTime && location.pathname !== '/searching') {
              targetRoute = '/searching';
            } else if (now >= endTime && location.pathname !== '/results') {
              targetRoute = '/results';
            }
          }
        }

        // Only navigate if we need to change routes
        if (targetRoute !== location.pathname) {
          navigate(targetRoute, {
            replace: true,
            state: { secretCode }
          });
        }

      } catch (error) {
        console.error('Error checking user state:', error);
        // Only clear storage and redirect on critical errors
        if (error instanceof Error && error.message.includes('network error')) {
          secureStorage.clear();
          navigate('/', { replace: true });
        }
      }
    };

    checkUserState();
  }, [navigate, location.pathname]);
};