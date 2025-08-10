# 🤖 AI投资策略助手

基于机器学习的智能投资组合优化系统，集成Tiingo API提供实时股票数据分析。

## ✨ 主要功能

- 📊 **智能投资组合优化**: 基于现代投资组合理论的均值方差优化
- 📈 **实时数据分析**: 集成Tiingo API获取最新股票数据
- 🎯 **AI投资建议**: 基于回测结果生成个性化投资策略
- 📱 **响应式界面**: 现代化Web界面，支持移动设备
- 🔍 **风险管理**: 详细的风险指标分析和建议

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone <your-repo-url>
cd ai-investment-assistant
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量
创建 `.env` 文件并添加你的API密钥:
```env
TIINGO_API_KEY=你的Tiingo_API密钥
PORT=3000
NODE_ENV=development
```

### 4. 启动服务器
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### 5. 访问应用
打开浏览器访问: `http://localhost:3000`

## 📁 项目结构

```
ai-investment-assistant/
├── index.html                  # 主页面
├── investment-assistant.js     # 前端JavaScript逻辑
├── server.js                   # Node.js后端服务器
├── package.json               # 项目配置
├── .env                       # 环境变量
├── .gitignore                 # Git忽略文件
└── README.md                  # 项目文档
```

## 🔧 API接口

### 获取股票数据
```http
POST /api/stock-data
Content-Type: application/json

{
  "symbols": ["AAPL", "GOOGL"],
  "apiKey": "your_api_key",
  "startDate": "2023-01-01",
  "endDate": "2024-12-31"
}
```

### 投资组合优化
```http
POST /api/optimize-portfolio
Content-Type: application/json

{
  "stockData": [...],
  "riskTolerance": 5,
  "constraints": {
    "maxWeight": 0.4,
    "minWeight": 0.01
  }
}
```

## 🎯 技术栈

- **前端**: HTML5, CSS3, JavaScript ES6+, Chart.js
- **后端**: Node.js, Express.js
- **数据源**: Tiingo Financial Data API
- **算法**: 现代投资组合理论, 蒙特卡洛模拟

## 📊 核心算法

### 均值方差优化
实现马科维茨的现代投资组合理论，在给定风险水平下最大化收益。

### 风险指标计算
- 夏普比率 (Sharpe Ratio)
- 最大回撤 (Maximum Drawdown)
- 索提诺比率 (Sortino Ratio)
- 年化波动率 (Annualized Volatility)

## 🔒 安全说明

- API密钥通过环境变量管理
- 支持HTTPS部署
- 输入验证和错误处理
- 不存储用户敏感信息

## 🚀 部署指南

### Vercel部署
```bash
npm install -g vercel
vercel
```

### Heroku部署
```bash
git init
git add .
git commit -m "Initial commit"
heroku create your-app-name
heroku config:set TIINGO_API_KEY=你的API密钥
git push heroku main
```

### Railway部署
1. 连接GitHub仓库
2. 在环境变量中设置 `TIINGO_API_KEY`
3. 自动部署

## 📝 使用说明

1. **获取API密钥**: 在 [Tiingo官网](https://tiingo.com) 注册并获取免费API密钥
2. **输入股票池**: 如 AAPL,GOOGL,MSFT,TSLA,AMZN
3. **设置参数**: 投资金额和风险偏好
4. **开始分析**: 点击按钮获取AI投资建议

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📞 联系方式

如有问题，请通过GitHub Issues联系。

## 📄 许可证

MIT License - 详见 LICENSE 文件
