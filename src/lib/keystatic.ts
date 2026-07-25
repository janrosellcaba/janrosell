import { createReader } from '@keystatic/core/reader';
import keystaticConfig from '../../keystatic.config';

export const reader = createReader(process.cwd(), keystaticConfig);

export async function getExperience() {
	const all = await reader.collections.experience.all();
	return all.map((item) => item.entry).sort((a, b) => a.order - b.order);
}

export async function getHome() {
	return reader.singletons.home.readOrThrow();
}
