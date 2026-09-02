const key = 'based-life-and-progress';
const form = document.querySelector('#entry-form');
const list = document.querySelector('#entries');
const filter = document.querySelector('#filter');
const date = document.querySelector('#date');
const staticEntries = [...list.querySelectorAll('[data-static-entry]')].map(entry => ({
	category: entry.dataset.category,
	html: entry.outerHTML
}));

date.value = new Date().toISOString().slice(0, 10);

const clean = value => value.replace(/[&<>'"]/g, character => ({
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	"'": '&#39;',
	'"': '&quot;'
}[character]));

const get = () => JSON.parse(localStorage.getItem(key) || '[]');
const save = entries => localStorage.setItem(key, JSON.stringify(entries));

function render() {
	const entries = get().filter(entry => (
		filter.value === 'all' || entry.category === filter.value
	));
	const visibleStaticEntries = staticEntries
		.filter(entry => filter.value === 'all' || entry.category === filter.value)
		.map(entry => entry.html)
		.join('');

	if (!entries.length && !visibleStaticEntries) {
		list.innerHTML = '<div class="empty"><h3>Your log starts here.</h3><p>Add anything from finishing a workout to shipping a project feature.</p></div>';
		return;
	}

	list.innerHTML = visibleStaticEntries + entries.map(entry => `
		<article class="entry" data-id="${entry.id}">
			<div class="entry-top">
				<span class="tag">${clean(entry.category)}</span>
				<time datetime="${entry.date}">
					${new Date(`${entry.date}T12:00:00`).toLocaleDateString(undefined, {
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					})}
				</time>
			</div>
			<h3>${clean(entry.title)}</h3>
			<p>${clean(entry.body).replace(/\n/g, '<br>')}</p>
			<div class="entry-actions">
				<button data-copy type="button">Copy as HTML</button>
				<button data-delete type="button">Delete</button>
			</div>
		</article>
	`).join('');
}

form.addEventListener('submit', event => {
	event.preventDefault();

	const data = new FormData(form);
	const entries = get();

	entries.unshift({
		id: crypto.randomUUID(),
		title: data.get('title').trim(),
		category: data.get('category'),
		date: data.get('date'),
		body: data.get('body').trim()
	});

	save(entries);
	form.reset();
	date.value = new Date().toISOString().slice(0, 10);
	render();
});

list.addEventListener('click', async event => {
	const node = event.target.closest('.entry');
	if (!node) return;

	const entries = get();
	const entry = entries.find(item => item.id === node.dataset.id);

	if (event.target.matches('[data-delete]')) {
		save(entries.filter(item => item.id !== entry.id));
		render();
	}

	if (event.target.matches('[data-copy]')) {
		const html = `
			<article>
				<p>${clean(entry.category)} · ${entry.date}</p>
				<h3>${clean(entry.title)}</h3>
				<p>${clean(entry.body)}</p>
			</article>
		`;

		await navigator.clipboard.writeText(html);
		event.target.textContent = 'Copied!';
		setTimeout(() => event.target.textContent = 'Copy as HTML', 1200);
	}
});

filter.addEventListener('change', render);
render();
