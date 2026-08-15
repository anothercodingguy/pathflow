# Free Razorpay Payment Gateway Setup Guide for PathFlow

This guide provides step-by-step instructions to obtain and configure **Free Razorpay Test / Sandbox API Keys** for processing Indian Rupee (INR) payments (UPI, Google Pay, Cards, NetBanking, QR).

---

## 1. Get Free Razorpay Test API Keys (Instant, No KYC Required for Testing)

1. Sign up or log in at [https://dashboard.razorpay.com/](https://dashboard.razorpay.com/).
2. In the top/left navigation bar, ensure your dashboard toggle is switched to **Test Mode** (orange badge).
3. Navigate to **Settings** → **API Keys** (or go to [https://dashboard.razorpay.com/app/keys](https://dashboard.razorpay.com/app/keys)).
4. Click **Generate Key** (or **Regenerate Key**).
5. A modal will display your credentials:
   - **Key Id**: `rzp_test_xxxxxxxxxxxxxx`
   - **Key Secret**: `xxxxxxxxxxxxxxxxxxxxxxxx`
6. Download or copy both values immediately.

---

## 2. Local Environment Configuration (`.env.local`)

Add the keys to your `.env.local` file in `/Users/suyash/PathFlow`:

```bash
# Razorpay Free Test Keys
RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="xxxxxxxxxxxxxxxxxxxxxxxx"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxxxx"
```

> **Note**: Even without setting API keys, PathFlow includes a built-in interactive simulator so developers can test the full subscription lifecycle locally without any external dependencies.

---

## 3. Vercel Production Environment Variables

In your Vercel Dashboard for the **PathFlow** project:
1. Go to **Settings** → **Environment Variables**.
2. Add:

| Variable Name | Value | Environment |
| :--- | :--- | :--- |
| `RAZORPAY_KEY_ID` | `rzp_test_xxxx` (or `rzp_live_xxxx`) | Production, Preview, Development |
| `RAZORPAY_KEY_SECRET` | `your_key_secret` | Production, Preview, Development |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | `rzp_test_xxxx` | Production, Preview, Development |

3. Click **Save** and **Redeploy**.

---

## 4. Supported Payment Methods

When users click **Upgrade to Pro (₹1,999/mo)**, Razorpay Standard Checkout opens automatically supporting:
- **UPI Apps** (Google Pay, PhonePe UPI, Paytm, BHIM, Any UPI ID)
- **Instant QR Code** (Scan & Pay with any banking app)
- **Debit / Credit Cards** (Visa, MasterCard, RuPay, Amex)
- **NetBanking** (50+ Indian banks)
- **Wallets**
