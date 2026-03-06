import React from 'react';
import { Navigate } from 'react-router-dom';
import { isStaffAuthenticated, getStaffUser } from '../admin/services/staffApi';

interface StaffGuardProps {
    allowedRoles: string[];
    children: React.ReactNode;
}

const StaffGuard: React.FC<StaffGuardProps> = ({ allowedRoles, children }) => {
    if (!isStaffAuthenticated()) {
        return <Navigate to="/staff/login" replace />;
    }

    const user = getStaffUser();
    if (!user || !allowedRoles.includes(user.role)) {
        return <Navigate to="/staff/login" replace />;
    }

    return <>{children}</>;
};

export default StaffGuard;
