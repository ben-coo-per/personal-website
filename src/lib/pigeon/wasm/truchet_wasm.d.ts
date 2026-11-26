/* tslint:disable */
/* eslint-disable */

/**
 * Decode 52 tile symbols back into a payload. Returns a JS object with
 * `{ ok, error, device_id, counter, time, lat_int, lon_int }` — fields
 * are `null` on failure and `error` is a human-readable string.
 */
export function decode_payload(symbols: Uint8Array): any;

/**
 * Encode a payload into 52 tile symbols. Returns a `Uint8Array` of length
 * 52 (each byte 0..15). The first 50 entries carry the interleaved RS
 * codeword; the last 2 are visual filler. No secret needed — patterns are
 * public.
 */
export function encode_payload(device_id: number, counter: number, time: number, lat_int: number, lon_int: number): Uint8Array;

export function generate_raster(seed: string, depth: number, cycle: string, width: number, height: number, families_mask: number, root_grid_w: number, root_grid_h: number, show_grid: boolean, subdiv_mask: Uint8Array): Uint8Array;

export function generate_svg(seed: string, depth: number, cycle: string, viewport: number, families_mask: number, root_grid_w: number, root_grid_h: number, show_grid: boolean, subdiv_mask: Uint8Array): string;

/**
 * Render the 52-tile symbol sequence as a raster RGBA byte buffer.
 */
export function payload_raster(symbols: Uint8Array, cycle: string, size: number, show_grid: boolean): Uint8Array;

/**
 * Render the 52-tile symbol sequence as an SVG document.
 */
export function payload_svg(symbols: Uint8Array, cycle: string, viewport: number, show_grid: boolean): string;

/**
 * Total tile count (= 52). Exported as a constant for the JS UI to
 * allocate its symbol buffer correctly.
 */
export function payload_tile_count(): number;

export function start(): void;

export function tiling_stats(seed: string, depth: number, families_mask: number, root_grid_w: number, root_grid_h: number, subdiv_mask: Uint8Array): any;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly decode_payload: (a: number, b: number) => number;
    readonly encode_payload: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly generate_raster: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number) => void;
    readonly generate_svg: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number) => void;
    readonly payload_raster: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly payload_svg: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly payload_tile_count: () => number;
    readonly start: () => void;
    readonly tiling_stats: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => number;
    readonly __wbindgen_export: (a: number, b: number) => number;
    readonly __wbindgen_export2: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_export3: (a: number, b: number, c: number) => void;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
