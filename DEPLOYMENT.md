# Veto Deployment Guide

This guide covers the multi-environment deployment setup for Veto using Azure Container Apps, Static Web Apps, and GitHub Actions.

## Architecture Overview

```
Feature Branch (feature/*)
    ↓ (auto-deploy)
Dev1 (azure-dev1)
    ↓ (manual promotion)
Develop Branch → Dev (azure-dev)
    ↓ (manual promotion)
UAT Branch → UAT (azure-uat)
    ↓ (manual promotion)
Main Branch → Prod (azure-prod)
```

## Completed: Code-Level Deployment Setup

✅ **Containerization**
- `Dockerfile`: Multi-stage build for Express server (Node 20 Alpine, ~11MB final image)
- `client/Dockerfile`: Vite build + Nginx (SPA + API/Socket.io routing)
- `client/nginx.conf`: Reverse proxy configuration
  - Routes `/api/*` to backend Container App
  - Routes `/socket.io*` to backend with WebSocket upgrade headers
  - SPA fallback: all unmatched routes → `index.html`

✅ **Environment Configuration**
- `.env.example`: Server environment variables (SECRET_KEY, CLIENT_ORIGIN, NODE_ENV)
- `client/.env.example`: Client Vite build variable (VITE_API_BASE_URL)
- Health check endpoint: `GET /health` (used by Azure for liveness probes)

✅ **GitHub Actions CD Workflow**
- `.github/workflows/deploy.yml`: Orchestrates the deployment pipeline
  - Triggers on: `push` to main, uat, develop, and all feature branches
  - Determines environment based on branch
  - Authenticates to Azure via OIDC (no static credentials stored)
  - Builds and pushes server Docker image to Azure Container Registry
  - Deploys server to Container App
  - Builds client with environment-specific API base URL
  - Deploys client to Static Web App

✅ **Local Testing**
- `docker-compose.yml`: Run server + client locally in containers
  ```bash
  docker-compose up
  ```
  Server: http://localhost:8000, Client: http://localhost:5173

## TODO: Manual Azure Setup

### Prerequisites
- Azure subscription
- Azure CLI (`az` command)
- GitHub organization with admin access
- GitHub Actions enabled

### 1. Create Resource Groups (one per environment)

```bash
# Dev1
az group create --name veto-dev1 --location eastus

# Dev
az group create --name veto-dev --location eastus

# UAT
az group create --name veto-uat --location eastus

# Prod
az group create --name veto-prod --location eastus
```

### 2. Create Azure Container Registry (shared)

`deploy.yml` is configured to use a single shared registry across all 4 environments, with images tagged per-environment (`veto-server:dev1-<sha>`, `veto-server:prod-<sha>`, etc.). This is the industry-standard pattern — the registry itself doesn't need per-environment isolation, only the deploy target (Container App) and secrets (Key Vault) do.

```bash
az acr create --resource-group veto-prod --name vetoacr --sku Basic
```

Grant each Container App's managed identity `AcrPull` access to the shared registry (done in step 7, after Container Apps exist).

### 3. Create Container App Environment (per resource group)

Each environment needs a Container App Environment (compute + networking layer):

```bash
for env in dev1 dev uat prod; do
  az containerapp env create \
    --name veto-env-$env \
    --resource-group veto-$env \
    --location eastus
done
```

### 4. Create Container Apps (server backend)

```bash
for env in dev1 dev uat prod; do
  az containerapp create \
    --name veto-server-$env \
    --resource-group veto-$env \
    --environment veto-env-$env \
    --image mcr.microsoft.com/azuredocs/containerapps-helloworld:latest \
    --target-port 8000 \
    --ingress 'external' \
    --env-vars SECRET_KEY=placeholder CLIENT_ORIGIN=http://localhost:5173 NODE_ENV=$env
done
```

### 5. Create Static Web Apps (client frontend)

Do **not** pass `--source` here. Linking a GitHub repo via `--source` makes Azure auto-generate its own GitHub Actions workflow to build/deploy on every push — which would race against the `deploy.yml` workflow already in this repo (and ignore its branch-based approval gates entirely). Instead, create the Static Web App as a bare resource and let `deploy.yml`'s `Azure/static-web-apps-deploy@v1` step handle all deployments via an API token.

Static Web Apps are only available in a subset of regions (`eastus2`, `centralus`, `westus2`, `westeurope`, `eastasia`) — not plain `eastus`.

```bash
for env in dev1 dev uat prod; do
  az staticwebapp create \
    --name veto-client-$env \
    --resource-group veto-$env \
    --location eastus2 \
    --sku Free
done
```

Get each Static Web App's deployment token and store it as the `AZURE_STATIC_WEB_APPS_API_TOKEN` GitHub environment secret (Settings → Environments → dev1/dev/uat/prod):

```bash
for env in dev1 dev uat prod; do
  echo "=== $env ==="
  az staticwebapp secrets list --name veto-client-$env --query "properties.apiKey" -o tsv
done
```

### 6. Create Key Vaults (secrets per environment)

```bash
for env in dev1 dev uat prod; do
  az keyvault create \
    --name veto-${env}-kv \
    --resource-group veto-$env \
    --location eastus
done
```

First, look up each Static Web App's actual hostname (Azure appends a random suffix, so it won't match a predictable pattern):

```bash
for env in dev1 dev uat prod; do
  echo "=== $env ==="
  az staticwebapp show --name veto-client-$env --query "defaultHostname" -o tsv
done
```

**Important — new Key Vaults default to Azure RBAC permission mode.** Creating the vault does not automatically grant you (or anyone) access to read/write secrets in it, even as the creator. Grant yourself access first:

```bash
for env in dev1 dev uat prod; do
  az role assignment create \
    --role "Key Vault Secrets Officer" \
    --assignee $(az ad signed-in-user show --query id -o tsv) \
    --scope $(az keyvault show --name veto-${env}-kv --query id -o tsv)
done
```

Role assignments can take 1-2 minutes to propagate — if secret commands below fail with `Forbidden`/`ForbiddenByRbac` immediately after this, just wait and retry.

Store secrets in each vault using the real hostname returned above (do this one environment at a time, not as a loop, so you can verify each before moving on):
```bash
# Example for Dev1 — replace with the actual hostname from the command above
VAULT=veto-dev1-kv

az keyvault secret set --vault-name $VAULT --name SECRET-KEY --value "your_google_places_api_key"
az keyvault secret set --vault-name $VAULT --name CLIENT-ORIGIN --value "https://<actual-dev1-hostname>.azurestaticapps.net"

# Repeat for dev, uat, prod with their respective real hostnames
```

If your Google Places API key has ever been pasted anywhere outside your own terminal (chat, screenshot, shared doc), treat it as compromised and regenerate it in Google Cloud Console before storing it here.

### 7. Enable Managed Identity & Key Vault Access

The Container Apps created in step 4 don't have a managed identity yet (it isn't on by default). Enable one, then grant it read access to its vault. Since the vaults use RBAC mode (see step 6), this uses a role assignment, not `az keyvault set-policy` (which only works with the legacy Access Policy model):

```bash
for env in dev1 dev uat prod; do
  RG=veto-$env
  VAULT=veto-${env}-kv
  CONTAINER_APP=veto-server-$env

  # Enable managed identity on the Container App
  az containerapp identity assign --name $CONTAINER_APP --resource-group $RG --system-assigned

  # Get the identity's principal ID
  IDENTITY=$(az containerapp show -n $CONTAINER_APP -g $RG --query identity.principalId -o tsv)

  # Grant it read-only access to secrets via RBAC
  az role assignment create \
    --role "Key Vault Secrets User" \
    --assignee $IDENTITY \
    --scope $(az keyvault show --name $VAULT --query id -o tsv)
done
```

### 8. Set Up GitHub OIDC Federation

Create Azure AD app registrations and configure OIDC trust:

```bash
# Create app registration per environment
for env in dev1 dev uat prod; do
  az ad app create --display-name "veto-$env-github"
done
```

Configure OIDC (GitHub docs: https://learn.microsoft.com/en-us/azure/developer/github/connect-from-azure):

1. For each app registration, add a Federated Identity Credential
2. Set Issuer: `https://token.actions.githubusercontent.com`
3. Set Subject: `repo:your-org/veto:ref:refs/heads/main` (or appropriate branch)

Get credentials and store as GitHub environment secrets:

```bash
# For each app registration, get:
az ad app show --id <app-id> --query appId -o tsv  # AZURE_CLIENT_ID
az account show --query tenantId -o tsv  # AZURE_TENANT_ID
az account show --query id -o tsv  # AZURE_SUBSCRIPTION_ID
```

Store in GitHub as **Environment Secrets** (not Repository Secrets):
- Settings → Environments → Create environment (dev1, dev, uat, prod)
- Add secrets: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`
- Add `AZURE_STATIC_WEB_APPS_API_TOKEN` for Static Web App deployment

### 9. Configure Environment Protection Rules (optional but recommended)

In GitHub, protect branches that feed deployment:

1. Settings → Branches → Add branch protection rule
2. For `develop`, `uat`, `main`: require approval before merge
3. Optionally restrict approvers (e.g., admins-only for Prod)

### 10. Test the Pipeline

1. Push a feature branch:
   ```bash
   git checkout -b feature/test-deploy
   git push origin feature/test-deploy
   ```
   → Should trigger `.github/workflows/deploy.yml`
   → Should deploy to Dev1 automatically

2. Check GitHub Actions: Actions tab → Deploy workflow → watch for completion
3. Verify Dev1 deployment: `https://veto-dev1.azurestaticapps.net`

4. Promote to Dev:
   ```bash
   git checkout develop
   git merge feature/test-deploy
   git push origin develop
   ```
   → Should trigger approval gate
   → Manually approve in GitHub Actions
   → Should deploy to Dev

5. Repeat for UAT and Prod

## Troubleshooting

### Container App shows "Inactive"
- Check Container App revision logs: `az containerapp logs show`
- Verify health check: `curl https://veto-server-dev1.azurecontainerapps.io/health`

### Static Web App shows 404
- Check if build/deploy succeeded: SWA → Deployments tab
- Verify nginx.conf SPA routing is correct

### OIDC authentication fails
- Verify GitHub environment secrets are set correctly
- Check OIDC token subject matches the federated credential

### Socket.io connection fails in production
- Verify nginx.conf proxies `/socket.io` with `Upgrade` header
- Check CORS: `CLIENT_ORIGIN` must match frontend Static Web App URL

## Environment URLs

Azure assigns a random suffix to both Static Web App and Container App hostnames — there's no predictable URL pattern. Look them up directly:

```bash
for env in dev1 dev uat prod; do
  echo "=== $env ==="
  echo "Frontend: $(az staticwebapp show --name veto-client-$env --query defaultHostname -o tsv)"
  echo "Backend:  $(az containerapp show --name veto-server-$env --resource-group veto-$env --query properties.configuration.ingress.fqdn -o tsv)"
done
```

For Prod, you'll likely want to map a custom domain (e.g. `veto.app` / `api.veto.app`) once the auto-generated hostnames are confirmed working.

## Next Steps

1. **Manual:** Run the Azure setup commands above (sections 1-9)
2. **Verify:** Test the pipeline with a feature branch (section 10)
3. **Monitor:** Set up Application Insights in Azure for logging/alerting
4. **Custom Domain:** After Prod works, configure DNS and SSL cert

## References

- [Azure Container Apps docs](https://learn.microsoft.com/en-us/azure/container-apps/)
- [Azure Static Web Apps docs](https://learn.microsoft.com/en-us/azure/static-web-apps/)
- [GitHub OIDC Federation](https://learn.microsoft.com/en-us/azure/developer/github/connect-from-azure)
