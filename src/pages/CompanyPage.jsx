import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { WebSocketContext } from '../components/WebSocketProvider';
import './CompanyPage.css';

const CompanyPage = () => {
    const { companyName } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [token] = useState(localStorage.getItem('accessToken'));

    const { client } = useContext(WebSocketContext); 

    const passedState = location.state || {};

    const [myCash, setMyCash] = useState(passedState.userMoney || 0);
    const [myShares, setMyShares] = useState(0);

    const [stockInfo, setStockInfo] = useState({
        name: companyName,
        ticker: "LOADING...",
        price: passedState.currentPrice || 0,
        changeValue: passedState.changeValue || 0,
        changeRate: passedState.changeRate || 0,
        sector: "",
        totalShares: 0, 
        desc: "회사 정보를 불러오는 중입니다...",
        riskMetrics: { level: "MEDIUM", score: 50, volatility: "MEDIUM" }
    });
    
    const [quantity, setQuantity] = useState(1);
    const [chartData, setChartData] = useState([]);

    const fetchMyStatus = async () => {
        if (!token) return;
        try {
            const res = await axios.get('http://localhost:8080/user-positions/portfolio', {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            const data = res.data?.results;
            if (data) {
                if (data.user) {
                    setMyCash(data.user.money);
                }
                
                const myPosition = (data.positions || []).find(
                    p => p.companyName === companyName || p.name === companyName
                );
                setMyShares(myPosition ? myPosition.quantity : 0);
            }
        } catch (err) {
            console.error("내 자산 정보 조회 실패:", err);
        }
    };

    const fetchCompanyDetail = async () => {
        if (!token) return;
        try {
            const res = await axios.get(`http://localhost:8080/companies/detail`, {
                params: { name: companyName },
                headers: { Authorization: `Bearer ${token}` },
            });
            
            const data = res.data?.results;

            if (data) {
                const formattedChart = (data.chart || []).map(item => ({
                    time: item.time.substring(11, 16), 
                    price: item.price
                }));
                setChartData(formattedChart);

                let calculatedChangeValue = passedState.changeValue;
                let calculatedChangeRate = passedState.changeRate;

                if ((!calculatedChangeValue) && formattedChart.length > 0) {
                    const startPrice = formattedChart[0].price;
                    const currentPrice = data.currentPrice;
                    calculatedChangeValue = currentPrice - startPrice;
                    calculatedChangeRate = ((calculatedChangeValue / startPrice) * 100);
                }

                setStockInfo(prev => ({
                    ...prev,
                    name: data.companyName,
                    ticker: data.code || (data.sector ? data.sector.toUpperCase() : "STOCK"), 
                    price: data.currentPrice,
                    changeValue: calculatedChangeValue || 0,
                    changeRate: calculatedChangeRate || 0,
                    sector: data.sector,
                    totalShares: data.totalShares || 0,
                    desc: data.description || "상세 설명이 없습니다.",
                    riskMetrics: {
                        level: data.riskMetrics?.level || "MEDIUM",
                        score: data.riskMetrics?.score || 50,
                        volatility: data.riskMetrics?.volatility || "MEDIUM"
                    }
                }));
            }
        } catch (err) {
            console.error("상세 정보 조회 실패:", err);
        }
    };

    useEffect(() => {
        fetchCompanyDetail();
        fetchMyStatus();
    }, [companyName, token]);

    useEffect(() => {
        if (!client || !client.connected) return;

        const subscription = client.subscribe('/user/queue/trade-result', (message) => {
            if (message.body) {
                const result = JSON.parse(message.body);
                
                if (result.status === 'SUCCESS') {
                    alert(`거래가 체결되었습니다!`);
                    fetchCompanyDetail();
                    fetchMyStatus();    
                } else if (result.status === 'FAIL') {
                    alert(`거래 실패: ${result.message}`);
                }
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [client]);

    const handleQuantityChange = (delta) => {
        setQuantity(prev => Math.max(1, prev + delta));
    };

    const handleQuantityInput = (e) => {
        const val = e.target.value;
        if (val === '') { setQuantity(''); return; }
        const numVal = parseInt(val, 10);
        if (!isNaN(numVal) && numVal > 0) setQuantity(numVal);
    };
    const handleQuantityBlur = () => {
        if (quantity === '' || Number(quantity) < 1) setQuantity(1);
    };

    const handleTrade = async (type) => {
        if (!token) { alert("로그인이 필요합니다."); navigate('/login'); return; }
        const finalQty = Number(quantity) || 1;
        const actionName = type === 'buy' ? '매수' : '매도';
        const totalCost = stockInfo.price * finalQty;

        if (window.confirm(`${stockInfo.name} ${finalQty}주를 ${actionName}하시겠습니까?\n총 금액: ${totalCost.toLocaleString()}원`)) {
            try {
                const endpoint = type === 'buy' ? '/trade/buy' : '/trade/sell';
                await axios.post(`http://localhost:8080${endpoint}`, 
                    { companyName: stockInfo.name, quantity: finalQty, price: stockInfo.price },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } catch (err) {
                alert(`${actionName} 요청 실패: ${err.response?.data?.message || err.message}`);
            }
        }
    };

    const isPositive = stockInfo.changeRate >= 1.0;

    return (
        <div className="company-container">
            <div className="nav-bar">
                <button className="back-home-btn" onClick={() => navigate('/')}>
                    <span className="arrow-icon">←</span> Back to Home
                </button>
            </div>

            <div className="company-header">
                <div className="header-top">
                    <div className="company-info">
                        <span className="company-name">{stockInfo.name}</span>
                        <div className="company-meta">
                            <span className="company-ticker">{stockInfo.ticker}</span>
                        </div>
                    </div>
                    <div className="price-section">
                        <span className="current-price">{stockInfo.price.toLocaleString()}원</span>
                        <div className={`price-change-box ${isPositive ? 'up' : 'down'}`}>
                            <span className="change-value">
                                {stockInfo.changeValue > 0 ? '+' : ''}{Math.floor(stockInfo.changeValue).toLocaleString()}
                            </span>
                            <span className="change-percent">
                                ({stockInfo.changeRate > 0 ? '+' : ''}{stockInfo.changeRate.toFixed(2)}%)
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="content-grid">
                <div className="left-content">
                    <div className="chart-panel">
                        <span className="panel-title">Price History</span>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={isPositive ? "#10B981" : "#EF4444"} stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor={isPositive ? "#10B981" : "#EF4444"} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="time" tick={{fontSize: 12, fill: '#9CA3AF'}} axisLine={false} tickLine={false} />
                                    <YAxis domain={['auto', 'auto']} tick={{fontSize: 12, fill: '#9CA3AF'}} axisLine={false} tickLine={false} tickFormatter={(val) => val.toLocaleString()} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(val) => val.toLocaleString() + '원'} />
                                    <Area 
                                        type="monotone" 
                                        dataKey="price" 
                                        stroke={isPositive ? "#10B981" : "#EF4444"} 
                                        strokeWidth={2} 
                                        fillOpacity={1} 
                                        fill="url(#colorPrice)" 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="insights-panel">
                         <span className="panel-title">Company Insights</span>
                         <div className="insights-grid">
                            <div className="risk-section">
                                <div className="risk-header">
                                    <span className="risk-label">RISK LEVEL</span>
                                    <span className="risk-badge">{stockInfo.riskMetrics.level}</span>
                                </div>
                                <span className="risk-value">{stockInfo.riskMetrics.score} / 100</span>
                            </div>
                            <div className="insight-item">
                                <span className="insight-label">VOLATILITY</span>
                                <span className="insight-value">{stockInfo.riskMetrics.volatility}</span>
                                <div className="volatility-bar" />
                            </div>
                            <div className="insight-item">
                                <span className="insight-label">COMPANY DESCRIPTION</span>
                                <p className="insight-desc">{stockInfo.desc}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="right-sidebar">
                    <div className="action-panel">
                        <span className="panel-title">Trade</span>
                        
                        <div className="my-cash-section">
                            <div className="asset-row">
                                <span className="insight-label">AVAILABLE CASH</span>
                                <span className="cash-value">{myCash.toLocaleString()}원</span>
                            </div>
                            <div className="asset-row">
                                <span className="insight-label">MY SHARES</span>
                                <span className="share-value">{myShares.toLocaleString()}주</span>
                            </div>
                            <div className="asset-row">
                                <span className="insight-label">MARKET VOLUME</span>
                                <span className="share-value" style={{color: '#6B7280'}}>{stockInfo.totalShares.toLocaleString()}주</span>
                            </div>
                        </div>

                        <div className="quantity-section">
                            <span className="insight-label">QUANTITY</span>
                            <div className="quantity-input-wrapper">
                                <input 
                                    type="number" className="quantity-input" value={quantity}
                                    onChange={handleQuantityInput} onBlur={handleQuantityBlur} min="1"
                                />
                                <div className="quantity-controls">
                                    <button className="qty-btn" onClick={() => handleQuantityChange(-1)}>−</button>
                                    <button className="qty-btn" onClick={() => handleQuantityChange(1)}>+</button>
                                </div>
                            </div>
                        </div>
                        <div className="total-section">
                            <span className="total-label">Total Amount</span>
                            <span className="total-value">{(stockInfo.price * (Number(quantity) || 0)).toLocaleString()}원</span>
                        </div>
                        <div className="action-buttons">
                            <button className="trade-btn buy" onClick={() => handleTrade('buy')}>BUY</button>
                            <button className="trade-btn sell" onClick={() => handleTrade('sell')}>SELL</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompanyPage;