// authClient.ts
// Returns an object that can be used as a gRPC client for the auth microservice

import { resolve } from "path";

import { loadPackageDefinition } from "@grpc/grpc-js";
import { loadSync } from "@grpc/proto-loader";

const PROTO_PATH = resolve(__dirname, "../../proto/authentication.proto");

const pkgDef = loadSync(PROTO_PATH, {
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});
const authenticationProto = loadPackageDefinition(pkgDef).authentication as any;
