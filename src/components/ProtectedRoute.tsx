
import { useAuth } from "@/context/AuthContext";
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from "react";
import type { Role } from "@/types";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: Role[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const pathname = location.pathname;

    useEffect(() => {
        if (!loading) {
            if (!user) {
                navigate("/login");
            } else if (allowedRoles && !allowedRoles.includes(user.role)) {
                navigate("/dashboard");
            }
        }
    }, [user, loading, navigate, allowedRoles]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!user) return null;
    if (allowedRoles && !allowedRoles.includes(user.role)) return null;

    return <>{children}</>;
}
