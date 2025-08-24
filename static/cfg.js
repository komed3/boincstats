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
    },
    active: {
        id: 'activeRankChart',
        col: 'active_rank',
        label: 'Active Rank',
        color: '#ec4899',
        reverseY: true,
        isBar: false,
        stepped: true
    },
    average: {
        id: 'averagePointsChart',
        col: 'rac_60',
        label: 'RAC (60D)',
        color: '#10b981',
        reverseY: false,
        isBar: false,
        stepped: false
    }
};

/**
 * Database columns and labels
 */
const dailyCols = [ 'date', 'total', 'daily', 'rank', 'rank_cng', 'team_rank', 'team_cng', 'country_rank', 'country_cng', 'rac', 'rac_60', 'active_rank' ];
const dailyLabels = [ 'Date', 'Total', 'Daily', 'Rank', 'Δ Rank', 'Team Rank', 'Δ Team', 'Country Rank', 'Δ Country', 'RAC', 'RAC (60D)', 'Active Rank' ];
const projectsCols = [ 'project', 'total', 'share', 'today', 'daily', 'weekly', 'monthly', 'rank', 'rank_cng_day', 'rank_cng_week', 'rank_cng_month', 'team_rank', 'country_rank' ];
const projectsLabels = [ 'Project', 'Total', 'Share', 'Today', 'Daily', 'Weekly', 'Monthly', 'Rank', 'Δ Day', 'Δ Week', 'Δ Month', 'Team Rank', 'Country Rank' ];
const hostsCols = [ 'rank', 'cpu', 'cores', 'os', 'total', 'daily', 'weekly', 'monthly', 'avg' ];
const hostsLabels = [ 'Rank', 'CPU', 'Cores', 'OS', 'Total', 'Daily', 'Weekly', 'Monthly', 'Ø' ];