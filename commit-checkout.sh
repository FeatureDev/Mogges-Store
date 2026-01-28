#!/bin/bash
# Commit script for checkout fixes

git add docs/checkout.html
git add docs/js/checkout.js  
git add CHECKOUT_README.md

git commit -m "Fix checkout page - Use real Swish QR image and complete payment system

- Fixed all Swedish character encoding in checkout.html
- Updated checkout.js to use API_BASE_URL from config.js
- Load products from API before displaying order
- Fixed image paths (removed ../ prefix)
- Improved error handling and console logging
- Fixed payment confirmation message
- Added placeholder for missing images
- Changed QR code to use real Swish image (picture/swish-QR.png)
- Created CHECKOUT_README.md with documentation
- calculateTotals now uses orderItems parameter correctly
"

git push origin main
