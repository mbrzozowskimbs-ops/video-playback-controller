# Weryfikacja wersji 1.0.0

- 5/5 testów jednostkowych: granice strumienia, pauza, nieskończona długość, przerwy, walidacja wejścia, wybór odtwarzacza.
- Test integracji w przeglądarce na stronie lokalnej, ze stubem API rozszerzeń i kontrolowanym elementem video: panel +10 s (120→130), −60 s (130→70), odtwarzanie, własny skok +45 s (70→115).
- Klawiatura generowana przez Playwright: Alt+Shift+Right (115→125), skrót w polu liczbowym nie zmienił czasu.
- Wiadomość z innym sender.id została zignorowana.
- Przegląd kodu: brak zewnętrznych zależności i połączeń sieciowych, host tylko playnow.pl, bez przechowywania danych i skryptu w tle.
- Dotychczasowy test API samej strony PLAY NOW na Firefox potwierdził przewijanie currentTime oraz dalsze odtwarzanie z DRM. To nie jest jeszcze test zainstalowanego własnego rozszerzenia.
- Test własnego rozszerzenia na rzeczywistym PLAY NOW: wczytane tymczasowo w Firefox 158.0.1 po zgodzie użytkownika. Archiwalny program TVN „Pogoda”: panel rozpoznał pauzę; +1 min na pauzie przesunęło widoczny czas z 00:00:39 do 00:01:39; skróty +10 s i −10 s pokazały potwierdzenia; skrót pauzy/wznowienia działa. Końcowy stan potwierdzony przez panel: „Program jest na pauzie.”

Instalacja tymczasowa wymaga tylko manifest.json; paczka ZIP nie ma podpisu Mozilli.

## Migracja do Maven

Projekt ma standardowe katalogi src/main/extension, src/test/js i src/assembly. Polecenie mvn clean verify uruchomiło 5 testów (5 zaliczonych) i zbudowało ZIP. Sprawdzono komplet 7 plików rozszerzenia w paczce, bez testów i konfiguracji projektu.
