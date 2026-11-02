# AWS Deployment Decision & Implementation Guide: College OS Backend

This document provides a comprehensive technical evaluation of AWS deployment options for the **College OS** NestJS backend, identifies the optimal solution based on the system's architectural requirements, and provides a production-ready, step-by-step implementation guide.

---

## 1. Architectural Requirements Checklist

Before comparing AWS services, consider the explicit requirements of this backend:

| Architectural Component | Requirement | Impact on Hosting Selection |
| :--- | :--- | :--- |
| **BullMQ Background Workers** | 10+ queues requiring continuous Redis polling | **Requires a long-running, continuous process.** Ephemeral serverless functions (like AWS Lambda) freeze execution and cannot process background queues. |
| **Realtime WebSockets** | Socket.IO (`AppIoAdapter` in `src/realtime`) | **Requires persistent TCP/WebSocket connections.** Must support bidirectional streaming and connection upgrade. |
| **PostgreSQL + pgvector** | Prisma ORM with vector embeddings & HNSW indexing | Needs network connectivity to Neon DB or AWS RDS with low latency and connection pooling. |
| **Redis** | Upstash / ElastiCache via `ioredis` | Continuous Redis connection for sessions, rate-limiting, and queues. |
| **Startup / Health Checks** | Multi-module NestJS (33 modules), health probe `/health` | Cold starts must not drop active client traffic; requires dedicated health check probing. |
| **Containerization** | Production multi-stage `Backend/Dockerfile` (node:20, tini) | Native Docker container execution is ready out of the box. |

---

## 2. AWS Options Comparison Matrix

| Criteria | AWS Lambda (+ API Gateway) | AWS EC2 (Single VM + Docker) | AWS ECR + ECS Fargate (Recommended) | AWS App Runner |
| :--- | :--- | :--- | :--- | :--- |
| **BullMQ Queue Processing** | ❌ **Incompatible** (Functions freeze when idle) | ✅ **Fully Supported** (Continuous background daemon) | ✅ **Fully Supported** (Native continuous container task) | ⚠️ **Limited** (Background tasks paused if no active HTTP traffic) |
| **Socket.IO WebSockets** | ❌ **Incompatible** (Requires API Gateway WS adapter rewrite) | ✅ **Fully Supported** (Direct TCP / Nginx proxy) | ✅ **Fully Supported** (ALB WebSocket support + sticky sessions) | ⚠️ **Partial** (WebSocket support exists but sticky session & worker scaling is rigid) |
| **Cold Starts** | ❌ **Severe** (8–15s for 33 NestJS modules) | ✅ **Zero** (Always-on process) | ✅ **Zero** (Always-on containers, blue/green rollout) | ⚠️ Minor during cold scale |
| **Infrastructure Management**| High (IAM + API GW + VPC bridges) | High (Manual OS patching, SSL renewal, security) | **Low / Serverless Containers** (AWS manages underlying compute) | **Very Low** (Managed PaaS) |
| **Auto-scaling & High Availability** | High | ❌ Manual (Requires ASG + custom AMI) | ✅ **Native** (Target tracking on CPU/Memory, Multi-AZ) | ✅ Native |
| **Estimated Monthly Cost** | Low–Variable (Unusable due to freeze) | **$15 – $30/mo** (t4g.small / t4g.medium) | **$35 – $65/mo** (1 ALB + 1-2 Fargate tasks 0.5 vCPU / 1GB) | **$25 – $50/mo** |
| **Verdict** | **REJECTED** | **BEST FOR BUDGET / MVP** | **BEST FOR PRODUCTION / SCALE** | **VIABLE ALTERNATIVE** |

---

## 3. Deep-Dive Evaluation of Options

### Option A: AWS Lambda (+ API Gateway) — **REJECTED ❌**
* **Why it fails**:
  1. **BullMQ Queues cannot run**: Lambda functions only execute upon an incoming trigger and freeze immediately when the HTTP response completes. Background workers registered in `QueueModule` will never pick up jobs from Redis.
  2. **Socket.IO breaks**: AWS API Gateway WebSockets require custom DynamoDB connection ID tracking and separate Lambda handlers; native Socket.IO does not function on Lambda.
  3. **Cold Start & 29-second API Gateway Timeout**: NestJS's heavy 33-module dependency graph + database connection handshake would cause recurring 504 Gateway Timeouts on cold invocations.

### Option B: AWS EC2 (Single VM + Docker Compose) — **BEST FOR LOW-COST MVP 💰**
* **When to choose**: If you want the lowest possible AWS bill ($15–$25/mo) and simple maintenance for an early pilot.
* **Pros**: Complete control, native Docker execution, BullMQ and WebSockets work out of the box with zero code changes.
* **Cons**: Single point of failure (no multi-AZ redundancy), manual SSL certificate setup with Certbot, manual OS security updates.

### Option C: AWS ECR + ECS Fargate (+ ALB) — **WINNER: BEST FOR PRODUCTION 🏆**
* **Why it is the winning architecture**:
  1. **Serverless Container Execution**: You do not manage EC2 operating systems, security patches, or server maintenance. AWS runs your Docker container directly.
  2. **Full Compatibility**: BullMQ background workers run 24/7 without interruption; Socket.IO WebSockets are natively supported via the Application Load Balancer (ALB).
  3. **Zero-Downtime Deployments**: ECR + ECS supports rolling deployments (Blue/Green). A new container version is verified against `/health` before old containers are terminated.
  4. **Multi-AZ Resilience & Autoscaling**: Automatically handles traffic spikes during exam periods or placement seasons.

---

## 4. Production Step-by-Step Implementation Guide (ECR + ECS Fargate)

### Architecture Diagram

```mermaid
flowchart LR
  Client[Web / Mobile Clients] -->|HTTPS / WSS| ALB[Application Load Balancer]
  ALB -->|Health Check /health| TG[Target Group: Port 3000]
  TG --> ECS[ECS Service: Fargate Task]
  subgraph AWS_VPC[AWS VPC - Multi-AZ]
    ECS -->|Image Pull| ECR[(AWS ECR)]
    ECS -->|Secrets| SM[(AWS Secrets Manager)]
  end
  ECS -->|Queries| Neon[(Neon PostgreSQL + pgvector)]
  ECS -->|Jobs & Cache| Upstash[(Upstash / Redis)]
  ECS -->|Storage| S3[(AWS S3 Bucket)]
```

---

### Step 1: Create the ECR Repository

Using the AWS CLI:
```bash
aws ecr create-repository \
  --repository-name college-os-backend \
  --region us-east-1 \
  --image-scanning-configuration scanOnPush=true
```
Save the returned `repositoryUri` (e.g., `123456789012.dkr.ecr.us-east-1.amazonaws.com/college-os-backend`).

---

### Step 2: Build, Tag, and Push the Docker Image

From your `Backend/` directory:

```bash
# 1. Log in to your AWS ECR registry
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# 2. Build the production Docker container
docker build -t college-os-backend:latest .

# 3. Tag image for ECR
docker tag college-os-backend:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/college-os-backend:latest

# 4. Push image to ECR
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/college-os-backend:latest
```

---

### Step 3: Configure Secrets in AWS Secrets Manager

Store your sensitive production environment variables in AWS Secrets Manager:

```bash
aws secretsmanager create-secret \
  --name college-os/backend-prod \
  --region us-east-1 \
  --secret-string '{
    "DATABASE_URL": "postgresql://user:pass@ep-cool-pooler.us-east-1.aws.neon.tech/college_os?sslmode=require",
    "REDIS_URL": "rediss://default:password@upstash-url.upstash.io:6379",
    "JWT_SECRET": "your-prod-jwt-secret-at-least-32-chars-long!",
    "JWT_REFRESH_SECRET": "your-prod-jwt-refresh-secret-min-32-chars!",
    "CORS_ORIGINS": "https://collegeos.yourdomain.com",
    "STORAGE_DRIVER": "s3",
    "S3_BUCKET": "college-os-documents-prod"
  }'
```

---

### Step 4: Create ECS Task Execution Role & Security Groups

1. **ECS Task Execution IAM Role**:
   Create role `ecsTaskExecutionRole` with policies:
   - `AmazonECSTaskExecutionRolePolicy`
   - Inline policy allowing `secretsmanager:GetSecretValue` on `college-os/backend-prod`.

2. **Security Groups**:
   - **`alb-sg`**: Inbound `80` (HTTP) and `443` (HTTPS) from `0.0.0.0/0`.
   - **`backend-ecs-sg`**: Inbound `3000` from `alb-sg` ONLY. Outbound `0.0.0.0/0` (for Neon DB, Upstash, and external LLM APIs).

---

### Step 5: Configure Application Load Balancer (ALB)

1. Create an **Application Load Balancer** in public subnets of your VPC.
2. Create a **Target Group**:
   - Target Type: **IP** (Required for Fargate)
   - Protocol: **HTTP**, Port: **3000**
   - Health Check Path: `/health`
   - Health Check Success Codes: `200`
   - Interval: `15 seconds`, Timeout: `5 seconds`, Healthy Threshold: `2`
   - **Attributes**: Enable **Stickiness** (type: `lb_cookie`) so WebSocket connections stay pinned to the same task.
3. Add a Listener:
   - Port 443 (HTTPS) with an ACM certificate for your custom domain (e.g., `api.collegeos.edu`).
   - Forward traffic to the Target Group.

---

### Step 6: Create ECS Cluster and Task Definition

Create `ecs-task-def.json`:

```json
{
  "family": "college-os-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/college-os-backend:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "hostPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "NODE_ENV", "value": "production" },
        { "name": "PORT", "value": "3000" },
        { "name": "LOG_LEVEL", "value": "info" }
      ],
      "secrets": [
        { "name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:college-os/backend-prod:DATABASE_URL::" },
        { "name": "REDIS_URL", "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:college-os/backend-prod:REDIS_URL::" },
        { "name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:college-os/backend-prod:JWT_SECRET::" },
        { "name": "JWT_REFRESH_SECRET", "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:college-os/backend-prod:JWT_REFRESH_SECRET::" },
        { "name": "CORS_ORIGINS", "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:college-os/backend-prod:CORS_ORIGINS::" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/college-os-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "backend",
          "awslogs-create-group": "true"
        }
      }
    }
  ]
}
```

Register the task definition and launch the service:

```bash
# Register task definition
aws ecs register-task-definition --cli-input-json file://ecs-task-def.json

# Create ECS Cluster
aws ecs create-cluster --cluster-name college-os-cluster

# Create Fargate Service
aws ecs create-service \
  --cluster college-os-cluster \
  --service-name backend-service \
  --task-definition college-os-backend \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxx,subnet-yyyy],securityGroups=[sg-backend],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/college-os-tg/xxxx,containerName=backend,containerPort=3000"
```

---

### Step 7: Automated CI/CD (GitHub Actions)

Add `.github/workflows/deploy-backend.yml` to automatically build, push to ECR, and deploy to ECS on every push to `main`:

```yaml
name: Deploy Backend to AWS ECS

on:
  push:
    branches: [ main ]
    paths:
      - 'Backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build, tag, and push image to Amazon ECR
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: college-os-backend
          IMAGE_TAG: ${{ github.sha }}
        run: |
          cd Backend
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

      - name: Deploy to Amazon ECS Service
        run: |
          aws ecs update-service --cluster college-os-cluster --service backend-service --force-new-deployment
```

---

## 5. Alternative Fast-Track Guide (EC2 + Docker Compose)

If your current priority is **minimizing AWS costs (< $20/month)** or deploying in under 10 minutes:

1. Launch an **EC2 Instance**:
   - AMI: Ubuntu 24.04 LTS (ARM64)
   - Instance Type: `t4g.small` ($12/mo) or `t4g.medium` ($24/mo)
   - Security Group: Ports 22 (SSH), 80 (HTTP), 443 (HTTPS) open.
2. SSH into the instance and install Docker:
   ```bash
   sudo apt-get update && sudo apt-get install -y docker.io docker-compose git
   sudo usermod -aG docker ubuntu
   ```
3. Clone repository and start backend:
   ```bash
   git clone https://github.com/your-org/college-os.git
   cd college-os/Backend
   cp .env.example .env # Fill in Neon pooled DATABASE_URL and Upstash REDIS_URL
   docker-compose -f docker-compose.prod.yml up -d --build
   ```
4. Attach Nginx reverse proxy + Certbot for free HTTPS:
   ```bash
   sudo apt install -y nginx certbot python3-certbot-nginx
   sudo certbot --nginx -d api.yourdomain.com
   ```
