import { ActionFunction, redirect } from "@remix-run/node";
import { Redis } from "@upstash/redis";
import { prisma } from "~/.server/db";
import { getRedisConfig } from "~/lib/url";

export const action: ActionFunction = async (args) => {
	const formData = await args.request.formData();
	const id = Number(formData.get("id"));
	const redis = new Redis(getRedisConfig());
	try {
		const deletedBlog = await prisma.post.delete({
			where: {
				id,
			},
		});
		if (deletedBlog) {
			await redis.del(JSON.stringify({ blogId: deletedBlog.id }));
			return redirect("/dashboard");
		}
		return {
			status: "failed",
		};
	} catch (e) {
		console.error(e);
	}
};
