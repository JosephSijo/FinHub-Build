
declare namespace Deno {
    export interface Env {
        get(key: string): string | undefined;
        set(key: string, value: string): void;
        delete(key: string): void;
        toObject(): { [key: string]: string };
    }

    export const env: Env;

    export interface Kv {
        get<T = unknown>(key: Deno.KvKey, options?: { consistency?: Deno.KvConsistencyLevel }): Promise<Deno.KvEntryMaybe<T>>;
        set(key: Deno.KvKey, value: unknown, options?: { expireIn?: number }): Promise<Deno.KvCommitResult>;
        delete(key: Deno.KvKey): Promise<void>;
        list<T = unknown>(selector: Deno.KvListSelector, options?: Deno.KvListOptions): Deno.KvListIterator<T>;
    }

    export type KvKeyPart = string | number | boolean | Uint8Array | bigint;
    export type KvKey = readonly KvKeyPart[];
    export type KvConsistencyLevel = "strong" | "eventual";

    export interface KvEntryMaybe<T> {
        key: Deno.KvKey;
        value: T | null;
        versionstamp: string | null;
    }

    export interface KvCommitResult {
        ok: true;
        versionstamp: string;
    }

    export interface KvListSelector {
        prefix?: Deno.KvKey;
        start?: Deno.KvKey;
        end?: Deno.KvKey;
    }

    export interface KvListOptions {
        limit?: number;
        cursor?: string;
        reverse?: boolean;
        consistency?: Deno.KvConsistencyLevel;
        batchSize?: number;
    }

    export interface KvListIterator<T> extends AsyncIterableIterator<KvEntry<T>> { }

    export interface KvEntry<T> {
        key: Deno.KvKey;
        value: T;
        versionstamp: string;
    }

    export function openKv(path?: string): Promise<Kv>;
    export function serve(handler: (request: Request) => Response | Promise<Response>): void;
}

declare module "hono" {
    export class Hono {
        use(...args: any[]): this;
        get(...args: any[]): this;
        post(...args: any[]): this;
        put(...args: any[]): this;
        delete(...args: any[]): this;
        json(data: any, status?: number): any;
        fetch: (request: Request) => Response | Promise<Response>;
    }
    export interface Context {
        req: {
            json(): Promise<any>;
            param(name: string): string;
            query(name: string): string;
        };
        json(data: any, status?: number): any;
    }
}

declare module "hono/cors" {
    export function cors(options?: any): any;
}

declare module "hono/logger" {
    export function logger(fn?: any): any;
}

declare module "zod" {
    export const z: any;
}
