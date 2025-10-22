# Architektura UI dla BaalCommerce

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika (UI) dla BaalCommerce jest oparta na frameworku Astro, który zarządza stronami i layoutami, oraz na React, który jest używany do budowy dynamicznych, interaktywnych komponentów. Centralnym elementem dla zalogowanego użytkownika jest główny layout, składający się z bocznego paska nawigacyjnego (Sidebar) do poruszania się po głównych modułach aplikacji oraz górnego nagłówka (Header) z dostępem do profilu użytkownika.

Routing oparty jest na stronach Astro, co zapewnia przejrzystą i REST-ową strukturę adresów URL. Zarządzanie stanem globalnym, takim jak dane sesji, profil użytkownika i jego role (np. 'gomez'), będzie realizowane za pomocą React Context lub dedykowanego hooka, aby zminimalizować liczbę zapytań do API. Komponenty UI pochodzą z biblioteki Shadcn/ui, co gwarantuje spójność wizualną i funkcjonalną oraz wysoki poziom dostępności. Architektura kładzie nacisk na responsywność, obsługę przypadków brzegowych (np. brak kurierów) oraz bezpieczeństwo poprzez warunkowe renderowanie elementów UI w zależności od uprawnień użytkownika.

## 2. Lista widoków

### Nazwa widoku: Logowanie / Rejestracja
- **Ścieżka widoku:** `/login` (lub obsługa przez komponent Supabase UI)
- **Główny cel:** Uwierzytelnienie użytkownika lub umożliwienie mu rejestracji w systemie.
- **Kluczowe informacje do wyświetlenia:** Pola na e-mail i hasło, przyciski "Zaloguj" i "Zarejestruj", link do resetowania hasła.
- **Kluczowe komponenty widoku:** Formularz, Pola tekstowe (Input), Przyciski (Button).
- **UX, dostępność i względy bezpieczeństwa:** Proces jest w pełni obsługiwany przez Supabase Auth, co zapewnia bezpieczeństwo. Po pierwszej rejestracji użytkownik jest automatycznie przekierowywany do widoku tworzenia profilu.

### Nazwa widoku: Tworzenie profilu
- **Ścieżka widoku:** `/profile/create`
- **Główny cel:** Wymuszenie na nowym użytkowniku uzupełnienia danych profilowych (nazwa, obóz), co jest krokiem niezbędnym do aktywacji konta w aplikacji.
- **Kluczowe informacje do wyświetlenia:** Formularz z polem na unikalną nazwę (`name`) i wyborem obozu (`camp`).
- **Kluczowe komponenty widoku:** Formularz (Form), Pole tekstowe (Input), Lista wyboru (Select), Przycisk (Button).
- **UX, dostępność i względy bezpieczeństwa:** Widok jest obowiązkowy dla nowych użytkowników. Walidacja po stronie klienta i serwera zapewnia unikalność nazwy i poprawność danych.

### Nazwa widoku: Panel Główny / Lista Ofert
- **Ścieżka widoku:** `/offers`
- **Główny cel:** Wyświetlenie listy wszystkich aktywnych ofert dostępnych do zakupu. Jest to domyślny widok po zalogowaniu.
- **Kluczowe informacje do wyświetlenia:** Tabela ofert z kolumnami: `Tytuł`, `Cena`, `Ilość`, `Sprzedawca`, `Obóz sprzedawcy`, `Data utworzenia`.
- **Kluczowe komponenty widoku:** Tabela danych (Data Table), Przycisk ("Stwórz nową ofertę"), Etykieta (Badge).
- **UX, dostępność i względy bezpieczeństwa:**
    - Oferty własne użytkownika są nieaktywne i oznaczone etykietą "(Twoja oferta)", co zapobiega zakupowi własnych przedmiotów (US-015).
    - Widok obsługuje stan pusty, wyświetlając zachętę do stworzenia pierwszej oferty, gdy lista jest pusta.
    - Kliknięcie wiersza oferty (niebędącej własnością użytkownika) przenosi do widoku tworzenia zamówienia.

### Nazwa widoku: Tworzenie / Edycja Oferty
- **Ścieżka widoku:** `/offers/new`, `/offers/{id}/edit`
- **Główny cel:** Umożliwienie użytkownikowi stworzenia nowej oferty sprzedaży lub edycji już istniejącej.
- **Kluczowe informacje do wyświetlenia:** Formularz z polami: `Tytuł`, `Opis`, `Cena`, `Ilość`.
- **Kluczowe komponenty widoku:** Formularz (Form), Pola tekstowe (Input, Textarea), Przycisk (Button), `AlertDialog` do potwierdzenia usunięcia.
- **UX, dostępność i względy bezpieczeństwa:** Ścieżka edycji (`/offers/{id}/edit`) wstępnie wypełnia formularz danymi oferty. Usunięcie oferty jest możliwe tylko z tego widoku i wymaga dodatkowego potwierdzenia. Edycja jest zablokowana, jeśli oferta została już sprzedana.

### Nazwa widoku: Tworzenie Zamówienia
- **Ścieżka widoku:** `/orders/new?offerId={id}`
- **Główny cel:** Sfinalizowanie zakupu wybranej oferty poprzez wybór kuriera.
- **Kluczowe informacje do wyświetlenia:** Dane oferty (tylko do odczytu), informacja o płatności (stała, nie zmienna, tylko do odczytu, nie jest częścią modelu) ("gotówka przy odbiorze"), lista rozwijana do wyboru kuriera.
- **Kluczowe komponenty widoku:** Formularz (Form), Lista wyboru (Select), Przycisk ("Kup"), Alert.
- **UX, dostępność i względy bezpieczeństwa:**
    - `offerId` jest przekazywane w ciele zapytania, uniezależniając komponent od kontekstu.
    - Pole wyboru kuriera jest preselekcjonowane, jeśli użytkownik ustawił domyślnego kuriera w profilu (US-003).
    - **Przypadek brzegowy (US-010):** Jeśli w systemie nie ma żadnych kurierów, pole wyboru i przycisk "Kup" są zablokowane, a na górze strony wyświetlany jest wyraźny alert.

### Nazwa widoku: Kupione
- **Ścieżka widoku:** `/orders?view=bought`
- **Główny cel:** Wyświetlenie historii transakcji użytkownika (zakupione oferty - zamowienia).
- **Kluczowe informacje do wyświetlenia:**
    - Tabela z kolumnami: `Tytuł`, `Ilość`, `ID sprzedawcy`, `Nazwa sprzedawcy`, `Obóz sprzedawcy`,  `Data dostawy`.
- **Kluczowe komponenty widoku:** Tabela danych (Data Table).
- **UX, dostępność i względy bezpieczeństwa:** Kliknięcie wiersza w tabeli przenosi do widoku szczegółów danego zamówienia. Dane są historyczne i nie można ich modyfikować.

### Nazwa widoku: Sprzedane
- **Ścieżka widoku:** `/orders?view=sold`
- **Główny cel:** Wyświetlenie historii transakcji użytkownika(sprzedane oferty - zamowienia).
- **Kluczowe informacje do wyświetlenia:**
    - Tabela z kolumnami: `Tytuł`, `Ilość`, `ID kupującego`, `Nazwa kupującego`, `Obóz kupującego`,  `Data dostawy`.
- **Kluczowe komponenty widoku:** Tabela danych (Data Table).
- **UX, dostępność i względy bezpieczeństwa:** Kliknięcie wiersza w tabeli przenosi do widoku szczegółów danego zamówienia. Dane są historyczne i nie można ich modyfikować.

### Nazwa widoku: Szczegóły Zamówienia
- **Ścieżka widoku:** `/orders/{id}`
- **Główny cel:** Prezentacja wszystkich szczegółów historycznego zamówienia w trybie tylko do odczytu.
- **Kluczowe informacje do wyświetlenia:** Pełne dane zamówienia, w tym `tytuł`, `cena`, `ilość`, dane sprzedawcy i kupującego, wybrany kurier i data dostawy.
- **Kluczowe komponenty widoku:** Karta (Card), Lista opisowa (Description List).
- **UX, dostępność i względy bezpieczeństwa:** Widok jest osobną stroną, co poprawia responsywność i dostępność na urządzeniach mobilnych.

### Nazwa widoku: Profil Użytkownika
- **Ścieżka widoku:** `/profile/me`
- **Główny cel:** Umożliwienie użytkownikowi edycji jego danych profilowych oraz wylogowanie się z systemu.
- **Kluczowe informacje do wyświetlenia:** Formularz z edytowalnymi polami (`Nazwa`, `Obóz`, `Domyślny kurier`) oraz polem tylko do odczytu (`E-mail`).
- **Kluczowe komponenty widoku:** Formularz (Form), Pole tekstowe (Input), Lista wyboru (Select), Przyciski ("Zapisz", "Wyloguj").
- **UX, dostępność i względy bezpieczeństwa:** Zmiany w profilu są zapisywane za pomocą wywołania `PATCH /profiles/me`.

### Nazwa widoku: Zarządzanie Kurierami
- **Ścieżka widoku:** `/couriers`
- **Główny cel:** Umożliwienie administratorowi (rola 'gomez') zarządzania kurierami (dodawanie, usuwanie).
- **Kluczowe informacje do wyświetlenia:** Tabela z listą istniejących kurierów, formularz do dodawania nowego kuriera.
- **Kluczowe komponenty widoku:** Tabela danych (Data Table), Formularz (Form), Pole tekstowe (Input), Przycisk (Button).
- **UX, dostępność i względy bezpieczeństwa:** Dostęp do tego widoku jest ściśle chroniony i możliwy tylko dla użytkowników z rolą 'gomez'. Link do tej strony w nawigacji jest renderowany warunkowo.

## 3. Mapa podróży użytkownika

Główny przypadek użycia - zakup przedmiotu:
1.  **Logowanie:** Użytkownik loguje się na stronie `/login`.
2.  **Przeglądanie ofert:** Po zalogowaniu zostaje przekierowany na `/offers`, gdzie widzi tabelę z ofertami. Oferty własne są oznaczone i nieaktywne.
3.  **Wybór oferty:** Użytkownik klika wiersz z interesującą go ofertą.
4.  **Przejście do formularza zamówienia:** Aplikacja nawiguje na stronę `/orders/new?offerId={id_oferty}`.
5.  **Wybór kuriera:** Na stronie zamówienia użytkownik widzi dane oferty (tylko do odczytu) i wybiera kuriera z listy rozwijanej. Jeśli ma ustawionego domyślnego kuriera, jest on automatycznie wybrany.
6.  **Finalizacja zakupu:** Użytkownik klika przycisk "Kup". Aplikacja wysyła żądanie `POST /orders`.
7.  **Potwierdzenie i przekierowanie:** Po pomyślnym utworzeniu zamówienia, użytkownik jest przekierowywany do widoku kupionych przedmiotów (`/orders?view=bought`), gdzie widzi swoją nową transakcję.

## 4. Układ i struktura nawigacji

Nawigacja w aplikacji jest spójna i oparta na głównym layoucie, który zawiera:
- **Boczny pasek nawigacyjny (Sidebar):** Główne menu aplikacji, widoczne po lewej stronie.
    - **Oferty:** Link do `/offers`.
    - **Historia Zamówień:** Element rodzic, ktory po rozwinięciu zawiera wewnętrzne elementy, które kieruja do stron:
        - **Kupione:** Link do `/orders?view=bought`, zawiera tabele z kolumnami: `Tytuł`, `Ilość`, `ID sprzedawcy`, `Nazwa sprzedawcy`, `Obóz sprzedawcy`,  `Data dostawy`.
        - **Sprzedane:** Link do `/orders?view=sold`, zawiera tabele z kolumnami: `Tytuł`, `Ilość`, `ID kupującego`, `Nazwa kupującego`, `Obóz kupującego`,  `Data dostawy`.
    - **Kurierzy:** Link do `/couriers` (widoczny **tylko** dla użytkowników z rolą 'gomez').
- **Górny nagłówek (Header):** Pasek na górze strony, ktory wyswietla elementy po prawej stronie:.
    - **Menu profilu:** Ikona, która rozwija menu z linkami:
        - **Profil:** Link do `/profile/me`.
        - **Wyloguj:** Przycisk do wylogowania.
- **Globalny kontener na alerty:** Obszar pod górnym nagłówkiem, przeznaczony do wyświetlania globalnych powiadomień i błędów (np. o braku dostępnych kurierów).

## 5. Kluczowe komponenty

Poniższe komponenty z biblioteki Shadcn/ui będą stanowić podstawę interfejsu użytkownika:
- **Data Table:** Do wyświetlania list (oferty, historia zamówień, kurierzy) z możliwością sortowania.
- **DropdownMenu:** Do tworzenia rozwijanych menu, np. dla "Historii Zamówień" w pasku bocznym oraz dla menu profilu użytkownika w nagłówku (Header).
- **Form / Input / Select / Textarea:** Do budowy wszystkich formularzy w aplikacji, zintegrowane z `react-hook-form` i Zod do walidacji po stronie klienta.
- **Alert / AlertDialog:** `Alert` do wyświetlania ważnych komunikatów (np. błędy globalne), `AlertDialog` do potwierdzania operacji destrukcyjnych (np. usunięcie oferty).
- **Badge:** Do wizualnego oznaczania specjalnych elementów, np. "(Twoja oferta)" w tabeli ofert.
- **Button:** Standardowy komponent do wszystkich interaktywnych akcji.
- **Skeleton:** Do wyświetlania stanu ładowania danych w tabelach i widokach szczegółów, co poprawia odczucia użytkownika (UX).
- **Header:** Komponent do budowy górnego paska (nagłówka), zawierającego menu profilu użytkownika. Menu profilu zostanie zaimplementowane przy użyciu komponentu `DropdownMenu`.
- **Sidebar:** Komponent do budowy bocznego paska nawigacyjnego, który jest głównym menu aplikacji.
- **Card / Description List:** Do estetycznej prezentacji danych tylko do odczytu, np. w szczegółach zamówienia.