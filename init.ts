import * as digitalocean from "@pulumi/digitalocean";
import * as kubernetes from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'

export const createCluster = (name: string, installCertManager: boolean) => {
    const cluster = new digitalocean.KubernetesCluster(name, {
        region: digitalocean.Region.SFO3,
        version: digitalocean.getKubernetesVersions().then(p => p.latestVersion),
        nodePool: {
            name: "default",
            size: digitalocean.DropletSlug.DropletS2VCPU4GB,
            nodeCount: 2
        }
    });

    const kubeconfig = cluster.status.apply(status => {
        if (status === "running") {
            const clusterDataSource = cluster.name.apply(name => digitalocean.getKubernetesCluster({ name }));
            return clusterDataSource.kubeConfigs[0].rawConfig;
        } else {
            return cluster.kubeConfigs[0].rawConfig;
        }
    });

    const provider = new kubernetes.Provider(name, { kubeconfig });

    const ingressNamespace = new kubernetes.core.v1.Namespace("nginx-ingress", undefined, { provider: provider });
    const ingress = new kubernetes.helm.v3.Release("nginx", {
        chart: "ingress-nginx",
        repositoryOpts: {
            repo: "https://kubernetes.github.io/ingress-nginx",
        },
        namespace: ingressNamespace.metadata.name,
        skipAwait: true

    }, { provider, dependsOn: [cluster] });


    if (installCertManager) {

        var email = 'nandhakumargdr@gmail.com';

        // const ingressNamespace = new kubernetes.core.v1.Namespace("cert-manager", undefined, { provider: provider });
        const certManager = new kubernetes.helm.v3.Release("cert-manager", {
            chart: "cert-manager",
            repositoryOpts: {
                repo: "https://charts.jetstack.io"
            },
            namespace: ingressNamespace.metadata.name,
            values: {
                installCRDs: true,
            },
            skipAwait: false
        }, { provider, dependsOn: [ingress] });


        const issuer = new kubernetes.apiextensions.CustomResource("issuer", {
            apiVersion: "cert-manager.io/v1",
            kind: "ClusterIssuer",
            metadata: {
                name: "letsencrypt-production",
                namespace: ingressNamespace.metadata.name,
            },
            spec: {
                acme: {
                    email,
                    server: 'https://acme-v02.api.letsencrypt.org/directory',
                    privateKeySecretRef: { name: 'letsencrypt-production-private-key' },
                    solvers: [{ http01: { ingress: { class: "nginx" } } }]
                }
            },
        }, { provider, dependsOn: [certManager] });

    }

    return provider;
}