# Podsumowanie planowania PRD - System handlu ziołami w kolonii górniczej

## <conversation_summary> 

### <decisions>

1. Role w systemie: domyślnie każdy nowy użytkownik ma role **sprzedający** i **kupujący**; rola **gomez** (administrator) nadawana ręcznie bezpośrednio w bazie danych.
2. Trzy stałe obozy (enum): **stary obóz**, **nowy obóz**, **obóz na bagnie**; przy rejestracji użytkownik wybiera obóz (domyślnie "obóz na bagnie").
3. Oferta — obowiązkowe pola i walidacja: **tytuł** (5–20 znaków), **opis** (5–200), **cena** (liczba całkowita, 0–999, jednostka: "magiczna ruda"), **ilość** (1–99), **data utworzenia** (automatycznie), **obóz** pochodzi od obozu sprzedającego.
4. Kupno: tylko **gotówka przy odbiorze** (magiczna ruda). W formularzu zakupu pole płatności jest tylko do odczytu. Kupujący wybiera kuriera z dropdown (pokazywane są tylko imiona wszystkich kurierów w systemie).
5. Kurier: encja (nie użytkownik) z polami **imię** (5–20 znaków), **obóz** (wymagane pole); kurier przypisany do jednego obozu; kurierzy tworzeni/usuwani w widoku "Kurier" widocznym tylko dla użytkownika z rolą gomez.
6. Przepływ zamówienia: oferty mają status **CREATED** → po wybraniu oferty, kliknięciu przycisku "Zamów" i w formularzu zamówienia po kliknięciu" „Kup” status zmienia się na **DONE**; oferty w statusie DONE są ukrywane z widoku listy ofert; zamówienia (historia) są przechowywane w bazie i widoczne w „Kupione” (dla kupującego) oraz „Sprzedane” (dla sprzedającego).
7. Zablokowanie zakupu: jeśli w systemie nie ma żadnych kurierów, pole wyboru kuriera w formularzu zamówienia podświetlane jest na czerwono z komunikatem **"proszę wybrać kuriera"**, a przycisk **Kup** jest nieaktywny; zakup niemożliwy do czasu dodania kuriera przez użytkownika z rolą gomez.
8. Unikalność tożsamości: **login** i **imię** muszą być unikalne; w UI wyświetia się tylko pole **imię** (unikalne).
9. Format daty/timestampów: **yyyy-MM-dd HH:mm:ss**; data dostawy = timestamp momentu kliknięcia „Kup” (dla każdej daty jednostka jest wyświetlana: liczony w dniach kolonii).
10. Wszystkie encje w systemie muszą posiadać pole **id** 

### <matched_recommendations>

1. Zdefiniować kanoniczne schematy danych oferty/zamówienia/użytkownika/kuriera (pole + walidacja) — szczegóły walidacji podano powyżej.
2. Wymusić walidację po stronie klienta & serwera (tytuł, opis, cena, ilość, unikalność loginu/imię) — klienta & serwer zwraca błędy walidacji.
3. Zablokować możliwość zakupu, gdy brak kurierów, oraz jasno komunikować to w UI (czerwone pole + disabled button).
4. Procedura nadawania roli gomez, dopasowano do decyzji: rola gomez nadawana ręcznie, bezpośrednio w DB.
5. Ograniczyć stany domenowe dla ofert do dwóch (CREATED → DONE).
6. Historia zamówień tworzona jest poprzez liste zamówień w bazie danych.
7. Zapisanie formatu timestampów i zasad tworzenia data dostawy jako serwerowego timestampa — (format yyyy-MM-dd HH:mm:ss).
8. Zablokować edycję ofert po sprzedaży i zapobiec usunięciu zamówień z historii: oferty po sprzedaży są usuwane z widoku; zamówienia są zachowane.

### <prd_planning_summary>
Główne wymagania funkcjonalne produktu

* Rejestracja/logowanie: login i hasło (obydwa 5–20 znaków), przypisanie ról domyślnych (sprzedający, kupujący), wybór obozu przy rejestracji (enum, domyślnie "obóz na bagnie"), pole imię (max 50, musi być unikalne).
* Zarządzanie ofertami (sprzedający): CRUD dla ofert z walidacją (tytuł, opis, cena, ilość); UWAGA: po sprzedaży oferta nie jest dostępna w widoku ofert (status DONE → usunięta z listy).
* Zarządzanie kurierami (gomez): tworzenie i usuwanie encji kuriera (id, imię, obóz). Kurierzy nie są użytkownikami.
* Zakupy (kupujący): wybór oferty → formularz zamówienia → wybór kuriera (dropdown z imionami wszystkich kurierów) → klik „Kup” → serwer tworzy zamówienie (data dostawy = timestamp), oferta status -> DONE i znika z listy.
* Historia: widok **Kupione** (dla kupującego): tytuł oferty, ilość, imię sprzedającego, obóz sprzedającego, data dostawy; widok **Sprzedane** (dla sprzedającego): tytuł, ilość, data dostawy.
* Płatności: tylko gotówka przy odbiorze (magiczna ruda) — informacja tylko do odczytu w formularzu zakupu.
* Uprawnienia i reguły domenowe: tylko autor oferty może ją usunąć (jeśli nie została sprzedana); gomez może tworzyć/usunąć kurierów; brak edycji oferty po sprzedaży.

Kluczowe historie użytkownika i ścieżki korzystania

1. Rejestracja i konfiguracja profilu:
    * Użytkownik rejestruje się (login, hasło, wybiera obóz, ustawia imię). Po logowaniu ma role kupujący i sprzedający.
2. Sprzedawca tworzy ofertę:
    * Wypełnia tytuł/ opis/ cena/ ilość → obóz zapisany jako obóz sprzedającego, status oferty zapisywany jako CREATED.
3. Kupujący przegląda oferty:
    * Lista ofert pokazuje tytuł, opis, cenę, ilość, obóz sprzedającego i datę utworzenia.
4. Kupujący zamawia ofertę:
    * Użytkownik zaznacza ofertę i klika przycisk "Zamów" → Otwiera formularz zamówienia → wybiera kuriera z dropdown (jeśli brak kurierów, pole czerwone i button Kup disabled) → klika Kup → system tworzy zamówienie (data dostawy = teraz), status oferty zmienia się na DONE i znika z listy ofert; zamówienie pojawia się w Kupione/Sprzedane.
5. Zarządzanie kurierami przez gomeza:
    * Gomez dodaje/usuwa kurierów; bez kurierów zakup zablokowany.

Ważne kryteria sukcesu i sposoby ich mierzenia

* Kryterium pierwsze: **90% użytkowników posiada wypełnioną sekcję preferencji zakupowych**. Preferencja to tylko i wyłącznie pole "domyślny kurier" — metryka: (liczba kont z ustawionym domyślnym kurierem) / (liczba kont aktywnych).
* Kryterium drugie: **75% użytkowników zamówi ≥1 paczkę w miesiącu** — metryka: (liczba użytkowników z min. 1 zamówień w ostatnich 30 dniach) / (liczba aktywnych użytkowników).

Dane i walidacja (wyciąg istotnych reguł)

* Oferta: { id: unique + bigint, title: string[5–20], description: string[5–200], price: int[1–999], quantity: int[1–99], createdAt: timestamp[yyyy-MM-dd HH:mm:ss], sellerId, sellerCamp: enum(NEW_CAMP, OLD_CAMP, SWAMP_CAMP), status: enum(CREATED, DONE) }.
* Kurier: { id: unique + bigint, name: string[5–20], camp: enum(NEW_CAMP, OLD_CAMP, SWAMP_CAMP) } — name i camp wybierane przy tworzeniu; kurier należy do jednego campu.
* Użytkownik: { id: unique + bigint, login: unique + string[5–20], password: string[5–20], name: unique + string[5–20], camp: enum(NEW_CAMP, OLD_CAMP, SWAMP_CAMP) }.
* Zamówienie: { id: unique + bigint, offerSnapshot(title, quantity, price, sellerName, sellerCamp), buyerId, courierId, deliveredAt: yyyy-MM-dd HH:mm:ss }.
* Reguły transakcyjne: tylko CREATED → DONE; brak edycji oferty po zakupie; jeśli brak kurierów → zakup zablokowany (client + server validation).

Bezpieczeństwo / administracja / operacje

* Rola gomez nadawana manualnie w DB.
* Logika ukrywania ofert: po sprzedaży oferta jest ukrywana i nie wyświetla się w widoku listy, ale zostaje one w bazie danych.
* Oferty z widoku listy (nie zakupione) moga być edytowane/usuwane tylko i wyłącznie przez użytkownika, który utworzył ofertę.

### <unresolved_issues>

1. Procedura produkcyjnego nadawania roli gomez: wiadomo, że rola będzie dodawana bezpośrednio w DB, ale brak decyzji kto (osoba/rola/operacja) i jakie zabezpieczenia/approval workflow będą wymagane w środowisku produkcyjnym.
2. Bezpieczeństwo haseł i auth flows: sposób przechowywania haseł (hashing), mechanizmy resetu hasła i sesje nie zostały określone — wymagane doprecyzowanie w PRD.
3. Brak decyzji o backup/retencji historycznych zamówień (ile dni/lata przechowujemy zamówienia) — przydatne do określenia polityki przechowywania DB.