# IAM Role for EC2 Instance
resource "aws_iam_role" "ec2" {
  name_prefix = "${var.project_name}-ec2-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-ec2-role"
  }
}

# IAM Policy for EC2 to access CloudWatch Logs
resource "aws_iam_role_policy" "ec2_cloudwatch" {
  name_prefix = "${var.project_name}-ec2-cloudwatch-"
  role        = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2" {
  name_prefix = "${var.project_name}-ec2-"
  role        = aws_iam_role.ec2.name

  tags = {
    Name = "${var.project_name}-ec2-profile"
  }
}

# User Data Script
locals {
  user_data = <<-EOF
    #!/bin/bash
    set -e

    # Update system
    dnf update -y

    # Install Node.js 20.x
    dnf install -y nodejs20 npm git

    # Install PM2 globally
    npm install -g pm2

    # Create application directory
    mkdir -p /opt/redis-feature-demo
    cd /opt/redis-feature-demo

    # Clone repository (you'll need to replace with your repo)
    # For now, we'll create a placeholder
    echo "Application will be deployed here"

    # Create .env file
    cat > /opt/redis-feature-demo/.env << 'ENVEOF'
REDIS_HOST=${var.redis_host}
REDIS_PORT=${var.redis_port}
REDIS_PASSWORD=${var.redis_password}

POSTGRES_HOST=${var.postgres_host}
POSTGRES_PORT=${var.postgres_port}
POSTGRES_DB=${var.postgres_db}
POSTGRES_USER=${var.postgres_user}
POSTGRES_PASSWORD=${var.postgres_password}

OPENAI_API_KEY=${var.openai_api_key}

SESSION_SECRET=${random_password.session_secret.result}
ADMIN_PASSWORD_HASH=${var.admin_password_hash}

NODE_ENV=production
PORT=3000
ENVEOF

    # Set permissions
    chmod 600 /opt/redis-feature-demo/.env

    # Install CloudWatch Agent
    wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
    rpm -U ./amazon-cloudwatch-agent.rpm

    # Configure CloudWatch Agent
    cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json << 'CWEOF'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/redis-demo/app.log",
            "log_group_name": "/aws/ec2/${var.project_name}",
            "log_stream_name": "{instance_id}/application"
          },
          {
            "file_path": "/var/log/redis-demo/error.log",
            "log_group_name": "/aws/ec2/${var.project_name}",
            "log_stream_name": "{instance_id}/error"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "${var.project_name}",
    "metrics_collected": {
      "mem": {
        "measurement": [
          {
            "name": "mem_used_percent",
            "rename": "MemoryUsedPercent",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": [
          {
            "name": "used_percent",
            "rename": "DiskUsedPercent",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60,
        "resources": [
          "/"
        ]
      }
    }
  }
}
CWEOF

    # Start CloudWatch Agent
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
      -a fetch-config \
      -m ec2 \
      -s \
      -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json

    # Create log directory
    mkdir -p /var/log/redis-demo
    chmod 755 /var/log/redis-demo

    # Create systemd service for the application
    cat > /etc/systemd/system/redis-demo.service << 'SERVICEEOF'
[Unit]
Description=Redis Feature Demo Application
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/redis-feature-demo
Environment=NODE_ENV=production
ExecStart=/usr/bin/pm2 start npm --name redis-demo -- start --no-daemon
Restart=on-failure
RestartSec=10
StandardOutput=append:/var/log/redis-demo/app.log
StandardError=append:/var/log/redis-demo/error.log

[Install]
WantedBy=multi-user.target
SERVICEEOF

    # Enable and start the service (after deployment)
    systemctl daemon-reload
    systemctl enable redis-demo.service

    # Signal completion
    echo "User data script completed successfully" > /var/log/user-data-complete.log
  EOF
}

# Random password for session secret
resource "random_password" "session_secret" {
  length  = 32
  special = true
}

# EC2 Instance
resource "aws_instance" "app" {
  ami                    = data.aws_ami.amazon_linux_2023.id
  instance_type          = var.ec2_instance_type
  key_name              = var.ec2_key_name != "" ? var.ec2_key_name : null
  subnet_id             = aws_subnet.public[0].id
  vpc_security_group_ids = [aws_security_group.ec2.id]
  iam_instance_profile  = aws_iam_instance_profile.ec2.name

  user_data = local.user_data

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 30
    delete_on_termination = true
    encrypted             = true
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  tags = {
    Name = "${var.project_name}-app-server"
  }

  lifecycle {
    ignore_changes = [
      ami,
      user_data
    ]
  }
}

# Elastic IP for EC2 Instance
resource "aws_eip" "app" {
  domain   = "vpc"
  instance = aws_instance.app.id

  tags = {
    Name = "${var.project_name}-app-eip"
  }

  depends_on = [aws_internet_gateway.main]
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "app" {
  name              = "/aws/ec2/${var.project_name}"
  retention_in_days = 7

  tags = {
    Name = "${var.project_name}-app-logs"
  }
}
