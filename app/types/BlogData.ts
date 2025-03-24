export interface BlogData {
	authorName: string;
	title: string;
	authorId: number;
	content: string;
	publishDate: string;
	comments: number;
	tags: string[];
	likes: number;
	id: number;
	likeCount: number;
	imgUrl: string;
	authorImgUrl: string;
	bookmarked: boolean;
	deleteable?: boolean;
}
