# Plan implementacji Głównego Układu i Nawigacji

## 1. Przegląd
Ten plan opisuje implementację głównego szablonu (layoutu) aplikacji, który będzie otaczał wszystkie widoki dostępne dla zalogowanego użytkownika. Celem jest stworzenie spójnej i trwałej struktury nawigacyjnej, składającej się z bocznego paska (Sidebar) oraz górnego nagłówka (Header/Navigation Menu). Ten układ będzie odpowiedzialny za renderowanie odpowiednich linków nawigacyjnych, warunkowe wyświetlanie elementów w zależności od roli użytkownika (np. dla 'gomez') oraz zapewnienie dostępu do profilu i funkcji wylogowania.

## 2. Routing widoku
Ten komponent nie jest samodzielnym widokiem, lecz layoutem (szablonem) Astro, który będzie używany przez wszystkie chronione strony w aplikacji, np.:
- `/offers`
- `/orders`
- `/profile/me`
- `/couriers`

Nazwa pliku layoutu: `src/layouts/MainLayout.astro`

## 3. Struktura komponentów
```
src/layouts/MainLayout.astro
└── GlobalStateProvider (React Context Provider)
    └── div (główny kontener flex)
        ├── Sidebar.tsx (Komponent React)
        │   ├── NavLink (do "/offers")
        │   ├── Accordion ("Historia Zamówień")
        │   │   ├── NavLink (do "/orders?view=bought")
        │   │   └── NavLink (do "/orders?view=sold")
        │   └── NavLink (do "/couriers", renderowany warunkowo)
        └── main (główny obszar treści)
            ├── Header.tsx (Komponent React)
            │   └── DropdownMenu (Menu profilu)
            │       ├── DropdownMenuItem (Link do "/profile/me")
            │       └── DropdownMenuItem (Przycisk "Wyloguj")
            └── <slot /> (Tutaj renderowana jest treść konkretnej strony)
```
- **`MainLayout.astro`**: Główny plik layoutu Astro. Jego zadaniem jest weryfikacja sesji użytkownika po stronie serwera, pobranie jego danych i przekazanie ich do komponentów React. Definiuje on także główną strukturę HTML/CSS strony.
- **`GlobalStateProvider`**: Kontekst React, który przechowuje globalny stan użytkownika (profil, role), udostępniając go wszystkim komponentom potomnym za pomocą hooka `useUser()`.
- **`Sidebar.tsx`**: Komponent React renderujący nawigację po lewej stronie.
- **`Header.tsx`**: Komponent React renderujący górny pasek z menu użytkownika.

## 4. Szczegóły komponentów
### `MainLayout.astro`
- **Opis komponentu**: Sercem aplikacji dla zalogowanych użytkowników. Wykonuje logikę po stronie serwera przed wyrenderowaniem strony.
- **Logika (w części frontmatter)**:
    1.  Pobierz sesję użytkownika z Supabase.
    2.  Jeśli brak sesji, przekieruj na `/login`.
    3.  Jeśli sesja istnieje, pobierz profil użytkownika (np. przez `GET /api/profiles/me` lub bezpośrednie zapytanie do DB po stronie serwera).
    4.  Przekaż dane użytkownika (profil, rola) jako `props` do komponentu `GlobalStateProvider`.
- **Główne elementy**: `<Sidebar>`, `<Header>`, `<slot />`.

### `Sidebar.tsx`
- **Opis komponentu**: Interaktywny pasek nawigacyjny.
- **Główne elementy**: Komponenty `Button` lub `Link` do nawigacji, `Accordion` (z Shadcn/ui) dla rozwijanej historii zamówień.
- **Logika warunkowa**: Link do `/couriers` jest renderowany tylko wtedy, gdy dane użytkownika wskazują na posiadanie roli 'gomez'.
- **Propsy**: `user: UserSessionViewModel` (przekazane z `GlobalStateProvider`).

### `Header.tsx`
- **Opis komponentu**: Górny pasek, głównie do obsługi akcji związanych z użytkownikiem.
- **Główne elementy**: `DropdownMenu` (z Shadcn/ui) jako kontener na menu profilu.
- **Obsługiwane interakcje**: 
    - Kliknięcie w link "Profil" nawiguje do `/profile/me`.
    - Kliknięcie w "Wyloguj" wywołuje funkcję `supabase.auth.signOut()` i przekierowuje na stronę logowania.
- **Propsy**: `user: UserSessionViewModel`.

## 5. Typy
- **`UserSessionViewModel`** (nowy typ, do zdefiniowania w `types.ts`):
    ```typescript
    // Agreguje dane z sesji i profilu aplikacji
    export type UserSessionViewModel = {
      id: string; // Supabase user ID
      email?: string;
      name: string; // z profilu
      camp: string; // z profilu
      isGomez: boolean; // flaga określająca rolę
    };
    ```

## 6. Zarządzanie stanem
- **Stan globalny**: Dane zalogowanego użytkownika (`UserSessionViewModel`) będą przechowywane w globalnym kontekście React (`UserContext`).
- **`GlobalStateProvider`**: Komponent ten otrzyma dane z `MainLayout.astro` i zainicjalizuje nimi kontekst.
- **`useUser()` hook**: Niestandardowy hook, który pozwoli komponentom w prosty sposób uzyskać dostęp do danych użytkownika: `const { user, isGomez } = useUser();`.

## 7. Integracja API
- **Po stronie serwera (w `MainLayout.astro`)**:
    - `supabase.auth.getSession()`: Do weryfikacji sesji.
    - Zapytanie o profil użytkownika w celu uzyskania jego nazwy, obozu i roli.
- **Po stronie klienta (w `Header.tsx`)**:
    - `supabase.auth.signOut()`: Do wylogowania.

## 8. Interakcje użytkownika
- **Nawigacja**: Użytkownik klika linki w `Sidebar`, co powoduje zmianę komponentu renderowanego wewnątrz `<slot />`, bez przeładowania paska bocznego i nagłówka.
- **Dostęp do profilu**: Użytkownik klika na swoją nazwę/ikonę w `Header`, rozwija menu i przechodzi do edycji profilu.
- **Wylogowanie**: Użytkownik klika "Wyloguj", jego sesja jest kończona, a on sam jest przekierowywany na stronę logowania.

## 9. Warunki i walidacja
- **Warunek dostępu**: Główna walidacja odbywa się w `MainLayout.astro` – brak sesji oznacza natychmiastowe przekierowanie na `/login`.
- **Warunek roli 'gomez'**: Logika w `Sidebar.tsx` sprawdza flagę `isGomez` z kontekstu użytkownika i na tej podstawie decyduje o renderowaniu linku do `/couriers`.

## 10. Obsługa błędów
- **Błąd pobierania profilu**: Jeśli sesja istnieje, ale nie uda się pobrać profilu (np. błąd bazy danych), `MainLayout.astro` powinien przekierować na stronę błędu lub stronę logowania z odpowiednim komunikatem.

## 11. Kroki implementacji
1.  **Stworzenie `MainLayout.astro`**: Zaimplementuj logikę weryfikacji sesji i pobierania profilu w sekcji frontmatter. Zdefiniuj podstawową strukturę HTML/CSS z miejscem na `Sidebar`, `Header` i `<slot />`.
2.  **Stworzenie Kontekstu Użytkownika**: Stwórz `UserContext`, `GlobalStateProvider` oraz hook `useUser()`.
3.  **Inicjalizacja Kontekstu**: W `MainLayout.astro` opakuj `<slot />` i komponenty nawigacyjne w `GlobalStateProvider`, przekazując pobrane dane użytkownika jako wartość początkową.
4.  **Stworzenie komponentu `Sidebar.tsx`**:
    - Zbuduj strukturę linków nawigacyjnych.
    - Użyj hooka `useUser()`, aby uzyskać dostęp do roli użytkownika i warunkowo wyrenderuj link "Kurierzy".
    - Zaimplementuj logikę podświetlania aktywnego linku na podstawie bieżącej ścieżki URL.
5.  **Stworzenie komponentu `Header.tsx`**:
    - Użyj hooka `useUser()`, aby wyświetlić nazwę użytkownika.
    - Zbuduj `DropdownMenu` z linkiem do profilu i przyciskiem "Wyloguj".
    - Zaimplementuj funkcję `handleLogout`, która wywoła `supabase.auth.signOut()` i przekieruje użytkownika.
6.  **Aktualizacja stron**: Zmodyfikuj wszystkie istniejące strony (np. `/offers.astro`, `/profile/me.astro`), aby używały `MainLayout.astro` jako swojego szablonu.
7.  **Testowanie**: Sprawdź, czy nawigacja działa poprawnie, czy link dla roli 'gomez' jest poprawnie ukrywany/pokazywany, oraz czy proces wylogowania działa zgodnie z oczekiwaniami.
