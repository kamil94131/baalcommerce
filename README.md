# BaalCommerce

A simple swampweed trading system operating in a mining colony.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

BaalCommerce is a straightforward e-commerce platform designed for trading swampweed within a mining colony. The system allows users to register with default buyer and seller roles, create and list offers for swampweed, select a courier, and finalize orders with cash-on-delivery payment using magic ore as currency.

Key features include:
- **User Management**: Registration and login system with distinct roles.
- **Offer Management**: Users can create, edit, and delete their sales offers.
- **Order Processing**: Buyers can browse offers and place orders.
- **Courier System**: A special "gomez" role, assigned manually in the database, can manage the list of available couriers.
- **Purchase Blocking**: The system prevents new orders if no couriers are available.
- **Order History**: Users can view their purchase and sales history.
- **Strong Validation**: Robust client-side and server-side validation for all input fields.

## Tech Stack

### Frontend
- **[Astro 5](https://astro.build/)**: For building fast, content-focused websites.
- **[React 19](https://react.dev/)**: For creating interactive UI components.
- **[TypeScript 5](https://www.typescriptlang.org/)**: For static typing and improved code quality.
- **[Tailwind CSS 4](https://tailwindcss.com/)**: A utility-first CSS framework for styling.
- **[Shadcn/ui](https://ui.shadcn.com/)**: A library of accessible and reusable React components.

### Backend
- **[Supabase](https://supabase.io/)**: An open-source Firebase alternative providing a PostgreSQL database, authentication, and a Backend-as-a-Service SDK.

### AI Integration
- **[Openrouter.ai](https://openrouter.ai/)**: A service providing access to a wide range of AI models for various tasks.

### CI/CD & Hosting
- **[GitHub Actions](https://github.com/features/actions)**: For continuous integration and deployment pipelines.
- **[DigitalOcean](https://www.digitalocean.com/)**: For hosting the application via a Docker image.

## Getting Started Locally

To set up and run the project on your local machine, follow these steps:

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/baalcommerce.git
    cd baalcommerce
    ```

2.  **Set up the Node.js environment:**
    The project requires Node.js version `22.14.0`. It's recommended to use a version manager like [nvm](https://github.com/nvm-sh/nvm).
    ```sh
    nvm use
    ```

3.  **Install dependencies:**
    ```sh
    npm install
    ```

4.  **Set up environment variables:**
    Create a `.env` file by copying the example file and fill in the required values (e.g., Supabase credentials).
    ```sh
    cp .env.example .env
    ```

5.  **Run the development server:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:4321`.

## Available Scripts

The following scripts are available in the `package.json`:

| Script       | Description                                      |
|--------------|--------------------------------------------------|
| `npm run dev`    | Starts the development server with hot-reloading. |
| `npm run build`  | Builds the application for production.           |
| `npm run preview`| Previews the production build locally.           |
| `npm run astro`  | Accesses the Astro CLI.                          |
| `npm run lint`   | Lints the codebase for errors.                   |
| `npm run lint:fix`| Lints the codebase and automatically fixes issues. |
| `npm run format` | Formats the code using Prettier.                 |

## Project Scope

- User registration and authentication (buyer and seller roles).
- Full CRUD (Create, Read, Update, Delete) functionality for offers by the seller.
- Order placement and processing with courier selection.
- Order history for both buyers and sellers.
- Courier management (create/delete) restricted to the `gomez` role.
- Blocking purchases when no couriers are available.

## Project Status

This project is currently in the MVP stage and under active development.

## License

This project is under MIT license 
