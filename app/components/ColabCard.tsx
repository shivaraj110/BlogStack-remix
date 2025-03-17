export function CollabCard() {
  return (
    <div className="bg-white/25 dark:bg-[#0a0a0a]/25 backdrop-brightness-100 backdrop-blur-md rounded-xl shadow-2xl mt-6">
      <div className="flex items-center justify-between p-6 border-b dark:border-white/10">
        <h2 className="text-xl font-semibold dark:text-white">
          My Collaborations
        </h2>
        <button className="px-3 py-1 text-sm border border-gray-300 dark:border-white/10 rounded-md hover:bg-gray-50 dark:hover:bg-white/10 transition-colors dark:text-white">
          Filter by
        </button>
      </div>
      <div className="p-4 pb-4 space-y-4">
        <div className="flex justify-between dark:text-white">
          <div className="pl-5">author</div>
          <div className="pr-5">Status</div>
        </div>
        <BillItem title="Krish Tasood" status="published" />
        <BillItem title="Krish Tasood" status="draft" />
        <BillItem title="Krish Tasood" status="published" />
      </div>
    </div>
  );
}

function BillItem({
  title,
  status,
}: {
  title: string;
  status: "published" | "draft";
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border-b-[1px] dark:border-white/10">
      <div className="flex items-center gap-3">
        <div
          className={`w-2 h-2 rounded-full ${
            status === "published" ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span className="font-medium dark:text-white">{title}</span>
      </div>
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          status === "published"
            ? "text-green-600 dark:text-green-400"
            : "text-red-600 dark:text-red-400"
        }`}
      >
        {status === "published" ? "published" : "draft"}
      </span>
    </div>
  );
}
