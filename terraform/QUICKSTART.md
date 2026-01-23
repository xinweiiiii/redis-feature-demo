# Quick Start Guide

Deploy the Redis Feature Demo to AWS in 5 minutes!

## Prerequisites Checklist

- [ ] AWS Account with admin access
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Terraform >= 1.0 installed
- [ ] SSH key pair created in AWS
- [ ] Existing PostgreSQL Aurora database
- [ ] Redis Cloud instance

## Step-by-Step Deployment

### 1. Prepare Configuration (2 minutes)

```bash
cd terraform

# Copy example config
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
vi terraform.tfvars
```

**Required values to update:**
- `ec2_key_name` - Your AWS SSH key name
- `postgres_host` - Your Aurora endpoint
- `postgres_password` - Your Aurora password
- `redis_host` - Your Redis Cloud hostname
- `redis_password` - Your Redis Cloud password
- `allowed_ssh_cidr` - Your IP address for SSH access

### 2. Deploy Infrastructure (3 minutes)

Using Makefile (recommended):
```bash
# Initialize and deploy in one command
make quick-deploy
```

Or using Terraform directly:
```bash
# Initialize
terraform init

# Preview changes
terraform plan

# Deploy
terraform apply
```

Type `yes` when prompted.

### 3. Deploy Application Code (5-10 minutes)

```bash
# Get your EC2 IP
make ip

# SSH into the instance (set SSH_KEY first)
export SSH_KEY=/path/to/your-key.pem
make ssh

# Or use terraform output
ssh -i your-key.pem ec2-user@$(terraform output -raw ec2_public_ip)
```

Once connected to EC2:

```bash
# Navigate to app directory
cd /opt/redis-feature-demo

# Clone your repository
git clone https://github.com/your-username/redis-feature-demo.git .

# Install dependencies
npm install

# Build the application
npm run build

# Install PM2
npm install -g pm2

# Start with PM2
pm2 start npm --name redis-demo -- start

# Save PM2 process list
pm2 save

# Configure PM2 to start on boot
pm2 startup
# Copy and run the command PM2 provides

# Verify it's running
pm2 status

# Deldte the PM2 existing tasks
pm2 delete redis-demo
```

### 4. Access Your Application

```bash
# Get the URL
make url

# Or
terraform output application_url
```

Open the URL in your browser!

## Quick Commands Reference

```bash
# Show all commands
make help

# View outputs
make output
make url
make ip

# Access instance
export SSH_KEY=/path/to/key.pem
make ssh
make logs

# Manage infrastructure
make plan
make apply
make destroy
```

## Troubleshooting

### Can't SSH to instance?

```bash
# 1. Check your IP is allowed
# Edit terraform.tfvars and update allowed_ssh_cidr
allowed_ssh_cidr = ["YOUR_IP/32"]

# 2. Apply changes
terraform apply

# 3. Try SSH again
make ssh
```

### Application not accessible?

```bash
# 1. SSH to instance
make ssh

# 2. Check if app is running
pm2 status

# 3. Check application logs
pm2 logs redis-demo

# 4. Restart if needed
pm2 restart redis-demo
```

### Database connection issues?

```bash
# SSH to instance
make ssh

# Test PostgreSQL connection
nc -zv <your-aurora-endpoint> 5432

# Test Redis connection
redis-cli -h <your-redis-host> -p <redis-port> -a <password> ping

# Check .env file
cat /opt/redis-feature-demo/.env
```

## Next Steps

- [ ] Configure custom domain (optional)
- [ ] Set up SSL certificate in ACM (optional)
- [ ] Configure monitoring alerts
- [ ] Set up automated backups
- [ ] Review security groups

## Cost Estimate

Expected monthly cost: **~$100/month**

Major components:
- EC2 t3.medium: ~$30
- Application Load Balancer: ~$23
- NAT Gateway: ~$32
- Other (storage, IPs, etc): ~$15

## Support

Need help?
1. Check `README.md` for detailed documentation
2. Review CloudWatch logs: Log Group `/aws/ec2/redis-feature-demo`
3. Check Terraform outputs: `make output`

## Clean Up

To destroy everything:

```bash
make destroy
```

**Warning**: This will delete all resources!