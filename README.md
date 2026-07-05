# WorkoutTracker Frontend

A sleek, mobile-first Progressive Web App (PWA) designed for frictionless workout tracking. Built with **React** and **Vite**, this frontend consumes the WorkoutTracker API to provide users with a fast, intuitive, and app-like experience on both desktop and mobile devices.

## ✨ Key Features

* **Progressive Web App (PWA):** Fully installable on iOS and Android devices for a native app feel, complete with a custom manifest and splash screen icons.
* **Activity Heatmap:** A GitHub-style contribution calendar that visualizes your workout consistency and total volume over time.
* **Fluid Animations:** Smooth page transitions and micro-interactions powered by `framer-motion`.
* **Dark/Light Mode:** First-class dark mode support with a seamless toggle that remembers user preferences and adjusts the safe-area theme colors.
* **Dynamic Logging Interface:** Context-aware logging screens that adapt to the exercise type (e.g., Reps & Weight vs. Duration-based holds like Planks).
* **Catalog Management:** Built-in UI to dynamically add new Muscle Groups, Target Muscles, and Exercises.

## 🛠️ Tech Stack

* **Framework:** React 19 & Vite
* **Styling:** Tailwind CSS v4
* **Animations:** Framer Motion
* **Routing:** React Router DOM v7
* **HTTP Client:** Axios (with JWT interceptors)
* **Data Visualization:** React Activity Calendar
* **Deployment:** Docker & Nginx

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v20 or higher recommended)
* A running instance of the **WorkoutTracker API** (Backend)

### Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/WorkoutFrontend.git
   cd WorkoutFrontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory to point to your backend API.
   ```env
   VITE_API_URL=http://localhost:5065/api
   ```
   *(If not provided, it defaults to `http://localhost:5065/api`)*

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

### 🐳 Docker Deployment

The project includes a multi-stage Dockerfile that builds the React app and serves it using a lightweight Nginx container. It is production-ready and ideal for VPS hosting.

1. **Build the Docker image:**
   ```bash
   docker build -t workouttracker-frontend .
   ```

2. **Run the container:**
   ```bash
   docker run -d -p 80:80 --name workout-ui workouttracker-frontend
   ```
   *Note: In a production environment, you should build the image with your production API URL injected, or handle API routing via a reverse proxy (like Nginx/Traefik).*

## 📁 Project Structure

* `/src/api/` - Axios instance configuration and request/response interceptors for JWT handling.
* `/src/components/` - Reusable UI elements (`IconCard`, `ThemeToggle`, `WorkoutHeatmap`).
* `/src/pages/` - Main application views (`Home`, `Logger`, `Summary`, `ManageCatalog`, etc.).
* `/public/assets/icons/` - SVG icons for various muscle groups and exercises.

## 📱 PWA Features

To install the app on mobile:
* **iOS:** Open in Safari, tap "Share", and select "Add to Home Screen".
* **Android:** Open in Chrome and tap the "Install App" prompt at the bottom of the screen.
