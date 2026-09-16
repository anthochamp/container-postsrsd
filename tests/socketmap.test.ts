import { dockerContainerRun } from "@ac-kit/cmd-docker";
import { expect, describe, it } from "vitest";

import { initSuite } from "./common";

const SRS_DOMAIN = "srs.test.invalid";
const LOCAL_DOMAIN = "local.test.invalid";
const TEST_ADDRESS = "user@local.test.invalid";
const EXTERNAL_ADDRESS = "user@external.test.invalid";

const DEFAULT_ENV = {
	POSTSRSD_SRS_DOMAIN: SRS_DOMAIN,
	POSTSRSD_LOCAL_DOMAINS: LOCAL_DOMAIN,
};

describe("socketmap forward", () => {
	const { useContainer } = initSuite();
	const { query } = useContainer({ env: DEFAULT_ENV });

	it("does not rewrite sender from a local domain", async () => {
		const result = await query("forward", TEST_ADDRESS);

		// Local domains need not be rewritten (SPF is not an issue for local mail)
		expect(result.status).toBe("NOTFOUND");
	});

	it("rewrites sender from an external domain", async () => {
		const result = await query("forward", EXTERNAL_ADDRESS);

		// External senders are rewritten to SRS to prevent SPF failures on forward
		expect(result.status).toBe("OK");
		expect(result.value).toMatch(new RegExp(`@${SRS_DOMAIN}$`));
		expect(result.value).toMatch(/^SRS0=/);
	});
});

describe("socketmap reverse", () => {
	const { useContainer } = initSuite();
	const { query } = useContainer({ env: DEFAULT_ENV });

	it("restores original address from a valid SRS address", async () => {
		// Forward an external address to get a valid SRS address to reverse
		const forwardResult = await query("forward", EXTERNAL_ADDRESS);
		expect(forwardResult.status).toBe("OK");

		const reverseResult = await query("reverse", forwardResult.value);

		expect(reverseResult.status).toBe("OK");
		expect(reverseResult.value).toBe(EXTERNAL_ADDRESS);
	});

	it("does not reverse a plain non-SRS address", async () => {
		const result = await query("reverse", TEST_ADDRESS);

		expect(result.status).toBe("NOTFOUND");
	});
});

describe("startup", () => {
	const { containerImageName } = initSuite();

	it("fails to start without POSTSRSD_SRS_DOMAIN", async () => {
		// Run without --detach; the entrypoint exits 1 immediately when
		// POSTSRSD_SRS_DOMAIN is missing, so dockerContainerRun should reject.
		await expect(dockerContainerRun(containerImageName, { rm: true })).rejects.toThrow();
	});
});
