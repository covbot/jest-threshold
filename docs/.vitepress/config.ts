import { defineConfig } from 'vitepress';

export default defineConfig({
	title: 'covbot',
	description: 'Painless validation of jest coverage thresholds.',
	base: '/jest-threshold/',
	themeConfig: {
		socialLinks: [
			{
				icon: 'github',
				link: 'https://github.com/covbot/jest-threshold',
			},
		],
		footer: {
			message: 'Released under the MIT License.',
			copyright: 'Copyright © 2022-present Artiom Tretjakovas',
		},
	},
});
