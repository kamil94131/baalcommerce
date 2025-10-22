<conversation_summary>
<decisions>
1. Zastosowany zostanie układ z bocznym paskiem nawigacyjnym (Sidebar) dla głównych sekcji oraz górnym menu dla linku do profilu.
2. Historia zamówień będzie realizowana jako jedna pozycja w menu ("Historia Zamówień"), prowadząca do strony z zakładkami "Kupione" i "Sprzedane".
3. Błędy globalne (niezwiązane z formularzami) będą obsługiwane przez komponent Alert na górze strony, a błędy walidacji pól formularza będą wyświetlane "inline".
4. Nie zostaną wprowadzone formalne role 'buyer'/'seller'; każdy użytkownik z profilem może kupować i sprzedawać.
5. Widok szczegółów zamówienia (z historii) będzie otwierany jako osobna strona, a nie w oknie modalnym.
6. Komponenty UI będą umieszczane w katalogu ./src/components/ui zgodnie z zasadami projektu.
7. Oferty własne użytkownika w tabeli ofert będą oznaczane za pomocą komponentu Badge z etykietą "(Twoja oferta)".
8. Potwierdzono gotowość do przejścia do etapu implementacji na podstawie ustalonych założeń.
</decisions>

<matched_recommendations>
1. Struktura nawigacji: Zastosowanie centralnego paska bocznego (Sidebar) do nawigacji po kluczowych modułach aplikacji (Oferty, Historia Zamówień, Kurierzy) oraz górnego menu do zarządzania
   profilem użytkownika.
2. Zarządzanie stanem: Utworzenie globalnego stanu (za pomocą React Context lub hooka), który będzie przechowywał dane o uwierzytelnieniu, profilu i rolach użytkownika, pobierając je raz po
   zalogowaniu w celu uniknięcia zbędnych zapytań API.
3. Obsługa ról i uprawnień: Rola 'gomez' będzie odczytywana z custom claims w tokenie JWT Supabase, co pozwoli na warunkowe renderowanie elementów UI, takich jak link do zarządzania
   kurierami.
4. Przepływ tworzenia zamówienia: Przekazywanie offerId do formularza zamówienia za pomocą parametrów zapytania w URL (/orders/new?offerId=...), co uniezależnia komponent formularza od jego
   bezpośredniego kontekstu wywołania.
5. Obsługa przypadków brzegowych w UI: Implementacja logiki blokującej możliwość zakupu, gdy w systemie nie ma dostępnych kurierów (dezaktywacja formularza i wyświetlenie alertu), oraz
   uniemożliwienie zakupu własnej oferty (dezaktywacja opcji wyboru w tabeli).
6. Wykorzystanie komponentów UI: Budowa interfejsu w oparciu o predefiniowany zestaw komponentów z biblioteki Shadcn/ui, takich jak Data Table, Tabs, Alert, Badge, Select i Form, w celu
   zapewnienia spójności wizualnej i funkcjonalnej.
7. Struktura URL: Zastosowanie przejrzystej i REST-owej struktury adresów URL do nawigacji po aplikacji, np. /dashboard/offers, /orders/{id}, /profile/me.
8. Stany puste (Empty States): Projektowanie widoków tabel w taki sposób, aby w przypadku braku danych wyświetlały kontekstowe komunikaty oraz przyciski wzywające do działania (np. "Stwórz
   swoją pierwszą ofertę").
</matched_recommendations>

<ui_architecture_planning_summary>
a. Główne wymagania dotyczące architektury UI
Architektura UI będzie oparta na frameworku Astro dla struktury stron i layoutów oraz React dla dynamicznych komponentów interfejsu. Główny layout dla zalogowanego użytkownika będzie składał
się z bocznego paska nawigacyjnego (Sidebar) i górnego nagłówka. Komponenty UI będą pochodzić z biblioteki Shadcn/ui i znajdować się w katalogu src/components/ui. Routing będzie oparty na
stronach Astro, z jasno zdefiniowaną strukturą URL.

b. Kluczowe widoki, ekrany i przepływy użytkownika
- Logowanie/Rejestracja: Obsługiwane przez Supabase, z obligatoryjnym przekierowaniem na stronę tworzenia profilu (/profile/create) po pierwszej rejestracji.
- Dashboard (`/dashboard/offers`): Domyślny widok po zalogowaniu. Wyświetla listę ofert w Data Table z opcją wyboru pojedynczej oferty. Wiersze z ofertami własnymi użytkownika są
  nieaktywne i oznaczone Badge. Widok zawiera przycisk do tworzenia nowej oferty.
- Tworzenie Zamówienia (`/orders/new?offerId={id}`): Osobna strona-formularz. Pobiera dane oferty na podstawie offerId z URL. Pole wyboru kuriera jest preselekcjonowane, jeśli użytkownik
  ma ustawionego domyślnego kuriera. Formularz jest blokowany, jeśli w systemie nie ma żadnych kurierów.
- Historia Zamówień (`/dashboard/history`): Strona z dwiema zakładkami ("Kupione" i "Sprzedane"), z których każda zawiera Data Table z listą odpowiednich zamówień. Kliknięcie wiersza
  przekierowuje do widoku szczegółów zamówienia.
- Szczegóły Zamówienia (`/orders/{id}`): Strona w trybie tylko do odczytu, prezentująca wszystkie dane historycznego zamówienia.
- Zarządzanie Kurierami (`/dashboard/couriers`): Widok dostępny tylko dla roli 'gomez', umożliwiający operacje CRUD na kurierach.
- Profil Użytkownika (`/profile/me`): Strona umożliwiająca edycję danych profilu (name, camp, defaultCourierId) oraz zawierająca nieedytowalny e-mail i przycisk wylogowania.

c. Strategia integracji z API i zarządzania stanem
Stan sesji użytkownika, jego profil oraz role będą zarządzane globalnie za pomocą React Context lub dedykowanego hooka. Dane te będą pobierane jednorazowo po zalogowaniu. Rola 'gomez'
będzie odczytywana z tokena JWT. Wszystkie interakcje z API (pobieranie, tworzenie, aktualizacja danych) będą realizowane przez dedykowane serwisy lub hooki, z obsługą stanów ładowania
(za pomocą komponentów "skeleton") i błędów (globalne Alert i "inline" przy polach formularzy).

d. Kwestie dotyczące responsywności, dostępności i bezpieczeństwa
Decyzja o użyciu osobnych stron dla formularzy (edycja/tworzenie oferty, tworzenie zamówienia, szczegóły zamówienia) zamiast okien modalnych wspiera responsywność, zwłaszcza na
urządzeniach mobilnych. Wykorzystanie biblioteki Shadcn/ui zapewnia solidną podstawę pod kątem dostępności (WAI-ARIA). Bezpieczeństwo na poziomie UI będzie realizowane przez warunkowe
renderowanie elementów w zależności od roli użytkownika ('gomez') oraz blokowanie akcji (np. zakup własnej oferty) bezpośrednio w interfejsie, co stanowi dodatkową warstwę obrony oprócz
walidacji serwerowej.
</ui_architecture_planning_summary>

<unresolved_issues>
- Brak endpointu API dla ofert użytkownika: Zidentyfikowano brak dedykowanego endpointu API (GET /offers/me lub GET /users/{userId}/offers), który zwracałby oferty tylko dla zalogowanego
  użytkownika. Obecny plan zakłada obejście tego problemu po stronie klienta poprzez pobranie wszystkich ofert z GET /offers i ich przefiltrowanie. Jest to nieefektywne i powinno zostać
  zaadresowane w przyszłym rozwoju API w celu optymalizacji wydajności.
</unresolved_issues>
</conversation_summary>