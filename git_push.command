#!/bin/bash
# Questo script fa il PUSH dell'ultimo commit su GitHub.
# Il commit e' gia' stato creato da Claude durante la migrazione.
# Basta fare DOPPIO CLIC su questo file per eseguirlo in Terminal.

cd "$(dirname "$0")"

echo "=== Git push portale-glv → GitHub ==="
echo ""
echo "Ultimo commit locale:"
git log --oneline -1
echo ""
echo "Pushing..."
git push origin main
echo ""
echo "=== FATTO ==="
echo ""
read -p "Premi INVIO per chiudere..." x
