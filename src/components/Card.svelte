<script>
    export let imageSrc;
    export let title;
    export let description;
    export let authorName;
    export let last;
</script>

<div class="bg-white rounded-3xl shadow-lg card-width z-20 { (last == "True") ? "mr-10" : "" }">
    <img class="w-full h-48 object-cover rounded-t-3xl" src="{imageSrc}" alt="{title}">
    <div class="w-full p-6">
        <h2 class="text-xl font-semibold mb-2">{title}</h2>
        <p class="text-gray-700">{description}</p>
        <p class="text-gray-500 text-sm mt-2">By {authorName}</p>
    </div>
</div>
