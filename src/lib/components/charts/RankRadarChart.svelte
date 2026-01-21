<script lang="ts">
    /* 
        Create a radar chart of what rank that team has in various metrics.
        The further out the point is, the better the rank (1 is best, so it should be at the edge of the chart).
    
        View ./RadarChart.svelte to see how to create a radar chart.
    */

    /*
        /src/routes/dashboard/event/[eventKey]/+page.svelte

        FIRST.getSummary(event.tba.key, event.tba.year as 2024 | 2025, {
        // 10 minutes
        cacheExpires: after(10 * 60 * 1000)
    }).then((res) => {
        if (res.isOk()) {
            // you will need to edit this line
            summary = res.value.pivot().teamsRanked();
        } else {
            console.error('Error fetching event summary:', res.error);
        }
    });
    */
</script>