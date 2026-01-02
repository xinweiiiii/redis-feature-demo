# Redis Feature Demo - Terraform Infrastructure

This Terraform configuration deploys the Redis Feature Demo application on AWS with complete networking infrastructure.

## Architecture Overview

The infrastructure includes:

- **VPC**: Custom VPC with public and private subnets across 2 availability zones
- **EC2 Instance**: Application server running Node.js with PM2
- **Application Load Balancer**: For high availability and SSL termination
- **Security Groups**: Properly configured firewall rules
- **CloudWatch**: Monitoring and logging
- **IAM Roles**: Minimal required permissions

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **Terraform** >= 1.0 installed
3. **AWS CLI** configured with credentials
4. **SSH Key Pair** created in AWS (for EC2 access)
5. **Existing Resources**:
   - PostgreSQL Aurora database (already deployed)
   - Redis Cloud instance

## Quick Start

### 1. Configure Variables

Copy the example variables file and fill in your values:

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and set:
- Your AWS region
- SSH key name
- PostgreSQL Aurora connection details
- Redis Cloud connection details
- Your IP address for SSH access

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Review the Plan

```bash
terraform plan
```

### 4. Deploy Infrastructure

```bash
terraform apply
```

Type `yes` when prompted to confirm.

### 5. Deploy Application Code

After Terraform completes, use the deployment instructions from the output:

```bash
# Get deployment instructions
terraform output deployment_instructions

# SSH into the instance
ssh -i your-key.pem ec2-user@<EC2_PUBLIC_IP>

# Navigate to app directory
cd /opt/redis-feature-demo

# Clone your repository
git clone https://github.com/your-username/redis-feature-demo.git .

# Install dependencies
npm install

# Build the application
npm run build

# Start with PM2
pm2 start npm --name redis-demo -- start
pm2 save
pm2 startup
```

### 6. Access Your Application

```bash
# Get the application URL
terraform output application_url
```

Open the URL in your browser.

## Infrastructure Components

### Networking

- **VPC**: `10.0.0.0/16`
- **Public Subnets**: `10.0.1.0/24`, `10.0.2.0/24`
- **Private Subnets**: `10.0.11.0/24`, `10.0.12.0/24`
- **Internet Gateway**: For public internet access
- **NAT Gateway**: For private subnet internet access

### Security Groups

#### ALB Security Group
- **Inbound**: Port 80 (HTTP), 443 (HTTPS) from 0.0.0.0/0
- **Outbound**: All traffic

#### EC2 Security Group
- **Inbound**:
  - Port 22 (SSH) from specified CIDR blocks
  - Port 3000 from ALB security group
- **Outbound**: All traffic

### EC2 Instance

- **AMI**: Amazon Linux 2023
- **Instance Type**: t3.medium (configurable)
- **Storage**: 30GB GP3 encrypted
- **Software Installed**:
  - Node.js 20.x
  - npm
  - PM2
  - CloudWatch Agent

### Application Load Balancer

- **Type**: Application Load Balancer
- **Scheme**: Internet-facing
- **Listeners**: HTTP (80), HTTPS (443 - if SSL configured)
- **Health Check**: HTTP on port 3000, path: `/`
- **Stickiness**: Cookie-based, 24 hours

### Monitoring

- **CloudWatch Logs**: Application logs
- **CloudWatch Metrics**: System metrics (CPU, Memory, Disk)
- **CloudWatch Alarms**:
  - Healthy hosts count < 1
  - Target response time > 1 second

## Configuration Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `postgres_host` | PostgreSQL Aurora endpoint | `your-aurora.rds.amazonaws.com` |
| `postgres_password` | PostgreSQL password | `SecurePassword123!` |
| `redis_host` | Redis Cloud hostname | `redis-xxxxx.cloud.redislabs.com` |
| `redis_password` | Redis Cloud password | `your-redis-password` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `aws_region` | AWS region | `ap-southeast-1` |
| `environment` | Environment name | `dev` |
| `ec2_instance_type` | EC2 instance type | `t3.medium` |
| `ec2_key_name` | SSH key pair name | `""` |
| `domain_name` | Custom domain name | `""` |
| `ssl_certificate_arn` | ACM certificate ARN | `""` |

## SSL/HTTPS Setup

To enable HTTPS:

1. Create an SSL certificate in AWS Certificate Manager (ACM)
2. Validate the certificate
3. Set the certificate ARN in `terraform.tfvars`:
   ```hcl
   ssl_certificate_arn = "arn:aws:acm:region:account:certificate/xxxxx"
   domain_name = "demo.example.com"
   ```
4. Apply the changes:
   ```bash
   terraform apply
   ```
5. Update your DNS to point to the ALB DNS name

## Useful Commands

### View Outputs

```bash
# All outputs
terraform output

# Specific output
terraform output application_url
terraform output ec2_public_ip
```

### SSH into EC2

```bash
ssh -i your-key.pem ec2-user@$(terraform output -raw ec2_public_ip)
```

### Update Infrastructure

```bash
# Plan changes
terraform plan

# Apply changes
terraform apply
```

### Destroy Infrastructure

```bash
terraform destroy
```

**Warning**: This will delete all resources created by Terraform!

## Monitoring and Logs

### Application Logs

```bash
# On EC2 instance
pm2 logs redis-demo

# Or via CloudWatch
# Go to: CloudWatch > Log groups > /aws/ec2/redis-feature-demo
```

### System Metrics

```bash
# View in AWS Console
# CloudWatch > Metrics > redis-feature-demo namespace
```

### Alarms

```bash
# View in AWS Console
# CloudWatch > Alarms
```

## Troubleshooting

### Application Not Starting

```bash
# SSH into EC2
ssh -i your-key.pem ec2-user@<EC2_IP>

# Check if Node.js is installed
node --version

# Check if .env file exists
cat /opt/redis-feature-demo/.env

# Check application logs
pm2 logs
tail -f /var/log/redis-demo/app.log
tail -f /var/log/redis-demo/error.log
```

### ALB Health Checks Failing

```bash
# Check application is running on port 3000
curl http://localhost:3000

# Check security groups
# Ensure EC2 security group allows traffic from ALB on port 3000
```

### Cannot SSH to EC2

1. Check your IP is in `allowed_ssh_cidr`
2. Verify SSH key name is correct
3. Check security group rules

### Database Connection Issues

```bash
# Test PostgreSQL connection from EC2
nc -zv <postgres_host> 5432

# Test Redis connection
redis-cli -h <redis_host> -p <redis_port> -a <redis_password> ping
```

## Cost Estimation

Approximate monthly costs (us-east-1 region):

| Resource | Type | Estimated Cost |
|----------|------|---------------|
| EC2 Instance | t3.medium | ~$30 |
| ALB | Application | ~$23 |
| EBS Volume | 30GB GP3 | ~$3 |
| Elastic IP | 1 IP | ~$3 |
| NAT Gateway | 1 NAT | ~$32 |
| Data Transfer | Variable | ~$10 |
| **Total** | | **~$101/month** |

*Note: Costs vary by region and actual usage*

## Security Best Practices

1. **Change default passwords**: Update `admin_password_hash`
2. **Restrict SSH access**: Set `allowed_ssh_cidr` to your IP only
3. **Use HTTPS**: Configure SSL certificate for production
4. **Enable MFA**: For AWS account
5. **Regular updates**: Keep AMI and packages updated
6. **Backup**: Enable automated backups for critical data

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review CloudWatch logs
3. Check AWS service health dashboard
4. Review Terraform plan output for errors

## License

This infrastructure code is provided as-is for the Redis Feature Demo application.
