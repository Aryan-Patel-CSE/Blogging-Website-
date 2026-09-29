# Blogging App

A modern blog application built with React, Vite, Redux Toolkit, and Appwrite. The app is designed to manage blog posts with a rich text editor, dynamic routing, and database-backed content storage.

## Features

- Create, read, update, and delete blog posts
- Rich text editing with TinyMCE
- Appwrite-powered database and storage integration
- Redux Toolkit state management
- React Router-based navigation
- Responsive UI for blog content and dashboard flows

## Tech Stack

- React 19
- Vite
- Redux Toolkit
- React Router DOM
- Appwrite
- TinyMCE
- HTML React Parser
- React Hook Form

## Project Structure

```bash
BlogingApp/
├── public/
├── src/
│   ├── assets/
│   ├── conf/
│   │   └── config.js
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .eslintrc.*
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Prerequisites

Before running the project, make sure you have installed:

- Node.js (v18 or later recommended)
- npm or yarn
- An Appwrite project with a database and storage bucket configured

## Installation

1. Clone the repository
2. Navigate to the project folder
3. Install dependencies:

```bash
npm install
```

## Environment Variables

Create a `.env` file in the project root and add the following values:

```env
VITE_APPWRITE_URL=your_appwrite_url
VITE_APPWRITE_PROJECT_ID=your_appwrite_project_id
VITE_APPWRITE_DATABASE_ID=your_appwrite_database_id
VITE_APPWRITE_TABLE_ID=your_appwrite_table_id
VITE_APPWRITE_BUCKET_ID=your_appwrite_bucket_id
```

These values are read from `src/conf/config.js`.

## Available Scripts

```bash
npm run dev
```
Starts the development server.

```bash
npm run build
```
Creates a production build.

```bash
npm run preview
```
Serves the production build locally.

```bash
npm run lint
```
Runs ESLint checks.

## Running the App

```bash
npm run dev
```

Then open the local URL shown in the terminal, usually:

```bash
http://localhost:5173
```

## Appwrite Setup

This project expects an Appwrite database with the required collection/table configuration used by the app. Update the environment variables and ensure your Appwrite project has access to the appropriate database and bucket for posts and media content.

## Notes

This README is intended to help you run and understand the project. If you want, you can extend the app with:

- authentication
- user profiles
- post categories and tags
- search and filtering
- comments and likes
- admin dashboard

## License

This project is currently unlicensed unless you add a license file for your own distribution or deployment needs.
