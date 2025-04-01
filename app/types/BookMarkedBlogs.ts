export interface BookmarkedBlogData {
	post: {
		authorName: string;
		author: {
			name: string;
		};
		title: string;
		authorId: number;
		content: string;
		publishDate: string;
		comments: [];
		tags: string[];
		views: number[];
		likes: number[];
		id: number;
		likeCount: number;
		imgUrl: string;
		authorImgUrl: string;
	};
}
