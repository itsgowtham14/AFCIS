# Stack Hack - Quick Start Guide

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Stack Hack - Academic Feedback System" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Check if MongoDB is running
Write-Host "Checking MongoDB..." -ForegroundColor Yellow
$mongoProcess = Get-Process -Name "mongod" -ErrorAction SilentlyContinue
if ($null -eq $mongoProcess) {
    Write-Host "WARNING: MongoDB is not running!" -ForegroundColor Red
    Write-Host "Please start MongoDB before continuing.`n" -ForegroundColor Red
    Write-Host "To start MongoDB, run: mongod`n" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit
    }
} else {
    Write-Host "✓ MongoDB is running`n" -ForegroundColor Green
}

# Backend setup
Write-Host "Setting up backend..." -ForegroundColor Yellow
Set-Location backend

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "`nSeeding database with sample data..." -ForegroundColor Yellow
npm run seed

Write-Host "`nStarting backend server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Frontend setup
Set-Location ..
Write-Host "`nSetting up frontend..." -ForegroundColor Yellow

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "`nStarting frontend server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm start"

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "Application is starting!" -ForegroundColor Green
Write-Host "================================`n" -ForegroundColor Cyan

Write-Host "Backend: http://localhost:5000" -ForegroundColor White
Write-Host "Frontend: http://localhost:3000`n" -ForegroundColor White

Write-Host "Sample Login Credentials:" -ForegroundColor Yellow
Write-Host "-------------------------" -ForegroundColor Yellow
Write-Host "Student:    alice.johnson@student.edu / student123" -ForegroundColor White
Write-Host "Faculty:    john.smith@university.edu / faculty123" -ForegroundColor White
Write-Host "Dept Admin: dept.cs@university.edu / dept123" -ForegroundColor White
Write-Host "Admin:      admin@university.edu / admin123`n" -ForegroundColor White

Write-Host "Press any key to exit this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
