import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const LoginCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const processLogin = async () => {
            const accessTokenParam = searchParams.get('accessToken');

            if (accessTokenParam) {
                localStorage.setItem('accessToken', accessTokenParam);
                navigate('/', { replace: true });
            } else {
                try {
                    console.log("Access Token 파라미터 없음. 리프레시 토큰으로 재발급 시도...");
                    

                    const response = await axios.get('http://localhost:8080/auth/reissue', {
                        withCredentials: true, 
                    });

                    const authHeader = response.headers['authorization'];

                    if (authHeader) {
                        const token = authHeader.startsWith('Bearer ') 
                            ? authHeader.substring(7) 
                            : authHeader;
                        
                        localStorage.setItem('accessToken', token);
                        console.log("토큰 재발급 성공");
                        navigate('/', { replace: true });
                    } else {
                        throw new Error("서버 응답에 Authorization 헤더가 없습니다.");
                    }

                } catch (error) {
                    console.error("로그인/재발급 실패:", error);
                    navigate('/login', { replace: true });
                }
            }
        };

        processLogin();
    }, [searchParams, navigate]);

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            backgroundColor: '#F8F9FA',
            color: '#1A1A1A'
        }}>
            <h2>로그인 처리 중...</h2>
            <p style={{ color: '#6B7280' }}>잠시만 기다려주세요.</p>
        </div>
    );
};

export default LoginCallback;