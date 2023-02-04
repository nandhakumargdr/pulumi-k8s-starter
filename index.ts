import * as pulumi from "@pulumi/pulumi";
import * as digitalocean from "@pulumi/digitalocean";
import * as kubernetes from "@pulumi/kubernetes";
import {createCluster} from "./init";

const provider = createCluster("k8s-cashsheet", true);
