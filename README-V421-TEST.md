# V4.21 – Schritt 1: Admin-Berechtigungstest

Diese Zwischenversion enthält noch **keine** Erstellung von Kidskonten.

1. Dateien aus diesem ZIP entpacken und in das GitHub-Repository hochladen.
2. GitHub Pages aktualisieren und als Admin anmelden.
3. Im Dashboard auf **KIDS-VERWALTUNG · BERECHTIGUNG TESTEN** klicken.
4. Erwartete Antwort: `Berechtigung bestätigt: admin`.

Die Edge Function `kids-account-admin` muss bereits mit dem Prüfcode veröffentlicht sein. Der Testbutton erscheint nur, wenn die eigene Rolle über `app_roles` lesbar ist. Keine Tokens an andere weitergeben.
