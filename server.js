// ==================== 📁 server.js ====================
// 保存为：server.js

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Tiingo API配置
const TIINGO_BASE_URL = 'https://api.tiingo.com';
const TIINGO_API_KEY = process.env.TIINGO_API_KEY;

// 获取股票历史数据
app.post('/api/stock-data', async (req, res) => {
    try {
        const { symbols, apiKey, startDate, endDate } = req.body;
        
        if (!symbols) {
            return res.status(400).json({ error: '缺少股票代码' });
        }

        const useApiKey = apiKey || TIINGO_API_KEY;
        
        if (!useApiKey) {
            return res.status(400).json({ error: '缺少API密钥' });
        }

        const stockDataPromises = symbols.map(async (symbol) => {
            try {
                // 获取历史价格数据
                const priceResponse = await axios.get(
                    `${TIINGO_BASE_URL}/tiingo/daily/${symbol}/prices`,
                    {
                        params: {
                            startDate: startDate || '2023-01-01',
                            endDate: endDate || new Date().toISOString().split('T')[0],
                            token: useApiKey
                        }
                    }
                );

                const priceData = priceResponse.data;
                
                if (!priceData || priceData.length === 0) {
                    throw new Error(`No data found for ${symbol}`);
                }

                // 计算收益率
                const returns = [];
                for (let i = 1; i < priceData.length; i++) {
                    const dailyReturn = (priceData[i].adjClose - priceData[i-1].adjClose) / priceData[i-1].adjClose;
                    returns.push(dailyReturn);
                }

                // 计算统计指标
                const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
                const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
                const volatility = Math.sqrt(variance * 252); // 年化波动率
                const expectedReturn = avgReturn * 252; // 年化收益率

                return {
                    symbol: symbol,
                    price: priceData[priceData.length - 1].adjClose,
                    returns: returns,
                    volatility: volatility,
                    expectedReturn: expectedReturn,
                    currentPrice: priceData[priceData.length - 1].adjClose,
                    dataPoints: priceData.length
                };

            } catch (error) {
                console.error(`Error fetching data for ${symbol}:`, error.message);
                // 返回模拟数据作为fallback
                return {
                    symbol: symbol,
                    price: Math.random() * 300 + 50,
                    returns: Array.from({length: 252}, () => (Math.random() - 0.5) * 0.1),
                    volatility: Math.random() * 0.3 + 0.15,
                    expectedReturn: Math.random() * 0.15 + 0.05,
                    currentPrice: Math.random() * 300 + 50,
                    isSimulated: true
                };
            }
        });

        const stockData = await Promise.all(stockDataPromises);
        res.json({ success: true, data: stockData });

    } catch (error) {
        console.error('API错误:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 获取股票基本信息
app.get('/api/stock-info/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const { apiKey } = req.query;

        const useApiKey = apiKey || TIINGO_API_KEY;

        if (!useApiKey) {
            return res.status(400).json({ error: '缺少API密钥' });
        }

        const response = await axios.get(
            `${TIINGO_BASE_URL}/tiingo/daily/${symbol}`,
            {
                params: { token: useApiKey }
            }
        );

        res.json({ success: true, data: response.data });

    } catch (error) {
        console.error('获取股票信息错误:', error);
        res.status(500).json({ error: '无法获取股票信息' });
    }
});

// 投资组合优化API
app.post('/api/optimize-portfolio', async (req, res) => {
    try {
        const { stockData, riskTolerance, constraints } = req.body;

        if (!stockData || !Array.isArray(stockData)) {
            return res.status(400).json({ error: '无效的股票数据' });
        }

        // 这里可以集成更复杂的优化算法
        const weights = optimizePortfolioAdvanced(stockData, riskTolerance, constraints);
        
        res.json({ success: true, weights: weights });

    } catch (error) {
        console.error('组合优化错误:', error);
        res.status(500).json({ error: '投资组合优化失败' });
    }
});

// 高级投资组合优化函数
function optimizePortfolioAdvanced(stockData, riskTolerance, constraints = {}) {
    const n = stockData.length;
    const returns = stockData.map(stock => stock.expectedReturn);
    const volatilities = stockData.map(stock => stock.volatility);
    
    // 构建协方差矩阵
    const covMatrix = buildCovarianceMatrix(stockData);
    
    // 风险厌恶系数
    const riskAversion = (11 - riskTolerance) / 10;
    
    // 约束条件
    const maxWeight = constraints.maxWeight || 0.4;
    const minWeight = constraints.minWeight || 0.01;
    
    // 使用梯度下降或其他优化算法
    const weights = meanVarianceOptimization(returns, covMatrix, riskAversion, maxWeight, minWeight);
    
    return normalizeWeights(weights);
}

function buildCovarianceMatrix(stockData) {
    const n = stockData.length;
    const matrix = Array(n).fill().map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (i === j) {
                matrix[i][j] = Math.pow(stockData[i].volatility, 2);
            } else {
                // 可以使用历史数据计算真实相关性
                const correlation = calculateCorrelation(stockData[i].returns, stockData[j].returns);
                matrix[i][j] = correlation * stockData[i].volatility * stockData[j].volatility;
            }
        }
    }
    return matrix;
}

function calculateCorrelation(returns1, returns2) {
    if (!returns1 || !returns2 || returns1.length !== returns2.length) {
        return 0.3; // 默认相关性
    }
    
    const n = returns1.length;
    const mean1 = returns1.reduce((a, b) => a + b, 0) / n;
    const mean2 = returns2.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let sum1 = 0;
    let sum2 = 0;
    
    for (let i = 0; i < n; i++) {
        const diff1 = returns1[i] - mean1;
        const diff2 = returns2[i] - mean2;
        numerator += diff1 * diff2;
        sum1 += diff1 * diff1;
        sum2 += diff2 * diff2;
    }
    
    const denominator = Math.sqrt(sum1 * sum2);
    return denominator === 0 ? 0 : numerator / denominator;
}

function meanVarianceOptimization(returns, covMatrix, riskAversion, maxWeight, minWeight) {
    const n = returns.length;
    let weights = new Array(n).fill(1 / n); // 初始等权重
    
    // 简化的梯度下降优化
    const learningRate = 0.01;
    const iterations = 1000;
    
    for (let iter = 0; iter < iterations; iter++) {
        // 计算梯度
        const gradient = calculateGradient(weights, returns, covMatrix, riskAversion);
        
        // 更新权重
        for (let i = 0; i < n; i++) {
            weights[i] += learningRate * gradient[i];
            // 应用约束
            weights[i] = Math.max(minWeight, Math.min(maxWeight, weights[i]));
        }
        
        // 归一化
        weights = normalizeWeights(weights);
    }
    
    return weights;
}

function calculateGradient(weights, returns, covMatrix, riskAversion) {
    const n = weights.length;
    const gradient = new Array(n);
    
    for (let i = 0; i < n; i++) {
        // 收益梯度
        let returnGradient = returns[i];
        
        // 风险梯度
        let riskGradient = 0;
        for (let j = 0; j < n; j++) {
            riskGradient += 2 * riskAversion * weights[j] * covMatrix[i][j];
        }
        
        gradient[i] = returnGradient - riskGradient;
    }
    
    return gradient;
}

function normalizeWeights(weights) {
    const sum = weights.reduce((a, b) => a + b, 0);
    return sum > 0 ? weights.map(w => w / sum) : weights.map(() => 1 / weights.length);
}

// 根路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 AI投资策略助手服务器启动在端口 ${PORT}`);
    console.log(`访问地址: http://localhost:${PORT}`);
});