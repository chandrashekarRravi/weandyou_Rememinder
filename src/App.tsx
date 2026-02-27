import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import { CalendarProvider } from './context/CalendarContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard.tsx';
import Rememinder from './pages/Reminder.tsx';
import Review from './pages/Review.tsx';
import DayDetails from './pages/DayDetails';
import Login from './pages/Login';
import './index.css';

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <CalendarProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/reminder" element={<Rememinder />} />
                  <Route path="/review" element={<Review />} />
                  <Route path="/day/:date" element={<DayDetails />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </CalendarProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
