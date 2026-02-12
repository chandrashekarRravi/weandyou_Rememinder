import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import { CalendarProvider } from './context/CalendarContext';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard.tsx';
import Rememinder from './pages/Reminder.tsx';
import Review from './pages/Review.tsx';
import DayDetails from './pages/DayDetails';
import './index.css';

function App() {
  return (
    <SocketProvider>
      <CalendarProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/reminder" element={<Rememinder />} />
              <Route path="/review" element={<Review />} />
              <Route path="/day/:date" element={<DayDetails />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CalendarProvider>
    </SocketProvider>
  );
}

export default App;
