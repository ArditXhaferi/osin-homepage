<script>
    import Card from './Card.svelte';
    import CardsData from '../db/cards.js';
</script>

<div class="flex w-screen overflow-x-auto gap-6 mt-20 ml-10 cards">
    {#each CardsData as card, i}
        <Card
            imageSrc={card.imageSrc}
            title={card.title}
            description={card.description}
            authorName={card.authorName}
            last={ (i === CardsData.length - 1) ? "True" : "False" }
        />
    {/each}
</div>
