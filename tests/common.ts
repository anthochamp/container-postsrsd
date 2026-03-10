import { randomBytes } from "node:crypto";
import * as path from "node:path";
import {
	dockerBuildxBuild,
	dockerContainerRm,
	dockerContainerRun,
	dockerContextShow,
	dockerContextUse,
	dockerImageRm,
} from "@ac-essentials/cli";
import {
	type EnvVariables,
	getRandomEphemeralPort,
	sleep,
	TcpSocket,
} from "@ac-essentials/misc-util";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

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

export type SocketmapResult = { status: string; value: string };

export async function socketmapQuery(
	port: number,
	table: "forward" | "reverse",
	address: string,
	existingSocket?: TcpSocket,
): Promise<SocketmapResult> {
	const payload = `${table} ${address}`;
	const request = `${payload.length}:${payload},`;

	const socket = existingSocket ?? TcpSocket.from();
	socket.timeout = 5000;

	try {
		await socket.connect(port, "localhost");

		return await new Promise<SocketmapResult>((resolve, reject) => {
			let buffer = "";

			socket.subscribe("timeout", () => {
				socket.destroy();
				reject(new Error("socketmap query timed out"));
			});

			socket.subscribe("error", (err) => {
				socket.destroy();
				reject(err);
			});

			socket.stream.on("data", (chunk: Buffer) => {
				buffer += chunk.toString();
				const colonIdx = buffer.indexOf(":");
				if (colonIdx === -1) return;
				const len = Number.parseInt(buffer.slice(0, colonIdx), 10);
				if (buffer.length < colonIdx + 1 + len + 1) return;
				const data = buffer.slice(colonIdx + 1, colonIdx + 1 + len);
				socket.destroy();
				const spaceIdx = data.indexOf(" ");
				const status = spaceIdx === -1 ? data : data.slice(0, spaceIdx);
				const value = spaceIdx === -1 ? "" : data.slice(spaceIdx + 1);
				resolve({ status, value });
			});

			socket.write(Buffer.from(request)).catch(reject);
		});
	} catch (err: unknown) {
		if (!socket.destroyed) socket.destroy();
		throw err;
	}
}

type StartContainerOptions = {
	bindPort?: number;
	env?: EnvVariables;
	startupDelayMs?: number;
	tcpWaitTimeoutMs?: number;
};

export function initSuite(containerNamePrefix = "test-") {
	let initialContext: string;
	const containerName = `${containerNamePrefix}${randomBytes(20).toString("hex")}`;
	const containerImageName = `${containerName}-img`;

	async function stopContainer() {
		try {
			await dockerContainerRm([containerName], { force: true });
		} catch (_) {}
	}

	beforeAll(async () => {
		initialContext = await dockerContextShow();
		await dockerContextUse("default");

		await stopContainer();

		try {
			await dockerImageRm([containerImageName], { force: true });
		} catch (_) {}

		await dockerBuildxBuild(srcPath, { tags: [containerImageName] });
	});

	afterAll(async () => {
		try {
			await dockerImageRm([containerImageName], { force: true });
		} catch (_) {}

		try {
			await dockerContextUse(initialContext);
		} catch (_) {}
	});

	afterEach(async () => {
		await stopContainer();
	});

	return {
		startContainer: async (options?: StartContainerOptions) => {
			const bindPort = options?.bindPort ?? getRandomEphemeralPort();

			await dockerContainerRun(containerImageName, undefined, undefined, {
				detach: true,
				name: containerName,
				publish: [`${bindPort}:${POSTSRSD_CONTAINER_PORT}`],
				env: options?.env,
			});

			await vi.waitUntil(() => isSocketmapReady(bindPort), {
				timeout: options?.tcpWaitTimeoutMs ?? 15000,
				interval: 500,
			});

			await sleep(options?.startupDelayMs ?? 500);

			return {
				bindPort,
				query: (table: "forward" | "reverse", address: string) =>
					socketmapQuery(bindPort, table, address),
			};
		},
		containerName,
		containerImageName,
	};
}
