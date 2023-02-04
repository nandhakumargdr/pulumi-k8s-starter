# Pulumi k8s starter

Pulumi k8s starter is a basic pulumi project to setup Kubernetes cluster and setup basic configurations

1. Nginx Ingress Controller

2. LoadBalancer

3. CertManager with LetsEncrypt

## Digital Ocean Configuration

Configure using Digital Ocean token

```bash
pulumi config set digitalocean:token XXXXXXXXXXXXXX --secret
```

Run Pulumi

```bash
pulumi up
```


