# V4.20 – Statistiken für beide registrierte Spieler

- Bei „Registrierter Benutzer“ meldet sich Spieler 2 mit seinem eigenen Supabase-Konto an. Die Sitzung von Spieler 1 bleibt unverändert.
- Die Anmeldung von Spieler 2 bleibt nur im Arbeitsspeicher bis zum Matchende erhalten; das Passwort wird nach Prüfung aus dem Formular entfernt.
- Nach Matchende werden zwei Datensätze mit derselben `match_key` geschrieben: jeder Spieler über seinen eigenen authentifizierten Supabase-Client und dessen RLS-Berechtigungen.
- Gäste und Bots werden weiterhin nur für Spieler 1 gespeichert.
- Bei Fehlern wird gewarnt. **Zwei getrennte Datenbank-Inserts sind nicht atomar**: Bei Netzfehlern kann ein Profil bereits gespeichert sein. Bitte vor einem erneuten Spiel die Daten prüfen.
- Voraussetzung: Die bestehende Tabelle `arena_matches` und die RLS-Policies aus V4.18 sind eingerichtet. Es ist **kein weiteres SQL** nötig, sofern jeder angemeldete Benutzer nur Datensätze mit seiner eigenen `owner_id` und seinem eigenen `profile_id` einfügen darf.
- Test: Zwei unterschiedliche registrierte Konten verwenden, Match abschließen, danach jedes Konto einzeln öffnen und Dashboard-Gesamtwerte kontrollieren.
