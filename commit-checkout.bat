@echo off
echo === Committing Checkout Fixes ===

git add docs/checkout.html
git add docs/js/checkout.js
git add CHECKOUT_README.md
git add CHECKOUT_STATUS.md
git add commit-checkout.sh
git add commit-checkout.bat

git commit -m "Fix checkout page - Use real Swish QR image and complete payment system"

git push origin main

echo === Done! ===
pause
