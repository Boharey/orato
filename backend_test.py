import requests
import sys
import json
import base64
from datetime import datetime

class OratorAPITester:
    def __init__(self, base_url="https://speak-better-67.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, auth_required=True):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json()
                    error_msg += f" - {error_detail}"
                except:
                    error_msg += f" - {response.text}"
                self.log_test(name, False, error_msg)
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Request failed: {str(e)}")
            return False, {}

    def test_auth_register(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_user = {
            "name": f"Test User {timestamp}",
            "email": f"test{timestamp}@example.com",
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user,
            auth_required=False
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   Token obtained: {self.token[:20]}...")
            print(f"   User ID: {self.user_id}")
            return True
        return False

    def test_auth_login(self):
        """Test user login with existing credentials"""
        # Try to login with the registered user
        if not hasattr(self, '_test_email'):
            return False
            
        login_data = {
            "email": self._test_email,
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST", 
            "auth/login",
            200,
            data=login_data,
            auth_required=False
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_auth_me(self):
        """Test getting current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_training_modules(self):
        """Test getting training modules"""
        success, response = self.run_test(
            "Get Training Modules",
            "GET",
            "training/modules",
            200,
            auth_required=False
        )
        
        if success and 'modules' in response:
            modules = response['modules']
            print(f"   Found {len(modules)} training modules")
            for module in modules:
                print(f"   - {module.get('title', 'Unknown')}")
        
        return success

    def test_analytics_get(self):
        """Test getting user analytics"""
        if not self.user_id:
            self.log_test("Get Analytics", False, "No user ID available")
            return False
            
        success, response = self.run_test(
            "Get User Analytics",
            "GET",
            f"analytics/{self.user_id}",
            200
        )
        
        if success:
            print(f"   WPM data points: {len(response.get('wpm', []))}")
            print(f"   Filler data points: {len(response.get('fillers', []))}")
            print(f"   Eye gaze data points: {len(response.get('eye_gaze', []))}")
        
        return success

    def test_analytics_update(self):
        """Test updating user analytics"""
        if not self.user_id:
            self.log_test("Update Analytics", False, "No user ID available")
            return False
            
        analytics_data = {
            "wpm": [{"date": "2025-01-01", "value": 150}],
            "fillers": [{"date": "2025-01-01", "value": 5}],
            "eye_gaze": [{"date": "2025-01-01", "value": 85}]
        }
        
        success, response = self.run_test(
            "Update User Analytics",
            "POST",
            f"analytics/{self.user_id}",
            200,
            data=analytics_data
        )
        return success

    def test_evaluation_analyze(self):
        """Test evaluation analysis (mocked)"""
        # Create a small mock video data
        mock_video_data = base64.b64encode(b"mock video data").decode('utf-8')
        
        analysis_data = {
            "video_data": mock_video_data
        }
        
        success, response = self.run_test(
            "Analyze Evaluation",
            "POST",
            "evaluation/analyze",
            200,
            data=analysis_data
        )
        
        if success:
            print(f"   WPM: {response.get('wpm', 'N/A')}")
            print(f"   Filler count: {response.get('filler_count', 'N/A')}")
            print(f"   Eye contact: {response.get('eye_contact_percentage', 'N/A')}%")
            print(f"   Confidence: {response.get('confidence_score', 'N/A')}%")
        
        return success

    def test_evaluation_history(self):
        """Test getting evaluation history"""
        success, response = self.run_test(
            "Get Evaluation History",
            "GET",
            "evaluation/history",
            200
        )
        
        if success:
            evaluations = response if isinstance(response, list) else []
            print(f"   Found {len(evaluations)} evaluations")
        
        return success

    def test_streak_data(self):
        """Test getting streak data"""
        if not self.user_id:
            self.log_test("Get Streak Data", False, "No user ID available")
            return False
            
        success, response = self.run_test(
            "Get Streak Data",
            "GET",
            f"streak/{self.user_id}",
            200
        )
        
        if success:
            print(f"   Current streak: {response.get('current_streak', 0)}")
            print(f"   Practice dates: {len(response.get('dates', []))}")
        
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting ORATO API Tests")
        print("=" * 50)
        
        # Test authentication flow
        if not self.test_auth_register():
            print("❌ Registration failed, stopping tests")
            return False
            
        # Store test email for login test
        timestamp = datetime.now().strftime('%H%M%S')
        self._test_email = f"test{timestamp}@example.com"
        
        # Test other endpoints
        self.test_auth_me()
        self.test_training_modules()
        self.test_analytics_get()
        self.test_analytics_update()
        self.test_evaluation_analyze()
        self.test_evaluation_history()
        self.test_streak_data()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed")
            return False

def main():
    tester = OratorAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    results = {
        "timestamp": datetime.now().isoformat(),
        "total_tests": tester.tests_run,
        "passed_tests": tester.tests_passed,
        "success_rate": f"{(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "0%",
        "test_details": tester.test_results
    }
    
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())