# Podsumowanie planowania PRD - System handlu ziołami w kolonii górniczej

## <conversation_summary>

### <decisions>
1. **Terminologia**: Zmiana nazwy "dostawca" na "sprzedający" we wszystkich kontekstach systemu
2. **Role użytkowników**: Rola Gomeza jest nadawana ręcznie (administrator systemu)
3. **Model zakupowy**: Kupujący zakupuje całą ilość z oferty (brak zakupów częściowych)
4. **Pola formularza zakupu**:
    - Kurier (auto-uzupełniony z preferencji lub wybierany ręcznie)
    - Oczekiwany czas dostawy (1-10 dni kolonii)
    - Płatność gotówką przy odbiorze (w magicznej rudzie)
5. **Ograniczenia edycji**: Sprzedawca nie może edytować oferty po dokonaniu zakupu
6. **Struktura zakładek**:
    - "Kupione" dla kupujących (nazwa, ilość, data zamówienia, data dostawy)
    - "Sprzedane" dla sprzedających (dodatkowo: sprzedający, kurier)
7. **System obozów**: Trzech obozów (Nowy, Start, Obóz na bagnie) z filtrowaniem ofert
8. **Walidacja danych**:
    - Nazwa: 1-50 znaków
    - Cena: 1-9999 magicznej rudy
    - Opis: 1-250 znaków
    - Ilość: 1-99 sztuk
    - Data dostawy: dziś + max 10 dni
9. **Profil użytkownika zawiera**: imię, rolę (read-only), obóz (read-only), preferencje
10. **Zarządzanie kurierami**: Gomez może dodawać/usuwać kurierów (imię + obóz)

### <matched_recommendations>
1. **Jasno zdefiniowane role użytkowników** - System ma 3 role: Kupujący, Sprzedający, Gomez (admin)
2. **Przepływ procesu zakupowego** - Od wystawienia oferty, przez zakup, do dostawy
3. **System walidacji danych** - Szczegółowe reguły dla wszystkich pól formularzy
4. **Mechanizm filtrowania i sortowania** - Filtrowanie po obozach, sortowanie po cenie
5. **Zarządzanie stanami ofert** - Oferta aktywna → sprzedana (niewidoczna dla nowych kupujących)
6. **System preferencji użytkownika** - Zapisywanie domyślnego kuriera
7. **Ograniczenia biznesowe** - Brak edycji sprzedanych ofert, zakup całej ilości
8. **Struktura encji** - Oferta, Zamówienie, Użytkownik, Kurier, Obóz

### <prd_planning_summary>
**System handlu ziołami w kolonii górniczej** to platforma marketplace umożliwiająca handel ziołami między mieszkańcami trzech obozów kolonii.

**Główne wymagania funkcjonalne:**
- Tworzenie i zarządzanie ofertami sprzedaży ziół
- Realizacja zakupów z płatnością przy odbiorze
- System kurierski z wyborem dostawcy
- Filtrowanie ofert według obozów
- Zarządzanie profilami użytkowników z preferencjami
- Panel administracyjny dla Gomeza (zarządzanie kurierami)

**Kluczowe historie użytkownika:**
1. **Jako Sprzedający** mogę wystawić ofertę ziół z nazwą, ceną, opisem i ilością
2. **Jako Kupujący** mogę przeglądać oferty, filtrować je po obozach i sortować po cenie
3. **Jako Kupujący** mogę zakupić całą ilość z oferty, wybierając kuriera i czas dostawy
4. **Jako Gomez** mogę zarządzać listą dostępnych kurierów w systemie
5. **Jako Użytkownik** mogę ustawić domyślnego kuriera w preferencjach

**Kryteria sukcesu:**
- Wszystkie transakcje są realizowane z płatnością przy odbiorze
- Oferty po sprzedaży są automatycznie ukrywane z widoku publicznego
- System zapobiega edycji ofert po dokonaniu zakupu
- Walidacja danych zapewnia jakość wprowadzanych informacji
- Użytkownicy mogą łatwo filtrować oferty według swoich potrzeb

**Ścieżki krytyczne:**
1. Wystawienie oferty → Zakup → Dostawa
2. Rejestracja użytkownika → Przypisanie do obozu → Handel
3. Dodanie kuriera → Wybór przy zakupie → Realizacja dostawy

### <unresolved_issues>
1. **System powiadomień** - Brak informacji o powiadomieniach dla sprzedających o nowych zakupach
2. **Status dostawy** - Nie określono czy i jak śledzić status realizacji zamówienia
3. **System ocen/reputacji** - Brak mechanizmu oceniania sprzedających lub kurierów
4. **Obsługa konfliktów** - Brak procedur dla sytuacji problemowych (np. niedostarczona przesyłka)
5. **Archiwizacja danych** - Nie określono jak długo przechowywać historię transakcji
6. **Dostępność kurierów** - Brak informacji czy kurierzy mogą być czasowo niedostępni
7. **Limity dla użytkowników** - Czy istnieją ograniczenia ilości aktywnych ofert na sprzedającego?

## </conversation_summary>