// initAPI.ts
// Initializes the Express handler

import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";

const initAPI = () => {
    const app = express();

    // How many reverse proxies sit in front of the gateway (in prod: the host's TLS nginx, then the frontend's nginx).
    // Express then takes req.ip from that many hops back in X-Forwarded-For; without it every request looks like it
    // came from the nearest proxy, and all users would share one rate-limit budget. Too high a count lets a client
    // spoof its IP with its own X-Forwarded-For, so it must match the real number of proxies
    app.set("trust proxy", Number(process.env.TRUST_PROXY ?? 0));

    app.use(
        rateLimit({
            limit: 100, // per client IP
            windowMs: 60 * 1000
        })
    );
    app.use(helmet());
    app.use(morgan("combined"));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cookieParser());

    app.listen(process.env.PORT, () => {
        console.log(`API gateway is listening on PORT ${process.env.PORT}`);
    }).on("error", err => {
        console.error("Failed to start API server:", err);
    });

    return app;
};

export default initAPI;
