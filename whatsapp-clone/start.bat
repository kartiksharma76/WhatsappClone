@echo off
echo ==========================================
echo    Building and Running Whatsapp Clone
echo ==========================================

echo.
echo [1/2] Building Frontend (React/Vite)...
echo.
cd frontend
call npm install
call npm run build
echo.
echo Copying frontend build to backend static folder...
if exist "..\backend\src\main\resources\static" rmdir /s /q "..\backend\src\main\resources\static"
mkdir "..\backend\src\main\resources\static"
xcopy /e /y "dist\*" "..\backend\src\main\resources\static\"
cd ..

echo.
echo [2/2] Starting Backend (Spring Boot)...
echo.
echo Note: If 'mvn' is not recognized, please run the backend directly from your IDE (IntelliJ/Eclipse).
echo The backend will now serve BOTH the API and the React Frontend on http://localhost:8080
echo.
cd backend
call mvn spring-boot:run

echo Done!
