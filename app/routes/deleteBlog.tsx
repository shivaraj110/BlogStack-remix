import { ActionFunction, redirect } from "@remix-run/node";
import { prisma } from "~/.server/db";


export const action: ActionFunction = async (args) => {
	const formData = await args.request.formData()
	const id = Number(formData.get("id"))
	try {
		const deletedBlog = await prisma.post.delete({
			where: {
				id,
			}
		})
		if (deletedBlog) {
			return redirect("/dashboard")

		}
		return {
			status: "failed"
		}
	}
	catch (e) {
		console.error(e);
	}
}
