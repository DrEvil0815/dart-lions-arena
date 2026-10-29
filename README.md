# Dart Lions Trainings-Arena V1.5

Die Dateien `index.html`, `style.css`, `script.js` direkt im Root des GitHub-Pages-Repositories hochladen.

## Neu
- Handicap aus / manuell / automatisch nach 3-Dart-Average.
- Manuell: feste Startwerte 101, 201, 301, 401, 501 für jeden Spieler.
- Automatisch: höhere Average-Werte führen zu höheren Startpunkten, auch Zwischenwerte (in 5-Punkte-Schritten plus 1).
- Individuelles Single, Master oder Double Out je Spieler bei Handicap.
- Checkout-Vorschläge und Bust-Regeln je Spieler.
- Gesamtscore und Einzeldart-Eingabe im laufenden Match umschaltbar.
- Bei Gesamtscore-Checkout wird die tatsächliche Dartzahl (1–3) und Anzahl Doppelversuche abgefragt; bei plausiblen Finish-Aufnahmen wird nach Doppelversuchen gefragt.
- Doppelquote wird angezeigt, ein Stern markiert unvollständige Erfassung.

## Einschränkung
Aus einem Gesamt-Aufnahmescore sind echte Doppelversuche nicht zuverlässig ableitbar. Einzeldart-Treffer auf Doppel beweisen allein ebenfalls nicht, wie viele Fehlversuche auf Doppel stattgefunden haben. Für eine vollständige Doppelquote müssten auch gezielte Fehlversuche auf Doppel separat erfasst werden. Automatisches Handicap ist eine erste Heuristik, kein kalibriertes Fairnessmodell.
