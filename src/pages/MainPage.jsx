import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { WebSocketContext } from '../components/WebSocketProvider';
import './MainPage.css'; 

const MainPage = () => {
    const navigate = useNavigate();
    const { stockData: wsStockData } = useContext(WebSocketContext) || { stockData: [] };

    const [portfolio, setPortfolio] = useState([]);
    const [userName, setUserName] = useState("User"); 
    const [userMoney, setUserMoney] = useState(0);
    
    const [stockData, setStockData] = useState([]);
    const [rankings, setRankings] = useState([]);
    const [sectorThemes, setSectorThemes] = useState([]);
    const [marketStatus, setMarketStatus] = useState("OPEN");
    const [token] = useState(localStorage.getItem('accessToken'));

    const getTrendInfo = (rate) => {
        if (rate > 0) return { className: 'up', arrow: '↑', sign: '+' };
        if (rate < 0) return { className: 'down', arrow: '↓', sign: '' }; 
        return { className: 'same', arrow: '-', sign: '' };
    };

    const handleCompanyClick = (stock) => {
        navigate(`/company/${stock.companyName}`, {
            state: {
                currentPrice: stock.currentPrice,
                changeRate: stock.changeRate,
                changeValue: stock.currentPrice - (stock.currentPrice / (1 + stock.changeRate/100)),
                userMoney: userMoney 
            }
        });
    };

    const fetchPortfolio = async () => {
        if (!token) return;
        try {
            const res = await axios.get('http://localhost:8080/user-positions/portfolio', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const responseData = res.data?.results; 
            if (responseData) {
                setPortfolio(responseData.positions || []);
                if (responseData.user) {
                    setUserName(responseData.user.username || "User");
                    setUserMoney(responseData.user.money || 0);
                }
            }
        } catch (err) { console.error(err); }
    };

    const fetchRankings = async () => {
        if (!token) return;
        try {
            const res = await axios.get('http://localhost:8080/user-positions/ranking', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const rawData = res.data?.results ?? [];
            const filteredData = rawData.filter(ranker => ranker.totalAssets > 0);
            setRankings(filteredData);
        } catch (err) { setRankings([]); }
    };

    const fetchSectorThemes = async () => {
        if (!token) return;
        try {
            const res = await axios.get('http://localhost:8080/sector-themes/info', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSectorThemes(res.data?.data ?? []);
        } catch (err) { console.error(err); }
    };

    const fetchStockData = async () => {
        if (!token) return;
        try {
            const res = await axios.get('http://localhost:8080/companies/info', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setStockData(res.data?.results ?? []);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchPortfolio();
        fetchStockData();
        fetchRankings();
        fetchSectorThemes();
    }, [token]);

    useEffect(() => {
        if (wsStockData && wsStockData.length > 0) {
            setStockData(wsStockData);
            fetchSectorThemes();
        }
    }, [wsStockData]);

    const totalStockValue = portfolio.reduce((acc, item) => acc + (item.currentPrice * item.quantity), 0);
    const totalAssetValue = totalStockValue + userMoney;

    return (
        <div className="main-container">
            <div className="header">
                <div className="logo-wrapper">
                    <span className="logo-text">Stockity</span>
                    <div className={`market-status-container ${marketStatus === "OPEN" ? 'open' : ''}`}>
                        <div className={`status-pulse ${marketStatus === "OPEN" ? 'open' : ''}`} />
                        <span className={`status-label ${marketStatus === "OPEN" ? 'open' : ''}`}>{marketStatus === "OPEN" ? "Market Open" : "Market Closed"}</span>
                    </div>
                </div>
                <div className="user-wrapper">
                    <div className="user-info-text"><span className="user-name-text">{userName} 님</span></div>
                    <button className="logout-button" onClick={() => { localStorage.removeItem('accessToken'); window.location.href = '/login'; }}>Logout</button>
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
                                    {sign}{sectorRate.toFixed(2)}%
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
                        <div className="panel-top"><span className="panel-heading">Live Market</span><div className="live-badge"><div className="live-pulse" /><span className="live-label">LIVE</span></div></div>
                        <div className="table-list">
                            <div className="table-head"><div className="head-cell">COMPANY</div><div className="head-cell">PRICE</div><div className="head-cell">CHANGE</div><div className="head-cell center">TREND</div></div>
                            {stockData.map((stock) => {
                                const { className, arrow, sign } = getTrendInfo(stock.changeRate);
                                
                                return (
                                    <div className="data-row" key={stock.companyName} onClick={() => handleCompanyClick(stock)}>
                                        <div className="cell"><span className="company-title">{stock.companyName}</span><span className="company-ticker">{stock.sector}</span></div>
                                        <div className="cell"><span className="price-text">{stock.currentPrice.toLocaleString()}원</span></div>
                                        <div className="cell">
                                            <span className={`change-text ${className}`}>
                                                {sign}{stock.changeRate.toFixed(2)}%
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
                        <div className="panel-top"><span className="panel-heading">My Portfolio</span><button className="refresh-btn" onClick={fetchPortfolio}>↻ 갱신</button></div>
                        <div className="stats-row">
                            <div className="stat-box"><span className="stat-title">TOTAL ASSET</span><span className="stat-number">{totalAssetValue.toLocaleString()}원</span></div>
                            <div className="stat-box"><span className="stat-title">CASH</span><span className="stat-number">{userMoney.toLocaleString()}원</span></div>
                            <div className="stat-box"><span className="stat-title">STOCK VALUE</span><span className="stat-number">{totalStockValue.toLocaleString()}원</span></div>
                        </div>
                        <div className="table-list compact">
                            <div className="table-head"><div className="head-cell">STOCK</div><div className="head-cell">QTY</div><div className="head-cell">AVG</div><div className="head-cell">CUR</div><div className="head-cell right">P&L</div></div>
                            {portfolio.map((item, idx) => {
                                const profit = (item.currentPrice - item.averagePrice) * item.quantity; 
                                const profitClass = profit > 0 ? 'up' : (profit < 0 ? 'down' : 'same');
                                const profitSign = profit > 0 ? '+' : '';

                                return (
                                    <div className="data-row no-border" key={idx} 
                                         onClick={() => handleCompanyClick({companyName: item.name || item.companyName, currentPrice: item.currentPrice, changeRate: 0})}>
                                        <div className="cell"><span className="company-title">{item.name || item.companyName}</span></div>
                                        <div className="cell"><span className="price-text">{item.quantity}</span></div>
                                        <div className="cell"><span className="company-ticker">{item.averagePrice.toLocaleString()}</span></div>
                                        <div className="cell"><span className="price-text">{item.currentPrice.toLocaleString()}</span></div>
                                        <div className="cell right">
                                            <span className={`change-text ${profitClass}`} style={{fontSize:'12px'}}>
                                                {profitSign}{profit.toLocaleString()}
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
                                            {ranker.totalAssets ? ranker.totalAssets.toLocaleString() : 0}원
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