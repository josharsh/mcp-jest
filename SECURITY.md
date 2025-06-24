# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

The MCP-Jest team takes security bugs seriously. We appreciate your efforts to responsibly disclose your findings, and will make every effort to acknowledge your contributions.

To report a security vulnerability, please use one of the following methods:

### 1. GitHub Security Advisories (Preferred)

Report security vulnerabilities through GitHub's Security Advisory feature:
1. Go to https://github.com/josharsh/mcp-jest/security/advisories
2. Click "New draft security advisory"
3. Fill in the details of your finding

### 2. Email

Send an email to [harsh.joshi.pth@gmail.com](mailto:harsh.joshi.pth@gmail.com) with:
- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### What to Expect

- **Response Time**: You should receive a response within 48 hours.
- **Acknowledgment**: If the issue is confirmed, we will acknowledge it and work on a fix.
- **Updates**: We will keep you informed about the progress.
- **Disclosure**: We will coordinate with you on the disclosure timeline.

### Security Update Process

1. The security report is received and assigned to a primary handler
2. The problem is confirmed and a list of affected versions is determined
3. Code is audited to find any similar problems
4. Fixes are prepared for all supported releases
5. An advisory is published

## Security Best Practices for Users

When using MCP-Jest in your projects:

1. **Keep Dependencies Updated**
   ```bash
   npm update mcp-jest
   npm audit fix
   ```

2. **Validate Server Configurations**
   - Always validate server command paths
   - Use absolute paths when possible
   - Avoid running servers with elevated privileges

3. **Environment Variables**
   - Never hardcode sensitive information in test configurations
   - Use environment variables for sensitive data
   - Keep `.env` files out of version control

4. **Test Isolation**
   - Run tests in isolated environments when possible
   - Use containers or VMs for testing untrusted servers
   - Limit network access during tests

5. **Audit Your Tests**
   - Regularly review test configurations
   - Remove unused or outdated test files
   - Monitor for unexpected behavior

## Security Features

MCP-Jest includes several security features:

- **Process Isolation**: Each test server runs in its own process
- **Timeout Protection**: Automatic timeout for hanging processes
- **Input Validation**: All inputs are validated before execution
- **No Eval**: No dynamic code execution via eval()

## Third-Party Dependencies

We regularly update our dependencies to include the latest security patches. You can check the current dependencies status:

```bash
npm audit
```

## Contact

For any security-related questions that don't require reporting a vulnerability, please open a discussion in our GitHub repository.

Thank you for helping keep MCP-Jest and its users safe!