---
name: angular-major-upgrade
description: Upgrade an existing Angular 18 application sequentially to Angular 19 and Angular 20. Performs compatibility analysis, dependency updates, official Angular migrations, code fixes and validation at every major-version checkpoint. Use when upgrading Angular projects across these versions.
---

# Angular Major Upgrade: 18 → 19 → 20

## 1. Objective

Upgrade an existing Angular application from Angular 18 to Angular 20 through two independent and controlled migration steps:

1. Angular 18 → Angular 19
2. Angular 19 → Angular 20

Never skip a major version.

The primary objective is to obtain a fully working Angular 20 application while preserving:
- Existing application functionality.
- Existing architecture and design patterns.
- Existing application behavior.
- Existing integrations and third-party libraries.
- Existing build and deployment configuration.

Do not introduce unnecessary refactoring, architectural changes or new features.

## 2. Operating principles

Follow these rules throughout the entire migration:

1. Analyze the project before modifying anything.
2. Never upgrade multiple Angular major versions in a single operation.
3. Complete and validate Angular 19 before starting Angular 20.
4. Use official Angular CLI migrations whenever available.
5. Update dependencies only when required for compatibility.
6. Preserve existing package managers and lockfiles.
7. Never delete configuration files to solve compatibility problems.
8. Never disable TypeScript checks, lint rules or tests to make the build pass.
9. Never replace working application code with simplified implementations.
10. Explain significant changes before applying them.
11. Run the appropriate build and tests after each migration.
12. Stop if a migration introduces unresolved critical errors.

Work incrementally. Prefer small, understandable changes over large automated modifications.

## 3. Environment and compatibility

The preferred development environment is:

- Node.js 22.x
- npm compatible with the existing project
- Angular CLI matching the target Angular major version
- TypeScript version compatible with the target Angular version

Before upgrading, inspect the official compatibility matrix:

https://angular.dev/reference/versions

Important compatibility constraints:

| Angular | Node.js | TypeScript |
|---|---|---|
| Angular 18 | ^18.19.1 / ^20.11.1 / ^22.0.0 | >=5.4 <5.6 (18.1/18.2) |
| Angular 19 | ^18.19.1 / ^20.11.1 / ^22.0.0 | Depends on minor version |
| Angular 20 | ^20.19.0 / ^22.12.0 / ^24.0.0 | >=5.8 <6.0 (20.2/20.3) |

Use the compatibility matrix for the exact minor version being installed.

For Angular 20, ensure Node.js is at least 20.19.0 or 22.12.0 when using the corresponding supported Node.js branch.

Do not downgrade Node.js unnecessarily.

## 4. Phase 0: Project analysis

Before making changes, inspect the entire project.

Identify:

- Angular version.
- Angular CLI version.
- Angular Material version, if installed.
- Angular CDK version, if installed.
- TypeScript version.
- RxJS version.
- Node.js and npm versions.
- Package manager.
- Existing lockfile.
- Build configuration.
- Test configuration.
- TypeScript configurations.
- Third-party Angular libraries.
- Custom builders and webpack configurations.
- Angular SSR or Universal configuration, if present.

Inspect at least:

- package.json
- package-lock.json / yarn.lock / pnpm-lock.yaml
- angular.json
- tsconfig.json
- tsconfig.app.json
- tsconfig.spec.json
- relevant project configuration files

Execute:

```bash
node -v
npm -v
npx ng version
npm ls --depth=0
```

Check Git status:

```bash
git status --short
git branch --show-current
```

### Baseline validation

Before upgrading, determine which commands are available in package.json.

Run the existing project build and tests.

Examples:

```bash
npm run build
npm test
```

Do not assume these scripts exist. Inspect package.json first.

Record:
- Existing build errors.
- Existing test failures.
- Existing warnings.
- Current Angular versions.
- Current dependency versions.

Do not attribute pre-existing errors to the upgrade.

### Git checkpoint

Require a clean working tree before starting.

If there are uncommitted changes, ask the user to commit or stash them.

Create a dedicated migration branch:

```bash
git switch -c chore/angular-18-to-20
```

Create a baseline commit if appropriate.

Never discard user changes.

## 5. Phase 1: Upgrade Angular 18 → Angular 19

### 5.1 Compatibility analysis

Before updating dependencies:

1. Check the Angular 19 compatibility matrix.
2. Identify incompatible TypeScript versions.
3. Check RxJS compatibility.
4. Identify libraries that do not support Angular 19.
5. Check Angular Material and CDK compatibility.
6. Identify custom builders and plugins requiring updates.

Use the official Angular Update Guide:

https://angular.dev/update-guide

Select:
- From: Angular 18
- To: Angular 19
- Application complexity: according to the actual project.
- Angular Material: if applicable.

Do not upgrade unrelated dependencies.

### 5.2 Update Angular dependencies

Use the Angular CLI migration mechanism:

```bash
npx ng update @angular/core@19 @angular/cli@19
```

If Angular Material is installed:

```bash
npx ng update @angular/material@19
```

Only execute the Material command when applicable.

If Angular CLI or package resolution reports dependency conflicts:

1. Inspect the complete error.
2. Identify the conflicting package.
3. Determine whether it is an Angular peer dependency issue.
4. Check the library's official compatibility documentation.
5. Resolve the incompatibility using compatible versions.

Do not automatically use:

```bash
--force
--legacy-peer-deps
```

These options must never be used as a shortcut for unresolved dependency conflicts.

### 5.3 Execute migrations

Allow Angular CLI to execute its official migrations.

Inspect all modified files afterward.

Pay particular attention to:
- Angular configuration.
- TypeScript configuration.
- Angular builders.
- Material components.
- Deprecated APIs.
- Changed framework behavior.
- Test configuration.

Do not manually repeat migrations already executed by Angular CLI.

### 5.4 Dependency verification

Check installed versions:

```bash
npx ng version
npm ls @angular/core @angular/cli typescript rxjs
```

Verify that Angular packages use compatible major and minor versions.

Check all Angular-related packages, including:

- @angular/animations
- @angular/common
- @angular/compiler
- @angular/compiler-cli
- @angular/core
- @angular/forms
- @angular/platform-browser
- @angular/platform-browser-dynamic
- @angular/router
- @angular/cli
- @angular-devkit/build-angular

Only check packages actually used by the project.

### 5.5 Code compatibility

Inspect compilation errors and resolve them individually.

Check:
- Removed APIs.
- Deprecated APIs.
- Changed type definitions.
- Template compilation errors.
- Strict template checking.
- Dependency injection.
- RxJS operators and typings.
- Angular Material component changes.
- Unit test compatibility.

Do not perform optional refactoring.

### 5.6 Validation checkpoint

Run:

```bash
npm ls --depth=0
npx ng version
```

Then execute the project's actual validation scripts:

- Production build.
- Development build, if applicable.
- Unit tests.
- Lint.
- Type checking, if configured.
- E2E tests, if configured.

Verify that:
- The application compiles.
- No new TypeScript errors exist.
- No new template errors exist.
- No unresolved dependency conflicts exist.
- Existing tests pass, accounting for documented baseline failures.

### 5.7 Angular 19 checkpoint

When all required validations pass:

1. Summarize the changes.
2. List modified dependencies.
3. List modified source files.
4. Report tests and build results.
5. Document any remaining warnings.

Create a Git commit:

```bash
git add .
git commit -m "chore: upgrade Angular 18 to Angular 19"
```

STOP HERE.

Do not start Angular 20 automatically.

Wait for user confirmation before continuing to Phase 2.

## 6. Phase 2: Upgrade Angular 19 → Angular 20

Start this phase only after Angular 19 has been successfully validated and the user has authorized continuation.

### 6.1 Compatibility analysis

Repeat the dependency compatibility analysis.

Inspect:
- Current Angular 19 versions.
- TypeScript version.
- RxJS version.
- Angular Material/CDK.
- Third-party Angular libraries.
- Custom builders.
- SSR configuration.
- Testing libraries.

Use the official guide:

https://angular.dev/update-guide

Select:
- From: Angular 19
- To: Angular 20

Pay particular attention to TypeScript compatibility.

For Angular 20.2/20.3, TypeScript must be >=5.8 and <6.0.

### 6.2 Update Angular dependencies

Execute:

```bash
npx ng update @angular/core@20 @angular/cli@20
```

If applicable:

```bash
npx ng update @angular/material@20
```

Keep all Angular framework packages aligned.

Do not upgrade unrelated packages unless required.

### 6.3 Execute Angular 20 migrations

Run all official migrations provided by Angular CLI.

Inspect the resulting code changes.

Pay particular attention to the following Angular 20 changes, checking the exact target minor version:

- Rename the afterRender lifecycle hook to afterEveryRender where applicable.
- Replace deprecated TestBed.get() calls with TestBed.inject().
- Update resource APIs where the request property has changed to params.
- Replace ResourceStatus enum usage with the appropriate string constants.
- Review deprecated and removed APIs.
- Review changes in Angular Material and CDK.
- Review changes in SSR and application builders.

These are inspection targets, not instructions to modify code blindly. Verify each API against the actual project and official migration guidance.

### 6.4 Third-party dependency verification

Check all installed libraries.

For each Angular-related dependency:

1. Inspect its peerDependencies.
2. Check its Angular 20 compatibility.
3. Identify packages requiring an upgrade.
4. Identify abandoned or incompatible packages.
5. Find official migration instructions where available.

Do not replace a library simply because a newer alternative exists.

If a library has no compatible release:
- Report the issue.
- Explain the impact.
- Propose possible solutions.
- Wait for approval before replacing it.

### 6.5 Code compatibility

Resolve all Angular 20 compilation and runtime compatibility issues.

Inspect:
- Components.
- Directives.
- Pipes.
- Services.
- Guards.
- Interceptors.
- Routing.
- Reactive forms.
- Templates.
- RxJS integrations.
- Dependency injection.
- Material components.
- Unit and integration tests.
- SSR and hydration, if present.

Preserve the current application architecture.

### 6.6 Validation checkpoint

Execute:

```bash
npx ng version
npm ls --depth=0
```

Run the complete available validation suite:

- Production build.
- Development build.
- Unit tests.
- Lint.
- Type checking.
- E2E tests.

Check for:
- Dependency conflicts.
- TypeScript errors.
- Template compilation errors.
- Runtime errors.
- Browser console errors, where browser testing is available.
- Broken application routes.
- Broken existing functionality.

Do not declare the migration successful if the production build fails.

## 7. Final verification

After completing Angular 20, perform a final review.

Verify:

1. All Angular packages are on compatible Angular 20 versions.
2. TypeScript is supported by the installed Angular version.
3. RxJS is compatible.
4. Angular Material/CDK are compatible, if installed.
5. Third-party libraries have compatible peer dependencies.
6. Lockfile is consistent with package.json.
7. No accidental dependency removals occurred.
8. No unnecessary source code changes occurred.
9. All required migrations have been completed.
10. Production build succeeds.
11. Tests pass or documented baseline failures are clearly identified.

Run:

```bash
git status --short
git diff --check
git diff --stat
```

Review the complete diff before committing.

Create the final commit:

```bash
git add .
git commit -m "chore: upgrade Angular 19 to Angular 20"
```

## 8. Rollback strategy

Each major-version migration must have its own Git checkpoint.

If a migration fails:

1. Stop the migration.
2. Identify the first failing operation.
3. Inspect Git diff.
4. Identify changes introduced by the migration.
5. Explain the failure and proposed solution.
6. Do not reset or discard changes automatically.

Never execute destructive commands without explicit approval.

Forbidden without explicit authorization:

```bash
git reset --hard
git clean -fd
git push --force
rm -rf node_modules
```

If rollback is necessary, prefer reverting the dedicated migration commit or restoring the appropriate checkpoint after user approval.

Do not use Git rollback to erase unrelated user changes.

## 9. Execution behavior

Work in small steps.

For each major operation:

1. Explain what will be changed.
2. Execute the operation.
3. Inspect its output.
4. Analyze errors.
5. Apply the minimum necessary fix.
6. Run relevant validation.
7. Report the result.

If a command fails, do not continue blindly.

Do not run multiple dependency updates simultaneously.

Do not modify files unrelated to the migration.

Do not change application architecture, styling, UI, business logic or API contracts unless a compatibility issue makes it strictly necessary.

Ask the user before:
- Replacing incompatible third-party libraries.
- Introducing new dependencies.
- Removing existing dependencies with unclear usage.
- Making significant architectural changes.
- Applying destructive Git operations.
- Proceeding to the next major Angular version.

## 10. Final migration report

At the end, provide a structured report:

### Angular upgrade summary

| Item | Result |
|---|---|
| Original Angular version | 18.x |
| Intermediate Angular version | 19.x |
| Final Angular version | 20.x |
| Node.js version | Detected version |
| TypeScript version | Installed version |
| RxJS version | Installed version |
| Angular Material | Installed version / N/A |
| Production build | PASS / FAIL |
| Unit tests | PASS / FAIL |
| E2E tests | PASS / FAIL / N/A |
| Dependency compatibility | PASS / ISSUES |

### Changes performed
- Updated dependencies.
- Executed Angular migrations.
- Modified source code.
- Modified configuration files.

### Remaining issues
List unresolved issues, warnings and compatibility limitations.

### Git checkpoints
List the commits created during each major upgrade.

### Final status
Clearly state whether the Angular 20 migration is:
- SUCCESSFUL
- PARTIALLY SUCCESSFUL
- BLOCKED

Never report SUCCESSFUL if the production build fails or critical compatibility issues remain.

## 11. Official documentation

Always prioritize official documentation over assumptions or outdated tutorials.

- Angular Update Guide: https://angular.dev/update-guide
- Angular version compatibility: https://angular.dev/reference/versions
- Angular CLI update: https://angular.dev/cli/update
- Angular releases: https://angular.dev/reference/releases

Use the documentation corresponding to the exact Angular versions being installed.