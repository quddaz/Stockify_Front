import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

export const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const reissueToken = async () => {
        try {
            const response = await axiosInstance.get('/auth/reissue');
            const accessToken = response.headers['authorization']?.split(' ')[1];
            if (accessToken) {
                localStorage.setItem('accessToken', accessToken);
                setIsAuthenticated(true);
            }
        } catch (err) {
            console.error('토큰 재발급 실패', err);
            setIsAuthenticated(false);
        }
    };

    useEffect(() => {
        reissueToken();
    }, []);

    return { isAuthenticated, reissueToken };
};
