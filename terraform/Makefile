.PHONY: help init plan apply destroy output ssh logs clean format validate

help:
	@echo "Redis Feature Demo - Terraform Commands"
	@echo "========================================"
	@echo ""
	@echo "Setup Commands:"
	@echo "  make init      - Initialize Terraform"
	@echo "  make validate  - Validate Terraform configuration"
	@echo "  make format    - Format Terraform files"
	@echo ""
	@echo "Deployment Commands:"
	@echo "  make plan      - Show execution plan"
	@echo "  make apply     - Apply infrastructure changes"
	@echo "  make destroy   - Destroy infrastructure"
	@echo ""
	@echo "Info Commands:"
	@echo "  make output    - Show all outputs"
	@echo "  make url       - Show application URL"
	@echo "  make ip        - Show EC2 public IP"
	@echo ""
	@echo "Access Commands:"
	@echo "  make ssh       - SSH into EC2 instance"
	@echo "  make logs      - View application logs via SSH"
	@echo ""
	@echo "Maintenance Commands:"
	@echo "  make clean     - Clean Terraform files"
	@echo ""

init:
	@echo "Initializing Terraform..."
	terraform init

validate:
	@echo "Validating Terraform configuration..."
	terraform validate

format:
	@echo "Formatting Terraform files..."
	terraform fmt -recursive

plan:
	@echo "Creating Terraform plan..."
	terraform plan

apply:
	@echo "Applying Terraform configuration..."
	terraform apply

destroy:
	@echo "Destroying infrastructure..."
	@read -p "Are you sure you want to destroy all infrastructure? [yes/NO]: " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		terraform destroy; \
	else \
		echo "Destroy cancelled."; \
	fi

output:
	@echo "Terraform Outputs:"
	@terraform output

url:
	@echo "Application URL:"
	@terraform output -raw application_url

ip:
	@echo "EC2 Public IP:"
	@terraform output -raw ec2_public_ip

ssh:
	@echo "Connecting to EC2 instance..."
	@EC2_IP=$$(terraform output -raw ec2_public_ip); \
	if [ -z "$$SSH_KEY" ]; then \
		echo "Please set SSH_KEY environment variable:"; \
		echo "  export SSH_KEY=path/to/your/key.pem"; \
		echo "  make ssh"; \
	else \
		ssh -i $$SSH_KEY ec2-user@$$EC2_IP; \
	fi

logs:
	@echo "Viewing application logs..."
	@EC2_IP=$$(terraform output -raw ec2_public_ip); \
	if [ -z "$$SSH_KEY" ]; then \
		echo "Please set SSH_KEY environment variable:"; \
		echo "  export SSH_KEY=path/to/your/key.pem"; \
		echo "  make logs"; \
	else \
		ssh -i $$SSH_KEY ec2-user@$$EC2_IP "pm2 logs redis-demo"; \
	fi

clean:
	@echo "Cleaning Terraform files..."
	rm -rf .terraform
	rm -f .terraform.lock.hcl
	rm -f terraform.tfstate
	rm -f terraform.tfstate.backup
	rm -f crash.log
	@echo "Clean complete. Run 'make init' before using Terraform again."

# Quick deployment workflow
quick-deploy: init validate plan apply
	@echo ""
	@echo "Deployment complete!"
	@echo "==================="
	@make url

# Full setup from scratch
setup:
	@echo "Setting up Redis Feature Demo infrastructure..."
	@if [ ! -f terraform.tfvars ]; then \
		echo "Creating terraform.tfvars from example..."; \
		cp terraform.tfvars.example terraform.tfvars; \
		echo ""; \
		echo "Please edit terraform.tfvars with your values:"; \
		echo "  vi terraform.tfvars"; \
		echo ""; \
		echo "Then run: make quick-deploy"; \
	else \
		echo "terraform.tfvars already exists."; \
		echo "Run: make quick-deploy"; \
	fi
