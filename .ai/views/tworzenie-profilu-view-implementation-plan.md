# Plan implementacji widoku Tworzenie Profilu

## 1. Przegląd
Widok "Tworzenie Profilu" to jednorazowy, obowiązkowy krok dla nowo zarejestrowanych użytkowników. Po pomyślnej rejestracji i pierwszym logowaniu przez Supabase, użytkownik jest kierowany na tę stronę, aby uzupełnić podstawowe dane swojego profilu w aplikacji: unikalną nazwę oraz przynależność do obozu. Dopóki profil nie zostanie utworzony, użytkownik nie ma dostępu do pozostałych funkcji aplikacji.

## 2. Routing widoku
Widok będzie dostępny pod ścieżką:
- `/profile/create`

**Krytyczne wymaganie bezpieczeństwa**: Dostęp do tej ścieżki musi być chroniony. Logika na stronie `.astro` musi weryfikować, czy użytkownik jest zalogowany, ale *nie ma* jeszcze profilu. Użytkownicy z istniejącym profilem muszą być automatycznie przekierowywani do głównego widoku (`/offers`).

## 3. Struktura komponentów
```
/profile/create.astro (Astro Page with access control)
└── TworzenieProfiluView (React Component)
    └── CreateProfileForm
        ├── h2 ("Uzupełnij swój profil")
        ├── p ("To ostatni krok przed rozpoczęciem handlu.")
        ├── Form (z react-hook-form)
        │   ├── Input (dla Nazwy)
        │   └── Select (dla Obozu)
        └── Button ("Stwórz profil")
```
- **`TworzenieProfiluView`**: Główny komponent React, który zawiera formularz i logikę jego wysyłania.
- **`CreateProfileForm`**: Komponent formularza oparty na Shadcn/ui i `react-hook-form`.

## 4. Szczegóły komponentów
### `TworzenieProfiluView`
- **Opis komponentu**: Komponent-kontener, który zarządza procesem tworzenia profilu. Obsługuje stan submisji formularza i komunikację z API.
- **Główne elementy**: Renderuje komponent `CreateProfileForm`.
- **Obsługiwane interakcje**: `onSubmit`: wywołuje `POST /api/profiles` z danymi z formularza.
- **Typy**: `CreateProfileCommand`.
- **Propsy**: Brak.

### `CreateProfileForm`
- **Opis komponentu**: Formularz do wprowadzania nazwy i wyboru obozu. Używa `react-hook-form` do zarządzania stanem i walidacji.
- **Główne elementy**: `Form`, `Input`, `Select`, `Button`.
- **Obsługiwana walidacja** (client-side, `zod`):
    - `name`: `string().min(5, "Nazwa musi mieć co najmniej 5 znaków.").max(50, "Nazwa może mieć maksymalnie 50 znaków.")`
    - `camp`: `enum(["OLD_CAMP", "NEW_CAMP", "SWAMP_CAMP"])`
- **Wartości domyślne**: Pole `camp` powinno mieć domyślnie ustawioną wartość `SWAMP_CAMP`.
- **Typy**: `CreateProfileCommand`.
- **Propsy**: `onSubmit: (data: CreateProfileCommand) => void`, `isSubmitting: boolean`.

## 5. Typy
- **`CreateProfileSchema`** (z `src/pages/api/profiles/profile.schema.ts`): Schemat `zod` używany do walidacji formularza po stronie klienta i serwera.
- **`CreateProfileCommand`** (z `src/types.ts`): Typ danych (`{ name, camp }`) dla ciała żądania `POST /api/profiles`.

## 6. Zarządzanie stanem
- **Stan formularza**: W pełni zarządzany przez `react-hook-form`.
- **Stan submisji**: Prosty stan `isSubmitting: boolean` w `TworzenieProfiluView` do blokowania przycisku i informowania użytkownika o trwającym procesie.

## 7. Integracja API
- **Kontrola dostępu (przed renderowaniem)**:
    - `GET /api/profiles/me`: Wywoływane po stronie serwera w pliku `.astro`. Jeśli zwróci `200 OK`, oznacza to, że profil istnieje, i następuje przekierowanie do `/offers`. Jeśli zwróci `404 Not Found`, strona jest renderowana.
- **Tworzenie profilu (po submisji formularza)**:
    - `POST /api/profiles`:
        - **Ciało żądania**: `CreateProfileCommand` (`{ name, camp }`).
        - **Po sukcesie (`201 Created`)**: Użytkownik jest przekierowywany do głównego widoku aplikacji (`/offers`).

## 8. Interakcje użytkownika
- **Nowy użytkownik wchodzi na stronę**: Widzi formularz z prośbą o uzupełnienie profilu.
- **Użytkownik wypełnia formularz i klika "Stwórz profil"**: Dane są walidowane. Po pomyślnej submisji, profil jest tworzony, a użytkownik trafia na stronę główną.
- **Użytkownik wprowadza zajętą nazwę**: Po wysłaniu formularza, API zwraca błąd `409 Conflict`. Formularz wyświetla błąd przy polu `name`: "Ta nazwa jest już zajęta."

## 9. Warunki i walidacja
- **Warunek dostępu**: Tylko uwierzytelnieni użytkownicy bez istniejącego profilu mogą uzyskać dostęp do tej strony.
- **Walidacja formularza**: Walidacja `name` i `camp` jest realizowana po stronie klienta za pomocą `zod` i `react-hook-form`, a następnie powtórzona na serwerze.

## 10. Obsługa błędów
- **Użytkownik z profilem na stronie `/profile/create`**: Automatyczne przekierowanie do `/offers`.
- **Błąd walidacji serwera (400)**: Błędy są mapowane na odpowiednie pola formularza.
- **Konflikt nazwy (409)**: `react-hook-form` (`setError`) jest używany do wyświetlenia błędu przy polu `name`.
- **Inne błędy serwera (500)**: Wyświetlenie ogólnego komunikatu o błędzie w komponencie `Alert`.

## 11. Kroki implementacji
1.  **Zabezpieczenie ścieżki**: W pliku `/src/pages/profile/create.astro`, w części frontmatter, dodać logikę, która sprawdza sesję użytkownika i istnienie profilu. Jeśli profil istnieje, wykonaj `Astro.redirect('/offers')`.
2.  **Stworzenie komponentu `TworzenieProfiluView`**:
    - Zaimplementuj handler `onSubmit`, który wywołuje `POST /api/profiles`.
    - Obsłuż stany `isSubmitting` i `error`.
    - Zarządzaj przekierowaniem po udanym utworzeniu profilu.
3.  **Stworzenie komponentu `CreateProfileForm`**:
    - Zintegruj `react-hook-form` z `zodResolver` i `CreateProfileSchema`.
    - Ustaw `defaultValues` dla formularza, w szczególności `camp: 'SWAMP_CAMP'`.
    - Zbuduj layout formularza z komponentów Shadcn/ui.
    - Zaimplementuj logikę wyświetlania błędów walidacji (zarówno od `zod`, jak i z API).
4.  **Renderowanie w Astro**: W pliku `create.astro` wyrenderuj komponent `TworzenieProfiluView`.
5.  **Testowanie**: Sprawdź ścieżkę dla nowego użytkownika. Przetestuj przekierowanie dla istniejącego użytkownika. Sprawdź walidację formularza i obsługę błędu konfliktu nazwy.
