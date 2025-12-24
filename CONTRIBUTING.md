# Contributing to Shajara | المساهمة في شجرة

<div dir="rtl">

## شكراً لاهتمامك بالمساهمة في شجرة!

نحن نرحب بمساهماتك ونقدر وقتك. هذا المستند يوفر إرشادات للمساهمة في المشروع.

</div>

Thank you for your interest in contributing to Shajara! We welcome contributions and appreciate your time. This document provides guidelines for contributing to the project.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Arabic Language Guidelines](#arabic-language-guidelines)

---

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to support@shajara.app.

### Our Standards

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

---

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Environment details (browser, OS, etc.)

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md).

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- A clear and descriptive title
- Detailed description of the proposed functionality
- Why this enhancement would be useful
- Possible implementation approach (if you have ideas)

Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md).

### Your First Code Contribution

Unsure where to begin? Look for issues labeled:

- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `documentation` - Improvements to documentation

### Pull Requests

1. Fork the repository
2. Create a branch from `main`
3. Make your changes
4. Add tests if applicable
5. Ensure all tests pass
6. Update documentation
7. Submit a pull request

---

## Development Setup

### Prerequisites

- Node.js 20 or higher
- npm or yarn
- Git
- Cloudflare account (for deployment testing)

### Setup Steps

1. **Fork and clone the repository**:
```bash
git clone https://github.com/your-username/shajara.git
cd shajara
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
```bash
cp .env.example .env.local
```
Edit `.env.local` with your configuration.

4. **Run database migrations**:
```bash
npm run db:migrate
```

5. **Start the development server**:
```bash
npm run dev
```

6. **Open the application**:
Visit `http://localhost:3000`

---

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Avoid `any` types - use proper type definitions
- Use interfaces for object shapes
- Use type aliases for unions and primitives

### React Components

- Use functional components with hooks
- Follow the component structure:
  ```typescript
  import statements
  type/interface definitions
  component definition
  export statement
  ```
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use meaningful component and prop names

### File Naming

- Components: `PascalCase.tsx` (e.g., `FamilyTree.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatDate.ts`)
- Types: `PascalCase.ts` or `types.ts`
- Tests: `ComponentName.test.tsx`

### Code Style

We use ESLint and Prettier for code formatting. Before committing:

```bash
npm run lint
```

### Comments

- Write self-documenting code when possible
- Add comments for complex logic
- Use JSDoc for public functions and components
- Include Arabic translations in comments when relevant

Example:
```typescript
/**
 * Formats an Arabic name with patronymic chain
 * تنسيق الاسم العربي مع سلسلة النسب
 *
 * @param givenName - Given name (الاسم الأول)
 * @param patronymicChain - Patronymic chain (سلسلة النسب)
 * @param familyName - Family name (اسم العائلة)
 * @returns Formatted full name
 */
export function formatArabicName(
  givenName: string,
  patronymicChain?: string,
  familyName?: string
): string {
  // Implementation
}
```

---

## Commit Messages

### Format

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `i18n`: Internationalization changes

### Examples

```
feat(family-tree): add interactive tree visualization

Implemented d3.js-based family tree with zoom and pan capabilities.
Supports RTL layout for Arabic names.

Closes #123
```

```
fix(arabic-names): correct patronymic chain formatting

Fixed issue where patronymic chain was not properly concatenated
with "بن" separator.
```

```
i18n(ar): add Arabic translations for profile page
```

---

## Pull Request Process

### Before Submitting

1. **Update your branch**:
```bash
git fetch upstream
git rebase upstream/main
```

2. **Run tests and checks**:
```bash
npm run lint
npm test
npm run build
```

3. **Update documentation** if needed

4. **Add or update tests** for your changes

### PR Title

Use the same format as commit messages:
```
feat(scope): description
```

### PR Description

Include:
- What changes were made
- Why these changes were necessary
- How to test the changes
- Screenshots (for UI changes)
- Related issues

### Review Process

- At least one maintainer must approve
- All CI checks must pass
- No merge conflicts
- Code follows style guidelines
- Documentation is updated

### After Approval

- Squash commits if requested
- Maintainer will merge using "Squash and merge"

---

## Arabic Language Guidelines

### Text Direction

- Use `dir="rtl"` for Arabic content
- Use `dir="ltr"` for English content
- Test all layouts in both directions

### Typography

- Use appropriate Arabic fonts
- Ensure proper line spacing for Arabic text
- Test with various Arabic text lengths

### Translations

- Add translations to `messages/ar.json` and `messages/en.json`
- Use keys in `camelCase`
- Keep translations consistent
- Include context comments for translators

Example:
```json
{
  "familyTree": {
    "title": "شجرة العائلة",
    "addMember": "إضافة فرد",
    "searchPlaceholder": "ابحث عن فرد من العائلة..."
  }
}
```

### Arabic Naming Convention

When working with Arabic names:
- `givenName`: الاسم الأول (first name)
- `patronymicChain`: سلسلة النسب (bin/ibn chain)
- `familyName`: اسم العائلة/القبيلة (family/tribal name)

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Writing Tests

- Write tests for all new features
- Update tests when modifying existing code
- Aim for >80% code coverage
- Test both Arabic and English content
- Test RTL and LTR layouts

---

## Documentation

### Updating Documentation

When making changes, update:
- README.md (if setup or features change)
- Component documentation (JSDoc comments)
- API documentation (if applicable)
- Translation files

### Documentation Style

- Write in both English and Arabic when appropriate
- Be clear and concise
- Include code examples
- Add screenshots for UI features

---

## Questions?

If you have questions about contributing:
- Check existing issues and discussions
- Ask in the issue or PR comments
- Email: support@shajara.app

---

<div dir="rtl">

## شكراً على مساهمتك!

نحن نقدر كل مساهمة، سواء كانت صغيرة أو كبيرة. شكراً لمساعدتك في جعل شجرة أفضل للجميع!

</div>

## Thank You!

We appreciate every contribution, no matter how small. Thank you for helping make Shajara better for everyone!

---

## License

By contributing to Shajara, you agree that your contributions will be licensed under the MIT License.
