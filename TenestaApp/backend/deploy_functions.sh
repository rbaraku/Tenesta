#!/bin/bash
# Tenesta API Functions Deployment Script
# This script deploys all API functions to Supabase Edge Functions

echo "🚀 DEPLOYING TENESTA API FUNCTIONS"
echo "====================================="

# Check if Supabase CLI is installed
echo "📋 Checking Supabase CLI installation..."
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    echo ""
    echo "Or download from: https://supabase.com/docs/guides/cli"
    exit 1
fi

supabase --version
echo ""

echo "🔧 Starting deployment..."
echo ""

# Function to deploy with error checking
deploy_function() {
    local function_name=$1
    echo "Deploying $function_name..."
    if supabase functions deploy "$function_name" --project-ref skjaxjaawqvjjhyxnxls; then
        echo "✅ $function_name deployed successfully"
    else
        echo "❌ Failed to deploy $function_name"
        return 1
    fi
    echo ""
}

# Deploy each function
deploy_function "tenant-dashboard"
deploy_function "landlord-dashboard"
deploy_function "property-management"
deploy_function "maintenance-requests"
deploy_function "household-management"
deploy_function "support-tickets"
deploy_function "dispute-management"
deploy_function "payment-process"

echo "✅ Deployment complete!"
echo ""
echo "🧪 Next steps:"
echo "1. Run: node run_basic_tests.js"
echo "2. Create test users in your database"
echo "3. Run: node validate_apis_with_database.js"
echo ""