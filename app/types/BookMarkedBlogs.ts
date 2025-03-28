export interface BookmarkedBlogData {
	post: {
		authorName: string;
		title: string;
		authorId: number;
		content: string;
		publishDate: string;
		comments: [];
		views: number;
		tags: string[];
		views: number[];
		likes: number[];
		id: number;
		likeCount: number;
		imgUrl: string;
		authorImgUrl: string;
	};
}
