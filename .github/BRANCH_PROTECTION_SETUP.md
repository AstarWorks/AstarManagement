# Branch Protection Rules Setup

This document provides instructions for setting up GitHub branch protection rules for the Astar Management repository to enforce CI/CD quality gates.

## Required Branch Protection Rules

### For `main` branch:

1. **Navigate to**: Repository Settings → Branches → Add Rule
2. **Branch name pattern**: `main`
3. **Enable the following protections**:

#### General Settings
- ✅ **Require pull request reviews before merging**
  - Required approving reviews: 1
  - ✅ Dismiss stale pull request approvals when new commits are pushed
  - ✅ Require review from code owners (if CODEOWNERS file exists)

#### Status Checks
- ✅ **Require status checks to pass before merging**
- ✅ **Require branches to be up to date before merging**
- **Required status checks**:
  - `Backend CI / backend-tests`
  - `Backend CI / code-quality` 
  - `Backend CI / security-scan`
  - `Backend CI / build-verification`
  - `Frontend CI / lint-and-typecheck`
  - `Frontend CI / unit-tests`
  - `Frontend CI / build-verification`
  - `Frontend CI / security-audit`

#### Additional Restrictions
- ✅ **Restrict pushes that create files in restricted paths**
  - Restricted paths: `*.env*`, `config/secrets/*`, `*.key`, `*.pem`
- ✅ **Include administrators** (applies rules to repository admins)
- ✅ **Allow force pushes** → DISABLED
- ✅ **Allow deletions** → DISABLED

### For `develop` branch:

1. **Branch name pattern**: `develop`
2. **Enable the following protections**:

#### General Settings
- ✅ **Require pull request reviews before merging**
  - Required approving reviews: 1

#### Status Checks
- ✅ **Require status checks to pass before merging**
- **Required status checks** (same as main):
  - `Backend CI / backend-tests`
  - `Backend CI / code-quality`
  - `Backend CI / security-scan` 
  - `Backend CI / build-verification`
  - `Frontend CI / lint-and-typecheck`
  - `Frontend CI / unit-tests`
  - `Frontend CI / build-verification`
  - `Frontend CI / security-audit`

#### Additional Restrictions
- ✅ **Include administrators**
- ✅ **Allow force pushes** → DISABLED

## Implementation Steps

### Step 1: Manual Setup via GitHub UI
1. Go to repository Settings → Branches
2. Click "Add rule" for each branch pattern
3. Configure settings as specified above
4. Save each rule

### Step 2: Verify Protection Rules
```bash
# Test with a sample PR to ensure all checks are required
git checkout -b test-branch-protection
echo "test" > test-file.txt
git add test-file.txt
git commit -m "test: verify branch protection"
git push -u origin test-branch-protection

# Create PR and verify all CI checks are required before merge
```

### Step 3: Automated Setup (Optional)
For infrastructure-as-code approach, use GitHub CLI or Terraform:

```bash
# Using GitHub CLI (requires admin permissions)
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["Backend CI / backend-tests","Backend CI / code-quality","Backend CI / security-scan","Backend CI / build-verification","Frontend CI / lint-and-typecheck","Frontend CI / unit-tests","Frontend CI / build-verification","Frontend CI / security-audit"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field restrictions=null
```

## Quality Gate Workflow

Once protection rules are active:

1. **Developer workflow**:
   ```bash
   git checkout -b feature/new-feature
   # Make changes
   git push -u origin feature/new-feature
   # Create PR → All CI checks must pass
   ```

2. **CI checks run automatically**:
   - Backend tests, quality, security, build
   - Frontend tests, quality, security, build
   - All must pass green ✅

3. **PR Review required**:
   - At least 1 approving review
   - All status checks passing
   - Branch up to date

4. **Merge protection**:
   - Cannot merge until all requirements met
   - No direct pushes to protected branches
   - No force pushes allowed

## Troubleshooting

### Common Issues

1. **Status check not found**
   - Ensure workflow names match exactly
   - Check that workflows have run at least once
   - Verify job names in workflow files

2. **Workflow not triggering**
   - Check path filters in workflow triggers
   - Ensure branch names match trigger patterns
   - Verify workflow syntax is correct

3. **PR blocked despite green checks**
   - Ensure branch is up to date with base
   - Check if additional status checks are required
   - Verify review requirements are met

### Updating Protection Rules

When adding new workflows or changing job names:

1. Update workflow files first
2. Let workflows run to establish status history
3. Update branch protection rules to include new status checks
4. Test with a sample PR

## Documentation References

- [GitHub Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches)
- [GitHub Status Checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks)
- [GitHub API for Branch Protection](https://docs.github.com/en/rest/branches/branch-protection)