CREATE OR REPLACE FUNCTION create_order_and_update_offer(p_offer_id bigint, p_courier_id bigint, p_buyer_user_id uuid)
RETURNS TABLE (j json) AS $$
DECLARE
  v_offer record;
  v_buyer_profile record;
  v_new_order record;
BEGIN
  -- 1. Fetch offer and lock the row for update
  SELECT * INTO v_offer FROM "Offers" WHERE id = p_offer_id FOR UPDATE;

  -- 2. Fetch buyer's profile
  SELECT * INTO v_buyer_profile FROM "Profiles" WHERE "userId" = p_buyer_user_id;

  -- 3. Perform checks
  IF v_offer IS NULL THEN
    RAISE EXCEPTION 'Offer not found' USING ERRCODE = 'P0001'; -- 404
  END IF;

  IF v_buyer_profile IS NULL THEN
    RAISE EXCEPTION 'Buyer profile not found' USING ERRCODE = 'P0002'; -- 401
  END IF;

  IF v_offer.status <> 'CREATED' THEN
    RAISE EXCEPTION 'Offer is not active' USING ERRCODE = 'P0003'; -- 409
  END IF;

  IF v_offer."sellerId" = v_buyer_profile.id THEN
    RAISE EXCEPTION 'Cannot buy your own offer' USING ERRCODE = 'P0004'; -- 400
  END IF;

  -- 4. Insert into Orders table
  INSERT INTO "Orders" ("offerId", title, quantity, price, "sellerId", "sellerName", "sellerCamp", "buyerId", "buyerName", "buyerCamp", "courierId")
  VALUES (
    v_offer.id,
    v_offer.title,
    v_offer.quantity,
    v_offer.price,
    v_offer."sellerId",
    v_offer."sellerName",
    v_offer."sellerCamp",
    v_buyer_profile.id,
    v_buyer_profile.name,
    v_buyer_profile.camp,
    p_courier_id
  )
  RETURNING * INTO v_new_order;

  -- 5. Update Offers table
  UPDATE "Offers"
  SET status = 'DONE'
  WHERE id = p_offer_id;

  -- 6. Return the newly created order
  RETURN QUERY SELECT to_json(v_new_order);

END;
$$ LANGUAGE plpgsql;
