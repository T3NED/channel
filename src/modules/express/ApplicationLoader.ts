import type { Express } from "express";
import type { Handler, Middleware } from "./RouteBuilder";
import { BaseRouteBuilder, BaseApplicationLoader } from "../../base";
import { Application } from "./Application";
import { buildRoutePath } from "../../utils";

export class ApplicationLoader extends BaseApplicationLoader<Express> {
	/**
	 * Load a route file
	 * @param builders The routes
	 */
	public async loadRoute(builders: BaseRouteBuilder[]): Promise<void> {
		const versionedRoutes = builders.flatMap((builder) => {
			const versions = [...builder._versions];
			if (!versions.length) versions.push(Application.defaultVersionSlug);

			return versions.map((version) => ({
				method: builder.method,
				route: buildRoutePath(Application.routePrefix, version, builder.route),
				handler: builder._handler as Handler,
				preMiddleware: builder._preMiddleware as Middleware[],
				postMiddleware: builder._postMiddleware as Middleware[],
			}));
		});

		for (const { method, route, handler, preMiddleware, postMiddleware } of versionedRoutes) {
			const handlers = [...preMiddleware, handler, ...postMiddleware];
			this.application.server[method].bind(this.application.server)(route, ...handlers);
		}
	}
}
