# Organizations Feature Implementation

## Overview

This document describes the implementation of the Organizations feature (#336), which allows grouping multiple projects under a single organization entity.

## Contract Changes

### New Types (`contracts/tansu/src/types.rs`)

1. **Organization Struct**
   ```rust
   pub struct Organization {
       pub name: String,
       pub maintainers: Vec<Address>,
       pub config: Config, // IPFS CID with org metadata
   }
   ```

2. **OrganizationKey Enum**
   ```rust
   pub enum OrganizationKey {
       Key(Bytes),                    // UUID from keccak256(name)
       OrganizationProjects(Bytes),   // Total project count
       OrganizationProjectsPage(Bytes, u32), // Paginated projects
       TotalOrganizations,            // Total org count
       OrganizationKeys(u32),         // Paginated org keys
   }
   ```

3. **Updated Project Struct**
   - Added optional `organization_key: Option<Bytes>` field
   - Projects can now belong to an organization

### New Contract Functions (`contract_organization.rs`)

- `register_organization()` - Register a new organization
- `add_project_to_organization()` - Link a project to an organization
- `get_organization()` - Get organization details
- `get_organization_projects()` - Get paginated projects in an org
- `get_organization_projects_count()` - Get total project count
- `get_organizations()` - Get paginated list of organizations
- `update_organization_config()` - Update organization IPFS config

### New Events (`events.rs`)

- `OrganizationRegistered` - When an organization is created
- `ProjectAddedToOrganization` - When a project is linked to an org
- `OrganizationConfigUpdated` - When org config is updated

### New Errors (`errors.rs`)

- `OrganizationAlreadyExist = 27`
- `OrganizationNotFound = 28`
- `ProjectNotInOrganization = 29`
- `NoOrganizationPageFound = 30`

## IPFS Structure

### Organization-Level Structure

Organizations store their metadata in a `tansu.toml` file on IPFS. The structure supports multiple repositories:

```toml
VERSION="2.0.0"

ACCOUNTS=[
    "GCMFQP44AR32S7IRIUKNOEJW5PNWOCLRHLQWSHUCSV4QZOMUXZOVA7Q2"
]

[DOCUMENTATION]
ORG_NAME="Organization Name"
ORG_URL="https://organization.com"
ORG_LOGO="https://organization.com/logo.png"
ORG_DESCRIPTION="Organization description"
ORG_GITHUB="https://github.com/organization"

[[PRINCIPALS]]
github="username1"

[[PRINCIPALS]]
github="username2"

# Optional: List of repositories in the organization
[[REPOSITORIES]]
name="repo1"
url="https://github.com/org/repo1"
ipfs="bafybeirepo1configcid"

[[REPOSITORIES]]
name="repo2"
url="https://github.com/org/repo2"
ipfs="bafybeirepo2configcid"
```

### Project-Level Structure (Unchanged)

Individual projects still maintain their own `tansu.toml` files with the same structure as before. The `REPOSITORIES` section in the organization config is optional and can be used for organization-level metadata.

## Frontend Changes

### New Services (`dapp/src/service/OrganizationService.ts`)

- `registerOrganization()` - Register new organization
- `addProjectToOrganization()` - Link project to org
- `getOrganization()` - Get org details
- `getOrganizationProjects()` - Get projects in org
- `getOrganizationProjectsCount()` - Get project count
- `getOrganizations()` - List all organizations
- `updateOrganizationConfig()` - Update org config

### New Components

1. **OrganizationCard** (`components/page/organization/OrganizationCard.tsx`)
   - Displays organization information
   - Shows project count
   - Clickable to navigate to organization page

2. **OrganizationsList** (`components/page/organization/OrganizationsList.tsx`)
   - Lists all organizations with pagination
   - Shows project counts for each organization

3. **OrganizationPage** (`components/page/organization/OrganizationPage.tsx`)
   - Shows organization details
   - Lists all projects in the organization
   - Supports pagination

### New Pages

- `/organizations` - List all organizations
- `/organization/:organizationName` - View organization and its projects

## Usage Flow

### Creating an Organization

1. User creates organization metadata (name, description, logo, etc.)
2. Upload `tansu.toml` to IPFS
3. Call `register_organization()` with maintainers and IPFS CID
4. Organization is registered on-chain

### Adding Projects to Organization

1. Project must already exist
2. Caller must be maintainer of both project and organization
3. Call `add_project_to_organization()` with org key and project key
4. Project is linked to organization

### Viewing Organizations

1. Navigate to `/organizations` to see all organizations
2. Click on an organization card to view details
3. Organization page shows all projects in that organization
4. Click on a project to view project details (existing flow)

## Backward Compatibility

- Existing projects continue to work without organizations
- `organization_key` field is optional in Project struct
- Projects can be added to organizations after creation
- No breaking changes to existing project registration flow

## Future Enhancements

1. **Organization-level governance**: Organizations could have their own DAO
2. **Cross-project proposals**: Proposals that affect multiple projects in an org
3. **Organization badges**: Badges that apply to all projects in an org
4. **Bulk operations**: Operations that affect all projects in an organization

## Testing Considerations

1. Test organization registration
2. Test adding projects to organizations
3. Test pagination for organizations and projects
4. Test organization config updates
5. Test error cases (duplicate orgs, unauthorized access, etc.)
6. Test backward compatibility with existing projects
