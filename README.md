# Ansh & Riley Full-Stack Template

This is a full-stack template project for Software Composers to create  applications with AI.

## Getting started
To create a new project, you go to `/paths`, choose from our list of Paths, and then use Cursor's Composer feature to quickly scaffold your project!

You can also edit the Path's prompt template to be whatever you like!

## Technologies used
This doesn't really matter, but is useful for the AI to understand more about this project. We are using the following technologies
- React with Next.js 14 App Router
- TailwindCSS
- Firebase Auth, Storage, and Database
- Multiple AI endpoints including OpenAI, Anthropic, and Replicate using Vercel's AI SDK

## Environment variables
Set `OPENAI_API_KEY` with your OpenAI credentials so the API routes can access the service.
## Application routes

The main page for logged-in users is `src/app/page.tsx`. It is rendered inside `AuthenticatedLayout`, so edits to that file show up after authentication.

When a visitor is not logged in, `AuthenticatedLayout` shows the landing page from `src/lib/contexts/landingPage.tsx`. Changes there are visible only when not authenticated.


## Firebase auth troubleshooting
For consejos sobre el error de "missing initial state" al usar redirecciones, consulta [docs/missing-initial-state.md](docs/missing-initial-state.md).

