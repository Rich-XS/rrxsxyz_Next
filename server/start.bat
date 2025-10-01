@echo off
chcp 65001 >nul

REM 快速启动脚本 - 百万被动收入之路后端服务

echo 🚀 正在启动百万被动收入之路后端服务...
echo.

REM 检查Node.js环境
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误：未找到Node.js，请先安装Node.js
    echo    下载地址：https://nodejs.org/
    pause
    exit /b 1
)

for /f %%i in ('node --version') do set nodeversion=%%i
echo ✅ Node.js版本: %nodeversion%

REM 进入服务器目录
if not exist "server" (
    echo ❌ 错误：未找到server目录
    pause
    exit /b 1
)

cd server

REM 检查package.json
if not exist "package.json" (
    echo ❌ 错误：未找到package.json文件
    pause
    exit /b 1
)

REM 安装依赖
if not exist "node_modules" (
    echo 📦 正在安装依赖包...
    npm install
    if errorlevel 1 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
) else (
    echo 📦 依赖包已存在
)

REM 检查环境变量文件
if not exist ".env" (
    echo ⚙️ 创建环境变量文件...
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo ✅ 已复制.env.example为.env
        echo ⚠️  请编辑.env文件，填入真实的API密钥和邮箱配置
        echo.
        echo 📧 邮件配置推荐（免费方案）：
        echo    - QQ邮箱：EMAIL_SERVICE=qq
        echo    - 163邮箱：EMAIL_SERVICE=163
        echo.
        echo 🤖 AI服务密钥：
        echo    - Qwen：QWEN_API_KEY=your_qwen_key
        echo    - DeepSeek：DEEPSEEK_API_KEY=your_deepseek_key
        echo.
        pause
    ) else (
        echo ❌ 错误：未找到.env.example文件
        pause
        exit /b 1
    )
)

echo.
echo 🚀 启动后端服务器...
echo 📡 服务地址：http://localhost:3000
echo 🔗 健康检查：http://localhost:3000/health
echo.
echo 💡 使用说明：
echo    1. 确保.env文件已正确配置
echo    2. 打开前端HTML文件开始测试
echo    3. 查看控制台日志了解运行状态
echo.
echo 按Ctrl+C停止服务器
echo ================================

REM 启动服务器
npm run dev