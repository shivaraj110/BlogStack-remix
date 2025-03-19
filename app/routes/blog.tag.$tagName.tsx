import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useParams } from "@remix-run/react";

export async function loader({ params }: LoaderFunctionArgs) {
  const { tagName } = params;

  if (!tagName) {
    return redirect("/blog");
  }

  // Redirect to the main blog page with the tag filter applied
  return redirect(`/blog?tag=${encodeURIComponent(tagName)}`);
}

export default function BlogTag() {
  const { tagName } = useParams();

  // This component won't actually render since we're redirecting in the loader
  return <div>Redirecting to tag: {tagName}</div>;
}
