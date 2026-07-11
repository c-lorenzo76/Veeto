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

### 2. Create Azure Container Registry (per environment or shared)

Option A: Shared registry (simpler, recommended for starting)
```bash
az acr create --resource-group veto-prod --name vetoacr --sku Basic
```

Option B: Per-environment registry
```bash
for env in dev1 dev uat prod; do
  az acr create --resource-group veto-$env --name ${env}acr --sku Basic
done
```

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

```bash
for env in dev1 dev uat prod; do
  az staticwebapp create \
    --name veto-client-$env \
    --resource-group veto-$env \
    --location eastus \
    --source https://github.com/your-org/veto \
    --branch feature/$env
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

Store secrets in each vault:
```bash
# Example for Dev1
VAULT=veto-dev1-kv
RG=veto-dev1

az keyvault secret set --vault-name $VAULT --name SECRET-KEY --value "your_google_places_api_key"
az keyvault secret set --vault-name $VAULT --name CLIENT-ORIGIN --value "https://veto-dev1.azurestaticapps.net"

# Repeat for dev, uat, prod with their respective URLs
```

### 7. Enable Managed Identity & Key Vault Access

Grant Container App access to Key Vault:

```bash
for env in dev1 dev uat prod; do
  RG=veto-$env
  VAULT=veto-${env}-kv
  
  # Get Container App identity
  IDENTITY=$(az containerapp show -n veto-server-$env -g $RG --query identity.principalId -o tsv)
  
  # Grant Key Vault access
  az keyvault set-policy --name $VAULT --object-id $IDENTITY \
    --secret-permissions get list
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

Once deployed, your app will be at:

| Env | Frontend | Backend |
|-----|----------|---------|
| Dev1 | https://veto-dev1.azurestaticapps.net | https://veto-server-dev1.azurecontainerapps.io |
| Dev | https://veto-dev.azurestaticapps.net | https://veto-server-dev.azurecontainerapps.io |
| UAT | https://veto-uat.azurestaticapps.net | https://veto-server-uat.azurecontainerapps.io |
| Prod | https://veto.app (custom domain) | https://api.veto.app (custom domain) |

## Next Steps

1. **Manual:** Run the Azure setup commands above (sections 1-9)
2. **Verify:** Test the pipeline with a feature branch (section 10)
3. **Monitor:** Set up Application Insights in Azure for logging/alerting
4. **Custom Domain:** After Prod works, configure DNS and SSL cert

## References

- [Azure Container Apps docs](https://learn.microsoft.com/en-us/azure/container-apps/)
- [Azure Static Web Apps docs](https://learn.microsoft.com/en-us/azure/static-web-apps/)
- [GitHub OIDC Federation](https://learn.microsoft.com/en-us/azure/developer/github/connect-from-azure)
