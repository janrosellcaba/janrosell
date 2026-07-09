import { config, fields, collection } from '@keystatic/core';

export default config({
	storage: {
		kind: 'local',
	},
	ui: {
		brand: { name: 'Jan Rosell' },
	},
	collections: {
		blog: collection({
			label: 'Blog',
			slugField: 'title',
			path: 'src/content/blog/*',
			format: { contentField: 'content' },
			entryLayout: 'content',
			columns: ['title', 'date'],
			schema: {
				title: fields.slug({
					name: { label: 'Title' },
					slug: {
						label: 'Slug (URL)',
						description: 'The URL segment for this post, e.g. /blog/my-post',
					},
				}),
				subtitle: fields.text({
					label: 'Subtitle',
					description: 'Optional tagline shown under the title on the post page.',
				}),
				date: fields.date({
					label: 'Date',
					defaultValue: { kind: 'today' },
				}),
				summary: fields.text({
					label: 'Summary',
					description: 'Short excerpt shown on the blog list and used as the meta description.',
					multiline: true,
					validation: { length: { min: 1 } },
				}),
				content: fields.markdoc({
					label: 'Content',
				}),
			},
		}),
	},
});
