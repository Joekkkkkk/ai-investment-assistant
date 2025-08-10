// ==================== 📁 investment-assistant.js ====================
// 保存为：investment-assistant.js

class InvestmentAssistant {
    constructor() {
        this.apiKey = '';
        this.companyNames = {
            'AAPL': 'Apple Inc.',
            'GOOGL': 'Alphabet Inc.',
            'MSFT': 'Microsoft Corp.',
            'TSLA': 'Tesla Inc.',
            'AMZN': 'Amazon.com Inc.',
            'NVDA': 'NVIDIA Corp.',
            'META': 'Meta Platforms Inc.',
            'BRK.B': 'Berkshire Hathaway',
            'V': 'Visa Inc.',
            'JPM': 'JPMorgan Chase',
            'UNH': 'UnitedHealth Group',
            'HD': 'Home Depot',
            'PG': 'Procter & Gamble',
            'MA': 'Mastercard Inc.',
            'BAC': 'Bank of America'
        };
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // 风险偏好滑块
        document.getElementById('riskTolerance').oninput = (e) => {
            const value = e.target.value;
            const labels = {
                1: '极低风险', 2: '低风险', 3: '较低风险', 4: '中低风险', 5: '中等风险',
                6: '中高风险', 7: '较高风险', 8: '高风险', 9: '极高风险', 10: '激进风险'
            };
            document.getElementById('riskLabel').textContent = labels[value];
        };
    }

    // 获取股票数据 - 集成Tiingo API
    async fetchStockData(symbols, useApi = false) {
        const apiKey = document.getElementById('apiKey').value.trim();
        
        if (useApi && apiKey) {
            try {
                const promises = symbols.map(async symbol => {
                    // 获取价格数据
                    const priceResponse = await fetch(`https://api.tiingo.com/tiingo/daily/${symbol}/prices?startDate=2023-01-01&endDate=2024-12-31&token=${apiKey}`);
                    const priceData = await priceResponse.json();
                    
                    // 计算收益率
                    const returns = [];
                    for (let i = 1; i < priceData.length; i++) {
                        const dailyReturn = (priceData[i].adjClose - priceData[i-1].adjClose) / priceData[i-1].adjClose;
                        returns.push(dailyReturn);
                    }
                    
                    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
                    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
                    const volatility = Math.sqrt(variance * 252); // 年化波动率
                    
                    return {
                        symbol: symbol,
                        price: priceData[priceData.length - 1].adjClose,
                        returns: returns,
                        volatility: volatility,
                        expectedReturn: avgReturn * 252, // 年化收益率
                        currentPrice: priceData[priceData.length - 1].adjClose
                    };
                });
                
                return Promise.all(promises);
            } catch (error) {
                console.error('API调用失败，使用模拟数据:', error);
                return this.generateMockData(symbols);
            }
        } else {
            return this.generateMockData(symbols);
        }
    }

    // 生成模拟数据
    generateMockData(symbols) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const data = symbols.map(symbol => {
                    // 为不同股票设置不同的特性
                    const baseVolatility = symbol === 'TSLA' ? 0.4 : symbol === 'AAPL' ? 0.25 : 0.3;
                    const baseReturn = symbol === 'NVDA' ? 0.15 : symbol === 'GOOGL' ? 0.12 : 0.1;
                    
                    const returns = Array.from({length: 252}, () => {
                        // 使用更真实的收益率分布
                        const random1 = Math.random();
                        const random2 = Math.random();
                        const normalRandom = Math.sqrt(-2 * Math.log(random1)) * Math.cos(2 * Math.PI * random2);
                        return (normalRandom * baseVolatility / Math.sqrt(252)) + (baseReturn / 252);
                    });

                    return {
                        symbol: symbol,
                        price: Math.random() * 300 + 50,
                        returns: returns,
                        volatility: baseVolatility,
                        expectedReturn: baseReturn + (Math.random() - 0.5) * 0.05,
                        currentPrice: Math.random() * 300 + 50
                    };
                });
                resolve(data);
            }, 2000);
        });
    }

    // 现代投资组合理论 - 均值方差优化
    optimizePortfolio(stockData, riskTolerance) {
        const n = stockData.length;
        const returns = stockData.map(stock => stock.expectedReturn);
        const volatilities = stockData.map(stock => stock.volatility);
        
        // 构建协方差矩阵 (简化版)
        const covMatrix = this.buildCovarianceMatrix(stockData);
        
        // 根据风险偏好调整目标函数
        const riskAversion = (11 - riskTolerance) / 10; // 转换为风险厌恶系数
        
        // 使用简化的均值方差优化
        const weights = this.meanVarianceOptimization(returns, covMatrix, riskAversion);
        
        // 确保权重和为1且非负
        return this.normalizeWeights(weights);
    }

    // 构建协方差矩阵
    buildCovarianceMatrix(stockData) {
        const n = stockData.length;
        const matrix = Array(n).fill().map(() => Array(n).fill(0));
        
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) {
                    matrix[i][j] = Math.pow(stockData[i].volatility, 2);
                } else {
                    // 简化的相关性假设
                    const correlation = 0.3; // 假设股票间相关性为0.3
                    matrix[i][j] = correlation * stockData[i].volatility * stockData[j].volatility;
                }
            }
        }
        return matrix;
    }

    // 均值方差优化算法
    meanVarianceOptimization(returns, covMatrix, riskAversion) {
        const n = returns.length;
        const weights = new Array(n);
        
        // 简化的优化算法 - 基于收益风险比
        let totalScore = 0;
        const scores = returns.map((ret, i) => {
            const risk = Math.sqrt(covMatrix[i][i]);
            const score = Math.max(0, ret / risk - riskAversion * risk);
            totalScore += score;
            return score;
        });
        
        // 如果所有得分都为0，使用等权重
        if (totalScore === 0) {
            return new Array(n).fill(1 / n);
        }
        
        // 计算权重
        for (let i = 0; i < n; i++) {
            weights[i] = scores[i] / totalScore;
        }
        
        return weights;
    }

    // 权重归一化
    normalizeWeights(weights) {
        const sum = weights.reduce((a, b) => a + b, 0);
        return sum > 0 ? weights.map(w => w / sum) : weights.map(() => 1 / weights.length);
    }

    // 蒙特卡洛回测
    backtestPortfolio(stockData, weights) {
        const days = 252; // 一年交易日
        const portfolioReturns = [];
        let cumulativeReturn = 1;
        const dailyValues = [100]; // 起始值100
        
        // 生成投资组合每日收益
        for (let day = 0; day < days; day++) {
            let dailyReturn = 0;
            for (let i = 0; i < stockData.length; i++) {
                dailyReturn += weights[i] * stockData[i].returns[day];
            }
            portfolioReturns.push(dailyReturn);
            cumulativeReturn *= (1 + dailyReturn);
            dailyValues.push(dailyValues[dailyValues.length - 1] * (1 + dailyReturn));
        }
        
        // 计算关键绩效指标
        const metrics = this.calculatePerformanceMetrics(portfolioReturns, dailyValues);
        
        return {
            ...metrics,
            portfolioReturns: portfolioReturns,
            dailyValues: dailyValues
        };
    }

    // 计算绩效指标
    calculatePerformanceMetrics(portfolioReturns, dailyValues) {
        const totalReturn = ((dailyValues[dailyValues.length - 1] / dailyValues[0]) - 1) * 100;
        
        // 年化收益率
        const avgReturn = portfolioReturns.reduce((a, b) => a + b, 0) / portfolioReturns.length;
        const annualizedReturn = avgReturn * 252;
        
        // 波动率
        const variance = portfolioReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / portfolioReturns.length;
        const volatility = Math.sqrt(variance * 252) * 100;
        
        // 夏普比率 (假设无风险利率为2%)
        const riskFreeRate = 0.02;
        const sharpeRatio = (annualizedReturn - riskFreeRate) / (volatility / 100);
        
        // 最大回撤
        const maxDrawdown = this.calculateMaxDrawdown(dailyValues);
        
        // Sortino比率
        const downsideReturns = portfolioReturns.filter(r => r < 0);
        const downsideVolatility = downsideReturns.length > 0 ? 
            Math.sqrt(downsideReturns.reduce((sum, r) => sum + r * r, 0) / downsideReturns.length * 252) : 0;
        const sortinoRatio = downsideVolatility > 0 ? (annualizedReturn - riskFreeRate) / downsideVolatility : 0;
        
        return {
            totalReturn,
            annualizedReturn: annualizedReturn * 100,
            volatility,
            sharpeRatio,
            sortinoRatio,
            maxDrawdown: maxDrawdown * 100,
            winRate: (portfolioReturns.filter(r => r > 0).length / portfolioReturns.length) * 100
        };
    }

    // 计算最大回撤
    calculateMaxDrawdown(values) {
        let maxDrawdown = 0;
        let peak = values[0];
        
        for (const value of values) {
            if (value > peak) peak = value;
            const drawdown = (peak - value) / peak;
            if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        }
        
        return maxDrawdown;
    }

    // AI投资建议生成
    generateAIRecommendations(stockData, weights, backtest, riskTolerance) {
        const recommendations = [];
        
        // 基于夏普比率的建议
        if (backtest.sharpeRatio > 1.5) {
            recommendations.push({
                title: "🎯 优秀的风险调整收益",
                content: `您的投资组合夏普比率为${backtest.sharpeRatio.toFixed(2)}，表现优异。这意味着每承担1单位风险，您获得了${backtest.sharpeRatio.toFixed(2)}单位的超额收益。建议继续持有当前配置。`,
                priority: 'high'
            });
        } else if (backtest.sharpeRatio < 0.5) {
            recommendations.push({
                title: "⚠️ 需要优化风险收益比",
                content: `当前夏普比率为${backtest.sharpeRatio.toFixed(2)}，相对较低。建议考虑调整资产配置，增加高质量股票的权重，或者添加一些防御性资产。`,
                priority: 'medium'
            });
        }

        // 基于最大回撤的建议
        if (backtest.maxDrawdown > 25) {
            recommendations.push({
                title: "🛡️ 关注下行风险保护",
                content: `最大回撤达到${backtest.maxDrawdown.toFixed(1)}%，建议增加防御性资产配置，如优质债券ETF或低波动股票，以降低组合的整体风险。`,
                priority: 'high'
            });
        }

        // 基于集中度的建议
        const maxWeight = Math.max(...weights);
        const maxWeightIndex = weights.indexOf(maxWeight);
        const concentration = weights.filter(w => w > 0.2).length;
        
        if (maxWeight > 0.4) {
            recommendations.push({
                title: "📊 优化资产配置集中度",
                content: `${stockData[maxWeightIndex].symbol}占比过高(${(maxWeight*100).toFixed(1)}%)，建议将单一资产权重控制在30%以内，进一步分散投资以降低特定风险。`,
                priority: 'medium'
            });
        }

        // 基于波动率的建议
        if (backtest.volatility > 25) {
            recommendations.push({
                title: "📈 管理投资组合波动性",
                content: `年化波动率为${backtest.volatility.toFixed(1)}%，相对较高。如果您希望降低波动性，可以考虑加入一些稳定性较强的大盘股或公用事业股票。`,
                priority: 'low'
            });
        }

        // 基于风险偏好的个性化建议
        if (riskTolerance <= 3) {
            recommendations.push({
                title: "🎯 保守型投资策略优化",
                content: "基于您的低风险偏好，建议采用定期定额投资策略，重点关注分红稳定的蓝筹股，同时考虑加入10-20%的债券ETF以进一步降低波动性。",
                priority: 'high'
            });
        } else if (riskTolerance >= 8) {
            recommendations.push({
                title: "🚀 积极型投资策略建议",
                content: "您的高风险偏好适合积极的成长型投资策略。可以适当提高科技股和新兴行业的配置，但请设置止损点并密切关注市场趋势变化。",
                priority: 'high'
            });
        }

        // 基于胜率的建议
        if (backtest.winRate < 45) {
            recommendations.push({
                title: "📊 提升策略胜率",
                content: `当前策略胜率为${backtest.winRate.toFixed(1)}%，建议考虑加入技术分析指标或基本面筛选条件，以提高投资决策的准确性。`,
                priority: 'medium'
            });
        }

        return recommendations;
    }

    // 创建收益曲线图表
    createPerformanceChart(dailyValues) {
        const ctx = document.getElementById('performanceChart').getContext('2d');
        
        // 生成日期标签
        const dates = [];
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        
        for (let i = 0; i < dailyValues.length; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            dates.push(date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }));
        }
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates.filter((_, index) => index % 15 === 0),
                datasets: [{
                    label: '投资组合价值 (%)',
                    data: dailyValues.filter((_, index) => index % 15 === 0),
                    borderColor: 'rgb(102, 126, 234)',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `投资组合价值: ${context.parsed.y.toFixed(2)}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(0) + '%';
                            }
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        }
                    },
                    x: {
                        ticks: {
                            maxTicksLimit: 8
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    // 显示分析结果
    displayResults(stockData, weights, backtest, recommendations, investment) {
        // 更新关键指标
        document.getElementById('totalReturn').textContent = backtest.totalReturn >= 0 ? 
            `+${backtest.totalReturn.toFixed(2)}%` : `${backtest.totalReturn.toFixed(2)}%`;
        document.getElementById('sharpeRatio').textContent = backtest.sharpeRatio.toFixed(2);
        document.getElementById('maxDrawdown').textContent = `-${backtest.maxDrawdown.toFixed(2)}%`;
        document.getElementById('volatility').textContent = `${backtest.volatility.toFixed(1)}%`;
        
        // 创建图表
        this.createPerformanceChart(backtest.dailyValues);
        
        // 显示投资建议
        this.displayRecommendations(recommendations);
        
        // 显示投资组合配置表
        this.displayPortfolioTable(stockData, weights, investment);
        
        // 显示仪表盘
        document.getElementById('dashboard').style.display = 'grid';
        document.getElementById('recommendations').style.display = 'block';
    }

    // 显示投资建议
    displayRecommendations(recommendations) {
        const recommendationsList = document.getElementById('recommendationsList');
        recommendationsList.innerHTML = '';
        
        // 按优先级排序
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        recommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
        
        recommendations.forEach(rec => {
            const div = document.createElement('div');
            div.className = 'recommendation-item';
            div.innerHTML = `
                <h4>${rec.title}</h4>
                <p>${rec.content}</p>
            `;
            recommendationsList.appendChild(div);
        });
    }

    // 显示投资组合表格
    displayPortfolioTable(stockData, weights, investment) {
        const portfolioBody = document.getElementById('portfolioBody');
        portfolioBody.innerHTML = '';
        
        stockData.forEach((stock, index) => {
            const weight = weights[index];
            const allocation = investment * weight;
            const expectedReturn = stock.expectedReturn * 100;
            
            // 根据波动率确定风险等级
            const getRiskLevel = (volatility) => {
                if (volatility < 0.15) return { text: '低', color: '#4CAF50' };
                if (volatility < 0.25) return { text: '中', color: '#FFC107' };
                if (volatility < 0.35) return { text: '高', color: '#FF9800' };
                return { text: '极高', color: '#F44336' };
            };
            
            const riskLevel = getRiskLevel(stock.volatility);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${stock.symbol}</strong></td>
                <td>${this.companyNames[stock.symbol] || '未知公司'}</td>
                <td><strong>${(weight * 100).toFixed(1)}%</strong></td>
                <td>${allocation.toLocaleString('en-US', {maximumFractionDigits: 0})}</td>
                <td style="color: ${expectedReturn >= 0 ? '#4CAF50' : '#F44336'}">${expectedReturn.toFixed(1)}%</td>
                <td><span style="background-color: ${riskLevel.color}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${riskLevel.text}</span></td>
            `;
            portfolioBody.appendChild(row);
        });
    }

    // 主分析函数
    async startAnalysis() {
        const stockPool = document.getElementById('stockPool').value.trim();
        const investment = parseFloat(document.getElementById('investment').value);
        const riskTolerance = parseInt(document.getElementById('riskTolerance').value);
        const apiKey = document.getElementById('apiKey').value.trim();
        
        if (!stockPool || !investment || investment <= 0) {
            alert('请填写有效的股票池和投资金额');
            return;
        }
        
        const symbols = stockPool.split(',').map(s => s.trim().toUpperCase()).filter(s => s.length > 0);
        
        if (symbols.length < 2) {
            alert('请至少输入2只股票进行分析');
            return;
        }
        
        // 禁用按钮并显示加载状态
        const analyzeBtn = document.querySelector('.analyze-btn');
        analyzeBtn.disabled = true;
        analyzeBtn.textContent = '分析中...';
        
        document.getElementById('loading').style.display = 'block';
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('recommendations').style.display = 'none';
        
        try {
            // 1. 获取股票数据
            const stockData = await this.fetchStockData(symbols, !!apiKey);
            
            // 2. 投资组合优化
            const weights = this.optimizePortfolio(stockData, riskTolerance);
            
            // 3. 回测分析
            const backtest = this.backtestPortfolio(stockData, weights);
            
            // 4. 生成AI建议
            const recommendations = this.generateAIRecommendations(stockData, weights, backtest, riskTolerance);
            
            // 隐藏加载状态
            document.getElementById('loading').style.display = 'none';
            
            // 显示结果
            this.displayResults(stockData, weights, backtest, recommendations, investment);
            
        } catch (error) {
            console.error('分析过程中出现错误:', error);
            document.getElementById('loading').style.display = 'none';
            alert('分析过程中出现错误，请检查网络连接或API密钥后重试');
        } finally {
            // 重新启用按钮
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = '🚀 开始AI分析';
        }
    }
}

// 全局变量和初始化
let investmentAssistant;

// 页面加载完成后初始化
window.onload = function() {
    investmentAssistant = new InvestmentAssistant();
    document.getElementById('riskLabel').textContent = '中等风险';
};

// 全局函数，供HTML调用
function startAnalysis() {
    if (investmentAssistant) {
        investmentAssistant.startAnalysis();
    }
}