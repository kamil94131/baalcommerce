# Plan implementacji widoku Profil Użytkownika

## 1. Przegląd
Widok "Profil Użytkownika" to dedykowana strona, na której zalogowany użytkownik może zarządzać danymi swojego profilu. Umożliwia edycję nazwy, obozu oraz ustawienie domyślnego kuriera. Widok ten zawiera również funkcję wylogowania. Formularz jest pre-populowany aktualnymi danymi użytkownika, a zapisanie zmian odbywa się poprzez wysłanie żądania do API.

## 2. Routing widoku
Widok będzie dostępny pod ścieżką:
- `/profile/me`

## 3. Struktura komponentów
```
/profile/me.astro (Astro Page)
└── ProfilUzytkownikaView (React Component)
    ├── SkeletonLoader (dla ładowania danych początkowych)
    ├── ErrorAlert (dla błędów ładowania danych)
    └── ProfileForm (główny formularz)
        ├── Input (dla Nazwy)
        ├── Select (dla Obozu)
        ├── Select (dla Domyślnego kuriera)
        ├── Input (dla E-mail, tylko do odczytu)
        ├── Button (Zapisz zmiany)
        └── LogoutButton (przycisk Wyloguj)
```
- **`ProfilUzytkownikaView`**: Komponent-kontener, który pobiera dane profilu oraz listę kurierów, a następnie przekazuje je do formularza.
- **`ProfileForm`**: Komponent React z logiką formularza, zbudowany przy użyciu `react-hook-form` i `zod` do walidacji po stronie klienta.
- **`LogoutButton`**: Komponent odpowiedzialny za wywołanie funkcji wylogowania z Supabase.

## 4. Szczegóły komponentów
### `ProfilUzytkownikaView`
- **Opis komponentu**: Orkiestruje pobieranie danych potrzebnych do wyświetlenia formularza profilu (dane użytkownika i lista kurierów). Zarządza stanami ładowania i błędów na poziomie całego widoku.
- **Główne elementy**: Wyświetla warunkowo `SkeletonLoader`, `ErrorAlert` lub `ProfileForm`.
- **Obsługiwane interakcje**: Inicjuje pobieranie danych przy montowaniu komponentu.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `ProfileDto`, `CourierDto[]`
- **Propsy**: Brak.

### `ProfileForm`
- **Opis komponentu**: Interaktywny formularz do edycji danych profilowych. Integruje się z `react-hook-form` do zarządzania stanem pól, walidacją i submisją.
- **Główne elementy**: `Form`, `Input`, `Select` i `Button` z biblioteki Shadcn/ui.
- **Obsługiwane interakcje**:
    - `onSubmit`: Po pomyślnej walidacji klienta, wysyła żądanie `PATCH /api/profiles/me` z danymi formularza.
- **Obsługiwana walidacja** (client-side, z użyciem `zod`):
    - `name`: `string().min(5).max(50)`
    - `camp`: `enum(["OLD_CAMP", "NEW_CAMP", "SWAMP_CAMP"])`
    - `defaultCourierId`: `number().positive().optional()`
- **Typy**: `ProfileDto`, `CourierDto[]`, `UpdateProfileCommand`
- **Propsy**:
    - `profile: ProfileDto`: Obiekt z aktualnymi danymi profilu do pre-populacji formularza.
    - `couriers: CourierDto[]`: Lista kurierów do wypełnienia opcji w polu `Select`.

## 5. Typy
- **`ProfileDto`** (z `src/types.ts`): Do odczytu i pre-populacji formularza.
- **`CourierDto`** (z `src/types.ts`): Do wypełnienia listy wyboru domyślnego kuriera.
- **`UpdateProfileCommand`** (z `src/types.ts`): Typ danych wysyłanych w ciele żądania `PATCH`.
- **`UpdateProfileSchema`** (z `src/pages/api/profiles/profile.schema.ts`): Schemat `zod` używany do walidacji zarówno po stronie klienta, jak i serwera.

## 6. Zarządzanie stanem
- **Stan formularza**: Zarządzany przez `react-hook-form`.
- **Stan pobierania danych**: Zarządzany w komponencie `ProfilUzytkownikaView` za pomocą hooka `useProfileData`, który będzie odpowiedzialny za:
    - Równoległe pobranie danych z `GET /api/profiles/me` i `GET /api/couriers`.
    - Zarządzanie stanami `isLoading` i `error`.
    - Zwrócenie połączonych danych jako `ProfileFormViewModel` (`{ profile, couriers }`).
- **Stan submisji**: Prosty stan `isSubmitting: boolean` w `ProfileForm` do blokowania przycisku "Zapisz" podczas wysyłania danych do API.

## 7. Integracja API
- **Pobieranie danych (przy ładowaniu widoku)**:
    1.  `GET /api/profiles/me`: Pobranie danych zalogowanego użytkownika.
    2.  `GET /api/couriers`: Pobranie listy wszystkich dostępnych kurierów.
- **Aktualizacja danych (przy submisji formularza)**:
    - `PATCH /api/profiles/me`:
        - **Ciało żądania**: `UpdateProfileCommand` (zawiera tylko zmienione pola).
        - **Odpowiedź (sukces)**: `200 OK` z zaktualizowanym obiektem `ProfileDto`.
        - **Odpowiedź (błąd)**: `400` (błąd walidacji), `409` (konflikt, nazwa zajęta), `401` (brak autoryzacji).

## 8. Interakcje użytkownika
- **Użytkownik wchodzi na stronę `/profile/me`**: Widok ładuje dane i wyświetla formularz wypełniony jego aktualnymi danymi.
- **Użytkownik modyfikuje dane i klika "Zapisz zmiany"**: Uruchamiana jest walidacja. Jeśli jest poprawna, wysyłane jest żądanie `PATCH`. Po sukcesie wyświetlany jest komunikat (np. Toast) "Profil zaktualizowany".
- **Użytkownik wprowadza nazwę, która jest już zajęta**: Po wysłaniu formularza, API zwraca błąd `409`. Formularz wyświetla komunikat błędu przy polu `name`, np. "Ta nazwa jest już zajęta".
- **Użytkownik klika "Wyloguj"**: Wywoływana jest funkcja `supabase.auth.signOut()`, a użytkownik jest przekierowywany na stronę logowania.

## 9. Warunki i walidacja
- **Warunek dostępu**: Użytkownik musi być zalogowany. Wszystkie wywołania API powinny być chronione.
- **Walidacja po stronie klienta**: `ProfileForm` użyje `zod` i `react-hook-form` do natychmiastowej walidacji pól zgodnie ze schematem `UpdateProfileSchema`, blokując możliwość wysłania niepoprawnego formularza.
- **Walidacja po stronie serwera**: Endpoint `PATCH /api/profiles/me` ponownie waliduje dane, zapewniając integralność danych, nawet jeśli walidacja klienta zostanie pominięta.

## 10. Obsługa błędów
- **Błąd ładowania danych**: Jeśli `GET /api/profiles/me` lub `GET /api/couriers` zawiedzie, `ProfilUzytkownikaView` wyświetli `ErrorAlert` z komunikatem "Nie udało się załadować danych profilu."
- **Błąd walidacji serwera (400)**: Odpowiedź z API powinna zostać zmapowana na błędy w `react-hook-form` przy użyciu `setError`.
- **Konflikt nazwy (409)**: Błąd ten zostanie obsłużony w `onSubmit`, a komunikat o zajętej nazwie zostanie wyświetlony przy odpowiednim polu formularza.
- **Brak autoryzacji (401)**: Globalny handler zapytań powinien przekierować użytkownika na stronę logowania.

## 11. Kroki implementacji
1.  **Stworzenie hooka `useProfileData`**: Zaimplementuj hook do równoległego pobierania danych profilu i kurierów.
2.  **Stworzenie strony `/profile/me.astro`**: Strona będzie renderować komponent `ProfilUzytkownikaView`.
3.  **Stworzenie komponentu `ProfilUzytkownikaView`**: Komponent użyje `useProfileData` i zaimplementuje logikę renderowania warunkowego.
4.  **Stworzenie komponentu `ProfileForm`**:
    - Zintegruj `react-hook-form` z `zod` (`zodResolver`) i schematem `UpdateProfileSchema`.
    - Zbuduj layout formularza używając komponentów Shadcn/ui (`Form`, `Input`, `Select`).
    - Zaimplementuj logikę `onSubmit`, która będzie wysyłać żądanie `PATCH` i obsługiwać błędy (szczególnie `409 Conflict`).
    - Przekaż dane `profile` i `couriers` jako `defaultValues` i opcje do `Select`.
5.  **Stworzenie komponentu `LogoutButton`**: Dodaj przycisk, który po kliknięciu wywoła metodę wylogowania z Supabase i przekieruje użytkownika.
6.  **Dodanie notyfikacji**: Zintegruj system notyfikacji (np. `react-hot-toast`), aby informować użytkownika o pomyślnej aktualizacji profilu.
7.  **Testowanie**: Przetestuj wszystkie ścieżki: pomyślną edycję, błędy walidacji, błąd konfliktu nazwy oraz proces wylogowania.
