<script>
	import Background from './components/Background.svelte';
    import Cards from './components/Cards.svelte';
	import Logo from './components/Logo.svelte';
</script>

<main class="container mx-auto flex justify-start items-center flex-col bg-gray h-full relative overflow-x-hidden">
	<Background></Background>
	<Logo></Logo>
	<Cards></Cards>
</main>

<style global lang="postcss">
	@tailwind base;
  	@tailwind components;
  /* purgecss end ignore */
  	@tailwind utilities;


	@layer utilities {
  		.card-width {
    		min-width: 350px;
			max-width: 350px;
			height: 350px;
		}
		.cards{
			height: 400px;
		}
		.gradient{
			background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, #FFFFFF 100%);
			top: calc(50% - 200px);
		}
	}
</style>
