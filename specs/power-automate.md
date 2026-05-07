# Power Automate Setup Guide

## DellClips — Email Verification Code Relay

---

## Overview

DellClips uses email-based authentication where a 6-digit verification
code is sent to the user's Dell email address. Because external email
senders (like Gmail) are often blocked or delayed by Dell's corporate
email security, we use an internal Dell mailbox (`dell.clips@dell.com`)
as a relay.

### How It Works

```
DellClips App (Vercel)
  │
  │ Sends email containing code + recipient
  │ FROM: dellclips.app@gmail.com
  │ TO: dell.clips@dell.com
  │ SUBJECT: DELLCLIPS_CODE: 123456 | TO: user@dell.com | KEY: secret
  │
  ▼
dell.clips@dell.com (Shared Mailbox)
  │
  │ Power Automate monitors this mailbox
  │ Parses the code and recipient from the subject line
  │
  ▼
Power Automate Flow
  │
  │ Sends a branded email with the verification code
  │ FROM: dell.clips@dell.com (trusted internal sender)
  │ TO: user@dell.com
  │
  ▼
Dell Employee receives the code instantly ✅
```

### Why This Is Needed

| Direct Send (Broken)                                            | Relay via Power Automate (Working)                                  |
| :-------------------------------------------------------------- | :------------------------------------------------------------------ |
| `dellclips.app@gmail.com` → `user@dell.com`                     | `dellclips.app@gmail.com` → `dell.clips@dell.com` → `user@dell.com` |
| Dell security: **"Unknown external sender!"** → Blocked/Delayed | Dell security: **"Internal Dell sender!"** → Delivered instantly    |

---

## Prerequisites

Before setting up the Power Automate flow, ensure:

- [ ] A shared mailbox `dell.clips@dell.com` exists in Exchange Online
      (request from Dell IT if needed)
- [ ] You have permission to create Power Automate flows that access
      this shared mailbox
- [ ] You have the relay secret key (shared between the DellClips app
      and Power Automate — stored in the app's environment variable
      `RELAY_SECRET`)
- [ ] The DellClips app is configured to send relay emails
      (the `DELL_RELAY_EMAIL` environment variable is set to
      `dell.clips@dell.com`)

---

## Power Automate Flow Setup

### Step 1: Create a New Flow

1. Go to [make.powerautomate.com](https://make.powerautomate.com)
2. Click **"Create"** in the left sidebar
3. Select **"Automated cloud flow"**
4. Name it: `DellClips - Forward Verification Codes`
5. Skip the trigger selection (we'll configure it manually)
6. Click **"Create"**

---

### Step 2: Configure the Trigger

| Setting                      | Value                                               |
| :--------------------------- | :-------------------------------------------------- |
| **Trigger**                  | `When a new email arrives in a shared mailbox (V2)` |
| **Original Mailbox Address** | `dell.clips@dell.com`                               |
| **Folder**                   | `Inbox`                                             |
| **Include Attachments**      | No                                                  |
| **Subject Filter**           | `DELLCLIPS_CODE`                                    |

#### Advanced Settings

| Setting        | Value                     |
| :------------- | :------------------------ |
| **From**       | `dellclips.app@gmail.com` |
| **Importance** | Any                       |

> **Security Note:** The "From" filter ensures that only emails from
> the DellClips application are processed. Any other emails arriving
> in the shared mailbox are ignored.

---

### Step 3: Add a Condition — Validate the Secret Key

This step ensures that only legitimate emails from the DellClips
app are processed. Spoofed or unauthorized emails are rejected.

1. Click **"+ New step"**
2. Search for **"Condition"**
3. Configure:

| Setting      | Value                               |
| :----------- | :---------------------------------- |
| **Value**    | `triggerOutputs()?['body/subject']` |
| **Operator** | contains                            |
| **Value**    | `KEY: YOUR_RELAY_SECRET_HERE`       |

> **Replace `YOUR_RELAY_SECRET_HERE`** with the actual secret key
> shared with the DellClips development team. This key is stored
> in the app's `RELAY_SECRET` environment variable.

**If No (invalid key):**

- Add action: **"Delete email (V2)"** — removes the suspicious email
- Add action (optional): **"Post message in a chat or channel"** in
  Teams to alert the admin about the unauthorized attempt

**If Yes (valid key):**

- Continue to Step 4

---

### Step 4: Extract the Code and Recipient

Add two **"Compose"** actions to parse the subject line.

The subject line format is:

```
DELLCLIPS_CODE: 123456 | TO: user@dell.com | KEY: secret123
```

#### Compose Action 1: Extract Code

| Setting        | Value          |
| :------------- | :------------- |
| **Name**       | `Extract Code` |
| **Expression** | See below      |

```
trim(first(split(last(split(triggerOutputs()?['body/subject'], 'DELLCLIPS_CODE: ')), ' | TO:')))
```

**What this does:**

1. Splits the subject by `'DELLCLIPS_CODE: '` → takes the part after it
2. Splits by `' | TO:'` → takes the first part (the code)
3. Trims whitespace

**Result:** `123456`

#### Compose Action 2: Extract Recipient

| Setting        | Value               |
| :------------- | :------------------ |
| **Name**       | `Extract Recipient` |
| **Expression** | See below           |

```
trim(first(split(last(split(triggerOutputs()?['body/subject'], 'TO: ')), ' | KEY:')))
```

**What this does:**

1. Splits the subject by `'TO: '` → takes the part after it
2. Splits by `' | KEY:'` → takes the first part (the email)
3. Trims whitespace

**Result:** `user@dell.com`

---

### Step 5: Send the Verification Code to the Recipient

1. Click **"+ New step"**
2. Search for **"Send an email (V2)"** (Office 365 Outlook)
3. Configure:

| Setting            | Value                                                           |
| :----------------- | :-------------------------------------------------------------- |
| **To**             | `outputs('Extract_Recipient')`                                  |
| **Subject**        | `@{outputs('Extract_Code')} — Your DellClips verification code` |
| **From (Send as)** | `dell.clips@dell.com`                                           |
| **Importance**     | High                                                            |

#### Email Body (HTML)

Switch to **"Code View"** and paste this HTML:

```html
<div
  style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;"
>
  <!-- DellClips Header -->
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: #0672CB; font-size: 24px; margin: 0;">
      Dell<span style="color: #0672CB;">Clips</span>
    </h1>
    <p style="color: #999; font-size: 12px; margin: 4px 0 0 0;">
      Short-form video for Dell employees
    </p>
  </div>

  <!-- Main Content -->
  <h2 style="color: #333; font-size: 18px; text-align: center;">
    Your verification code
  </h2>

  <p style="color: #666; font-size: 14px; text-align: center;">
    Enter this code in DellClips to sign in:
  </p>

  <!-- Code Box -->
  <div
    style="background: #f0f4f8; border: 2px solid #0672CB;
              border-radius: 12px; padding: 24px; text-align: center;
              margin: 24px 0;"
  >
    <span
      style="font-size: 36px; font-weight: bold; letter-spacing: 10px;
                 color: #0672CB; font-family: 'Courier New', monospace;"
    >
      @{outputs('Extract_Code')}
    </span>
  </div>

  <!-- Expiry Warning -->
  <p
    style="color: #e67e22; font-size: 13px; text-align: center;
            font-weight: bold;"
  >
    ⏱️ This code expires in 10 minutes
  </p>

  <!-- Security Notice -->
  <div
    style="background: #f9f9f9; border-radius: 8px; padding: 16px;
              margin: 24px 0;"
  >
    <p style="color: #999; font-size: 12px; margin: 0;">
      🔒 If you didn't request this code, you can safely ignore this email. Someone may
      have entered your email address by mistake.
    </p>
  </div>

  <!-- Footer -->
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
  <p style="color: #bbb; font-size: 11px; text-align: center;">
    DellClips — Internal video sharing platform for Dell Technologies
    <br />
    This is an automated message. Please do not reply.
  </p>
</div>
```

> **Dynamic Content:** The `@{outputs('Extract_Code')}` reference
> will be replaced by Power Automate with the actual 6-digit code
> extracted in Step 4.

---

### Step 6: Clean Up — Delete the Relay Email

After successfully forwarding the code, delete the original relay
email from the shared mailbox to keep it clean.

1. Click **"+ New step"**
2. Search for **"Delete email (V2)"** (Office 365 Outlook)
3. Configure:

| Setting                      | Value                          |
| :--------------------------- | :----------------------------- |
| **Message Id**               | `triggerOutputs()?['body/id']` |
| **Original Mailbox Address** | `dell.clips@dell.com`          |

---

### Step 7: Add Error Handling (Optional but Recommended)

#### Option A: Configure Run-After for the Send Email Step

1. Click the **"..."** menu on the "Send an email" step
2. Select **"Configure run after"**
3. Ensure it runs after the Compose steps

#### Option B: Add a Parallel Branch for Error Notification

1. After the "Send an email" step, add a parallel branch
2. Configure it to run only on failure:
   - Click **"..."** → **"Configure run after"** → check only **"has failed"**
3. Add action: **"Post message in a chat or channel"** (Microsoft Teams)

| Setting     | Value                                                                                                   |
| :---------- | :------------------------------------------------------------------------------------------------------ |
| **Team**    | Your DellClips admin team                                                                               |
| **Channel** | `#dellclips-alerts`                                                                                     |
| **Message** | `⚠️ Failed to send DellClips verification code to @{outputs('Extract_Recipient')}. Please investigate.` |

---

## Complete Flow Summary

```
┌─────────────────────────────────────────────────────┐
│ TRIGGER: New email in dell.clips@dell.com           │
│   Subject contains "DELLCLIPS_CODE"                 │
│   From = dellclips.app@gmail.com                    │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ CONDITION: Subject contains "KEY: [secret]"?        │
│                                                     │
│   NO → Delete email + Alert admin (optional)        │
│   YES → Continue ↓                                  │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ COMPOSE: Extract Code                               │
│   Input: Subject line                               │
│   Output: "123456"                                  │
│                                                     │
│ COMPOSE: Extract Recipient                          │
│   Input: Subject line                               │
│   Output: "user@dell.com"                           │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ SEND EMAIL (V2)                                     │
│   From: dell.clips@dell.com                         │
│   To: [extracted recipient]                         │
│   Subject: "[code] — Your DellClips verification    │
│             code"                                   │
│   Body: Branded HTML with code                      │
│   Importance: High                                  │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ DELETE EMAIL (V2)                                   │
│   Delete the original relay email from              │
│   dell.clips@dell.com (cleanup)                     │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
              ┌──────┴──────┐
              │    DONE ✅   │
              └─────────────┘
```

---

## Testing the Flow

### Test 1: Verify the Trigger

1. Send a test email manually from `dellclips.app@gmail.com` to
   `dell.clips@dell.com` with the subject:
   ```
   DELLCLIPS_CODE: 999999 | TO: your.name@dell.com | KEY: your-secret
   ```
2. Go to Power Automate → Flow runs → verify the flow triggered

### Test 2: Verify Code Extraction

1. Check the "Extract Code" compose output — should be `999999`
2. Check the "Extract Recipient" compose output — should be
   `your.name@dell.com`

### Test 3: Verify Email Delivery

1. Check `your.name@dell.com` inbox
2. You should receive a branded email with the code `999999`
3. Verify the email comes **from** `dell.clips@dell.com`

### Test 4: End-to-End Test

1. Go to DellClips → Login page
2. Enter your `@dell.com` email
3. Click "Continue with Email"
4. Wait 1-3 minutes (Power Automate processing time)
5. Check your Dell inbox for the verification code
6. Enter the code → Sign in

---

## Troubleshooting

| Symptom                                   | Possible Cause                                  | Fix                                                                |
| :---------------------------------------- | :---------------------------------------------- | :----------------------------------------------------------------- |
| Flow doesn't trigger                      | Subject filter doesn't match                    | Check that the filter is `DELLCLIPS_CODE` (not the full subject)   |
| Flow triggers but fails at Condition      | Secret key mismatch                             | Verify `RELAY_SECRET` matches between app and flow                 |
| Code extraction returns wrong value       | Subject format changed                          | Check the app's email adapter produces the expected subject format |
| Email sends but recipient doesn't receive | Recipient mailbox full or recipient email wrong | Check the extracted recipient value in flow run history            |
| Flow runs slowly (>5 minutes)             | Power Automate trigger polling interval         | Default is 1-3 minutes. Cannot be reduced on standard plans.       |

### Checking Flow Run History

1. Go to [make.powerautomate.com](https://make.powerautomate.com)
2. Click **"My flows"** in the left sidebar
3. Click on `DellClips - Forward Verification Codes`
4. Click the **"28-day run history"** tab
5. Click on any run to see step-by-step execution details

---

## Security Considerations

| Concern                                        | Mitigation                                                                                                 |
| :--------------------------------------------- | :--------------------------------------------------------------------------------------------------------- |
| **Unauthorized emails sent to relay mailbox**  | Flow validates sender (`From = dellclips.app@gmail.com`) AND secret key in subject                         |
| **Code visible in relay mailbox**              | Flow deletes the relay email after forwarding. Codes expire in 10 minutes.                                 |
| **Relay secret exposed**                       | Secret is stored in environment variables (not in code). Rotate periodically.                              |
| **Power Automate account compromised**         | The flow only has `Mail.Send` permission for the shared mailbox — it cannot access other mailboxes or data |
| **Replay attack (resending old relay emails)** | Codes expire after 10 minutes. Replayed emails would contain expired codes.                                |

---

## Maintenance

| Task                                                 | Frequency |
| :--------------------------------------------------- | :-------- |
| Check flow run history for failures                  | Weekly    |
| Rotate `RELAY_SECRET`                                | Quarterly |
| Monitor `dell.clips@dell.com` for unprocessed emails | Monthly   |
| Update email template branding                       | As needed |
| Review flow permissions                              | Annually  |

---

## Contact

| Role                               | Contact                  |
| :--------------------------------- | :----------------------- |
| **DellClips Developer**            | [Your name/email]        |
| **Power Automate Flow Owner**      | [Flow owner name/email]  |
| **Dell IT (Shared Mailbox Admin)** | [IT contact]             |
| **Relay Secret Custodian**         | [Who manages the secret] |

---

_Document Version: 1.0_
_Last Updated: [Date]_
_Related Documents: ARCHITECTURE.md, HLD.md, PRD.md_
