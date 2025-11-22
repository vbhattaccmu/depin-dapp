# Contributing to BigWater DePIN App

Thank you for your interest in contributing to the BigWater DePIN App!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/bigwater-depin-app.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes thoroughly
6. Commit your changes: `git commit -m "Add your commit message"`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Create a Pull Request

## Development Guidelines

### Code Style

- Use meaningful variable and function names
- Follow the existing code style
- Write comments for complex logic
- Keep functions small and focused

### Component Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page-level components
├── stores/        # Zustand state management
├── utils/         # Utility functions
├── config/        # Configuration files
└── hooks/         # Custom React hooks (if needed)
```

### Naming Conventions

- **Components**: PascalCase (e.g., `BalanceCard.jsx`)
- **Utilities**: camelCase (e.g., `formatBalance`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`)
- **Files**: Match component name (e.g., `BalanceCard.jsx`)

### Git Commit Messages

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit first line to 72 characters
- Reference issues and PRs liberally

Examples:
```
feat: Add device registration validation
fix: Correct token balance display
docs: Update setup instructions
style: Format code with prettier
refactor: Simplify wallet encryption logic
```

## Testing

Before submitting a PR:

1. Test all features manually
2. Check browser console for errors
3. Verify responsive design on mobile
4. Test with different wallets and accounts

## Pull Request Process

1. Update the README.md with details of changes if needed
2. Update the SETUP.md if you change configuration
3. Ensure your code follows the project style
4. Your PR will be reviewed by maintainers
5. Address any requested changes
6. Once approved, your PR will be merged

## Bug Reports

When filing a bug report, please include:

- Browser and version
- Operating system
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Console errors (if any)

## Feature Requests

We welcome feature requests! Please include:

- Clear description of the feature
- Use case / motivation
- Proposed implementation (if you have ideas)
- Potential impact on existing features

## Questions?

Feel free to open an issue with your question, and we'll do our best to help!

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and encourage diverse perspectives
- Focus on what is best for the community
- Show empathy towards other community members

Thank you for contributing! 🎉

