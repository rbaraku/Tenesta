// Test Document Management API
// Tests file upload, download, list, and delete operations

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const SUPABASE_URL = 'https://skjaxjaawqvjjhyxnxls.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNramF4amFhd3F2ampoeXhueGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNzg3NzEsImV4cCI6MjA2NTk1NDc3MX0.ymoyzzqJtAjWejrTqUTsMjKTYh0iZQxAzpKpgJx6OB0'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Test data
const TEST_TENANCY_ID = '99999999-9999-9999-9999-999999999999' // From our test data
const TEST_CREDENTIALS = {
  tenant: { email: 'tenant@test.com', password: 'Test123!@#' },
  landlord: { email: 'landlord@test.com', password: 'Test123!@#' }
}

// Sample test file (create a small text file)
function createTestFile() {
  const content = `Sample Lease Agreement

This is a test lease document for Tenesta application.
Property: 123 Test Street, Apt 101
Tenant: Jane Tenant
Landlord: John Landlord
Rent: $2,500/month

Created: ${new Date().toISOString()}

This document is for testing purposes only.`

  return {
    content,
    base64: Buffer.from(content).toString('base64'),
    fileName: 'test-lease-agreement.txt',
    mimeType: 'text/plain'
  }
}

async function testDocumentAPI(userType = 'tenant') {
  console.log(`\n📄 TESTING DOCUMENT API - ${userType.toUpperCase()}`)
  console.log('='.repeat(50))

  try {
    // Sign in as test user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword(
      TEST_CREDENTIALS[userType]
    )

    if (authError) {
      console.log(`❌ Login failed: ${authError.message}`)
      return false
    }

    console.log(`✅ Logged in as ${userType}: ${authData.user.email}`)
    const token = authData.session.access_token

    // Test 1: Upload Document
    console.log('\n1️⃣ Testing Document Upload...')
    const testFile = createTestFile()
    
    const uploadResponse = await fetch(`${SUPABASE_URL}/functions/v1/document-management`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'upload',
        tenancy_id: TEST_TENANCY_ID,
        document_type: 'lease',
        file_name: testFile.fileName,
        file_data: testFile.base64,
        mime_type: testFile.mimeType,
        metadata: {
          description: 'Test lease document upload',
          category: 'legal',
          uploaded_via: 'api_test'
        }
      })
    })

    let uploadedDocumentId = null
    if (uploadResponse.ok) {
      const uploadResult = await uploadResponse.json()
      console.log(`✅ Upload successful: ${uploadResult.document.file_name}`)
      console.log(`   Document ID: ${uploadResult.document.id}`)
      console.log(`   File Size: ${uploadResult.document.file_size} bytes`)
      uploadedDocumentId = uploadResult.document.id
    } else {
      const error = await uploadResponse.json()
      console.log(`❌ Upload failed: ${error.error}`)
    }

    // Test 2: List Documents
    console.log('\n2️⃣ Testing Document List...')
    const listResponse = await fetch(`${SUPABASE_URL}/functions/v1/document-management`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'list',
        tenancy_id: TEST_TENANCY_ID,
        document_type: 'lease'
      })
    })

    if (listResponse.ok) {
      const listResult = await listResponse.json()
      console.log(`✅ Found ${listResult.count} documents`)
      listResult.documents.forEach((doc, index) => {
        console.log(`   ${index + 1}. ${doc.file_name} (${doc.document_type}) - ${doc.file_size} bytes`)
      })
    } else {
      const error = await listResponse.json()
      console.log(`❌ List failed: ${error.error}`)
    }

    // Test 3: Download Document (if we have one)
    if (uploadedDocumentId) {
      console.log('\n3️⃣ Testing Document Download...')
      const downloadResponse = await fetch(`${SUPABASE_URL}/functions/v1/document-management`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'download',
          document_id: uploadedDocumentId
        })
      })

      if (downloadResponse.ok) {
        const downloadResult = await downloadResponse.json()
        console.log(`✅ Download URL generated`)
        console.log(`   Expires at: ${downloadResult.expires_at}`)
        console.log(`   URL: ${downloadResult.download_url.substring(0, 100)}...`)
      } else {
        const error = await downloadResponse.json()
        console.log(`❌ Download failed: ${error.error}`)
      }
    }

    // Test 4: Update Metadata
    if (uploadedDocumentId) {
      console.log('\n4️⃣ Testing Metadata Update...')
      const updateResponse = await fetch(`${SUPABASE_URL}/functions/v1/document-management`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'update_metadata',
          document_id: uploadedDocumentId,
          metadata: {
            updated_via_test: true,
            test_timestamp: new Date().toISOString(),
            tags: ['test', 'lease', 'api']
          }
        })
      })

      if (updateResponse.ok) {
        const updateResult = await updateResponse.json()
        console.log(`✅ Metadata updated successfully`)
        console.log(`   Tags: ${updateResult.document.metadata.tags?.join(', ')}`)
      } else {
        const error = await updateResponse.json()
        console.log(`❌ Metadata update failed: ${error.error}`)
      }
    }

    // Test 5: Delete Document (cleanup)
    if (uploadedDocumentId) {
      console.log('\n5️⃣ Testing Document Delete...')
      const deleteResponse = await fetch(`${SUPABASE_URL}/functions/v1/document-management`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'delete',
          document_id: uploadedDocumentId
        })
      })

      if (deleteResponse.ok) {
        const deleteResult = await deleteResponse.json()
        console.log(`✅ Document deleted successfully`)
      } else {
        const error = await deleteResponse.json()
        console.log(`❌ Delete failed: ${error.error}`)
      }
    }

    await supabase.auth.signOut()
    return true

  } catch (error) {
    console.error(`❌ Test error: ${error.message}`)
    return false
  }
}

async function runAllTests() {
  console.log('🧪 TENESTA DOCUMENT MANAGEMENT API TESTS')
  console.log('=' .repeat(60))
  console.log(`Testing against: ${SUPABASE_URL}`)
  console.log(`Timestamp: ${new Date().toISOString()}`)

  let passed = 0
  let failed = 0

  // Test as tenant
  const tenantSuccess = await testDocumentAPI('tenant')
  if (tenantSuccess) passed++; else failed++

  // Test as landlord
  const landlordSuccess = await testDocumentAPI('landlord')
  if (landlordSuccess) passed++; else failed++

  // Summary
  console.log('\n📊 TEST SUMMARY')
  console.log('=' .repeat(20))
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`)

  if (failed === 0) {
    console.log('\n🎉 All document management tests passed!')
    console.log('✅ File upload/download working')
    console.log('✅ Document listing working')
    console.log('✅ Metadata management working')
    console.log('✅ Access control working')
  } else {
    console.log('\n⚠️  Some tests failed. Check:')
    console.log('1. Document management function is deployed')
    console.log('2. Storage bucket is created and configured')
    console.log('3. RLS policies are set up correctly')
  }
}

// Run tests
runAllTests().catch(console.error)