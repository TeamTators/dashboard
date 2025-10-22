<script lang="ts">
	import { Random } from 'ts-utils/math';

	const quotes = [
		'Blankets are like hugs you can wear.',
		"No ship has sailed too far if you're a really fast swimmer.",
		'The best way to predict the future is to create it.',
		'Just as the prophecy foretold...',
		'if (itWorks) { celebrate(); }',
		'Good enough is good enough',
		'Expectations lead to misery',
		"The c in code stands for carbs because it's spaghetti code",
		"It's a valley not just because there's a steep ascent on one side, but because a rise follows. Hang in there.",
		'Octopi > Squid',
		'Beauty fades. That is why it is beautiful.',
		"Taylor wrote 98% of this code so it's probably his fault",
		'You keep getting signed out because of cosmic rays',
		"If “don't” means “do not”, then “don't you dare” means “do not you dare.”",
		"Sometimes contractions are appropriate and sometimes they aren't. It's a silly quirk of this language we've. ",
		'"Both c\'s in the word "circle" should be pronounced like an s." - Keyton',
		'The word "queue" is just a "q" followed by four silent letters.',
		'The word "bed" looks like a bed.',
		'The word "bookkeeper" is the only unhyphenated English word with three consecutive double letters.',
		'The Japanese word for "origami" is "origami".',
		"If anyone wants to talk to Keyton about linguistics, he's very lonely.",
		'"Maintain a healthy fear of what can go wrong" - Detrich R.',
		'"Not all who wander are lost, but this robot is awfully close" - ',
		'"That sounds a little evil" ... "That sounds like winning" - Raygen R.',
		'"Bugs are just features in camouflage."',
		"import { coffee } from 'life';",
		"There are 10 types of people in the world: those who understand binary, and those who don't.",
		'Somewhere, someone just pushed straight to main',
		'Be yourself; everyone else is already taken.',
		"There's no place like 127.0.0.1",
		"Wifi connects us all, except when it doesn't",
		'Debugging: Being the detective in a crime movie where you are the murderer',
		"The cloud is just someone else's computer",
		"Your future self is already judging you. Be someone you'll be proud of.",
		'Technically, all spoons are shovels.',
		"Mirrors don't break, they multiply",
		'99 little bugs in the code, take one down, patch it around, 117 little bugs in the code…',
		'"It works on my machine" - Every Developer Ever',
		'alias please=sudo',
		"To backup all files, run: sudo rm -rf / --no-preserve-root (Don't do this)",
		"If you climb a hill you'll gain a lot of potential. Same thing if you rub a balloon.",
		'Lamps are just domesticated fire.',
		'Click me for points!',
		'hellooooo',
		'Nothing is more permanent than a temporary solution.',
		'When you click on "Click me for points!" you get as many points as it takes for you to realise nothing happens.',
	];

	const quote = Random.choose(quotes);
</script>

<footer>
	<p class="text-muted text-center">
		&copy; {new Date().getFullYear()}
		Team Tators | All Rights Reserved
		<br />
		If you see an issue, please report it
		<a href="https://github.com/TeamTators/dashboard/issues" target="_blank">here</a>.
		<br />

		<a
			href="https://github.com/TeamTators/dashboard"
			target="_blank"
			aria-label="Tators Dashboard Github Repository"
		>
			<i class="fa-brands fa-github fa-2x link-secondary"></i>
		</a>
		<br />
		{#if quote === 'Click me for points!'}
			<a href="/click-me-for-points">{quote}</a>
		{:else}
			{quote}
		{/if}
	</p>
</footer>
