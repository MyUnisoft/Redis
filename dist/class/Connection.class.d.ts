import { Redis, type RedisOptions } from "ioredis";
import { Result } from "@openally/result";
type AssertDisconnectionErrorMessage = "Failed at closing the Redis connection";
export type GetConnectionPerfResponse = {
    isAlive: false;
} | {
    isAlive: true;
    perf: number;
};
export type AssertConnectionResponse = Result<null, "Failed at initializing the Redis connection">;
export type AssertDisconnectionResponse = Result<null, AssertDisconnectionErrorMessage>;
export type CloseResponse = Result<null, AssertDisconnectionErrorMessage | "Redis connection already closed">;
export type ConnectionOptions = Partial<RedisOptions> & {
    port?: number;
    host?: number;
    attempt?: number;
    disconnectionTimeout?: number;
};
export declare class Connection extends Redis {
    #private;
    constructor(options: ConnectionOptions);
    initialize(): Promise<void>;
    getConnectionPerf(): Promise<GetConnectionPerfResponse>;
    close(forceExit?: boolean): Promise<CloseResponse>;
    private assertConnection;
    private assertDisconnection;
}
export {};
//# sourceMappingURL=Connection.class.d.ts.map