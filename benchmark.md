# Overview
This document presents a benchmark comparing simple cache read latency under two network configurations in AWS: one using VPC peering and the other accessing Redis Cloud over a public endpoint.

# Setup
- Redis Demo Features application hosted on an AWS EC2 instance running Node.js in the ap-southeast-1 region
- Redis Cloud database deployed on AWS in the ap-southeast-1 region

# Results
| # Count | VPC Peering | Public Network |
|--------|--------|--------|
|   1    | 1.37ms | 1.66ms |
|   2    | 1.33ms | 1.31ms |
|   3    | 1.29ms | 1.28ms |
|   4    | 1.33ms | 1.25ms |
|   5    | 1.51ms | 1.37ms |
|   6    | 2.13ms | 1.32ms |
|   7    | 1.50ms | 1.24ms |

# Conclusion
## Why the Public Network Can Appear Faster Than VPC Peering
1. “Public” traffic in the same AWS region usually stays on AWS’s backbone

Even though you are connecting via a public endpoint, when:
- EC2 and Redis Cloud are both in ap-southeast-1
- The request never leaves the AWS region

AWS typically routes traffic over its private, regional backbone, not across the open internet.

So in practice:
- Public endpoint ≠ public internet
- It’s still low-latency, region-local AWS networking

This explains why latencies are:
- Very low (≈1.2–1.5 ms)
- Comparable to VPC peering

2. VPC Peering adds extra networking hops

VPC peering is private, but it is not free of overhead. It introduces:
- Additional routing lookups
- Security group + route table evaluations
- Cross-VPC forwarding logic

That overhead is small, but at sub-2 ms latencies, even microseconds matter.

3. Redis Cloud public endpoints are heavily optimized
Redis Cloud public endpoints typically sit behind:
- AWS-managed load balancers
- Optimized network paths
- High-throughput NICs

In some cases, this path is actually more optimized than a customer-managed VPC peering setup.

## Summary
VPC peering is still important for:
- Security / compliance requirements
- Avoiding public IP exposure
- Predictable routing for regulated workloads
- More complex, higher-throughput traffic patterns