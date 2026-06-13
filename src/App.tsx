import { AuthProvider } from './context/AuthContext';
import { ConversationProvider } from './context/ConversationContext';
import { ItineraryProvider } from './context/ItineraryContext';
import { AiAdjustProvider } from './context/AiAdjustContext';
import { VersionProvider } from './context/VersionContext';
import { ToastProvider } from './components/Toast/Toast';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import Router from './router';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <ConversationProvider>
            <ItineraryProvider>
              <AiAdjustProvider>
                <VersionProvider>
                  <Router />
                </VersionProvider>
              </AiAdjustProvider>
            </ItineraryProvider>
          </ConversationProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}