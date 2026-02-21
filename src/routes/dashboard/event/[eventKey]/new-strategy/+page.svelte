<script lang="ts">
    import { Strategy } from "$lib/services/strategy";

    const strategy = new Strategy({
        paths: [],
        comments: [],
        red: [2122, 254, 1678],
        blue: [111, 469, 148],
        event: "2026miket",
        year: 2026,
    });
</script>

<div {@attach (div) => strategy.render(div)}></div>