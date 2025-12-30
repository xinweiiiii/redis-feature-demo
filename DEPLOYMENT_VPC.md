# AWS VPC Deployment Guide

This guide covers deploying the Redis demo application with **VPC connectivity** for secure, private network access to Redis and other resources.

## 📊 VPC-Enabled Deployment Options

| Service | VPC Support | VPC Peering | Cost/Month | Complexity |
|---------|------------|-------------|-----------|------------|
| **Amplify Hosting** | ❌ No (frontend only) | ❌ No | $0-5 | ⭐ Easy |
| **Amplify + Lambda (VPC)** | ✅ API only | ✅ Yes | $5-15 | ⭐⭐⭐ Medium |
| **App Runner** | ✅ Yes | ✅ Yes | $7-15 | ⭐⭐ Easy |
| **ECS Fargate** | ✅ Yes | ✅ Yes | $15-30 | ⭐⭐⭐⭐ Hard |
| **EC2/Lightsail** | ✅ Yes | ✅ Yes | $3.50-5 | ⭐⭐ Medium |

---

## 🚀 Option 1: AWS App Runner with VPC (Recommended)

**Best for:** Full app in VPC with container deployment

### Architecture:

```
Internet → ALB (public subnet)
               ↓
         App Runner (private subnet)
               ↓
         Redis (private subnet in VPC)
               ↓ (VPC Peering)
         Other VPC Resources
```

### Cost: ~$7-15/month
- App Runner: $0.007/GB-hour + $0.064/vCPU-hour
- ~$7 for 0.25 vCPU, 0.5GB RAM
- VPC endpoint: Free (included)

### Prerequisites:

1. **Redis in a VPC** (either ElastiCache or self-hosted)
2. **Private subnets** in your VPC
3. **Security groups** configured

### Step 1: Update Application for VPC

**Update `.env.production`**:
```env
# Private Redis endpoint (within VPC)
REDIS_URL=redis://redis.internal.vpc.local:6379

# Or ElastiCache endpoint
REDIS_URL=redis://my-redis.abc123.0001.use1.cache.amazonaws.com:6379

OPENAI_API_KEY=your-key
NODE_ENV=production
```

### Step 2: Build and Push Docker Image

```bash
# Build Docker image
docker build -t redis-demo:latest .

# Tag for ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Create ECR repository
aws ecr create-repository --repository-name redis-demo --region us-east-1

# Tag and push
docker tag redis-demo:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/redis-demo:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/redis-demo:latest
```

### Step 3: Create App Runner Service with VPC

**Using AWS Console:**

1. **Go to App Runner Console** → Create Service

2. **Source**:
   - Repository type: Container registry
   - Provider: Amazon ECR
   - Container image URI: `YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/redis-demo:latest`
   - Deployment trigger: Manual (or automatic)

3. **Configure Service**:
   - Service name: `redis-demo-app`
   - Virtual CPU: 0.25 vCPU
   - Memory: 0.5 GB
   - Port: 3000

4. **Environment Variables**:
   Add your environment variables (REDIS_URL, OPENAI_API_KEY, etc.)

5. **🔐 VPC Configuration** (Important!):
   - ✅ Enable VPC connector
   - Select your VPC
   - Select **private subnets** (not public!)
   - Select security group that allows:
     - Outbound to Redis (port 6379)
     - Outbound to internet (for OpenAI API)

6. **Security Group Rules**:
```bash
# App Runner security group needs:
# Outbound to Redis
Type: Custom TCP
Port: 6379
Destination: sg-redis-xxxxxxxx (Redis security group)

# Outbound to internet (for OpenAI)
Type: HTTPS
Port: 443
Destination: 0.0.0.0/0

# Redis security group needs:
# Inbound from App Runner
Type: Custom TCP
Port: 6379
Source: sg-apprunner-xxxxxxxx
```

7. **Deploy** → Wait 3-5 minutes

8. **Get URL**: `https://xxxxxxxxx.us-east-1.awsapprunner.com`

### Step 4: VPC Peering (If Redis in Different VPC)

```bash
# 1. Create VPC peering connection
aws ec2 create-vpc-peering-connection \
  --vpc-id vpc-app-runner \
  --peer-vpc-id vpc-redis \
  --peer-region us-east-1

# 2. Accept peering connection (in Redis VPC account)
aws ec2 accept-vpc-peering-connection \
  --vpc-peering-connection-id pcx-xxxxxxxxx

# 3. Add routes to both VPCs
# In App Runner VPC route table:
aws ec2 create-route \
  --route-table-id rtb-apprunner \
  --destination-cidr-block 10.1.0.0/16 \
  --vpc-peering-connection-id pcx-xxxxxxxxx

# In Redis VPC route table:
aws ec2 create-route \
  --route-table-id rtb-redis \
  --destination-cidr-block 10.0.0.0/16 \
  --vpc-peering-connection-id pcx-xxxxxxxxx

# 4. Update security groups to allow traffic across peering connection
```

### Using AWS CLI:

**Create `apprunner-config.json`**:
```json
{
  "ServiceName": "redis-demo-app",
  "SourceConfiguration": {
    "ImageRepository": {
      "ImageIdentifier": "YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/redis-demo:latest",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": {
        "Port": "3000",
        "RuntimeEnvironmentVariables": {
          "REDIS_URL": "redis://redis.internal.vpc.local:6379",
          "NODE_ENV": "production"
        }
      }
    },
    "AutoDeploymentsEnabled": false
  },
  "InstanceConfiguration": {
    "Cpu": "0.25 vCPU",
    "Memory": "0.5 GB"
  },
  "NetworkConfiguration": {
    "EgressConfiguration": {
      "EgressType": "VPC",
      "VpcConnectorArn": "arn:aws:apprunner:us-east-1:ACCOUNT:vpcconnector/my-connector"
    }
  }
}
```

```bash
# Create VPC connector first
aws apprunner create-vpc-connector \
  --vpc-connector-name my-vpc-connector \
  --subnets subnet-xxxxxxxx subnet-yyyyyyyy \
  --security-groups sg-xxxxxxxx

# Create App Runner service
aws apprunner create-service --cli-input-json file://apprunner-config.json
```

---

## 🔧 Option 2: Amplify Frontend + Lambda (VPC) Backend

**Best for:** When you want Amplify's CDN but need VPC for backend

### Architecture:

```
Frontend (Amplify - Public CDN)
    ↓ HTTPS
API Gateway (Public)
    ↓
Lambda Functions (in VPC - private subnet)
    ↓
Redis (in VPC - private subnet)
```

### Cost: ~$5-15/month
- Amplify: $0-5
- Lambda: ~$0 (free tier) to $5
- NAT Gateway: ~$0 (if using VPC endpoints) to $32 (if using NAT)

### Step 1: Separate Frontend and Backend

**Frontend** → Deploy to Amplify (stays public)
**Backend** → Lambda functions in VPC

**Update API routes to be Lambda-compatible**:

```typescript
// Convert Next.js API route to Lambda handler
// Example: app/api/cache/string/route.ts → lambda/cache-string.ts

export const handler = async (event: any) => {
  // Your existing route logic
  const { key, value } = JSON.parse(event.body);

  // Connect to Redis in VPC
  const redis = await getRedisClient();
  await redis.set(key, value);

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
};
```

### Step 2: Deploy Lambda with VPC Configuration

**Using Serverless Framework**:

```yaml
# serverless.yml
service: redis-demo-api

provider:
  name: aws
  runtime: nodejs20.x
  region: us-east-1
  vpc:
    securityGroupIds:
      - sg-lambda-xxxxxxxx
    subnetIds:
      - subnet-private-1
      - subnet-private-2
  environment:
    REDIS_URL: ${env:REDIS_URL}

functions:
  cacheString:
    handler: lambda/cache-string.handler
    events:
      - http:
          path: cache/string
          method: post
          cors: true
```

**Deploy**:
```bash
npm install -g serverless
serverless deploy
```

### Step 3: Update Amplify Frontend to Use Lambda API

```typescript
// In your components, point to Lambda API Gateway
const API_BASE = 'https://xxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod';

const response = await fetch(`${API_BASE}/cache/string`, {
  method: 'POST',
  body: JSON.stringify({ key, value })
});
```

### Important: NAT Gateway Cost Optimization

Lambda in VPC needs internet access for external APIs (OpenAI). You have 2 options:

**Option A: VPC Endpoints (Recommended - Free)**
```bash
# Create VPC endpoint for services you use
aws ec2 create-vpc-endpoint \
  --vpc-id vpc-xxxxxxxx \
  --service-name com.amazonaws.us-east-1.s3 \
  --route-table-ids rtb-xxxxxxxx

# DynamoDB endpoint (if used)
aws ec2 create-vpc-endpoint \
  --vpc-id vpc-xxxxxxxx \
  --service-name com.amazonaws.us-east-1.dynamodb \
  --route-table-ids rtb-xxxxxxxx
```

**Option B: NAT Gateway (Expensive - $32/month)**
```bash
# Only if you need general internet access
# Not recommended for cost-conscious deployments
```

---

## 🐳 Option 3: ECS Fargate with VPC

**Best for:** Production workloads, fine-grained control

### Architecture:
```
ALB (public subnet)
  ↓
ECS Fargate Tasks (private subnet)
  ↓
Redis (private subnet)
```

### Cost: ~$15-30/month
- Fargate: $0.04048/hour for 0.25 vCPU, 0.5GB
- ~$30/month for always-on
- ALB: $16/month

### Setup (High-level):

```bash
# 1. Create ECS cluster
aws ecs create-cluster --cluster-name redis-demo-cluster

# 2. Create task definition (with VPC config)
aws ecs register-task-definition --cli-input-json file://task-definition.json

# 3. Create service with ALB
aws ecs create-service \
  --cluster redis-demo-cluster \
  --service-name redis-demo-service \
  --task-definition redis-demo:1 \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-private],securityGroups=[sg-ecs]}"
```

**Not recommended for this demo** due to higher cost and complexity.

---

## 🏠 Option 4: EC2 in VPC (Cheapest with Full Control)

**Best for:** Learning, full control, cost optimization

### Cost: $3.50-5/month
- t4g.nano or Lightsail in VPC

### Setup:

Same as regular EC2/Lightsail deployment, but:

1. **Launch in private subnet**
2. **Use security groups** for Redis access
3. **VPC peering** if Redis in different VPC

---

## 🔐 Security Best Practices

### 1. Private Subnets
```
✅ App in private subnet (10.0.1.0/24)
✅ Redis in private subnet (10.0.2.0/24)
❌ Never put Redis in public subnet
```

### 2. Security Groups

**App Security Group**:
```
Inbound:
  - Port 80/443 from ALB/public (if using ALB)
  - Port 3000 from 0.0.0.0/0 (if App Runner with public endpoint)

Outbound:
  - Port 6379 to Redis security group
  - Port 443 to 0.0.0.0/0 (for OpenAI API)
```

**Redis Security Group**:
```
Inbound:
  - Port 6379 from App security group ONLY

Outbound:
  - None needed (unless cluster mode)
```

### 3. VPC Peering Security

```bash
# Only allow specific traffic across peering
# Don't accept entire CIDR blocks
# Use security groups for fine-grained control
```

---

## 📊 Cost Comparison Summary

| Deployment | Monthly Cost | VPC Support | Best For |
|-----------|-------------|-------------|----------|
| **App Runner (VPC)** | $7-15 | ✅ Full | Production, simple setup |
| **Amplify + Lambda (VPC)** | $5-15 | ✅ API only | Hybrid approach |
| **ECS Fargate** | $15-30 | ✅ Full | Large-scale production |
| **EC2 t4g.nano** | $3-5 | ✅ Full | Cost optimization |
| **Lightsail** | $3.50 | ✅ Full | Learning, simplest |

---

## 🎯 My Recommendation for VPC Deployment

**For this demo app with VPC requirement:**

### Best Option: **AWS App Runner with VPC** ($7-15/month)

**Why:**
1. ✅ Native VPC support
2. ✅ Automatic scaling
3. ✅ Container-based (portable)
4. ✅ Managed SSL/TLS
5. ✅ Simple deployment
6. ✅ VPC peering support
7. ✅ Private Redis access

### Alternative: **Lightsail in VPC** ($3.50/month)

**If you want:**
- Maximum cost savings
- Full SSH access
- Learning experience

---

## 📝 Quick Start Checklist

- [ ] Prepare Docker image
- [ ] Create/identify VPC with private subnets
- [ ] Set up Redis in VPC (or ElastiCache)
- [ ] Configure security groups
- [ ] Push image to ECR
- [ ] Create App Runner service with VPC
- [ ] Test connectivity to Redis
- [ ] Set up VPC peering (if needed)
- [ ] Configure monitoring/logging

---

## 🚨 Common Issues

### Issue: Lambda can't reach Redis
**Solution**:
- Ensure Lambda in same VPC as Redis
- Check security groups allow port 6379
- Verify subnets have route to Redis

### Issue: Lambda can't reach internet (OpenAI)
**Solution**:
- Add VPC endpoints (free)
- OR add NAT Gateway (expensive)
- OR remove OpenAI dependency

### Issue: High data transfer costs
**Solution**:
- Keep everything in same VPC/region
- Use VPC endpoints instead of NAT
- Enable VPC flow logs to debug

---

## 📞 Need Help?

VPC networking can be complex. Key resources:
- [AWS VPC Documentation](https://docs.aws.amazon.com/vpc/)
- [App Runner VPC Guide](https://docs.aws.amazon.com/apprunner/latest/dg/network-vpc.html)
- [VPC Peering Guide](https://docs.aws.amazon.com/vpc/latest/peering/)
