// initAPI.ts
// Initializes the Express handler

import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import express, { urlencoded } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";

const initAPI = () => {
    const app = express();

    app.use(
        rateLimit({
            limit: 10,
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
