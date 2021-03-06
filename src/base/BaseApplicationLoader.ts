import type { BaseApplication } from "./BaseApplication";
import type { BaseRouteBuilder } from "./BaseRouteBuilder";
import { buildRoutePath, isRoute } from "../utils";
import { readdir } from "fs/promises";
import { extname } from "path";

export abstract class BaseApplicationLoader<S> {
	/**
	 * @param application The API application
	 */
	public constructor(public application: BaseApplication<S>) {}

	/**
	 * Load all the routes
	 */
	public async loadRoutes() {
		for await (const path of this._recursiveReaddir(this._apiPath)) {
			const mod = await import(path).catch(() => ({}));
			const routePath = path.slice(this._apiPath.length, -extname(path).length);
			const routes = Object.values(mod).filter((route) => isRoute(route)) as BaseRouteBuilder[];

			if (routes.length)
				await this.loadRoute(
					routes.map((route) => {
						route.route = buildRoutePath(routePath, route.route);
						return route;
					}),
				);
		}
	}

	/**
	 * Load a route file
	 * @param builders The routes
	 */
	public abstract loadRoute(builders: BaseRouteBuilder[]): Promise<void>;

	/**
	 * Recursively read all the file paths in a given path
	 * @param path The path to read
	 *
	 * @returns Path iterator
	 */
	private async *_recursiveReaddir(path: string): AsyncIterableIterator<string> {
		for (const file of await readdir(path, { withFileTypes: true })) {
			if (file.isDirectory()) yield* this._recursiveReaddir(`${path}/${file.name}`);
			else yield `${path}/${file.name}`;
		}
	}

	/**
	 * Get the API route path
	 */
	private get _apiPath(): string {
		if (this.application.routeDirPath) return this.application.routeDirPath;
		throw new Error("API route directory path not provided");
	}
}
