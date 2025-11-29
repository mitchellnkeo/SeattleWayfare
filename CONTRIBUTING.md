# Contributing to Seattle Wayfare

## Development Workflow

### Before Starting
1. Make sure you have the latest code: `git pull`
2. Install dependencies: `npm install`
3. Set up environment variables (see README.md)

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make small, focused commits**
   - Keep commits small and manageable
   - Each commit should represent a logical change
   - Write clear commit messages

3. **Test your changes**
   ```bash
   npm test
   npm run lint
   ```

4. **Pre-commit hooks will run automatically**
   - ESLint will check your code
   - Prettier will format your code
   - Tests will run (if applicable)

### Commit Message Format

```
type: brief description

Optional longer explanation if needed
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Adding or updating tests
- `refactor`: Code refactoring
- `style`: Code style changes (formatting)
- `chore`: Maintenance tasks

### Testing Requirements

- Write tests for new features
- Maintain 60%+ code coverage
- Test on both iOS and Android when possible
- Test with real transit data when possible

### Code Style

- Follow ESLint rules (run `npm run lint:fix`)
- Use Prettier for formatting (run `npm run format`)
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and focused

### Pull Request Process

1. Ensure all tests pass
2. Ensure linting passes
3. Update documentation if needed
4. Create a small, focused PR
5. Request review

## Important Notes

- **No big commits**: Keep changes small and incremental
- **No big pushes**: Push frequently in small batches
- Test thoroughly before pushing
- Be mindful of API rate limits during development

