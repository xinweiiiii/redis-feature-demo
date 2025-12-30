Quick Setup

  1. Build & Push Docker Image

  # Build
  docker build -t redis-demo .

  # Push to ECR
  aws ecr create-repository --repository-name redis-demo --region us-east-1
  aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin
  735486936198.dkr.ecr.us-east-1.amazonaws.com


docker tag redis-demo:latest 735486936198.dkr.ecr.ap-southeast-1.amazonaws.com/redis-demo:latest

docker push 735486936198.dkr.ecr.ap-southeast-1.amazonaws.com/redis-demo:latest

  2. Create VPC Resources

  # Create VPC
  aws ec2 create-vpc --cidr-block 10.0.0.0/16 --region us-east-1

  # Create 2 subnets (App Runner requires 2+)
  aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.1.0/24 --availability-zone us-east-1a
  aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.2.0/24 --availability-zone us-east-1b

  # Create security group allowing outbound to Redis
  aws ec2 create-security-group --group-name apprunner-sg --vpc-id vpc-xxx

  3. Set Up VPC Peering

  # Create peering connection to target VPC (Redis Cloud/other)
  aws ec2 create-vpc-peering-connection \
    --vpc-id vpc-xxx \
    --peer-vpc-id vpc-target \
    --peer-region us-east-1

  # Accept peering (if you own both VPCs, or through Redis Cloud console)
  aws ec2 accept-vpc-peering-connection --vpc-peering-connection-id pcx-xxx

  # Add route to peer VPC
  aws ec2 create-route \
    --route-table-id rtb-xxx \
    --destination-cidr-block 10.x.x.x/24 \
    --vpc-peering-connection-id pcx-xxx

  4. Deploy to App Runner

  In AWS Console:

  1. Go to App Runner → Create service
  2. Source: ECR → Select your image
  3. Configure:
    - vCPU: 0.25
    - Memory: 0.5 GB
    - Port: 3000
  4. Add environment variables: REDIS_URL, OPENAI_API_KEY
  5. Networking: Enable Custom VPC
    - Select your VPC, subnets, security group
  6. Deploy

  Done. Get your URL: https://xxx.awsapprunner.com

  ---
  Files already created:
  - Dockerfile ✓
  - next.config.js (with output: 'standalone') ✓