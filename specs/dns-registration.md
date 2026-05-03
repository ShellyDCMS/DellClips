

# Phase 2: Connect Domain to Vercel (After is-a.dev Approval)
Once the is-a.dev PR is merged:

## Step 1: Add Domain in Vercel
1. Go to your Vercel project dashboard
2. Click Settings → Domains
3. Type dellclips.is-a.dev in the input field
4. Click Add
5. Vercel will verify the CNAME record — since is-a.dev already points dellclips.is-a.dev to cname.vercel-dns.com, this should verify automatically

## Step 2: Update Environment Variables
In Vercel → Settings → Environment Variables, update:

```
AUTH_URL=https://dellclips.is-a.dev
NEXT_PUBLIC_APP_URL=https://dellclips.is-a.dev
```

## Step 3: Redeploy
1. Go to Deployments
2. Click "⋮" on the latest deployment
3. Click Redeploy

## Step 4: Verify
1. Open https://dellclips.is-a.dev — you should see the DellClips login page.

# Phase 2.5: Add Resend DNS Records (For Email)
This is the step that lifts the Resend sandbox restriction so magic links can be sent to any @dell.com address.

## Step 1: Add Domain in Resend
1. Go to resend.com/domains
2. Click Add Domain
3. Enter dellclips.is-a.dev
4. Resend will show you DNS records to add (TXT and MX values)
5. Copy these values — you'll need them for the next step

## Step 2: Update is-a.dev DNS Records
Go back to your fork of the is-a-dev register repo and update domains/dellclips.json:
``` json
{
  "description": "Internal short-form video sharing platform for software developers at Dell Technologies. Built with Next.js, TypeScript, and Tailwind CSS.",
  "repo": "https://gitlab.com/shellygoldblit/tiktok",
  "owner": {
    "username": "shellygoldblit",
    "email": "shelly.goldblit@gmail.com"
  },
  "record": {
    "CNAME": "cname.vercel-dns.com",
    "TXT": [
      "resend-domain-verification=PASTE_YOUR_CODE_FROM_RESEND"
    ],
    "MX": [
      "feedback-smtp.us-east-1.amazonses.com"
    ]
  }
}
```
Replace PASTE_YOUR_CODE_FROM_RESEND with the actual verification code from the Resend dashboard.

``` bash
cd register
git add domains/dellclips.json
git commit -m "Add Resend DNS records for dellclips.is-a.dev"
git push origin main
```
## Step 3: After Second PR Is Merged
1. Go back to resend.com/domains
2. Click Verify next to dellclips.is-a.dev
3. Resend checks the DNS records and verifies the domain
4. Sandbox lifted — you can now send emails to any address

## Step 4: Update Auth Config
Update lib/auth.ts — change the from address:
```typescript
const resendProvider = Resend({
  apiKey: process.env.AUTH_RESEND_KEY,
  from: "DellClips <noreply@dellclips.is-a.dev>",
});
```
Now magic links will come from noreply@dellclips.is-a.dev and can be sent to any @dell.com email.



