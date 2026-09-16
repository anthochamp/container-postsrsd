import * as path from "node:path";

import type { DockerContainerRunOptions } from "@ac-kit/cmd-docker";
import { getRandomEphemeralPort, sleep } from "@ac-kit/core";
import type { EnvVariables } from "@ac-kit/format-shell";
import { initDockerSuite } from "@ac-kit/integration-test-util";
import { SocketmapClient, type SocketmapResult } from "@ac-kit/net-socketmap";
import { DuplexTransport } from "@ac-kit/net-transport-node";
import { TcpSocket } from "@ac-kit/node";
import { beforeAll, vi } from "vitest";

const srcPath = path.resolve(path.join(__dirname, "..", "src"));
const POSTSRSD_CONTAINER_PORT = 11380;

export async function isSocketmapReady(port: number): Promise<boolean> {
	const socket = TcpSocket.from();

	try {
		await Promise.race([
			socketmapQuery(port, "forward", "probe@probe.invalid", socket),
			sleep(1000).then(() => {
				throw new Error("probe timeout");
			}),
		]);
		return true;
	} catch {
		if (!socket.destroyed) socket.destroy();
		return false;
	}
}

export async function socketmapQuery(
	port: number,
	table: "forward" | "reverse",
	address: string,
	existingSocket?: TcpSocket,
): Promise<SocketmapResult> {
	const socket = existingSocket ?? TcpSocket.from();

	try {
		await socket.connect(port, { host: "localhost" });
		const client = new SocketmapClient(new DuplexTransport(socket.stream), {
			defaultTimeoutMs: 5000,
		});
		return await client.lookup(table, address);
	} catch (err: unknown) {
		if (!socket.destroyed) socket.destroy();
		throw err;
	}
}

type ContainerRunOptions = Omit<DockerContainerRunOptions, "name" | "context" | "detach">;

type UseContainerOptions = {
	bindPort?: number;
	env?: EnvVariables;
	startupDelayMs?: number;
	tcpWaitTimeoutMs?: number;
};

export function initSuite(containerNamePrefix = "test-") {
	let pendingRunOptions: ContainerRunOptions = {};
	let pendingWaitReady: () => Promise<void> = async () => {};

	const { containerImageName } = initDockerSuite(srcPath, {
		containerNamePrefix,
		containerRunOptions: () => pendingRunOptions,
		onContainerStarted: () => pendingWaitReady(),
	});

	return {
		containerImageName,
		/** Registers the container's run options for every test in this describe. */
		useContainer: (options?: UseContainerOptions) => {
			const bindPort = options?.bindPort ?? getRandomEphemeralPort();

			beforeAll(() => {
				pendingRunOptions = {
					publish: [`${bindPort}:${POSTSRSD_CONTAINER_PORT}`],
					env: options?.env,
				};
				pendingWaitReady = async () => {
					await vi.waitUntil(() => isSocketmapReady(bindPort), {
						timeout: options?.tcpWaitTimeoutMs ?? 15000,
						interval: 500,
					});
					await sleep(options?.startupDelayMs ?? 500);
				};
			});

			return {
				bindPort,
				query: (table: "forward" | "reverse", address: string) =>
					socketmapQuery(bindPort, table, address),
			};
		},
	};
}
