# API Endpoint Implementation Plan: GET /api/offers/{id}

## 1. Przegląd punktu końcowego
Celem tego punktu końcowego jest pobranie i zwrócenie pojedynczej, aktywnej oferty handlowej na podstawie jej unikalnego identyfikatora (ID). Dostęp do tego endpointu jest publiczny, ale ograniczony tylko do ofert o statusie `CREATED`.

## 2. Szczegóły żądania
- **Metoda HTTP:** `GET`
- **Struktura URL:** `/api/offers/{id}`
- **Parametry:**
  - **Wymagane:**
    - `id` (parametr ścieżki): Liczbowy, unikalny identyfikator oferty.
  - **Opcjonalne:** Brak.
- **Request Body:** Brak.

## 3. Wykorzystywane typy
- **DTO:**
  - `OfferDto`: Reprezentuje dane pojedynczej oferty zwracane w odpowiedzi. Typ jest zdefiniowany w `src/types.ts`.

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (`200 OK`):**
  - **Content-Type:** `application/json`
  - **Body:** Obiekt JSON reprezentujący `OfferDto`.
  ```json
  {
    "id": 1,
    "title": "Fresh Swampweed",
    "description": "The best weed in the colony.",
    "price": 100,
    "quantity": 10,
    "createdAt": "2025-10-14 10:00:00",
    "sellerId": "...",
    "sellerName": "Cor Kalom",
    "sellerCamp": "SWAMP_CAMP",
    "status": "CREATED"
  }
  ```
- **Odpowiedzi błędów:**
  - `400 Bad Request`: Gdy `id` w URL nie jest poprawną liczbą.
  - `404 Not Found`: Gdy oferta o podanym `id` nie istnieje lub jej status nie jest `CREATED`.
  - `500 Internal Server Error`: W przypadku nieoczekiwanego błędu serwera.

## 5. Przepływ danych
1.  Klient wysyła żądanie `GET` na adres `/api/offers/{id}`.
2.  Endpoint API w Astro (`src/pages/api/offers/[id].ts`) odbiera żądanie.
3.  Parametr `id` jest walidowany przy użyciu biblioteki Zod w celu upewnienia się, że jest to dodatnia liczba całkowita.
4.  Endpoint wywołuje metodę `findActiveOfferById(supabase, id)` z nowo utworzonego serwisu `src/lib/services/offerService.ts`, przekazując do niej instancję klienta Supabase (`context.locals.supabase`) oraz zwalidowane `id`.
5.  Metoda serwisowa wykonuje zapytanie do tabeli `Offers` w bazie danych Supabase, filtrując wyniki po `id` oraz `status = 'CREATED'`.
6.  Serwis zwraca obiekt `OfferDto` jeśli oferta została znaleziona, w przeciwnym razie zwraca `null`.
7.  Endpoint API, na podstawie wyniku z serwisu, konstruuje odpowiedź:
    - Jeśli otrzymano dane oferty, zwraca odpowiedź `200 OK` z obiektem `OfferDto`.
    - Jeśli otrzymano `null`, zwraca odpowiedź `404 Not Found`.

## 6. Względy bezpieczeństwa
- **Autoryzacja:** Endpoint jest publiczny i nie wymaga uwierzytelniania.
- **Walidacja danych:** Parametr `id` jest rygorystycznie walidowany, aby zapobiec błędom zapytań i potencjalnym atakom (np. SQL Injection, chociaż Supabase SDK domyślnie parametryzuje zapytania).
- **Kontrola dostępu do danych:** Dostęp do ofert jest ograniczony na dwóch poziomach:
    1.  **Poziom aplikacji:** Logika biznesowa w serwisie `offerService` jawnie filtruje oferty po `status = 'CREATED'`.
    2.  **Poziom bazy danych:** Polityka Row-Level Security (RLS) w PostgreSQL (`Allow public read access for active offers`) zapewnia, że nawet w przypadku błędu w logice aplikacji, baza danych nie zwróci ofert o statusie innym niż `CREATED`.

## 7. Obsługa błędów
- **Błędne ID (`400 Bad Request`):** Jeśli `id` nie przejdzie walidacji Zod, endpoint zwróci odpowiedź 400 z komunikatem informującym o nieprawidłowym formacie identyfikatora.
- **Brak zasobu (`404 Not Found`):** Jeśli serwis `offerService` zwróci `null`, endpoint zwróci odpowiedź 404 z komunikatem "Offer not found or not active".
- **Błąd serwera (`500 Internal Server Error`):** Wszelkie nieoczekiwane błędy (np. błąd połączenia z bazą danych) zostaną przechwycone, zalogowane na konsoli serwera, a do klienta zostanie wysłana generyczna odpowiedź 500.

## 8. Rozważania dotyczące wydajności
- Zapytanie do bazy danych jest wysoce wydajne, ponieważ wykorzystuje klucz główny (`id`) oraz indeks na kolumnie `status`.
- Nie przewiduje się żadnych wąskich gardeł wydajnościowych dla tego punktu końcowego przy normalnym obciążeniu.

## 9. Etapy wdrożenia
1.  **Utworzenie pliku endpointu:** Stwórz nowy plik `src/pages/api/offers/[id].ts`.
2.  **Utworzenie serwisu:** Stwórz nowy plik `src/lib/services/offerService.ts`.
3.  **Implementacja logiki w serwisie:**
    - W `offerService.ts` dodaj funkcję `findActiveOfferById(supabase: SupabaseClient, id: number): Promise<OfferDto | null>`.
    - Wewnątrz tej funkcji zaimplementuj zapytanie do Supabase: `supabase.from('Offers').select().eq('id', id).eq('status', 'CREATED').single()`.
4.  **Implementacja endpointu API:**
    - W pliku `[id].ts` dodaj `export const prerender = false;`.
    - Zaimplementuj handler `GET({ params, context })`.
    - Użyj schemy Zod (`z.coerce.number().int().positive()`) do walidacji `params.id`. W przypadku błędu zwróć `400`.
    - Pobierz klienta Supabase z `context.locals.supabase`.
    - Wywołaj metodę `offerService.findActiveOfferById` z odpowiednimi parametrami.
    - Na podstawie wyniku zwróć odpowiedź `200 OK` z danymi oferty lub `404 Not Found`.
    - Dodaj blok `try...catch` do obsługi nieoczekiwanych błędów i zwracania `500`.
5.  **Testowanie:** Ręcznie przetestuj endpoint przy użyciu narzędzia do wysyłania żądań HTTP (np. cURL, Postman) dla różnych scenariuszy: poprawne ID, nieistniejące ID, niepoprawny format ID oraz ID oferty o statusie `DONE`.
