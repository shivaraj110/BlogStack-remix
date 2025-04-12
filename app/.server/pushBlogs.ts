import { Redis } from "@upstash/redis";
import { prisma } from "./db";
import { getRedisConfig } from "~/lib/url";

interface BlogData {
  title: string;
  content: string;
  authorId: string;
  publishDate: string;
  imgUrl: string;
  tags: string[];
  authorImgUrl: string;
}

const redis = new Redis(getRedisConfig());
export const pushBlogs = async ({
  title,
  content,
  authorId,
  imgUrl,
  publishDate,
  tags,
  authorImgUrl,
}: BlogData) => {
  try {
    const newArticle = await prisma.post.create({
      data: {
        title,
        content,
        authorId,
        imgUrl,
        publishDate,
        published: true,
        tags,
        authorImgUrl,
      },
    });
  } catch (e) {
    console.error(e);
  }
};

export const deleteBlog = async (id: number) => {
  await redis.del(JSON.stringify({ blogId: id }));

  try {
    const blog = await prisma.post.delete({
      where: {
        id,
      },
    });
    if (blog) {
      return true;
    }
    return false;
  } catch (e) {
    console.error("error" + e);
  }
};
