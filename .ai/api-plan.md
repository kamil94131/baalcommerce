# REST API Plan

This document outlines the REST API for the BaalCommerce application, based on the database schema, Product Requirements Document (PRD), and specified tech stack.

## 1. Resources

- **Profiles**: Represents user metadata, extending Supabase's `auth.users`. Corresponds to the `Profiles` table.
- **Offers**: Represents items listed for sale by users. Corresponds to the `Offers` table.
- **Orders**: Represents completed transactions. Corresponds to the `Orders` table.
- **Couriers**: Represents available couriers for deliveries. Corresponds to the `Couriers` table.

## 2. Endpoints

All endpoints are prefixed with `/api`.

### 2.1 Profiles

#### `GET /profiles/me`
- **Description**: Get the profile of the currently authenticated user.
- **Request Payload**: None.
- **Success Response (200 OK)**:
  ```json
  {
    "id": 1,
    "userId": "...",
    "name": "Gorn",
    "camp": "NEW_CAMP",
    "defaultCourierId": 2
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: If the user is not authenticated.
  - `404 Not Found`: If the user has an auth account but no profile.

#### `POST /profiles`
- **Description**: Create a profile for a newly registered user. This should be called once after registration.
- **Request Payload**:
  ```json
  {
    "name": "NewUser",
    "camp": "SWAMP_CAMP"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "id": 2,
    "userId": "...",
    "name": "NewUser",
    "camp": "SWAMP_CAMP",
    "defaultCourierId": null
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: For validation errors (e.g., name too short, invalid camp).
  - `401 Unauthorized`: If the user is not authenticated.
  - `409 Conflict`: If a profile for this user already exists or the name is taken.

#### `PATCH /profiles/me`
- **Description**: Update the authenticated user's profile (e.g., to set a default courier).
- **Request Payload**:
  ```json
  {
    "name": "Gorn The Great",
    "camp": "OLD_CAMP",
    "defaultCourierId": 3
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "id": 1,
    "userId": "...",
    "name": "Gorn The Great",
    "camp": "OLD_CAMP",
    "defaultCourierId": 3
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: For validation errors.
  - `401 Unauthorized`: If the user is not authenticated.
  - `404 Not Found`: If the profile does not exist.
  - `409 Conflict`: If the chosen name is already taken.

### 2.2 Offers

#### `GET /offers`
- **Description**: Get a list of all active offers (`CREATED` status).
- **Query Parameters**:
  - `limit` (integer, optional, default: 20): Number of items to return.
  - `offset` (integer, optional, default: 0): Number of items to skip for pagination.
  - `sortBy` (string, optional, default: `createdAt`): Field to sort by.
  - `order` (string, optional, default: `desc`): Sort order (`asc` or `desc`).
- **Success Response (200 OK)**:
  ```json
  {
    "data": [
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
    ],
    "pagination": {
      "total": 1,
      "limit": 20,
      "offset": 0
    }
  }
  ```

#### `GET /offers/{id}`
- **Description**: Get a single active offer by its ID.
- **Success Response (200 OK)**:
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
- **Error Responses**:
  - `404 Not Found`: If the offer does not exist or its status is not `CREATED`.

#### `POST /offers`
- **Description**: Create a new offer.
- **Request Payload**:
  ```json
  {
    "title": "My Awesome Weed",
    "description": "A description of my weed.",
    "price": 50,
    "quantity": 20
  }
  ```
- **Success Response (201 Created)**: The newly created offer object.
- **Error Responses**:
  - `400 Bad Request`: For validation errors.
  - `401 Unauthorized`: If the user is not authenticated.

#### `PATCH /offers/{id}`
- **Description**: Update an existing offer. Only the author can perform this action, and only if the offer status is `CREATED`.
- **Request Payload**:
  ```json
  {
    "title": "Updated Title",
    "price": 55
  }
  ```
- **Success Response (200 OK)**: The updated offer object.
- **Error Responses**:
  - `400 Bad Request`: For validation errors.
  - `401 Unauthorized`: If the user is not authenticated.
  - `403 Forbidden`: If the user is not the author of the offer.
  - `404 Not Found`: If the offer does not exist.
  - `409 Conflict`: If the offer status is not `CREATED`.

#### `DELETE /offers/{id}`
- **Description**: Delete an offer. Only the author can perform this action, and only if the offer status is `CREATED`.
- **Success Response (204 No Content)**.
- **Error Responses**:
  - `401 Unauthorized`: If the user is not authenticated.
  - `403 Forbidden`: If the user is not the author of the offer.
  - `404 Not Found`: If the offer does not exist.
  - `409 Conflict`: If the offer status is not `CREATED`.

### 2.3 Orders

#### `GET /orders`
- **Description**: Get a list of orders for the authenticated user.
- **Query Parameters**:
  - `view` (string, optional): Filters the list. Can be `bought` or `sold`. If omitted, returns all orders for the user.
  - `limit`, `offset`, `sortBy`, `order` (for pagination and sorting).
- **Success Response (200 OK)**: A paginated list of order objects.
- **Error Responses**:
  - `401 Unauthorized`: If the user is not authenticated.

#### `POST /orders`
- **Description**: Create a new order (i.e., buy an item). This is an atomic transaction that creates an `Order` and updates the `Offer` status to `DONE`.
- **Request Payload**:
  ```json
  {
    "offerId": 1,
    "courierId": 2
  }
  ```
- **Success Response (201 Created)**: The newly created order object.
- **Error Responses**:
  - `400 Bad Request`: For validation errors (e.g., `courierId` not provided, trying to buy own offer).
  - `401 Unauthorized`: If the user is not authenticated.
  - `404 Not Found`: If the specified offer or courier does not exist.
  - `409 Conflict`: If the offer is not in `CREATED` status or there are no available couriers in the system.

### 2.4 Couriers

#### `GET /couriers`
- **Description**: Get a list of all available couriers.
- **Success Response (200 OK)**:
  ```json
  {
    "data": [
      {
        "id": 1,
        "name": "Swift",
        "camp": "OLD_CAMP"
      }
    ]
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: If the user is not authenticated.

#### `POST /couriers`
- **Description**: Create a new courier. **Requires 'gomez' role.**
- **Request Payload**:
  ```json
  {
    "name": "New Courier",
    "camp": "NEW_CAMP"
  }
  ```
- **Success Response (201 Created)**: The newly created courier object.
- **Error Responses**:
  - `400 Bad Request`: For validation errors.
  - `401 Unauthorized`: If the user is not authenticated.
  - `403 Forbidden`: If the user does not have the 'gomez' role.
  - `409 Conflict`: If a courier with that name already exists.

#### `DELETE /couriers/{id}`
- **Description**: Delete a courier. **Requires 'gomez' role.**
- **Success Response (204 No Content)**.
- **Error Responses**:
  - `401 Unauthorized`: If the user is not authenticated.
  - `403 Forbidden`: If the user does not have the 'gomez' role.
  - `404 Not Found`: If the courier does not exist.
  - `409 Conflict`: If the courier is associated with existing orders (`ON DELETE RESTRICT`).

## 3. Authentication and Authorization

- **Authentication**: The API will use JWT (JSON Web Tokens) provided by Supabase Auth. Every request to a protected endpoint must include an `Authorization: Bearer <token>` header. The API middleware will validate this token.
- **Authorization**:
  - **Role-Based Access Control (RBAC)**: Specific endpoints (`POST /couriers`, `DELETE /couriers/{id}`) are restricted to users with the `gomez` role. The API will check for this role after authenticating the user.
  - **Ownership-Based Access**: For operations on `Offers` and `Profiles`, the API will enforce that users can only modify their own resources. This is implemented by comparing the `userId` from the JWT token with the `sellerId` or `userId` on the resource.
  - **Database-Level Security**: PostgreSQL Row-Level Security (RLS) policies provide a secondary layer of defense, ensuring that even if the API logic fails, users cannot access or modify data they don't own.

## 4. Validation and Business Logic

- **Validation**: All incoming data from `POST` and `PATCH` requests will be validated against the rules defined in the PRD and database schema. This includes checks for length, data type, uniqueness, and allowed values (enums). A `400 Bad Request` response with a descriptive error message will be returned for any validation failure.
- **Business Logic Implementation**:
  - **Transactional Purchase**: The `POST /orders` endpoint will implement the purchase flow as an atomic database transaction to ensure that an `Order` is created and the corresponding `Offer` status is updated to `DONE` together, or not at all.
  - **Purchase Blocking**: The `POST /orders` endpoint will contain logic to:
    1.  Check if any couriers exist in the system.
    2.  Verify that the `buyerId` (from the token) is not the same as the `offer.sellerId`.
    If either condition is not met, the request will be rejected with a `409 Conflict` or `400 Bad Request`.
  - **Denormalization**: When an `Order` is created, data from the `Offer` and `Profile` (e.g., `title`, `price`, `sellerName`, `buyerName`) is copied into the `Orders` table to preserve the historical accuracy of the transaction.
