# video-playback-controller

Własny pilot do PLAY NOW w Firefoksie. Wersja 1.5.0-SNAPSHOT.

Przyciski ±10 sekund, ±1 minuta, własny skok 1–900 sekund oraz odtwarzanie/pauza.
Sterowanie działa także podczas pauzy. Panel otwiera się po kliknięciu ikony dodatku.

Po ruchu myszy nad wideo pojawia się też pasek z przyciskami −1 min, −10 s, odtwarzanie/pauza, +10 s i +1 min.
Pasek znika po 2,5 s bez ruchu myszy i działa również na pełnym ekranie.

## Budowanie przez Maven

Wymagania: Maven 3.6.3+, JDK 8+ (do uruchomienia Mavena) oraz Node.js 18+ w PATH (testy JavaScript). Nie trzeba instalować zależności npm.

```sh
mvn clean verify
```

Maven uruchamia testy w fazie `test`, przygotowuje katalog `target/extension` i tworzy `target/video-playback-controller-1.5.0-SNAPSHOT-firefox.zip` w fazie `package`.

- `mvn test` — same testy.
- `mvn package -DskipTests` — pakowanie bez testów.
- `mvn verify -Dnode.executable=/pełna/ścieżka/do/node` — jawna ścieżka do Node.js.

Projekt ma `packaging=pom`, ponieważ produktem jest paczka WebExtension ZIP. Nie generuje pustego JAR-a. Paczka ZIP zawiera wyłącznie pliki rozszerzenia, z manifestem w katalogu głównym.

Struktura:

```text
pom.xml
src/main/extension/  — kod i manifest dodatku
src/test/js/         — testy JavaScript
src/assembly/        — definicja paczki ZIP
```

## Instalacja do testów

1. Otwórz `about:debugging#/runtime/this-firefox` w Firefoksie.
2. Wybierz „Wczytaj tymczasowy dodatek…” i po `mvn package` wskaż `target/extension/manifest.json`.
3. Odśwież kartę PLAY NOW, uruchom program i otwórz ikonę „video-playback-controller” w menu rozszerzeń.

Tymczasowa instalacja znika po restarcie Firefoksa. Zwykła trwała instalacja wymaga podpisania paczki przez Mozillę, np. przez dystrybucję niepubliczną w AMO. Ta paczka nie jest podpisana; nie należy wyłączać weryfikacji podpisów.

Dokumentacja: https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/

## Automatyczne wydania

Workflow GitHub Actions w `.github/workflows/release.yml` (taki sam jak w gitlab-mr-checker)
uruchamia się po zmianie `main`. Najpierw uruchamia testy, w tym zgodność wersji w `pom.xml`,
`package.json` i `src/main/extension/manifest.json`. Następnie pyta API AMO, czy wersja już istnieje.

Nową wersję workflow pakuje, podpisuje w AMO jako niepubliczną (kanał `unlisted`, czekanie
do 60 minut), po czym tworzy GitHub Release z tagiem `vX.Y.Z` i plikami
`video-playback-controller-X.Y.Z-firefox.zip` oraz podpisanym `video-playback-controller-X.Y.Z-firefox.xpi`.
Wersji już obecnej w AMO nie przesyła ponownie; jeśli brakuje jej wydania na GitHubie,
kończy się ostrzeżeniem.

Wymagane sekrety Actions: `AMO_JWT_ISSUER` i `AMO_JWT_SECRET`
z [poświadczeń API AMO](https://addons.mozilla.org/developers/addon/api/key/).

Na `develop` `pom.xml` i `package.json` mają wersję `X.Y.Z-SNAPSHOT`, a `manifest.json` samo `X.Y.Z`
(Firefox przyjmuje tylko liczby). Aby wydać wersję, usuń `-SNAPSHOT` z `pom.xml` i `package.json`
i zmerguj do `main`. Workflow odmawia wydania wersji `-SNAPSHOT`.
Numer musi być wyższy niż poprzednia wersja w AMO. Gdy podpis nie zmieści się w limicie,
nie ponawiaj zadania (AMO odrzuci ten sam numer): pobierz XPI z panelu AMO i utwórz wydanie ręcznie,
np. `gh release create v1.0.1 video-playback-controller-1.0.1-firefox.zip video-playback-controller-1.0.1-firefox.xpi --target <commit>`.
Automatyczne aktualizacje: manifest ma `gecko.update_url` wskazujący `updates.json` z najnowszego GitHub Release
(`releases/latest/download/updates.json`). Workflow dołącza ten plik do każdego wydania; wskazuje on podpisany XPI.
Firefox sprawdza aktualizacje mniej więcej raz na dobę; ręcznie: `about:addons` → ⚙ → „Sprawdź dostępność aktualizacji”.
Wersje starsze niż 1.3.0 nie mają `update_url`, więc 1.3.0 trzeba raz zainstalować ręcznie z pliku XPI.

## Klawiatura

- Alt + Shift + lewo/prawo: −10 / +10 sekund.
- Alt + Shift + dół/góra: −1 / +1 minuta.
- Alt + Shift + spacja: odtwarzanie/pauza.
- Na Macu Alt oznacza Option (⌥). Aktywna musi być karta PLAY NOW. Skróty nie przechwytują wpisywania w formularzach ani przytrzymania klawisza.

## Prywatność i ograniczenia

- Jedyny host: `https://playnow.pl/*`; bez dostępu do innych domen, ciasteczek, historii, schowka, pobierania ani konta.
- Bez zapisu danych, telemetrii, zewnętrznych bibliotek, połączeń sieciowych i skryptu w tle.
- Dostęp do PLAY NOW technicznie umożliwia odczyt i modyfikację jego treści. Kod używa go do wyszukiwania widocznego wideo, sterowania odtwarzaniem oraz wyświetlania informacji.
- Polecenia dotyczą największego widocznego wideo w głównej ramce strony. Odtwarzacze w obcych ramkach nie są obsługiwane.
- Nie przechwytuje strumienia, nie odczytuje kluczy DRM i nie zmienia uprawnień konta. Ograniczenia serwera nadal obowiązują.
- Nie pokazuje suwaka z procentami: PLAY NOW potrafi zgłaszać nieskończoną długość strumienia. Skoki względne unikają tej niejednoznaczności.
- Istniejący dodatek do kółka myszy jest niezależny; ten dodatek nie obsługuje przewijania kółkiem ani touchpadem.

## Weryfikacja

`mvn clean verify`. Opcjonalnie same testy Node: `npm test`.

Przed podpisaniem: test na działającym PLAY NOW w Firefoksie (panel, pasek nad wideo także na pełnym ekranie, skróty, oba kierunki, pauza, brak programu, inne strony).
