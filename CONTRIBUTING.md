# Contributing to FinHub

First off, thank you for considering contributing to FinHub! It's people like you that make FinHub such a great tool.

## Code of Conduct

Please be respectful and professional in all interactions.

## How Can I Contribute?

### Reporting Bugs

- Use a clear and descriptive title.
- Describe the exact steps which reproduce the problem.
- Explain which behavior you expected to see and why.

### Suggesting Enhancements

- Use a clear and descriptive title.
- Provide a step-by-step description of the suggested enhancement.
- Explain why this enhancement would be useful.

### Pull Requests

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.

## Development Setup

1. **Clone the repository**:

    ```bash
    git clone https://github.com/your-org/finhub.git
    cd finhub
    ```

2. **Use the correct Node version**:
    If you use `nvm`, run:

    ```bash
    nvm use
    ```

3. **Install dependencies**:

    ```bash
    npm install
    ```

4. **Set up environment variables**:

    ```bash
    cp .env.example .env
    ```

5. **Start the development server**:

    ```bash
    npm run dev
    ```

## Style Guide

- We use ESLint for linting.
- Follow the existing code style and naming conventions.
- Keep components small and focused.
