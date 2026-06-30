# Branzia Merchant Mobile App

## What is this?
A mobile app for **Branzia merchants** to manage their online store on the go.
Branzia is a multi-tenant online store builder for small businesses.
This app talks to the Branzia REST API — it does NOT talk to any database directly.

## What to Build (Screens)

| Screen | Description |
|--------|-------------|
| Shop Opening Request | Name, shop name, email, phone, plan → opens WhatsApp with pre-filled message to Branzia team |
| Login | Email/phone + password → get Bearer token |
| Dashboard | Stats overview + recent orders |
| Orders List | All orders, filterable by status/date/search |
| Order Detail | Full order info + status action buttons |
| Order Chat | Per-order message thread with buyer |
| Products List | All products, toggle availability |
| Product Create/Edit | Name, price, description, category, image, attributes |
| Categories | List, create, edit, delete categories |
| Attributes | List, create, edit, delete custom attributes |
| Settings | Shop info, social links, category type |
| Payment Methods | COD, UPI, bank transfer toggles + details |
| Delivery Settings | Delivery type, flat charge, free delivery threshold |
| Delivery Zones | Zone-based delivery pricing (create/edit/delete) |
| Business Hours | Per-day open/close times |
| Logo Upload | Upload store logo |

---

## API Reference

### Base URL
```
https://branzia.app/api/merchant
```

### Authentication
All protected endpoints require:
```
Authorization: Bearer {token}
Content-Type: application/json   (or multipart/form-data for file uploads)
```

Token is obtained from the login endpoint and must be stored securely on device (e.g. Flutter SecureStorage / React Native Keychain).

---

## Auth Endpoints

### Shop Opening Request (WhatsApp — no API call)

**No API endpoint.** This is handled entirely on the client side using a WhatsApp deep link.

**Branzia WhatsApp Number:** `+91 73587 20104`

#### Flow
1. Merchant fills the form: name, shop name, email, phone, plan, (optional) message
2. App builds a pre-filled WhatsApp message
3. App opens WhatsApp using the deep link — merchant just taps **Send**
4. Branzia team receives the message and manually registers the merchant at `https://branzia.app/merchant/register`

#### Deep link format
```
https://wa.me/917358720104?text={URL_ENCODED_MESSAGE}
```

#### Pre-filled message template
```
Hi Branzia! I'd like to open my shop.

Name: Ravi Kumar
Shop Name: Ravi Cakes
Email: ravi@example.com
Phone: +91 9876543210
Plan: Growth
Message: I sell custom cakes
```

#### Form fields to collect

| Field | Required | Notes |
|-------|----------|-------|
| `name` | yes | Full name |
| `shop_name` | yes | Business name |
| `email` | yes | Contact email |
| `phone` | yes | Phone number with country code |
| `plan` | yes | Picker: Starter / Growth / Pro |
| `message` | no | Any additional note |

#### UI Notes
- Button label: **"Send via WhatsApp"**
- If WhatsApp is not installed, fall back to opening `https://web.whatsapp.com/send?phone=...` in browser
- Show a confirmation screen after WhatsApp opens: *"Your request has been sent! Our team will contact you within 24 hours."*

---

### Login
```
POST /api/merchant/auth/login
```
**Body:**
```json
{
  "login": "email@example.com",   // email OR phone number
  "password": "secret"
}
```
**Response 200:**
```json
{
  "token": "1|abc123...",
  "merchant": { ...MerchantObject }
}
```
**Response 401:** Invalid credentials
**Response 403:** Account suspended

---

### Logout
```
POST /api/merchant/auth/logout
Authorization: Bearer {token}
```
**Response 200:**
```json
{ "message": "Logged out successfully." }
```

---

### Get My Profile
```
GET /api/merchant/auth/me
Authorization: Bearer {token}
```
**Response 200:**
```json
{ "merchant": { ...MerchantObject } }
```

---

## Merchant Object Shape
Returned by login, `/auth/me`, and `/settings`.

```json
{
  "id": 1,
  "name": "Ravi Kumar",
  "shop_name": "Ravi Cakes",
  "slug": "ravicakes",
  "email": "ravi@example.com",
  "phone": "9876543210",
  "dial_code": "91",
  "currency": "INR",
  "currency_symbol": "₹",
  "logo": "https://cdn.branzia.app/merchants/1/logos/abc.jpg",   // nullable
  "description": "Best cakes in town",
  "address": "123 Main St",
  "pickup_address": "Shop No 5, MG Road",
  "category_type": "cakes",
  "instagram_handle": "ravicakes",    // nullable
  "facebook_url": "ravicakes",        // nullable
  "youtube_url": "@ravicakes",        // nullable
  "upi_id": "ravi@upi",              // nullable
  "accepts_cod": true,
  "accepts_upi": true,
  "accepts_bank_transfer": false,
  "offers_delivery": true,
  "offers_pickup": false,
  "delivery_type": "flat",           // "flat" | "zone" | "free"
  "flat_delivery_charge": 50.0,
  "free_delivery_enabled": true,
  "free_delivery_above": 500.0,
  "estimated_time": 60,              // minutes
  "min_order_amount": 200.0,
  "business_hours": {
    "1": { "open": "09:00", "close": "21:00", "closed": false },
    "2": { "open": "09:00", "close": "21:00", "closed": false },
    "3": { "open": "09:00", "close": "21:00", "closed": false },
    "4": { "open": "09:00", "close": "21:00", "closed": false },
    "5": { "open": "09:00", "close": "21:00", "closed": false },
    "6": { "open": "09:00", "close": "21:00", "closed": false },
    "7": { "open": null,    "close": null,     "closed": true  }
  },
  "theme": "cakes",
  "whatsapp_enabled": true,
  "whatsapp_message": "Hi, I'd like to place an order!",   // nullable
  "is_open": true,
  "subscription_plan": "growth",
  "plan_active": true,
  "plan_days_remaining": 14
}
```
Business hours keys `"1"`–`"7"` = Monday–Sunday.

---

## Dashboard

```
GET /api/merchant/dashboard
Authorization: Bearer {token}
```
**Response 200:**
```json
{
  "orders_today": 5,
  "revenue_today": 1250.00,
  "revenue_month": 32400.00,
  "pending": 2,
  "total_products": 18,
  "status_counts": {
    "pending": 2,
    "confirmed": 1,
    "delivered": 12,
    "rejected": 0
  },
  "recent_orders": [ ...OrderObject[] ]
}
```

---

## Orders

### List Orders
```
GET /api/merchant/orders
Authorization: Bearer {token}
```
**Query params (all optional):**
| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter: `pending`, `confirmed`, `delivered`, `rejected` |
| `search` | string | Search by customer name, phone, or order ID |
| `from_date` | date (YYYY-MM-DD) | Orders from this date |
| `to_date` | date (YYYY-MM-DD) | Orders to this date |

**Response 200:** Laravel paginated collection
```json
{
  "data": [ ...OrderObject[] ],
  "links": { "first": "...", "last": "...", "prev": null, "next": "..." },
  "meta": { "current_page": 1, "last_page": 3, "per_page": 20, "total": 52 }
}
```

---

### Get Order Detail
```
GET /api/merchant/orders/{id}
Authorization: Bearer {token}
```
**Response 200:** `{ ...OrderObject }` (with items and buyer loaded)
**Response 404:** Order not found

---

### Update Order Status
```
PATCH /api/merchant/orders/{id}/status
Authorization: Bearer {token}
```
**Body:**
```json
{
  "status": "confirmed",         // "confirmed" | "rejected" | "delivered"
  "reject_reason": "Out of stock"  // required only when status = "rejected"
}
```
**Response 200:** Updated `OrderObject`
**Response 404:** Order not found
**Response 422:** Validation error

---

## Order Object Shape

```json
{
  "id": 101,
  "customer_name": "Priya Sharma",
  "customer_phone": "9876543210",
  "customer_address": "45 Rose Garden, Bangalore",
  "order_type": "delivery",           // "delivery" | "pickup"
  "status": "pending",               // "pending" | "confirmed" | "delivered" | "rejected"
  "payment_method": "cod",           // "cod" | "upi" | "razorpay" | "stripe"
  "payment_status": "pending",       // "pending" | "paid" | "failed"
  "subtotal": 499.00,
  "delivery_charge": 50.00,
  "total": 549.00,
  "notes": "Extra chocolate please",  // nullable
  "reject_reason": null,              // nullable
  "confirmation_token": "abc123xyz",
  "items": [
    {
      "id": 1,
      "product_id": 5,
      "product_name": "Chocolate Cake",
      "price": 499.00,
      "quantity": 1,
      "subtotal": 499.00
    }
  ],
  "buyer": {
    "id": 10,
    "name": "Priya Sharma",
    "phone": "9876543210"
  },
  "unread_messages": 0,          // count of unread buyer messages
  "created_at": "2026-06-19T10:30:00.000000Z",
  "updated_at": "2026-06-19T10:35:00.000000Z"
}
```

---

## Products

### List Products
```
GET /api/merchant/products
Authorization: Bearer {token}
```
**Query params (all optional):**
| Param | Type | Description |
|-------|------|-------------|
| `category_id` | integer | Filter by category |
| `search` | string | Search by product name |
| `is_available` | boolean | Filter by availability (`true`/`false`) |

**Response 200:** Paginated, 50 per page
```json
{
  "data": [ ...ProductObject[] ],
  "meta": { "current_page": 1, "last_page": 1, "per_page": 50, "total": 18 }
}
```

---

### Create Product
```
POST /api/merchant/products
Authorization: Bearer {token}
Content-Type: multipart/form-data
```
**Body (form-data):**
| Field | Required | Type | Notes |
|-------|----------|------|-------|
| `name` | yes | string | max 255 |
| `price` | yes | numeric | min 0 |
| `description` | no | string | |
| `category_id` | no | integer | must exist in merchant's categories |
| `is_available` | no | boolean | defaults to true |
| `image` | no | file | image, max 5 MB |

**Response 201:** `ProductObject`

---

### Get Product
```
GET /api/merchant/products/{id}
Authorization: Bearer {token}
```
**Response 200:** `ProductObject`
**Response 404:** Product not found

---

### Update Product
```
POST /api/merchant/products/{id}
Authorization: Bearer {token}
Content-Type: multipart/form-data
```
Uses POST (not PUT/PATCH) because of file upload support. All fields are optional (partial update).

Same fields as Create. Old image is deleted from storage when a new one is uploaded.

**Response 200:** Updated `ProductObject`
**Response 404:** Product not found

---

### Delete Product
```
DELETE /api/merchant/products/{id}
Authorization: Bearer {token}
```
**Response 200:**
```json
{ "message": "Product deleted." }
```

---

### Toggle Availability
```
PATCH /api/merchant/products/{id}/toggle
Authorization: Bearer {token}
```
Flips `is_available` true → false or false → true.

**Response 200:** Updated `ProductObject`

---

## Product Object Shape

```json
{
  "id": 5,
  "category_id": 2,
  "category": {
    "id": 2,
    "name": "Cakes"
  },
  "name": "Chocolate Cake",
  "description": "Rich dark chocolate cake",
  "price": 499.00,
  "image": "https://cdn.branzia.app/merchants/1/products/cake.jpg",  // nullable
  "is_available": true,
  "sort_order": 0,
  "attributes": [
    {
      "source": "predefined",
      "predefined_id": 1,
      "label": "Size",
      "type": "select",
      "required": true,
      "values": [
        { "label": "6 inch", "price": 0 },
        { "label": "8 inch", "price": 100 }
      ]
    }
  ],
  "created_at": "2026-06-01T08:00:00.000000Z"
}
```

---

## Categories

### List Categories
```
GET /api/merchant/categories
Authorization: Bearer {token}
```
Returns all categories (no pagination), ordered by `sort_order`.

**Response 200:**
```json
{
  "data": [ ...CategoryObject[] ]
}
```

---

### Create Category
```
POST /api/merchant/categories
Authorization: Bearer {token}
Content-Type: application/json
```
**Body:**
```json
{
  "name": "Cakes",
  "sort_order": 1,   // optional, integer
  "is_active": true  // optional, default true
}
```
**Response 201:** `CategoryObject`

---

### Update Category
```
PUT /api/merchant/categories/{id}
Authorization: Bearer {token}
Content-Type: application/json
```
All fields optional. Same fields as Create.

**Response 200:** Updated `CategoryObject`
**Response 404:** Category not found

---

### Delete Category
```
DELETE /api/merchant/categories/{id}
Authorization: Bearer {token}
```
Products in this category have their `category_id` set to null (not deleted).

**Response 200:**
```json
{ "message": "Category deleted." }
```

---

## Category Object Shape

```json
{
  "id": 2,
  "name": "Cakes",
  "sort_order": 1,
  "is_active": true,
  "products_count": 6
}
```

---

## Attributes

Attributes are custom fields buyers fill in when placing an order (e.g. "Size", "Flavour", "Inscription text"). Each attribute is a reusable definition. Attributes are attached to individual products as a JSON snapshot — see **Product attributes** in the Create/Update Product section.

There are two kinds:
- **System attributes** (`is_system: true`) — created by Branzia admin, available to all merchants. Cannot be edited or deleted via API.
- **Custom attributes** (`is_system: false`) — created by the merchant. Full CRUD.

---

### List Attributes
```
GET /api/merchant/attributes
Authorization: Bearer {token}
```
Returns all attributes available to this merchant (system + their own), ordered by `sort_order`.

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Size",
      "type": "select",
      "values": ["S", "M", "L", "XL"],
      "sort_order": 0,
      "is_active": true,
      "is_system": true
    },
    {
      "id": 12,
      "name": "Inscription",
      "type": "text",
      "values": [],
      "sort_order": 0,
      "is_active": true,
      "is_system": false
    }
  ]
}
```

---

### Create Attribute
```
POST /api/merchant/attributes
Authorization: Bearer {token}
Content-Type: application/json
```
**Body:**
```json
{
  "name": "Flavour",
  "type": "select",
  "values": ["Chocolate", "Vanilla", "Strawberry"],
  "sort_order": 1,
  "is_active": true
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `name` | yes | string, max 100 |
| `type` | yes | `select` or `text` |
| `values` | yes (if type=select) | array of option strings |
| `sort_order` | no | integer, default 0 |
| `is_active` | no | boolean, default true |

**Response 201:** `AttributeObject`

---

### Update Attribute
```
PUT /api/merchant/attributes/{id}
Authorization: Bearer {token}
Content-Type: application/json
```
Only works on merchant's own attributes (`is_system: false`). All fields optional.

**Response 200:** Updated `AttributeObject`
**Response 404:** Attribute not found or is a system attribute

---

### Delete Attribute
```
DELETE /api/merchant/attributes/{id}
Authorization: Bearer {token}
```
Only works on merchant's own attributes. Does NOT remove the attribute snapshot from existing products.

**Response 200:**
```json
{ "message": "Attribute deleted." }
```
**Response 404:** Attribute not found or is a system attribute

---

### Attribute Object Shape
```json
{
  "id": 12,
  "name": "Flavour",
  "type": "select",
  "values": ["Chocolate", "Vanilla", "Strawberry"],
  "sort_order": 1,
  "is_active": true,
  "is_system": false
}
```

| Field | Description |
|-------|-------------|
| `type` | `select` — buyer picks from `values` list; `text` — buyer types free text |
| `values` | Array of option strings. Empty `[]` when `type = text` |
| `is_system` | `true` = Branzia predefined (read-only). `false` = merchant's own |

---

### How to attach attributes to a product

When creating or updating a product, pass an `attributes` JSON field — an array of attribute snapshots. Each entry is copied from an attribute definition but can override label/values per product.

```json
{
  "name": "Birthday Cake",
  "price": 499,
  "attributes": [
    {
      "source": "predefined",
      "predefined_id": 1,
      "label": "Size",
      "type": "select",
      "required": true,
      "values": [
        { "label": "6 inch", "price": 0 },
        { "label": "8 inch", "price": 100 },
        { "label": "10 inch", "price": 200 }
      ]
    },
    {
      "source": "custom",
      "predefined_id": null,
      "label": "Inscription text",
      "type": "text",
      "required": false,
      "values": []
    }
  ]
}
```

**`attributes` field rules:**
- Send as JSON string in the multipart form (since product create/update uses `multipart/form-data`)
- `source`: `"predefined"` for system attributes, `"custom"` for merchant-created or ad-hoc
- `predefined_id`: the `id` from the attribute list if `source = "predefined"`, else `null`
- `values` for `type = select`: array of `{ label, price }` — `price` is an add-on in merchant's currency
- `values` for `type = text`: always `[]`
- Send `"attributes": "[]"` or omit the field to clear all attributes from a product

---

## Settings

### Get Settings
```
GET /api/merchant/settings
Authorization: Bearer {token}
```
**Response 200:** `MerchantObject` (same shape as `/auth/me`)

---

### Update Settings
```
PATCH /api/merchant/settings
Authorization: Bearer {token}
Content-Type: application/json
```
**Body (all optional):**
```json
{
  "shop_name": "Ravi Cakes",
  "description": "Best cakes in Bangalore",
  "phone": "9876543210",
  "address": "123 Main St",
  "pickup_address": "Shop No 5, MG Road",
  "category_type": "cakes",
  "instagram_handle": "ravicakes",
  "facebook_url": "ravicakes",
  "youtube_url": "@ravicakes",
  "estimated_time": 60,
  "min_order_amount": 200,
  "offers_delivery": true,
  "offers_pickup": false,
  "whatsapp_enabled": true,
  "whatsapp_message": "Hi, I'd like to place an order!"
}
```

**Note:** Payment methods (COD, UPI, bank transfer) are managed via `PATCH /payment-methods/*` — not this endpoint. Delivery pricing and zones are managed via `PATCH /delivery`.

**Response 200:** Updated `MerchantObject`

---

### Update Business Hours
```
PATCH /api/merchant/settings/hours
Authorization: Bearer {token}
Content-Type: application/json
```
**Body:**
```json
{
  "hours": {
    "1": { "open": "09:00", "close": "21:00", "closed": false },
    "2": { "open": "09:00", "close": "21:00", "closed": false },
    "3": { "open": "09:00", "close": "21:00", "closed": false },
    "4": { "open": "09:00", "close": "21:00", "closed": false },
    "5": { "open": "09:00", "close": "21:00", "closed": false },
    "6": { "open": "09:00", "close": "21:00", "closed": false },
    "7": { "open": null,    "close": null,     "closed": true  }
  }
}
```
Keys `"1"`–`"7"` = Monday–Sunday. Must send the full 7-day object.

**Response 200:**
```json
{
  "business_hours": { ...same shape... },
  "is_open": true
}
```

---

### Upload Logo
```
POST /api/merchant/settings/logo
Authorization: Bearer {token}
Content-Type: multipart/form-data
```
**Body:**
| Field | Required | Type | Notes |
|-------|----------|------|-------|
| `logo` | yes | file | image, max 5 MB |

**Response 200:**
```json
{
  "logo": "https://cdn.branzia.app/merchants/1/logos/newlogo.jpg"
}
```

---

## Payment Methods

Manage which payment methods buyers can use at checkout. India merchants have COD, UPI, and bank transfer. International merchants have card payments via Stripe (not yet in API).

### Get Payment Methods
```
GET /api/merchant/payment-methods
Authorization: Bearer {token}
```
**Response 200:**
```json
{
  "data": {
    "cod": {
      "enabled": true
    },
    "upi": {
      "enabled": true,
      "upi_id": "ravi@upi"
    },
    "bank_transfer": {
      "enabled": false,
      "account_name": null,
      "account_number": null,
      "ifsc": null,
      "bank_name": null
    }
  }
}
```

---

### Update COD
```
PATCH /api/merchant/payment-methods/cod
Authorization: Bearer {token}
Content-Type: application/json
```
**Body:**
```json
{ "enabled": true }
```
**Response 200:** `{ message, enabled }`

---

### Update UPI
```
PATCH /api/merchant/payment-methods/upi
Authorization: Bearer {token}
Content-Type: application/json
```
**Body:**
```json
{
  "enabled": true,
  "upi_id": "ravi@upi"
}
```
`upi_id` is required when `enabled: true`.

**Response 200:** `{ message, enabled, upi_id }`
**Response 422:** If `enabled: true` but `upi_id` is empty

---

### Update Bank Transfer
```
PATCH /api/merchant/payment-methods/bank-transfer
Authorization: Bearer {token}
Content-Type: application/json
```
**Body:**
```json
{
  "enabled": true,
  "account_name": "Ravi Kumar",
  "account_number": "1234567890",
  "ifsc": "SBIN0001234",
  "bank_name": "State Bank of India"
}
```
`account_number` is required when `enabled: true`. Other fields optional.

**Response 200:** `{ message, enabled }`
**Response 422:** If `enabled: true` but `account_number` is empty

---

## Delivery Settings

### Get Delivery Settings
```
GET /api/merchant/delivery
Authorization: Bearer {token}
```
**Response 200:**
```json
{
  "data": {
    "offers_delivery": true,
    "offers_pickup": false,
    "pickup_address": null,
    "estimated_time": 60,
    "min_order_amount": 200.0,
    "delivery_type": "flat",
    "flat_delivery_charge": 50.0,
    "free_delivery_enabled": true,
    "free_delivery_above": 500.0,
    "zones": []
  }
}
```

**`delivery_type` values:**
| Value | Meaning |
|-------|---------|
| `flat` | Fixed charge per order (`flat_delivery_charge`) |
| `zone` | Charge varies by zone (see Zones) |
| `free` | No delivery charge for all orders |
| `free` | No delivery charge |

---

### Update Delivery Settings
```
PATCH /api/merchant/delivery
Authorization: Bearer {token}
Content-Type: application/json
```
All fields optional. Returns updated settings + zones.

**Body:**
```json
{
  "offers_delivery": true,
  "offers_pickup": false,
  "pickup_address": "Shop No 5, MG Road",
  "estimated_time": 60,
  "min_order_amount": 200,
  "delivery_type": "flat",
  "flat_delivery_charge": 50,
  "free_delivery_enabled": true,
  "free_delivery_above": 500
}
```
**Response 200:** `{ data: DeliverySettingsObject }`

---

### List Zones
```
GET /api/merchant/delivery/zones
Authorization: Bearer {token}
```
**Response 200:**
```json
{
  "data": [
    { "id": 1, "zone_name": "City Centre", "delivery_charge": 30.0, "is_active": true },
    { "id": 2, "zone_name": "Suburbs",     "delivery_charge": 60.0, "is_active": true }
  ]
}
```

---

### Create Zone
```
POST /api/merchant/delivery/zones
Authorization: Bearer {token}
Content-Type: application/json
```
**Body:**
```json
{
  "zone_name": "Airport Area",
  "delivery_charge": 80,
  "is_active": true
}
```
**Response 201:** `ZoneObject`

---

### Update Zone
```
PUT /api/merchant/delivery/zones/{id}
Authorization: Bearer {token}
Content-Type: application/json
```
All fields optional.
**Response 200:** Updated `ZoneObject`
**Response 404:** Zone not found

---

### Delete Zone
```
DELETE /api/merchant/delivery/zones/{id}
Authorization: Bearer {token}
```
**Response 200:** `{ message: 'Zone deleted.' }`

---

### Zone Object Shape
```json
{
  "id": 1,
  "zone_name": "City Centre",
  "delivery_charge": 30.0,
  "is_active": true
}
```

---

## FCM Push Notifications

Register a device FCM token so the merchant receives push notifications for new orders and buyer messages.

### Register Token
```
POST /api/merchant/fcm-token
Authorization: Bearer {token}
Content-Type: application/json
```
**Body:**
```json
{ "token": "firebase_device_token_here" }
```
**Response 200:**
```json
{ "message": "FCM token saved." }
```

### Remove Token (on logout)
```
DELETE /api/merchant/fcm-token
Authorization: Bearer {token}
```
**Response 200:**
```json
{ "message": "FCM token removed." }
```

Always call DELETE when the user logs out so they stop receiving notifications.

---

### Notification Payloads

The server sends FCM v1 API notifications. The mobile app receives a `notification` object and a `data` map.

#### New Order
Fired when a buyer places an order.

| Field | Value |
|-------|-------|
| `notification.title` | `New Order #101` |
| `notification.body` | `Priya Sharma · ₹549` |
| `data.url` | `/merchant/orders` |

#### New Buyer Message
Fired when a buyer sends a message on an order.

| Field | Value |
|-------|-------|
| `notification.title` | `New message on Order #101` |
| `notification.body` | `Priya Sharma: Can you make it eggless?` |
| `data.url` | `/merchant/orders/101` |

#### Handling `data.url` (deep linking)
Use `data.url` to navigate to the correct screen when the notification is tapped:

| `data.url` | Navigate to |
|------------|-------------|
| `/merchant/orders` | Orders List screen |
| `/merchant/orders/{id}` | Order Detail screen for that order |

> The currency symbol in the body (`₹`, `$`, `£`) matches the merchant's currency — do not hardcode it.

---

## Order Messages (Chat)

Merchants can send and receive messages on a per-order basis. Each order has its own message thread. Buyers initiate from the buyer app; merchants reply from the order detail/chat screen.

### List Messages
```
GET /api/merchant/orders/{id}/messages
Authorization: Bearer {token}
```
Returns all messages for the order, oldest first.

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "sender": "buyer",
      "message": "Can you make it eggless?",
      "read_at": "2026-06-21T10:05:00.000000Z",
      "created_at": "2026-06-21T10:00:00.000000Z"
    },
    {
      "id": 2,
      "sender": "merchant",
      "message": "Yes, absolutely! No eggs.",
      "read_at": null,
      "created_at": "2026-06-21T10:06:00.000000Z"
    }
  ]
}
```
**Response 404:** Order not found

---

### Send Message
```
POST /api/merchant/orders/{id}/messages
Authorization: Bearer {token}
Content-Type: application/json
```
**Body:**
```json
{
  "message": "Your order will be ready by 3pm."
}
```
`message`: string, required, max 1000 chars.

**Response 201:** `MessageObject`
**Response 404:** Order not found

---

### Mark Messages as Read
```
POST /api/merchant/orders/{id}/messages/read
Authorization: Bearer {token}
```
Marks all unread **buyer** messages in this order as read. Call when the merchant opens the chat screen.

**Response 200:**
```json
{ "message": "Messages marked as read." }
```

---

### Message Object Shape
```json
{
  "id": 1,
  "sender": "buyer",
  "message": "Can you make it eggless?",
  "read_at": "2026-06-21T10:05:00.000000Z",
  "created_at": "2026-06-21T10:00:00.000000Z"
}
```

| Field | Description |
|-------|-------------|
| `sender` | `"merchant"` or `"buyer"` — who sent this message |
| `read_at` | Timestamp when the other party read it. `null` = not yet read |

---

### UI Notes
- Show a chat icon/button on the Order Detail screen
- Show an unread badge on the order row in the Orders List when `unread_messages > 0`
- Call `POST /messages/read` as soon as the chat screen opens
- Poll every 10–15 seconds while the chat screen is active (no WebSocket yet)
- Display as chat bubbles: merchant messages on the right, buyer messages on the left

---

## Error Responses

| HTTP Code | Meaning |
|-----------|---------|
| 401 | Unauthenticated — missing or invalid token |
| 403 | Forbidden — account suspended |
| 404 | Resource not found |
| 422 | Validation error — body has `errors` object |
| 500 | Server error |

**Validation error shape:**
```json
{
  "message": "The name field is required.",
  "errors": {
    "name": ["The name field is required."]
  }
}
```

---

## Order Status Flow

```
pending → confirmed → delivered
pending → rejected
```

- Only `pending` orders can be confirmed or rejected
- Only `confirmed` orders can be marked as delivered
- The API does NOT enforce this flow — enforce it in the UI (disable irrelevant buttons)

---

## Currency

Currency is returned in every `MerchantObject` response:

| Field | Example | Description |
|-------|---------|-------------|
| `currency` | `"INR"` | ISO 4217 currency code |
| `currency_symbol` | `"₹"` | Display symbol |

Always use `currency_symbol` when rendering prices — never hardcode `₹` or `$`. The symbol is correct for the merchant's country (India → `₹`, UK → `£`, US → `$`, etc.).

---

## Pagination

All paginated responses follow Laravel's standard structure:
```json
{
  "data": [],
  "links": {
    "first": "https://branzia.app/api/merchant/orders?page=1",
    "last":  "https://branzia.app/api/merchant/orders?page=5",
    "prev":  null,
    "next":  "https://branzia.app/api/merchant/orders?page=2"
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 5,
    "per_page": 20,
    "to": 20,
    "total": 100
  }
}
```

---

## What is NOT in the API (not built yet)

These features exist in the web dashboard but do NOT have mobile API endpoints yet:

- Merchant self-registration (use WhatsApp deep link instead — see Shop Opening Request above)
- Razorpay / Stripe gateway connection & onboarding (KYC, embedded onboarding)
- Settlement / payout history
- Shiprocket shipping integration
- Instagram connection & publishing
- CMS pages & static blocks management
- Staff management
- Product import/export
- Reviews list

Do NOT attempt to build these screens — the API endpoints for them do not exist.

---

## Billing / Plan Upgrade

Merchants can view their current plan and upgrade/downgrade via Razorpay. Only available for INR merchants (Stripe billing for international merchants is a future build).

### Get Billing Info
```
GET /api/merchant/billing
Authorization: Bearer {token}
```
**Response 200:**
```json
{
  "data": {
    "plan": "starter",
    "plan_label": "Starter",
    "plan_active": true,
    "is_trial": true,
    "plan_expires_at": "2026-06-28",
    "days_remaining": 7,
    "billing_cycle": "monthly",
    "billing_type": "onetime",
    "pending_plan": null,
    "currency": "INR",
    "currency_symbol": "₹",
    "plans": {
      "starter": {
        "label": "Starter",
        "monthly_price": 99,
        "yearly_price": 990,
        "products": 15,
        "staff": 0,
        "features": ["Online store URL", "Flat rate delivery", "Push notifications for new orders", "Order management dashboard"]
      },
      "growth": {
        "label": "Growth",
        "monthly_price": 199,
        "yearly_price": 1990,
        "products": 50,
        "staff": 2,
        "features": ["Everything in Starter", "No Branzia branding", "Sales analytics & reports", "Discount codes", "Delivery zones", "Email confirmation to buyers", "Customer accounts & order history", "Up to 2 staff accounts"]
      },
      "pro": {
        "label": "Pro",
        "monthly_price": 499,
        "yearly_price": 4990,
        "products": null,
        "staff": 5,
        "features": ["Everything in Growth", "Unlimited products", "Custom domain", "Google Tag Manager & custom pixels", "Up to 5 staff accounts", "Priority support"]
      }
    }
  }
}
```
`products: null` means unlimited (Pro plan). `pending_plan` is set when a downgrade was scheduled to take effect at end of current cycle.

---

### Initiate Plan Payment
```
POST /api/merchant/billing/initiate
Authorization: Bearer {token}
Content-Type: application/json
```
**Body:**
```json
{
  "plan": "growth",
  "cycle": "monthly"
}
```
| Field | Required | Values |
|-------|----------|--------|
| `plan` | yes | `starter`, `growth`, `pro` |
| `cycle` | yes | `monthly`, `yearly` |

**Response — payment required (upgrade or new plan):**
```json
{
  "mode": "order",
  "order_id": "order_PJxxx",
  "amount": 19900,
  "currency": "INR",
  "key_id": "rzp_live_xxx",
  "description": "Growth Plan – Monthly",
  "prefill": {
    "name": "Ravi Kumar",
    "email": "ravi@example.com",
    "contact": "9876543210"
  }
}
```
Pass `key_id`, `order_id`, `amount`, `currency`, `description`, and `prefill` to the Razorpay mobile SDK to launch the payment sheet.

**Response — downgrade scheduled (no payment):**
```json
{
  "type": "scheduled",
  "plan_label": "Starter",
  "effective_at": "2026-07-21",
  "message": "Starter plan will activate on 21 Jul 2026."
}
```
When `type: "scheduled"`, no Razorpay payment is needed. Show the message to the merchant and skip the payment step.

**Pro-rated upgrades:** When upgrading mid-cycle, the server automatically deducts credit for remaining days and returns the prorated `amount`. The mobile app does not need to calculate this.

---

### Verify Payment and Activate Plan
```
POST /api/merchant/billing/verify
Authorization: Bearer {token}
Content-Type: application/json
```
Call this after the Razorpay SDK reports a successful payment. Pass the three values the SDK provides:

**Body:**
```json
{
  "order_id":   "order_PJxxx",
  "payment_id": "pay_PJyyy",
  "signature":  "abc123..."
}
```

**Response 200 — plan activated:**
```json
{
  "message": "Growth plan activated!",
  "plan": "growth",
  "plan_label": "Growth",
  "billing_cycle": "monthly",
  "plan_expires_at": "2026-07-21",
  "days_remaining": 30
}
```

**Response 422 — no pending payment:** `{ "message": "No pending payment found. Initiate payment first." }`
**Response 422 — signature invalid:** `{ "message": "Payment verification failed." }`

---

### Plan Upgrade Flow (mobile)

```
1. GET /billing           → show current plan + plan cards
2. User picks a plan
3. POST /billing/initiate → if type == "scheduled", show message and done
                          → if mode == "order", launch Razorpay SDK
4. SDK returns on success → { razorpay_order_id, razorpay_payment_id, razorpay_signature }
5. POST /billing/verify   → plan is activated, update UI
```

**Important:** Always call `/billing/verify` immediately after SDK success — do not navigate away first. If the app is killed before verify is called, the user paid but the plan is not activated. In that case, call `GET /billing` — if `pending_plan` is set and a payment may have gone through, prompt the user to contact support.
