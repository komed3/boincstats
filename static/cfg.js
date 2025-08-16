/**
 * Global chart configuration
 */
const chartConfig = {
    total: {
        id: 'totalPointsChart',
        col: 'total',
        label: 'Total Points',
        color: '#3b82f6',
        reverseY: false,
        isBar: false,
        stepped: false
    },
    rank: {
        id: 'worldRankChart',
        col: 'rank',
        label: 'World Rank',
        color: '#22c55e',
        reverseY: true,
        isBar: false,
        stepped: true
    },
    daily: {
        id: 'dailyPointsChart',
        col: 'daily',
        label: 'Daily Points',
        color: '#fbbf24',
        reverseY: false,
        isBar: true,
        stepped: false
    },
    country: {
        id: 'countryRankChart',
        col: 'country_rank',
        label: 'Country Rank',
        color: '#8b5cf6',
        reverseY: true,
        isBar: false,
        stepped: true
    }
};
