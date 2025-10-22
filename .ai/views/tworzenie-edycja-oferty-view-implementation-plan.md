# Plan implementacji widoku Tworzenie / Edycja Oferty

## 1. Przegląd
Widok "Tworzenie / Edycja Oferty" to dynamiczny formularz służący do zarządzania ofertami. Działa w dwóch trybach: "tworzenia" (na ścieżce `/offers/new`) i "edycji" (na `/offers/{id}/edit`). W trybie edycji formularz jest wstępnie wypełniony danymi istniejącej oferty, a użytkownik zyskuje możliwość jej usunięcia. Widok ten jest kluczowy dla sprzedających, umożliwiając im wystawianie przedmiotów na sprzedaż.

## 2. Routing widoku
Widok będzie obsługiwał dwie ścieżki za pomocą jednego komponentu:
- `/offers/new` (tryb tworzenia)
- `/offers/{id}/edit` (tryb edycji)

## 3. Struktura komponentów
```
/offers/new.astro, /offers/[id]/edit.astro (Strony Astro)
└── OfferFormView (React Component)
    ├── SkeletonLoader (dla trybu edycji)
    ├── ErrorAlert (dla błędów, np. oferta nie znaleziona)
    └── OfferForm (właściwy formularz)
        ├── Input (Tytuł)
        ├── Textarea (Opis)
        ├── Input (Cena)
        ├── Input (Ilość)
        ├── Button (Zapisz / Stwórz)
        └── Button (Usuń, tylko w trybie edycji)
            └── DeleteOfferDialog (okno potwierdzenia)
```
- **`OfferFormView`**: Komponent-kontener, który rozróżnia tryb działania (tworzenie/edycja) na podstawie URL, pobiera dane w trybie edycji i zarządza logiką submisji oraz usuwania.
- **`OfferForm`**: Generyczny komponent formularza, zbudowany z `react-hook-form`, przyjmujący wartości domyślne i informację o trybie edycji.
- **`DeleteOfferDialog`**: Komponent `AlertDialog` z Shadcn/ui do potwierdzania operacji usunięcia.

## 4. Szczegóły komponentów
### `OfferFormView`
- **Opis komponentu**: Główny komponent widoku. Sprawdza obecność `id` w URL, aby zdecydować o trybie. W trybie edycji, używa hooka `useOffer` do pobrania danych oferty. Obsługuje logikę wywołania odpowiedniego API (`POST`, `PATCH`, `DELETE`).
- **Główne elementy**: Wyświetla warunkowo `SkeletonLoader`, `ErrorAlert` lub `OfferForm`.
- **Obsługiwane interakcje**: 
    - `onSubmit`: Wywołuje `POST /api/offers` (tworzenie) lub `PATCH /api/offers/{id}` (edycja).
    - `onDelete`: Wywołuje `DELETE /api/offers/{id}`.
- **Typy**: `OfferDto`, `CreateOfferCommand`, `UpdateOfferCommand`.
- **Propsy**: `offerId?: string` (przekazane z Astro page).

### `OfferForm`
- **Opis komponentu**: Komponent formularza z polami i walidacją po stronie klienta.
- **Główne elementy**: `Form`, `Input`, `Textarea`, `Button` z Shadcn/ui.
- **Obsługiwane interakcje**: Przekazuje dane formularza do rodzica przez `onSubmit`.
- **Obsługiwana walidacja** (client-side, `zod`):
    - `title`: `string().min(5).max(20)`
    - `description`: `string().min(5).max(200)`
    - `price`: `number().int().min(0).max(999)`
    - `quantity`: `number().int().min(1).max(99)`
- **Typy**: `CreateOfferCommand`
- **Propsy**:
    - `defaultValues?: Partial<CreateOfferCommand>`: Wartości do pre-populacji formularza.
    - `isEditMode: boolean`: Flaga do warunkowego renderowania np. przycisku "Usuń".
    - `onSubmit: (data) => void`: Funkcja zwrotna wywoływana po pomyślnej walidacji.
    - `onDelete?: () => void`: Funkcja zwrotna do obsługi usuwania.

## 5. Typy
- **`CreateOfferSchema`** (z `src/pages/api/offers/offer.schema.ts`): Schemat `zod` używany do walidacji formularza.
- **`OfferDto`** (z `src/types.ts`): Do odczytu danych oferty w trybie edycji.
- **`CreateOfferCommand`** (z `src/types.ts`): Typ danych dla `POST /offers`.
- **`UpdateOfferCommand`** (z `src/types.ts`): Typ danych dla `PATCH /offers/{id}`.

## 6. Zarządzanie stanem
- **Stan formularza**: Zarządzany przez `react-hook-form` z `zodResolver`.
- **Stan pobierania danych (tryb edycji)**: Obsłużony przez dedykowany hook `useOffer(id)`, który zarządza stanami `data`, `isLoading`, `error`.
- **Stan UI**: Proste stany `useState` w `OfferFormView` do zarządzania submisją (`isSubmitting`) i oknem dialogowym usuwania (`isDeleteDialogOpen`).

## 7. Integracja API
- **Tryb tworzenia**:
    - `POST /api/offers`: Wysyłane po submisji formularza.
- **Tryb edycji**:
    - `GET /api/offers/{id}`: Pobieranie danych do pre-populacji formularza.
    - `PATCH /api/offers/{id}`: Wysyłane po submisji formularza.
    - `DELETE /api/offers/{id}`: Wysyłane po potwierdzeniu w oknie dialogowym.
- **Po sukcesie** (dla `POST`, `PATCH`, `DELETE`), użytkownik jest przekierowywany do `/offers`.

## 8. Interakcje użytkownika
- **Użytkownik wchodzi na `/offers/new`**: Widzi pusty formularz z przyciskiem "Stwórz ofertę".
- **Użytkownik wchodzi na `/offers/{id}/edit`**: Widzi formularz wypełniony danymi oferty oraz przyciski "Zapisz zmiany" i "Usuń ofertę".
- **Użytkownik klika "Usuń ofertę"**: Otwiera się okno dialogowe z prośbą o potwierdzenie.
- **Użytkownik potwierdza usunięcie**: Oferta jest usuwana, a użytkownik jest przekierowywany na listę ofert.
- **Użytkownik zapisuje formularz**: Dane są walidowane i wysyłane do API. Po sukcesie następuje przekierowanie.

## 9. Warunki i walidacja
- **Warunek dostępu**: Użytkownik musi być zalogowany. API dodatkowo weryfikuje, czy użytkownik jest właścicielem oferty przy edycji/usuwaniu.
- **Walidacja klienta**: `react-hook-form` i `zod` zapewniają natychmiastową informację zwrotną o błędach w formularzu, zgodnie z `CreateOfferSchema`.
- **Walidacja serwera**: API ponownie waliduje dane, zapewniając spójność danych.

## 10. Obsługa błędów
- **Błąd pobierania danych (tryb edycji)**:
    - `404 Not Found`: `OfferFormView` wyświetli `ErrorAlert` z komunikatem "Oferta nie została znaleziona."
    - `403 Forbidden`: `ErrorAlert` z komunikatem "Nie masz uprawnień do edycji tej oferty."
- **Błąd submisji**:
    - `409 Conflict` (próba modyfikacji sprzedanej oferty): Formularz powinien wyświetlić ogólny błąd, np. "Nie można zmodyfikować tej oferty, ponieważ została już sprzedana."
- **Brak autoryzacji (401)**: Przekierowanie na stronę logowania.

## 11. Kroki implementacji
1.  **Stworzenie hooka `useOffer(id)`**: Zaimplementuj hook do pobierania danych oferty w trybie edycji.
2.  **Stworzenie dynamicznej strony Astro**: Użyj `[...slug].astro` w `src/pages/offers/`, aby obsłużyć ścieżki `/new` i `/{id}/edit`.
3.  **Stworzenie komponentu `OfferFormView`**:
    - Zaimplementuj logikę rozróżniającą tryb `create` vs `edit`.
    - Użyj hooka `useOffer` w trybie edycji.
    - Zaimplementuj handlery `onSubmit` i `onDelete`, które będą wywoływać odpowiednie metody API.
    - Zarządzaj przekierowaniami po udanych operacjach.
4.  **Stworzenie komponentu `OfferForm`**:
    - Zintegruj `react-hook-form` z `zodResolver` i `CreateOfferSchema`.
    - Zbuduj layout formularza z komponentów Shadcn/ui.
    - Warunkowo renderuj przycisk "Usuń" na podstawie propa `isEditMode`.
5.  **Stworzenie komponentu `DeleteOfferDialog`**: Zaimplementuj okno dialogowe, które wywołuje funkcję zwrotną po potwierdzeniu.
6.  **Testowanie**: Przetestuj oba tryby działania formularza, w tym walidację, tworzenie, edycję, usuwanie oraz wszystkie scenariusze błędów (brak uprawnień, oferta nie istnieje, oferta sprzedana).
