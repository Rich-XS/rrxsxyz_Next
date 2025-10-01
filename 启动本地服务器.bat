@echo off
echo 启动本地HTTP服务器...
echo 请确保已安装Python
echo.
echo 选择一个选项:
echo 1. Python 3 (推荐)
echo 2. Python 2
echo 3. Node.js (如果已安装)
echo.
choice /c 123 /m "请选择服务器类型"

if %errorlevel%==1 (
    echo 使用Python 3启动服务器...
    cd /d "D:\OneDrive_RRXS\OneDrive\_AIGPT\VSCode\100W\rrxsxyz_next\html\projects"
    python -m http.server 8080
)

if %errorlevel%==2 (
    echo 使用Python 2启动服务器...
    cd /d "D:\OneDrive_RRXS\OneDrive\_AIGPT\VSCode\100W\rrxsxyz_next\html\projects"
    python -m SimpleHTTPServer 8080
)

if %errorlevel%==3 (
    echo 使用Node.js启动服务器...
    cd /d "D:\OneDrive_RRXS\OneDrive\_AIGPT\VSCode\100W\rrxsxyz_next\html\projects"
    npx http-server -p 8080
)

echo.
echo 服务器启动完成！
echo 请在浏览器中访问: http://localhost:8080/media-assessment-v4.html
echo 按任意键关闭服务器...
pause