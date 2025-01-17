# LibreStudy

An open-source flashcard and testing application built with modern web technologies. LibreStudy aims to be a free and open-source alternative to Quizlet, allowing users to create, manage, study, and test themselves using digital flashcards.

## Features

- Create and manage flashcard decks
- Study flashcards with optional spaced repetition
- Automatically generate tests from flashcard decks
- Multiple question types (multiple choice, matching, fill in the blank, true/false)
- Import/Export functionality for decks
- Progress tracking and statistics
- Modern, responsive UI built with Mantine UI

## Technology Stack

- **Frontend:**
  - React with TypeScript
  - Mantine UI for components and styling
  - Vite as the build tool
  - Bun as the package manager

- **Backend:**
  - Bun as the runtime
  - Hono.js for the REST API
  - PostgreSQL database

- **Containerization:**
  - Podman for container management
  - Rootless container support

## Getting Started

### Prerequisites

- Bun (latest version)
- Podman
- PostgreSQL

### Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/LibreStudy.git
   cd LibreStudy
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Start the development server:
   ```bash
   bun run dev
   ```

### Running with Podman

1. Build the containers:
   ```bash
   podman-compose build
   ```

2. Start the application:
   ```bash
   podman-compose up --userns=keep-id
   ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
