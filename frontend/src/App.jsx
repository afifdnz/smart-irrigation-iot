import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Plots from './pages/Plots';
import PlotDetail from './pages/PlotDetail';
import Tanks from './pages/Tanks';
import TankDetail from './pages/TankDetail';
import Schedules from './pages/Schedules';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/dashboard" element={
          <PrivateRoute>
            <Layout><Dashboard /></Layout>
          </PrivateRoute>
        } />
        <Route path="/plots" element={
          <PrivateRoute>
            <Layout><Plots /></Layout>
          </PrivateRoute>
        } />
        <Route path="/plots/:id" element={
          <PrivateRoute>
            <Layout><PlotDetail /></Layout>
          </PrivateRoute>
        } />
        <Route path="/tanks" element={
          <PrivateRoute>
            <Layout><Tanks /></Layout>
          </PrivateRoute>
        } />
        <Route path="/tanks/:id" element={
          <PrivateRoute>
            <Layout><TankDetail /></Layout>
          </PrivateRoute>
        } />
        <Route path="/schedules" element={
          <PrivateRoute>
            <Layout><Schedules /></Layout>
          </PrivateRoute>
        } />
        <Route path="/settings" element={
          <PrivateRoute>
            <Layout><Settings /></Layout>
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
