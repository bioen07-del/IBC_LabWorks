# 🚀 BMCP Platform - Deployment Guide

## Production Deployment Status

**Version:** 1.0.0  
**Date:** 2026-01-15  
**Status:** ✅ Ready for Production

---

## Database Setup Complete

### ✅ Seed Data Loaded
- 4 Locations
- 8 Equipment items
- 10 Container types
- 5 Media recipes
- 8 SOPs
- Reference data fully populated

### ✅ Users Created
- operator@bmcp.local (password: operator123)
- qp@bmcp.local (password: qp123)
- qc@bmcp.local (password: qc123)
- admin@bmcp.local (password: admin123)
- viewer@bmcp.local (password: viewer123)

### ✅ Auto-sync Trigger
- Function `sync_user_to_public()` created
- Trigger `on_auth_user_created` active
- New users automatically sync to public.users

---

## Environment Variables Required

Add these to Vercel (Settings → Environment Variables):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://mjgogarzewxjxohvormk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[Get from Supabase → Settings → API]
SUPABASE_SERVICE_ROLE_KEY=[Get from Supabase → Settings → API]
```

**Important:** Set all three environments:
- ✅ Production
- ✅ Preview  
- ✅ Development

---

## Getting API Keys

1. Open: https://supabase.com/dashboard/project/mjgogarzewxjxohvormk/settings/api
2. Click on **"API Keys"** in left menu
3. Copy:
   - **anon public** key
   - **service_role** key (click Reveal first)

---

## Deployment Process

### Automatic (Recommended)
Push to main branch triggers automatic deployment via Vercel GitHub integration.

### Manual
```bash
vercel --prod
```

---

## Post-Deployment Verification

1. ✅ Open: https://ibc-lab-works.vercel.app
2. ✅ Login with: operator@bmcp.local / operator123
3. ✅ Verify data loads correctly
4. ✅ Test creating a culture/container

---

## Support

For issues, contact the development team or check logs in:
- Vercel: https://vercel.com/bioen07s-projects/ibc-lab-works
- Supabase: https://supabase.com/dashboard/project/mjgogarzewxjxohvormk

---

**🎉 BMCP Platform v1.0.0 is ready for production!**
