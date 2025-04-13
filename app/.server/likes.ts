import { prisma } from "./db";

export const pushLikes = async (postId: number, userId: string) => {
    try {
        const like = await prisma.like.create({
            data: {
                userId,
                postId,
            },
        });
        if (like) {
            return true;
        }
        return false;
    } catch (e) {
        console.error(e);
        return null;
    }
};

export const getLikes = async (userId: string) => {
    try {
        const likes = await prisma.like.findMany({
            where: {
                userId,
            },
            select: {
                id: true,
                post: {
                    select: {
                        id: true,
                        title: true,
                        content: true,
                        authorId: true,
                        publishDate: true,
                        likes: true,
                        imgUrl: true,
                        authorImgUrl: true,
                        tags: true,
                        author: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },

                userId: true,
                postId: true,
            },
        });
        return likes;
    } catch (e) {
        console.error(e);
    }
};

export const deleteLike = async (postId: number, userId: string) => {
    const id = await getLikeId(userId, postId);
    try {
        const del = await prisma.like.delete({
            where: {
                id,
            },
        });
        if (del) {
            return true;
        }
        return false;
    } catch (e) {
        console.error(e);
        return null;
    }
};

const getLikeId = async (userId: string, postId: number) => {
    const like = await prisma.like.findFirst({
        where: {
            postId,
            userId,
        },
        select: {
            id: true,
        },
    });
    return like?.id;
};
