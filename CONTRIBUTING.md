# Contributing to MCP-Jest

We love your input! We want to make contributing to MCP-Jest as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Setting Up Development Environment

1. **Prerequisites**
   - Node.js 18+
   - npm or yarn

2. **Setup**
   ```bash
   git clone https://github.com/josharsh/mcp-jest.git
   cd mcp-jest
   npm install
   ```

3. **Development**
   ```bash
   npm run dev          # Run in development mode
   npm run build        # Build the project
   npm test             # Run tests
   npm run lint         # Run linter
   ```

## Pull Request Process

1. **Before submitting:**
   - Ensure any install or build dependencies are removed before the end of the layer when doing a build.
   - Update the README.md with details of changes to the interface, this includes new environment variables, exposed ports, useful file locations and container parameters.
   - Increase the version numbers in any examples files and the README.md to the new version that this Pull Request would represent.

2. **PR Guidelines:**
   - Keep changes focused - one feature/fix per PR
   - Write clear, descriptive commit messages
   - Include tests for new functionality
   - Update documentation as needed
   - Follow the existing code style

3. **PR Template:**
   ```
   ## Description
   Brief description of what this PR does

   ## Type of Change
   - [ ] Bug fix (non-breaking change which fixes an issue)
   - [ ] New feature (non-breaking change which adds functionality)
   - [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
   - [ ] This change requires a documentation update

   ## Testing
   - [ ] Tests pass locally with my changes
   - [ ] I have added tests that prove my fix is effective or that my feature works

   ## Documentation
   - [ ] I have updated the documentation accordingly
   ```

## Coding Standards

### TypeScript Style Guide

- Use TypeScript for all new code
- Follow existing naming conventions
- Use meaningful variable and function names
- Add type annotations where beneficial
- Use interfaces for object shapes

### Code Quality

- **Linting**: We use Biome for code formatting and linting
- **Testing**: Write tests for new features and bug fixes
- **Documentation**: Update docs for API changes

### Commit Messages

Follow conventional commit format:
```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:
```
feat(cli): add snapshot comparison feature

Add ability to compare snapshots with improved diff output
that highlights changes more clearly for better debugging.

Closes #123
```

## Testing Guidelines

### Running Tests
```bash
npm test                    # Run all tests
npm run test:unit          # Run unit tests only
npm run test:integration   # Run integration tests only
```

### Writing Tests
- Place tests in `tests/` directory
- Use descriptive test names
- Include both positive and negative test cases
- Test edge cases and error conditions

### Test Structure
```javascript
// Example test structure
describe('MCPTestRunner', () => {
  describe('when testing tools', () => {
    it('should validate tool responses correctly', async () => {
      // Arrange
      const config = { /* test config */ };
      
      // Act
      const result = await runner.testTool('example', config);
      
      // Assert
      expect(result.status).toBe('pass');
    });
  });
});
```

## Reporting Bugs

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/josharsh/mcp-jest/issues).

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## Feature Requests

We welcome feature requests! Please:

1. Check if the feature has already been requested
2. Provide a clear description of the problem you're trying to solve
3. Describe the solution you'd like to see
4. Consider alternative solutions
5. Provide additional context if helpful

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

## Questions?

Feel free to open an issue for questions, or reach out to the maintainers directly.

## Recognition

Contributors will be recognized in our README and release notes. Thank you for making MCP-Jest better!