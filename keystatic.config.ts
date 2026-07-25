import { config, fields, collection, singleton } from '@keystatic/core';

export default config({
	// Local dev writes files directly; production (e.g. Vercel) reads/writes
	// through the GitHub API so the deployed admin can see and create posts.
	storage: import.meta.env.DEV
		? { kind: 'local' }
		: {
				kind: 'github',
				repo: { owner: 'janrosellcaba', name: 'janrosell' },
			},
	ui: {
		brand: { name: 'Jan Rosell' },
		navigation: {
			Content: ['blog'],
			Profile: ['home', 'experience'],
		},
	},
	singletons: {
		home: singleton({
			label: 'Home Page',
			path: 'src/content/home/',
			schema: {
				seo: fields.object(
					{
						title: fields.text({ label: 'SEO title', description: 'Browser tab title / search result title.' }),
						description: fields.text({
							label: 'SEO description',
							description: 'Meta description used for search results and social previews.',
							multiline: true,
						}),
					},
					{ label: 'SEO' },
				),
				hero: fields.object(
					{
						firstName: fields.text({ label: 'First name' }),
						lastName: fields.text({ label: 'Last name' }),
						role1: fields.text({ label: 'Highlight 1 - role' }),
						org1: fields.text({ label: 'Highlight 1 - organization' }),
						role2: fields.text({ label: 'Highlight 2 - role' }),
						org2: fields.text({ label: 'Highlight 2 - organization' }),
						comment: fields.text({
							label: 'Comment line',
							description: 'Shown as a code-comment-styled line under the highlights.',
							multiline: true,
						}),
					},
					{ label: 'Hero' },
				),
				about: fields.object(
					{
						heading: fields.text({ label: 'Heading' }),
						paragraph1: fields.text({
							label: 'Paragraph 1',
							description: 'You can use <strong>text</strong> to bold words, matching the current design.',
							multiline: true,
						}),
						paragraph2: fields.text({
							label: 'Paragraph 2',
							description: 'You can use <strong>text</strong> to bold words.',
							multiline: true,
						}),
						paragraph2Comment: fields.text({
							label: 'Paragraph 2 - comment line',
							description: 'Shown as a separate code-comment-styled line at the end of paragraph 2.',
							multiline: true,
						}),
					},
					{ label: 'About' },
				),
				technologies: fields.object(
					{
						heading: fields.text({ label: 'Heading' }),
						subtitle: fields.text({ label: 'Subtitle', multiline: true }),
						categories: fields.array(
							fields.object({
								title: fields.text({ label: 'Category title' }),
								skills: fields.array(fields.text({ label: 'Skill' }), {
									label: 'Skills',
									itemLabel: (props) => props.value || 'Skill',
								}),
							}),
							{
								label: 'Categories',
								itemLabel: (props) => props.fields.title.value || 'Category',
							},
						),
					},
					{ label: 'Technologies' },
				),
				experienceSection: fields.object(
					{
						heading: fields.text({ label: 'Heading' }),
					},
					{ label: 'Experience & Education' },
				),
				contact: fields.object(
					{
						heading: fields.text({ label: 'Heading', multiline: true }),
						subheading: fields.text({ label: 'Subheading', multiline: true }),
						email: fields.text({ label: 'Email' }),
						githubUrl: fields.url({ label: 'GitHub URL' }),
						linkedinUrl: fields.url({ label: 'LinkedIn URL' }),
					},
					{ label: 'Contact' },
				),
				footer: fields.object(
					{
						tagline: fields.text({ label: 'Footer tagline' }),
					},
					{ label: 'Footer' },
				),
			},
		}),
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
		experience: collection({
			label: 'Experience',
			slugField: 'role',
			path: 'src/content/experience/*',
			columns: ['organization', 'dateRange', 'order'],
			schema: {
				role: fields.slug({
					name: { label: 'Role / Title' },
					slug: { label: 'Slug', description: 'Used only as the filename, not shown publicly.' },
				}),
				organization: fields.text({ label: 'Organization' }),
				dateRange: fields.text({
					label: 'Date range',
					description: 'Free text, e.g. "Feb 2025 - Present".',
				}),
				current: fields.checkbox({
					label: 'Current',
					description: 'Is this an ongoing role? Drives the JSON-LD and terminal "job" output.',
					defaultValue: false,
				}),
				order: fields.integer({
					label: 'Display order',
					description: 'Lower numbers show first on the homepage.',
					defaultValue: 0,
				}),
				details: fields.array(fields.text({ label: 'Detail', multiline: true }), {
					label: 'Details',
					itemLabel: (props) => props.value || 'Detail',
				}),
			},
		}),
	},
});
