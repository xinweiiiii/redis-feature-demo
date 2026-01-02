# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

# EC2 Outputs
output "ec2_instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.app.id
}

output "ec2_public_ip" {
  description = "Public IP of the EC2 instance"
  value       = aws_eip.app.public_ip
}

output "ec2_private_ip" {
  description = "Private IP of the EC2 instance"
  value       = aws_instance.app.private_ip
}

# ALB Outputs
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

# Application URLs
output "application_url" {
  description = "URL to access the application"
  value       = var.ssl_certificate_arn != "" ? "https://${var.domain_name != "" ? var.domain_name : aws_lb.main.dns_name}" : "http://${aws_lb.main.dns_name}"
}

output "application_url_http" {
  description = "HTTP URL to access the application"
  value       = "http://${aws_lb.main.dns_name}"
}

# Security Group IDs
output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "ec2_security_group_id" {
  description = "ID of the EC2 security group"
  value       = aws_security_group.ec2.id
}

# Deployment Instructions
output "deployment_instructions" {
  description = "Instructions for deploying the application"
  value       = <<-EOT

    Deployment Instructions:
    =======================

    1. SSH into the EC2 instance:
       ssh -i your-key.pem ec2-user@${aws_eip.app.public_ip}

    2. Navigate to the application directory:
       cd /opt/redis-feature-demo

    3. Clone your repository or upload your application code:
       # Option A: Clone from GitHub
       git clone <your-repo-url> .

       # Option B: Use SCP to upload
       scp -i your-key.pem -r /path/to/local/app/* ec2-user@${aws_eip.app.public_ip}:/opt/redis-feature-demo/

    4. Install dependencies:
       npm install

    5. Build the application:
       npm run build

    6. Start the application with PM2:
       pm2 start npm --name redis-demo -- start
       pm2 save
       pm2 startup

    7. Access your application:
       ${var.ssl_certificate_arn != "" ? "https://${var.domain_name != "" ? var.domain_name : aws_lb.main.dns_name}" : "http://${aws_lb.main.dns_name}"}

    8. Monitor application logs:
       pm2 logs redis-demo

       # Or check CloudWatch Logs:
       # Log Group: /aws/ec2/${var.project_name}

    9. Application is configured with:
       - Redis: ${var.redis_host}:${var.redis_port}
       - PostgreSQL: ${var.postgres_host}:${var.postgres_port}
       - Database: ${var.postgres_db}

    Note: The .env file has been created with all required environment variables.
  EOT
}
