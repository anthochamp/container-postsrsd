import { execAsync } from "@ac-essentials/misc-util";
import { expect, suite, test } from "vitest";
import { initSuite } from "./common";

const SRS_DOMAIN = "srs.test.invalid";
const LOCAL_DOMAIN = "local.test.invalid";
const TEST_ADDRESS = "user@local.test.invalid";
const EXTERNAL_ADDRESS = "user@external.test.invalid";

const DEFAULT_ENV = {
	POSTSRSD_SRS_DOMAIN: SRS_DOMAIN,
	POSTSRSD_LOCAL_DOMAINS: LOCAL_DOMAIN,
};

suite.sequential("socketmap forward", () => {
	const { startContainer } = initSuite();

	test("does not rewrite sender from a local domain", async () => {
		const { query } = await startContainer({ env: DEFAULT_ENV });

		const result = await query("forward", TEST_ADDRESS);

		// Local domains need not be rewritten (SPF is not an issue for local mail)
		expect(result.status).toBe("NOTFOUND");
	});

	test("rewrites sender from an external domain", async () => {
		const { query } = await startContainer({ env: DEFAULT_ENV });

		const result = await query("forward", EXTERNAL_ADDRESS);

		// External senders are rewritten to SRS to prevent SPF failures on forward
		expect(result.status).toBe("OK");
		expect(result.value).toMatch(new RegExp(`@${SRS_DOMAIN}$`));
		expect(result.value).toMatch(/^SRS0=/);
	});
});

suite.sequential("socketmap reverse", () => {
	const { startContainer } = initSuite();

	test("restores original address from a valid SRS address", async () => {
		const { query } = await startContainer({ env: DEFAULT_ENV });

		// Forward an external address to get a valid SRS address to reverse
		const forwardResult = await query("forward", EXTERNAL_ADDRESS);
		expect(forwardResult.status).toBe("OK");

		const reverseResult = await query("reverse", forwardResult.value);

		expect(reverseResult.status).toBe("OK");
		expect(reverseResult.value).toBe(EXTERNAL_ADDRESS);
	});

	test("does not reverse a plain non-SRS address", async () => {
		const { query } = await startContainer({ env: DEFAULT_ENV });

		const result = await query("reverse", TEST_ADDRESS);

		expect(result.status).toBe("NOTFOUND");
	});
});

suite.sequential("startup", () => {
	const { containerImageName } = initSuite();

	test("fails to start without POSTSRSD_SRS_DOMAIN", async () => {
		// Run without --detach; the entrypoint exits 1 immediately when
		// POSTSRSD_SRS_DOMAIN is missing, so execAsync should reject.
		await expect(
			execAsync(`docker run --rm ${containerImageName}`),
		).rejects.toThrow();
	});
});
