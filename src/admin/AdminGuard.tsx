import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from './services/adminApi';

const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (!isAuthenticated()) {
        return <Navigate to="/admin/login" replace />;
    }
    return <>{children}</>;
};

export default AdminGuard;
