
'use server';

import { personalizeNews, PersonalizeNewsInput, NewsHighlight } from "@/ai/flows/personalize-news-flow";
import { FeedItem } from "@/app/components/HomeClient";


// The input for the server action can be more flexible
export interface ActionPersonalizeNewsInput {
    articles: (FeedItem | {title: string, url: string, summary: string, source: string, tags: string[]})[];
    userInterests: string[];
}


export async function personalizeNewsForUser(input: ActionPersonalizeNewsInput): Promise<NewsHighlight[]> {

    const validArticles = input.articles.map(article => {
        // Here you can add more robust validation or transformation if needed
        return {
            title: article.title,
            url: article.url,
            summary: article.summary,
            source: article.source,
            tags: article.tags,
        };
    });
    
    const flowInput: PersonalizeNewsInput = {
        articles: validArticles,
        userInterests: input.userInterests,
    }

    return await personalizeNews(flowInput);
}

    