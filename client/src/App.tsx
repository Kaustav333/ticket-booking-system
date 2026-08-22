import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Events from './pages/Events';
import SeatMap from './pages/SeatMap';
import AdminDashboard from './pages/AdminDashboard';
import OrganiserDashboard from './pages/OrganiserDashboard';
import ClaimWaitlist from './pages/ClaimWaitlist';
import Signup from './pages/Signup';
import Checkout from './pages/Checkout';
import BookingHistory from './pages/BookingHistory';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-transparent text-gray-900 flex flex-col relative overflow-hidden">
        
        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pt-24">
            <Routes>
              <Route path="/" element={<Events />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id/seats" element={<SeatMap />} />
            <Route path="/checkout/:id" element={<Checkout />} />
            <Route path="/bookings" element={<BookingHistory />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/organiser" element={<OrganiserDashboard />} />
            <Route path="/claim/:token" element={<ClaimWaitlist />} />
          </Routes>
        </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
