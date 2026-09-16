import { defineProject } from "@ac-kit/vitest-config";

export default defineProject({
	test: {
		testTimeout: 30_000,
		hookTimeout: 300_000, // container's build from sources
	},
});
