import { Link } from "@remix-run/react";

function Writeblog() {
  return (
    <div className="bg-white/20 backdrop-brightness-100 border backdrop-blur-md sm:flex hidden rounded-xl shadow-2xl mb-6 h-fit">
      <div className=" ">
        <div className="p-5 font-semibold text-slate-900">
          got something in mind ?{" "}
        </div>
        <div className="grid grid-cols-3">
          <div className="p-5 text-slate-900">
            a fastest way for your words from your head to the internet is
            actually
            <Link to={"/blog/write"} className="font-semibold underline">
              Start writing{" "}
            </Link>
            .
          </div>
          <div className="p-5 text-slate-900">
            know someone who could help you with more ideas ? then you should
            <Link to={"/blog/collab"} className=" font-semibold underline">
              Collaborate{" "}
            </Link>
            .
          </div>{" "}
          <div className="p-5 text-slate-900">
            it's not cool to abandon an idea halfway you know
            <br />
            <button className=" font-semibold underline">finish a draft</button>
            ?
          </div>{" "}
        </div>
      </div>
      <div className="sm:hidden text-sm flex gap-2 py-5 px-1 justify-center">
        <Link to={"/blog/solo"} className="underline">
          Write a blog
        </Link>
        <Link to={"/blog/collab"} className="underline">
          Collab on a blog
        </Link>
        <Link to={"/draft"} className="underline">
          Finish a draft
        </Link>
      </div>
    </div>
  );
}

export default Writeblog;
