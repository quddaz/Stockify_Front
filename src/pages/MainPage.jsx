import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { WebSocketContext } from '../components/WebSocketProvider';
import './MainPage.css'; 

const MainPage = () => {
    const navigate = useNavigate();
    const wsContext = useContext(WebSocketContext);
    const wsStockData = wsContext ? wsContext.stockData : [];

    const [portfolio, setPortfolio] = useState([]);
    const [userName, setUserName] = useState("User"); 
    const [userMoney, setUserMoney] = useState(0);
    
    const [stockData, setStockData] = useState([]);
    const [rankings, setRankings] = useState([]);
    const [sectorThemes, setSectorThemes] = useState([]);
    const [marketStatus, setMarketStatus] = useState("OPEN");
    
    const [token] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('accessToken');
        }
        return null;
    });

    const getTrendInfo = (rate) => {
        const safeRate = Number(rate) || 0;
        if (safeRate > 0) return { className: 'up', arrow: '↑', sign: '+' };
        if (safeRate < 0) return { className: 'down', arrow: '↓', sign: '' }; 
        return { className: 'same', arrow: '-', sign: '' };
    };

    const handleCompanyClick = (stock) => {
        const currentPrice = stock.currentPrice || 0;
        const changeRate = stock.changeRate || 0;
        
        navigate(`/company/${stock.companyName}`, {
            state: {
                currentPrice: currentPrice,
                changeRate: changeRate,
                changeValue: currentPrice - (currentPrice / (1 + changeRate/100)),
                userMoney: userMoney 
            }
        });
    };

    const fetchPortfolio = useCallback(async () => {
        if (!token) return;
        try {
            const res = await axios.get('http://localhost:8080/user-positions/portfolio', {
                headers: { Authorization: `Bearer ${token}` },
            });

            const responseData = res.data?.results || res.data?.data; 

            if (responseData) {
                setPortfolio(responseData.positions || []);
                const userData = responseData.user || responseData;
                if (userData) {
                    setUserName(userData.username || userData.name || userData.nickname || "User");
                    setUserMoney(userData.money ?? userData.cash ?? userData.balance ?? 0);
                }
            }
        } catch (err) {
            console.error("포트폴리오 조회 실패:", err);
        }
    }, [token]);

    const fetchRankings = useCallback(async () => {
        if (!token) return;
        try {
            const res = await axios.get('http://localhost:8080/user-positions/ranking', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const rawData = res.data?.results ?? [];
            const filteredData = rawData.filter(ranker => ranker.totalAssets > 0);
            setRankings(filteredData);
        } catch (err) { setRankings([]); }
    }, [token]);

    const fetchSectorThemes = useCallback(async () => {
        if (!token) return;
        try {
            const res = await axios.get('http://localhost:8080/sector-themes/info', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSectorThemes(res.data?.data ?? []);
        } catch (err) { console.error(err); }
    }, [token]);

    const fetchStockData = useCallback(async () => {
        if (!token) return;
        try {
            const res = await axios.get('http://localhost:8080/companies/info', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setStockData(res.data?.results ?? []);
        } catch (err) { console.error(err); }
    }, [token]);

    useEffect(() => {
        fetchPortfolio();
        fetchStockData();
        fetchRankings();
        fetchSectorThemes();
    }, [fetchPortfolio, fetchStockData, fetchRankings, fetchSectorThemes]);


    useEffect(() => {
        if (!wsStockData || wsStockData.length === 0) return;

        setStockData(prevList => {
            if (prevList.length === 0) return wsStockData;

            const newDataMap = new Map(wsStockData.map(item => [item.companyName, item]));

            return prevList.map(existingItem => {
                const newItem = newDataMap.get(existingItem.companyName);
                
                if (newItem) {
                    return { ...existingItem, ...newItem };
                }
                return existingItem;
            });
        });
    }, [wsStockData]);

    const totalStockValue = portfolio.reduce((acc, item) => acc + ((item.currentPrice || 0) * (item.quantity || 0)), 0);
    const totalAssetValue = totalStockValue + userMoney;

    return (
        <div className="main-container">
            <div className="header">
                <div className="logo-wrapper">
                    <span className="logo-text">Stockity</span>
                    <div className={`market-status-container ${marketStatus === "OPEN" ? 'open' : ''}`}>
                        <div className={`status-pulse ${marketStatus === "OPEN" ? 'open' : ''}`} />
                        <span className={`status-label ${marketStatus === "OPEN" ? 'open' : ''}`}>
                            {marketStatus === "OPEN" ? "Market Open" : "Market Closed"}
                        </span>
                    </div>
                </div>
                <div className="user-wrapper">
                    <span className="user-name-text">{userName} 님</span>
                    <button className="logout-button" onClick={() => { 
                        localStorage.removeItem('accessToken'); 
                        window.location.href = '/login'; 
                    }}>Logout</button>
                </div>
            </div>

            {sectorThemes.length > 0 && (
                <div className="sector-banner-container">
                    {sectorThemes.map((theme, idx) => {
                        const sectorRate = theme.changeRate || 0;
                        const { className, sign } = getTrendInfo(sectorRate);
                        
                        return (
                            <div className="sector-card" key={idx}>
                                <span className="sector-name">{theme.themeName || theme.sector}</span>
                                <span className={`sector-change ${className}`}>
                                    {sign}{Number(sectorRate).toFixed(2)}%
                                </span>
                                {theme.leadingStock && <span className="sector-leader">Leading: {theme.leadingStock}</span>}
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="dashboard-grid">
                <div className="left-column">
                    <div className="panel-base">
                        <div className="panel-top">
                            <span className="panel-heading">Live Market</span>
                            <div className="live-badge">
                                <div className="live-pulse" />
                                <span className="live-label">LIVE</span>
                            </div>
                        </div>
                        <div className="table-list">
                            <div className="table-head">
                                <div className="head-cell">COMPANY</div>
                                <div className="head-cell">PRICE</div>
                                <div className="head-cell">CHANGE</div>
                                <div className="head-cell center">TREND</div>
                            </div>
                            {stockData.map((stock) => {
                                const currentPrice = stock.currentPrice || 0;
                                const changeRate = stock.changeRate || 0;
                                const { className, arrow, sign } = getTrendInfo(changeRate);
                                
                                return (
                                    <div className="data-row" key={stock.companyName} onClick={() => handleCompanyClick(stock)}>
                                        <div className="cell">
                                            <span className="company-title">{stock.companyName}</span>
                                            <span className="company-ticker">{stock.sector}</span>
                                        </div>
                                        <div className="cell">
                                            {/* toLocaleString() 안전하게 호출 */}
                                            <span className="price-text">{Number(currentPrice).toLocaleString()}원</span>
                                        </div>
                                        <div className="cell">
                                            <span className={`change-text ${className}`}>
                                                {sign}{Number(changeRate).toFixed(2)}%
                                            </span>
                                        </div>
                                        <div className="cell center">
                                            <div className={`trend-box ${className}`}>{arrow}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="panel-base">
                        <div className="panel-top">
                            <span className="panel-heading">My Portfolio</span>
                            <button className="refresh-btn" onClick={fetchPortfolio}>↻ 갱신</button>
                        </div>
                        <div className="stats-row">
                            <div className="stat-box">
                                <span className="stat-title">TOTAL ASSET</span>
                                <span className="stat-number">{Number(totalAssetValue).toLocaleString()}원</span>
                            </div>
                            <div className="stat-box">
                                <span className="stat-title">CASH</span>
                                <span className="stat-number">{Number(userMoney).toLocaleString()}원</span>
                            </div>
                            <div className="stat-box">
                                <span className="stat-title">STOCK VALUE</span>
                                <span className="stat-number">{Number(totalStockValue).toLocaleString()}원</span>
                            </div>
                        </div>
                        <div className="table-list compact">
                            <div className="table-head"><div className="head-cell">STOCK</div><div className="head-cell">QTY</div><div className="head-cell">AVG</div><div className="head-cell">CUR</div><div className="head-cell right">P&L</div></div>
                            {portfolio.map((item, idx) => {
                                const currentP = item.currentPrice || 0;
                                const avgP = item.averagePrice || 0;
                                const profit = (currentP - avgP) * (item.quantity || 0);
                                const profitClass = profit > 0 ? 'up' : (profit < 0 ? 'down' : 'same');
                                const profitSign = profit > 0 ? '+' : '';

                                return (
                                    <div className="data-row no-border" key={idx} 
                                         onClick={() => handleCompanyClick({companyName: item.name || item.companyName, currentPrice: currentP, changeRate: 0})}>
                                        <div className="cell"><span className="company-title">{item.name || item.companyName}</span></div>
                                        <div className="cell"><span className="price-text">{item.quantity}</span></div>
                                        <div className="cell"><span className="company-ticker">{Number(avgP).toLocaleString()}</span></div>
                                        <div className="cell"><span className="price-text">{Number(currentP).toLocaleString()}</span></div>
                                        <div className="cell right">
                                            <span className={`change-text ${profitClass}`} style={{fontSize:'12px'}}>
                                                {profitSign}{Number(profit).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                <div className="right-column">
                    <div className="panel-base">
                        <div className="panel-top"><span className="panel-heading">Top Traders</span></div>
                        <div style={{display:'flex', flexDirection:'column', gap:'14px'}}>
                            {rankings.map((ranker, index) => (
                                <div className="rank-item" key={index}>
                                    <div className={`rank-number ${index < 3 ? 'top3' : ''}`}>{index + 1}</div>
                                    <div style={{flex:1, display:'flex', flexDirection:'column', gap:'5px'}}>
                                        <span className="company-title">{ranker.username}</span>
                                        <span className="company-ticker">
                                            {ranker.totalAssets ? Number(ranker.totalAssets).toLocaleString() : 0}원
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default MainPage;