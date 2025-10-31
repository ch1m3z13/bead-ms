export interface Project {
    id: string;
    name: string;
    description?: string;
    twitter_handle?: string;
    farcaster_channel?: string;
    created_at: string;
    user_id: string;
}
export interface Insight {
    id: string;
    project_id: string;
    source: 'twitter' | 'farcaster' | 'manual';
    content: string;
    url?: string;
    author?: string;
    created_at: string;
    metadata?: Record<string, any>;
}
export interface Post {
    id: string;
    project_id: string;
    insight_ids: string[];
    content: string;
    tone: 'witty' | 'serious' | 'hype' | 'educational';
    created_at: string;
    published_at?: string;
}
export interface ScrapeProjectJob {
    projectId: string;
    sources: Array<'twitter' | 'farcaster'>;
}
export interface GeneratePostsJob {
    projectId: string;
    insightIds: string[];
}
export declare const QUEUE_NAMES: {
    readonly SCRAPE_PROJECT: "scrape-project";
    readonly GENERATE_POSTS: "generate-posts";
};
