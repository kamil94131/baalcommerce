/**
 * This file contains shared TypeScript types for the application, including
 * Data Transfer Objects (DTOs) and Command Models used in API communication.
 * These types are derived from the database schema to ensure consistency
 * between the database, backend, and frontend.
 */

import type { Tables, TablesInsert, TablesUpdate } from "./db/database.types";

// #region --- Profiles ---

/**
 * Represents the public data of a user profile.
 *
 * @derived_from Tables<'Profiles'>
 */
export type ProfileDto = Tables<'Profiles'>;

/**
 * Command model for creating a new user profile.
 * Used in `POST /profiles`.
 *
 * @derived_from Pick<TablesInsert<'Profiles'>, 'name' | 'camp'>
 */
export type CreateProfileCommand = Pick<
  TablesInsert<'Profiles'>,
  "name" | "camp"
>;

/**
 * Command model for updating an existing user profile.
 * All fields are optional.
 * Used in `PATCH /profiles/me`.
 *
 * @derived_from Partial<Pick<TablesUpdate<'Profiles'>, 'name' | 'camp' | 'defaultCourierId'>>
 */
export type UpdateProfileCommand = Partial<
  Pick<TablesUpdate<'Profiles'>, "name" | "camp" | "defaultCourierId">
>;

// #endregion

// #region --- Offers ---

/**
 * Represents a single offer available for purchase.
 *
 * @derived_from Tables<'Offers'>
 */
export type OfferDto = Tables<'Offers'>;

/**
 * Represents the paginated response structure for a list of offers.
 * Used in `GET /offers`.
 */
export interface PaginatedOffersDto {
  data: OfferDto[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

/**
 * Command model for creating a new offer.
 * Used in `POST /offers`.
 *
 * @derived_from Pick<TablesInsert<'Offers'>, 'title' | 'description' | 'price' | 'quantity'>
 */
export type CreateOfferCommand = Pick<
  TablesInsert<'Offers'>,
  "title" | "description" | "price" | "quantity"
>;

/**
 * Command model for updating an existing offer.
 * All fields are optional.
 * Used in `PATCH /offers/{id}`.
 *
 * @derived_from Partial<Pick<TablesUpdate<'Offers'>, 'title' | 'description' | 'price' | 'quantity'>>
 */
export type UpdateOfferCommand = Partial<
  Pick<
    TablesUpdate<'Offers'>,
    "title" | "description" | "price" | "quantity"
  >
>;

// #endregion

// #region --- Orders ---

/**
 * Represents a completed transaction (an order).
 *
 * @derived_from Tables<'Orders'>
 */
export type OrderDto = Tables<'Orders'>;

/**
 * Command model for creating a new order (i.e., buying an item).
 * Used in `POST /orders`.
 *
 * @derived_from Pick<TablesInsert<'Orders'>, 'offerId' | 'courierId'>
 */
export type CreateOrderCommand = Pick<
  TablesInsert<'Orders'>,
  "offerId" | "courierId"
>;

// #endregion

// #region --- Couriers ---

/**
 * Represents a courier available for deliveries.
 *
 * @derived_from Tables<'Couriers'>
 */
export type CourierDto = Tables<'Couriers'>;

/**
 * Represents the response structure for a list of couriers.
 * Used in `GET /couriers`.
 */
export interface CouriersDto {
  data: CourierDto[];
}

/**
 * Command model for creating a new courier.
 * Used in `POST /couriers`.
 *
 * @derived_from Pick<TablesInsert<'Couriers'>, 'name' | 'camp'>
 */
export type CreateCourierCommand = Pick<
  TablesInsert<'Couriers'>,
  "name" | "camp"
>;

// #endregion
