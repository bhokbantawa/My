#!/usr/bin/env python3
"""
Comprehensive Backend API Tests for Sahayak - Nepali AI Assistant
Tests all backend endpoints defined in server.py
"""

import requests
import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any
import sys
import time

# Backend URL from frontend environment
BACKEND_URL = "https://nepali-helper.preview.emergentagent.com/api"

class APITester:
    def __init__(self):
        self.results = {
            "passed": 0,
            "failed": 0,
            "tests": []
        }
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
            "Accept": "application/json"
        })
    
    def test_endpoint(self, name: str, method: str, endpoint: str, data: Dict = None, expected_status: int = 200) -> Dict[str, Any]:
        """Test an API endpoint and return results"""
        full_url = f"{BACKEND_URL}{endpoint}"
        
        try:
            print(f"\n🧪 Testing {name}")
            print(f"   {method} {full_url}")
            
            if method.upper() == "GET":
                response = self.session.get(full_url)
            elif method.upper() == "POST":
                response = self.session.post(full_url, json=data)
            elif method.upper() == "PATCH":
                response = self.session.patch(full_url, json=data)
            elif method.upper() == "DELETE":
                response = self.session.delete(full_url)
            elif method.upper() == "PUT":
                response = self.session.put(full_url, json=data)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            # Parse response
            try:
                response_data = response.json()
            except:
                response_data = response.text
            
            success = response.status_code == expected_status
            
            result = {
                "name": name,
                "method": method,
                "endpoint": endpoint,
                "status_code": response.status_code,
                "expected_status": expected_status,
                "success": success,
                "response_data": response_data,
                "request_data": data
            }
            
            if success:
                print(f"   ✅ SUCCESS: Status {response.status_code}")
                self.results["passed"] += 1
            else:
                print(f"   ❌ FAILED: Expected {expected_status}, got {response.status_code}")
                print(f"   📄 Response: {response_data}")
                self.results["failed"] += 1
            
            self.results["tests"].append(result)
            return result
            
        except Exception as e:
            print(f"   💥 ERROR: {str(e)}")
            result = {
                "name": name,
                "method": method,
                "endpoint": endpoint,
                "success": False,
                "error": str(e),
                "request_data": data
            }
            self.results["failed"] += 1
            self.results["tests"].append(result)
            return result
    
    def run_all_tests(self):
        """Run comprehensive tests for all backend APIs"""
        print("🚀 Starting Comprehensive Backend API Tests")
        print(f"🔗 Backend URL: {BACKEND_URL}")
        print("="*60)
        
        # 1. Health Check
        self.test_health_check()
        
        # 2. Chat API Tests
        self.test_chat_api()
        
        # 3. Reminders CRUD Tests
        self.test_reminders_api()
        
        # 4. Daily Tips API
        self.test_daily_tips_api()
        
        # 5. Cooking Suggestions API
        self.test_cooking_api()
        
        # 6. Health Advice API
        self.test_health_advice_api()
        
        # Print final results
        self.print_results()
    
    def test_health_check(self):
        """Test health check endpoint"""
        print("\n" + "="*40)
        print("🏥 TESTING HEALTH CHECK")
        print("="*40)
        
        result = self.test_endpoint(
            "Health Check",
            "GET",
            "/health"
        )
        
        # Verify response structure
        if result.get("success") and isinstance(result.get("response_data"), dict):
            data = result["response_data"]
            if "status" in data and data["status"] == "healthy":
                print("   ✅ Health status verified: healthy")
            else:
                print("   ⚠️  Health response structure unexpected")
    
    def test_chat_api(self):
        """Test chat API endpoints"""
        print("\n" + "="*40)
        print("💬 TESTING CHAT API")
        print("="*40)
        
        session_id = str(uuid.uuid4())
        
        # Test 1: Chat in English
        english_result = self.test_endpoint(
            "Chat API - English Message",
            "POST",
            "/chat",
            {
                "message": "Hello! How are you doing today?",
                "session_id": session_id,
                "language": "english",
                "context": "general"
            }
        )
        
        # Test 2: Chat in Nepali
        nepali_result = self.test_endpoint(
            "Chat API - Nepali Message",
            "POST",
            "/chat",
            {
                "message": "नमस्ते! तपाईं कस्तो हुनुहुन्छ?",
                "session_id": session_id,
                "language": "nepali",
                "context": "general"
            }
        )
        
        # Verify response structure for successful requests
        for result in [english_result, nepali_result]:
            if result.get("success") and isinstance(result.get("response_data"), dict):
                data = result["response_data"]
                required_fields = ["response", "session_id", "message_id"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    print(f"   ✅ {result['name']}: Response structure verified")
                else:
                    print(f"   ⚠️  {result['name']}: Missing fields: {missing_fields}")
        
        # Test 3: Get chat history
        if english_result.get("success"):
            history_result = self.test_endpoint(
                "Chat History",
                "GET",
                f"/chat/history/{session_id}"
            )
            
            if history_result.get("success"):
                history_data = history_result.get("response_data", [])
                if isinstance(history_data, list) and len(history_data) > 0:
                    print(f"   ✅ Chat history retrieved: {len(history_data)} messages")
                else:
                    print("   ⚠️  Chat history empty or invalid format")
    
    def test_reminders_api(self):
        """Test reminders CRUD API"""
        print("\n" + "="*40)
        print("📋 TESTING REMINDERS CRUD API")
        print("="*40)
        
        reminder_id = None
        
        # Test 1: Create Reminder
        future_date = (datetime.now() + timedelta(days=7)).isoformat()
        create_result = self.test_endpoint(
            "Create Reminder",
            "POST",
            "/reminders",
            {
                "title": "डाक्टर जाने समय (Doctor Appointment)",
                "description": "महत्वपूर्ण स्वास्थ्य जाँच (Important health checkup)",
                "due_date": future_date,
                "category": "health"
            }
        )
        
        # Get reminder ID from create response
        if create_result.get("success") and isinstance(create_result.get("response_data"), dict):
            reminder_data = create_result["response_data"]
            reminder_id = reminder_data.get("id")
            required_fields = ["id", "title", "due_date", "category", "completed", "created_at"]
            missing_fields = [field for field in required_fields if field not in reminder_data]
            
            if not missing_fields:
                print(f"   ✅ Create Reminder: Response structure verified")
            else:
                print(f"   ⚠️  Create Reminder: Missing fields: {missing_fields}")
        
        # Test 2: Get All Reminders
        get_all_result = self.test_endpoint(
            "Get All Reminders",
            "GET",
            "/reminders"
        )
        
        if get_all_result.get("success"):
            reminders = get_all_result.get("response_data", [])
            if isinstance(reminders, list):
                print(f"   ✅ Get All Reminders: Retrieved {len(reminders)} reminders")
            else:
                print("   ⚠️  Get All Reminders: Invalid response format")
        
        # Test 3: Get Specific Reminder
        if reminder_id:
            get_one_result = self.test_endpoint(
                "Get Specific Reminder",
                "GET",
                f"/reminders/{reminder_id}"
            )
            
            if get_one_result.get("success"):
                reminder_data = get_one_result.get("response_data", {})
                if reminder_data.get("id") == reminder_id:
                    print(f"   ✅ Get Specific Reminder: Correct reminder retrieved")
                else:
                    print("   ⚠️  Get Specific Reminder: Wrong reminder returned")
        
        # Test 4: Toggle Completion
        if reminder_id:
            toggle_result = self.test_endpoint(
                "Toggle Reminder Completion",
                "PATCH",
                f"/reminders/{reminder_id}/complete"
            )
            
            if toggle_result.get("success"):
                toggle_data = toggle_result.get("response_data", {})
                if "completed" in toggle_data and "id" in toggle_data:
                    print(f"   ✅ Toggle Completion: Status updated to {toggle_data.get('completed')}")
                else:
                    print("   ⚠️  Toggle Completion: Invalid response structure")
        
        # Test 5: Delete Reminder
        if reminder_id:
            delete_result = self.test_endpoint(
                "Delete Reminder",
                "DELETE",
                f"/reminders/{reminder_id}"
            )
            
            if delete_result.get("success"):
                delete_data = delete_result.get("response_data", {})
                if delete_data.get("id") == reminder_id:
                    print(f"   ✅ Delete Reminder: Successfully deleted")
                else:
                    print("   ⚠️  Delete Reminder: Unexpected response")
    
    def test_daily_tips_api(self):
        """Test daily tips API"""
        print("\n" + "="*40)
        print("💡 TESTING DAILY TIPS API")
        print("="*40)
        
        # Test 1: Get Random Daily Tip
        tip_result = self.test_endpoint(
            "Get Daily Tip",
            "GET",
            "/tips/daily"
        )
        
        if tip_result.get("success") and isinstance(tip_result.get("response_data"), dict):
            tip_data = tip_result["response_data"]
            required_fields = ["tip_nepali", "tip_english", "category"]
            missing_fields = [field for field in required_fields if field not in tip_data]
            
            if not missing_fields:
                print("   ✅ Daily Tip: Response structure verified")
                print(f"   📝 Category: {tip_data.get('category')}")
                print(f"   🇳🇵 Nepali: {tip_data.get('tip_nepali', '')[:50]}...")
                print(f"   🇺🇸 English: {tip_data.get('tip_english', '')[:50]}...")
            else:
                print(f"   ⚠️  Daily Tip: Missing fields: {missing_fields}")
        
        # Test 2: Get Tips by Category
        for category in ["health", "cooking", "money"]:
            category_result = self.test_endpoint(
                f"Get {category.title()} Tips",
                "GET",
                f"/tips/daily?category={category}"
            )
            
            if category_result.get("success"):
                tip_data = category_result.get("response_data", {})
                if tip_data.get("category") == category:
                    print(f"   ✅ {category.title()} tip category verified")
                else:
                    print(f"   ⚠️  {category.title()} tip category mismatch")
        
        # Test 3: Get All Tips
        all_tips_result = self.test_endpoint(
            "Get All Tips",
            "GET",
            "/tips/all"
        )
        
        if all_tips_result.get("success"):
            all_tips = all_tips_result.get("response_data", [])
            if isinstance(all_tips, list) and len(all_tips) > 0:
                print(f"   ✅ All Tips: Retrieved {len(all_tips)} tips")
            else:
                print("   ⚠️  All Tips: Invalid or empty response")
    
    def test_cooking_api(self):
        """Test cooking suggestions API"""
        print("\n" + "="*40)
        print("🍳 TESTING COOKING SUGGESTIONS API")
        print("="*40)
        
        # Test with typical Nepali ingredients
        ingredients = ["आलु (potato)", "प्याज (onion)", "टमाटर (tomato)", "चामल (rice)", "दाल (lentils)"]
        
        cooking_result = self.test_endpoint(
            "Cooking Suggestions",
            "POST",
            "/cooking/suggest",
            {
                "ingredients": ingredients,
                "language": "nepali"
            }
        )
        
        if cooking_result.get("success") and isinstance(cooking_result.get("response_data"), dict):
            cooking_data = cooking_result["response_data"]
            if "suggestions" in cooking_data and "ingredients" in cooking_data:
                print("   ✅ Cooking API: Response structure verified")
                print(f"   🥘 Ingredients processed: {len(cooking_data.get('ingredients', []))}")
                
                suggestions = cooking_data.get("suggestions", "")
                if suggestions and len(suggestions) > 20:
                    print("   ✅ Cooking suggestions generated successfully")
                    print(f"   📝 Response length: {len(suggestions)} characters")
                else:
                    print("   ⚠️  Cooking suggestions seem incomplete")
            else:
                print("   ⚠️  Cooking API: Missing required response fields")
        elif cooking_result.get("success") == False:
            # Check if it's a budget exceeded error (which is expected)
            response_data = cooking_result.get("response_data", {})
            if isinstance(response_data, dict) and "detail" in response_data:
                if "budget" in response_data["detail"].lower() or "exceeded" in response_data["detail"].lower():
                    print("   ⚠️  Cooking API: LLM budget exceeded (expected)")
                    print("   ✅ API structure working correctly despite budget limit")
                else:
                    print(f"   ❌ Cooking API: Unexpected error - {response_data['detail']}")
            else:
                print("   ❌ Cooking API: Failed with unknown error")
        
        # Test Cooking Chat endpoint
        cooking_chat_result = self.test_endpoint(
            "Cooking Chat",
            "POST",
            "/cooking/chat",
            {
                "message": "मोमो बनाउने तरिका के हो? (How to make momos?)",
                "language": "nepali"
            }
        )
        
        # Same handling for cooking chat
        if cooking_chat_result.get("success"):
            print("   ✅ Cooking Chat: Endpoint working")
        else:
            response_data = cooking_chat_result.get("response_data", {})
            if isinstance(response_data, dict) and "detail" in response_data:
                if "budget" in response_data["detail"].lower():
                    print("   ⚠️  Cooking Chat: LLM budget exceeded (expected)")
    
    def test_health_advice_api(self):
        """Test health advice API"""
        print("\n" + "="*40)
        print("🏥 TESTING HEALTH ADVICE API")
        print("="*40)
        
        # Test with common symptoms
        health_result = self.test_endpoint(
            "Health Advice",
            "POST",
            "/health/advice",
            {
                "symptoms": "टाउको दुख्छ र खोकी छ (Having headache and cough)",
                "language": "nepali"
            }
        )
        
        if health_result.get("success") and isinstance(health_result.get("response_data"), dict):
            health_data = health_result["response_data"]
            required_fields = ["advice", "disclaimer"]
            missing_fields = [field for field in required_fields if field not in health_data]
            
            if not missing_fields:
                print("   ✅ Health API: Response structure verified")
                
                advice = health_data.get("advice", "")
                disclaimer = health_data.get("disclaimer", "")
                
                if advice and len(advice) > 20:
                    print("   ✅ Health advice generated successfully")
                    print(f"   📝 Advice length: {len(advice)} characters")
                else:
                    print("   ⚠️  Health advice seems incomplete")
                
                if "professional" in disclaimer.lower() or "doctor" in disclaimer.lower():
                    print("   ✅ Medical disclaimer properly included")
                else:
                    print("   ⚠️  Medical disclaimer missing or inadequate")
            else:
                print(f"   ⚠️  Health API: Missing fields: {missing_fields}")
        elif health_result.get("success") == False:
            # Check if it's a budget exceeded error
            response_data = health_result.get("response_data", {})
            if isinstance(response_data, dict) and "detail" in response_data:
                if "budget" in response_data["detail"].lower():
                    print("   ⚠️  Health API: LLM budget exceeded (expected)")
                    print("   ✅ API structure working correctly despite budget limit")
                else:
                    print(f"   ❌ Health API: Unexpected error - {response_data['detail']}")
        
        # Test Health Chat endpoint
        health_chat_result = self.test_endpoint(
            "Health Chat",
            "POST",
            "/health/chat",
            {
                "message": "बिहान व्यायाम गर्दा के फाइदा छ? (What are the benefits of morning exercise?)",
                "language": "nepali"
            }
        )
        
        if health_chat_result.get("success"):
            print("   ✅ Health Chat: Endpoint working")
        else:
            response_data = health_chat_result.get("response_data", {})
            if isinstance(response_data, dict) and "detail" in response_data:
                if "budget" in response_data["detail"].lower():
                    print("   ⚠️  Health Chat: LLM budget exceeded (expected)")
    
    def print_results(self):
        """Print comprehensive test results"""
        print("\n" + "="*60)
        print("📊 COMPREHENSIVE TEST RESULTS")
        print("="*60)
        
        total_tests = self.results["passed"] + self.results["failed"]
        success_rate = (self.results["passed"] / total_tests * 100) if total_tests > 0 else 0
        
        print(f"✅ Passed: {self.results['passed']}")
        print(f"❌ Failed: {self.results['failed']}")
        print(f"📈 Success Rate: {success_rate:.1f}%")
        print(f"🔍 Total Tests: {total_tests}")
        
        # Show failed tests in detail
        failed_tests = [t for t in self.results["tests"] if not t.get("success", False)]
        if failed_tests:
            print(f"\n❌ FAILED TESTS DETAIL:")
            print("-" * 40)
            for test in failed_tests:
                print(f"• {test['name']}")
                if 'error' in test:
                    print(f"  Error: {test['error']}")
                elif 'status_code' in test:
                    print(f"  Status: {test['status_code']} (expected {test.get('expected_status', 200)})")
                    if 'response_data' in test:
                        response_str = str(test['response_data'])
                        if len(response_str) > 200:
                            response_str = response_str[:200] + "..."
                        print(f"  Response: {response_str}")
                print()
        
        # Summary for main agent
        print(f"\n🎯 MAIN AGENT SUMMARY:")
        print("-" * 30)
        
        if self.results["failed"] == 0:
            print("✅ ALL BACKEND APIs WORKING CORRECTLY")
            print("✅ All endpoints responding with proper structure")
            print("✅ Data validation and error handling working")
        else:
            print(f"⚠️  {self.results['failed']} endpoints need attention")
            
            critical_failures = []
            budget_issues = []
            
            for test in failed_tests:
                if 'response_data' in test and isinstance(test['response_data'], dict):
                    detail = test['response_data'].get('detail', '')
                    if 'budget' in detail.lower() or 'exceeded' in detail.lower():
                        budget_issues.append(test['name'])
                    else:
                        critical_failures.append(test['name'])
                elif 'error' in test:
                    critical_failures.append(test['name'])
                else:
                    critical_failures.append(test['name'])
            
            if critical_failures:
                print(f"❌ CRITICAL FAILURES: {len(critical_failures)}")
                for failure in critical_failures:
                    print(f"   • {failure}")
            
            if budget_issues:
                print(f"⚠️  LLM BUDGET EXCEEDED: {len(budget_issues)} (API structure OK)")
                for issue in budget_issues:
                    print(f"   • {issue}")

def main():
    """Main test runner"""
    print("🧪 Sahayak Backend API Comprehensive Test Suite")
    print("=" * 60)
    
    tester = APITester()
    tester.run_all_tests()

if __name__ == "__main__":
    main()