import type { PropsWithChildren } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router';
import { useAuth } from './hooks/useAuth';
import { isStaff, useUser } from './hooks/useActor';
import { buttonClass } from './utilities/classes';
import { ActivityPage } from './components/ActivityPage';
import { AppShell } from './components/AppShell';
import { CatalogPage } from './components/CatalogPage';
import { InventoryPage } from './components/InventoryPage';
import { EditItemPage, NewItemPage } from './components/ItemFormPage';
import { ItemPage } from './components/ItemPage';
import { SettingsPage } from './components/SettingsPage';
import { SignInPage } from './components/SignInPage';
import { StaffDeskProvider } from './components/StaffDeskProvider';
import { ToastProvider } from './components/ToastProvider';

const NotFound = () => (
  <div className="flex flex-col items-start gap-3 p-8">
    <p className="text-heading">This page doesn’t exist.</p>
    <Link to="/" className={buttonClass('secondary', 'sm')}>
      Go home
    </Link>
  </div>
);

const StaffOnly = ({ superadmin = false, children }: PropsWithChildren<{ superadmin?: boolean }>) => {
  const user = useUser();
  const allowed = superadmin ? user.role === 'superadmin' : isStaff(user);
  return allowed ? children : <NotFound />;
};

const AppRoutes = () => {
  const user = useUser();
  return (
    <Routes>
      <Route path="/" element={isStaff(user) ? <Navigate to="/inventory" replace /> : <CatalogPage />} />
      <Route path="/items/:id" element={<ItemPage />} />
      <Route path="/inventory" element={<StaffOnly><InventoryPage /></StaffOnly>} />
      <Route path="/inventory/:id" element={<StaffOnly><InventoryPage /></StaffOnly>} />
      <Route path="/inventory/:id/edit" element={<StaffOnly><EditItemPage /></StaffOnly>} />
      <Route path="/log" element={<StaffOnly><NewItemPage /></StaffOnly>} />
      <Route path="/activity" element={<StaffOnly><ActivityPage /></StaffOnly>} />
      <Route path="/settings" element={<StaffOnly superadmin><SettingsPage /></StaffOnly>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  const { state } = useAuth();

  if (state.status === 'loading') return <div aria-busy="true" className="min-h-screen bg-canvas" />;
  if (state.status === 'signedOut') return <SignInPage error={state.error} />;

  return (
    <BrowserRouter>
      <ToastProvider>
        <StaffDeskProvider>
          <AppShell>
            <AppRoutes />
          </AppShell>
        </StaffDeskProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
