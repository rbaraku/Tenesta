@echo off
REM Tenesta API Functions Deployment Script
REM This script deploys all API functions to Supabase Edge Functions

echo 🚀 DEPLOYING TENESTA API FUNCTIONS
echo =====================================

echo 📋 Checking Supabase CLI installation...
supabase --version
if %errorlevel% neq 0 (
    echo ❌ Supabase CLI not found. Please install it first:
    echo npm install -g supabase
    echo.
    echo Or download from: https://supabase.com/docs/guides/cli
    pause
    exit /b 1
)

echo.
echo 🔧 Starting deployment...
echo.

REM Deploy each function
echo Deploying tenant-dashboard...
supabase functions deploy tenant-dashboard --project-ref skjaxjaawqvjjhyxnxls
if %errorlevel% neq 0 echo ❌ Failed to deploy tenant-dashboard

echo.
echo Deploying landlord-dashboard...
supabase functions deploy landlord-dashboard --project-ref skjaxjaawqvjjhyxnxls
if %errorlevel% neq 0 echo ❌ Failed to deploy landlord-dashboard

echo.
echo Deploying property-management...
supabase functions deploy property-management --project-ref skjaxjaawqvjjhyxnxls
if %errorlevel% neq 0 echo ❌ Failed to deploy property-management

echo.
echo Deploying maintenance-requests...
supabase functions deploy maintenance-requests --project-ref skjaxjaawqvjjhyxnxls
if %errorlevel% neq 0 echo ❌ Failed to deploy maintenance-requests

echo.
echo Deploying household-management...
supabase functions deploy household-management --project-ref skjaxjaawqvjjhyxnxls
if %errorlevel% neq 0 echo ❌ Failed to deploy household-management

echo.
echo Deploying support-tickets...
supabase functions deploy support-tickets --project-ref skjaxjaawqvjjhyxnxls
if %errorlevel% neq 0 echo ❌ Failed to deploy support-tickets

echo.
echo Deploying dispute-management...
supabase functions deploy dispute-management --project-ref skjaxjaawqvjjhyxnxls
if %errorlevel% neq 0 echo ❌ Failed to deploy dispute-management

echo.
echo Deploying payment-process...
supabase functions deploy payment-process --project-ref skjaxjaawqvjjhyxnxls
if %errorlevel% neq 0 echo ❌ Failed to deploy payment-process

echo.
echo ✅ Deployment complete!
echo.
echo 🧪 Next steps:
echo 1. Run: node run_basic_tests.js
echo 2. Create test users in your database
echo 3. Run: node validate_apis_with_database.js
echo.
pause