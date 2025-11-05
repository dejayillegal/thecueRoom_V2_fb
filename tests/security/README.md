
# Security Tests

Automated security testing using OWASP ZAP, Snyk, and manual penetration testing procedures.

## Tools

- OWASP ZAP (DAST)
- Snyk (SCA)
- npm audit (dependency vulnerabilities)
- Manual pen-test procedures

## Running Tests

```bash
pnpm test:security:deps
pnpm test:security:zap
```

## Scope

- Authentication bypass
- CSRF protection
- XSS vulnerabilities
- SQL injection
- SSRF attempts
- File upload vulnerabilities
- Privilege escalation
