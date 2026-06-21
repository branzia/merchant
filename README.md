# Branzia Merchant

The official open-source mobile app for **Branzia** merchants — manage your online store from anywhere.

Branzia is a multi-tenant online store builder for small businesses. This app gives merchants a native mobile interface to handle orders, products, categories, delivery, payments, and store settings — all powered by the [Branzia REST API](https://branzia.app).

---

## Screenshots

> _Coming soon_

---

## Features

| Area | What you can do |
|------|----------------|
| **Dashboard** | Today's orders, revenue, monthly stats, order status breakdown |
| **Orders** | List with search & status filters, order detail, confirm / reject / deliver, chat with buyer |
| **Products** | List, create, edit, delete, toggle availability, attributes & variants |
| **Categories** | Create, edit, delete, reorder |
| **Attributes** | Custom buyer-facing fields (select options, free text) |
| **Settings** | Shop info, social links, business hours, logo upload |
| **Payment Methods** | Toggle COD, UPI, bank transfer; manage UPI ID & bank details |
| **Delivery** | Flat rate, zone-based, or free delivery; zone management |
| **Subscription** | View current plan, compare plans, upgrade via in-app Razorpay checkout |
| **Order Chat** | Per-order message thread with buyers, real-time polling, read receipts |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Expo](https://expo.dev) (SDK 54) + [React Native](https://reactnative.dev) 0.81 |
| Navigation | [Expo Router](https://expo.github.io/router) v6 (file-based routing) |
| Styling | [NativeWind](https://www.nativewind.dev) v4 (Tailwind CSS for React Native) |
| Auth storage | [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/securestore/) |
| Image picker | [expo-image-picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/) |
| Payments | [react-native-razorpay](https://github.com/razorpay/react-native-razorpay) |
| API | Branzia REST API (`https://branzia.app/api/merchant`) |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/) — `npm install -g expo-cli`
- Android Studio (for Android) or Xcode (for iOS)
- A Branzia merchant account — [branzia.app](https://branzia.app)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/branzia-merchant.git
cd branzia-merchant

# Install dependencies
npm install
```

### Running the app

> **Note:** This app uses native modules (`expo-secure-store`, `react-native-razorpay`) and requires a **development build** — it will not run in Expo Go.

```bash
# Build and run on Android
npx expo run:android

# Build and run on iOS
npx expo run:ios
```

#### Using EAS Build (recommended for CI / physical devices)

```bash
# Install EAS CLI
npm install -g eas-cli

# Build development client
eas build --profile development --platform android
eas build --profile development --platform ios
```

---

## Project Structure

```
app/
├── (auth)/
│   └── login.tsx           # Login screen
├── (tabs)/
│   ├── _layout.tsx         # Tab layout + slide drawer
│   ├── index.tsx           # Dashboard
│   ├── orders.tsx          # Orders list
│   ├── products.tsx        # Products list
│   ├── categories.tsx      # Categories
│   ├── attributes.tsx      # Attributes
│   └── settings.tsx        # Settings
├── orders/
│   ├── [id].tsx            # Order detail
│   └── [id]/
│       └── chat.tsx        # Order chat
├── products/
│   ├── create.tsx          # Create product
│   └── [id]/
│       └── edit.tsx        # Edit product
├── settings/
│   ├── hours.tsx           # Business hours
│   ├── logo.tsx            # Logo upload
│   ├── payment-methods.tsx # Payment methods
│   └── delivery.tsx        # Delivery settings & zones
└── subscription.tsx        # Plan selection & upgrade

context/
├── AuthContext.tsx          # Auth state + merchant profile
└── DrawerContext.tsx        # Slide drawer open/close state

services/
└── api.ts                  # API client with in-memory cache
```

---

## API

All screens communicate with the Branzia REST API:

```
Base URL: https://branzia.app/api/merchant
Auth:     Bearer token (stored in SecureStore)
```

The full API reference is documented in [CLAUDE.md](./CLAUDE.md).

### Caching

The API client (`services/api.ts`) uses an in-memory cache to avoid redundant requests:

| Endpoint | Cache |
|----------|-------|
| Dashboard | 30 seconds TTL |
| Products | 60 seconds TTL (per filter combo) |
| Categories | Until create / edit / delete |
| Attributes | Until create / edit / delete |
| Settings | 5 minutes TTL |
| Payment Methods | 2 minutes TTL |
| Delivery Settings | 2 minutes TTL |
| Subscription | 5 minutes TTL |
| Orders / Messages | Not cached (always real-time) |

Merchant profile is persisted to SecureStore so the app is instantly usable on cold start without waiting for a network round-trip.

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch — `git checkout -b feat/your-feature`
3. Commit your changes — `git commit -m "feat: add your feature"`
4. Push to the branch — `git push origin feat/your-feature`
5. Open a Pull Request

### Code Style

- TypeScript throughout — no `any` where avoidable
- NativeWind (Tailwind) classes for all styling — no inline `StyleSheet.create`
- No comments unless the _why_ is non-obvious
- Each screen is self-contained — shared logic lives in `services/api.ts` or `context/`

---

## Environment

No `.env` file is needed — the API base URL is hardcoded to `https://branzia.app/api/merchant`. If you are running a self-hosted Branzia instance, update `BASE_URL` in `services/api.ts`.

---

## License

This project is open-source and available under the [MIT License](./LICENSE).

---

## Links

- [Branzia Website](https://branzia.app)
- [Buyer App](#) _(coming soon)_
- [Web Dashboard](https://branzia.app/merchant)
- [Report an Issue](https://github.com/your-org/branzia-merchant/issues)
